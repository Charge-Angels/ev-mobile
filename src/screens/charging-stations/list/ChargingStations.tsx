import { DrawerActions } from '@react-navigation/native';
import I18n from 'i18n-js';
import { Container, Spinner, View } from 'native-base';
import React from 'react';
import { Platform, ScrollView } from 'react-native';
import { ClusterMap } from 'react-native-cluster-map';
import { Location } from 'react-native-location';
import { Marker, Region } from 'react-native-maps';
import Modal from 'react-native-modal';
import { Modalize } from 'react-native-modalize';

import ChargingStationComponent
  from '../../../components/charging-station/ChargingStationComponent';
import HeaderComponent from '../../../components/header/HeaderComponent';
import ItemsList, { ItemsSeparatorType } from '../../../components/list/ItemsList';
import SimpleSearchComponent from '../../../components/search/simple/SimpleSearchComponent';
import ThemeManager from '../../../custom-theme/ThemeManager';
import I18nManager from '../../../I18n/I18nManager';
import LocationManager from '../../../location/LocationManager';
import computeModalStyle from '../../../ModalStyles';
import ProviderFactory from '../../../provider/ProviderFactory';
import BaseProps from '../../../types/BaseProps';
import ChargingStation, { ChargePointStatus, Connector } from '../../../types/ChargingStation';
import { DataResult } from '../../../types/DataResult';
import { GlobalFilters } from '../../../types/Filter';
import Constants from '../../../utils/Constants';
import SecuredStorage from '../../../utils/SecuredStorage';
import Utils from '../../../utils/Utils';
import BaseAutoRefreshScreen from '../../base-screen/BaseAutoRefreshScreen';
import ChargingStationsFilters, { ChargingStationsFiltersDef } from './ChargingStationsFilters';
import computeStyleSheet from './ChargingStationsStyles';
import SiteArea from '../../../types/SiteArea';

export interface Props extends BaseProps {}

interface State {
  chargingStations?: ChargingStation[];
  loading?: boolean;
  refreshing?: boolean;
  isAdmin?: boolean;
  skip?: number;
  limit?: number;
  count?: number;
  initialFilters?: ChargingStationsFiltersDef;
  filters?: ChargingStationsFiltersDef;
  showMap?: boolean;
  visible?: boolean;
  chargingStationSelected?: ChargingStation;
}

export default class ChargingStations extends BaseAutoRefreshScreen<Props, State> {
  public state: State;
  public props: Props;
  private searchText: string;
  private siteArea: SiteArea;
  private currentLocation: Location;
  private locationEnabled: boolean;
  private currentRegion: Region;
  private darkMapTheme = require('../../../utils/map/google-maps-night-style.json');

  public constructor(props: Props) {
    super(props);
    // Init State
    this.state = {
      chargingStations: [],
      loading: true,
      refreshing: false,
      isAdmin: false,
      initialFilters: {},
      filters: {},
      skip: 0,
      limit: Constants.PAGING_SIZE,
      count: 0,
      showMap: false,
      visible: false,
      chargingStationSelected: null
    };
  }

  public async componentDidMount() {
    // Get initial filters
    await this.loadInitialFilters();
    this.siteArea = Utils.getParamFromNavigation(this.props.route, 'siteArea', null) as unknown as SiteArea;
    await super.componentDidMount();
  }

  public setState = (
    state: State | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Pick<State, never>) | Pick<State, never>,
    callback?: () => void
  ) => {
    super.setState(state, callback);
  };

  public async loadInitialFilters() {
    const centralServerProvider = await ProviderFactory.getProvider();
    const connectorStatus = (await SecuredStorage.loadFilterValue(
      centralServerProvider.getUserInfo(),
      GlobalFilters.ONLY_AVAILABLE_CHARGING_STATIONS
    )) as ChargePointStatus;
    const connectorType = await SecuredStorage.loadFilterValue(centralServerProvider.getUserInfo(), GlobalFilters.CONNECTOR_TYPES);
    let location = Utils.convertToBoolean(
      await SecuredStorage.loadFilterValue(centralServerProvider.getUserInfo(), GlobalFilters.LOCATION)
    );
    if (!location) {
      location = false;
    }
    this.setState({
      initialFilters: { connectorStatus, connectorType, location },
      filters: { connectorStatus, connectorType, location }
    });
  }

  public async getCurrentLocation(): Promise<Location> {
    const { filters } = this.state;
    // Get the current location
    let currentLocation = (await LocationManager.getInstance()).getLocation();
    this.locationEnabled = currentLocation ? true : false;
    // Bypass location
    if (!filters.location) {
      currentLocation = null;
    }
    return currentLocation;
  }

  public getChargingStations = async (searchText: string, skip: number, limit: number): Promise<DataResult<ChargingStation>> => {
    let chargingStations: DataResult<ChargingStation>;
    const { filters } = this.state;
    try {
      const params = {
        Search: searchText,
        SiteAreaID: this.siteArea?.id,
        Issuer: true,
        ConnectorStatus: filters.connectorStatus,
        ConnectorType: filters.connectorType,
        LocLatitude: this.currentLocation ? this.currentLocation.latitude : null,
        LocLongitude: this.currentLocation ? this.currentLocation.longitude : null,
        LocMaxDistanceMeters: this.currentLocation ? Constants.MAX_DISTANCE_METERS : null
      };
      // Get current location
      this.currentLocation = await this.getCurrentLocation();
      // Get with the Site Area
      chargingStations = await this.centralServerProvider.getChargingStations(params, { skip, limit }, ['id']);
      // Get total number of records
      if ((chargingStations.count === -1) && Utils.isEmptyArray(this.state.chargingStations)) {
        const chargingStationsNbrRecordsOnly =
          await this.centralServerProvider.getChargingStations(params, Constants.ONLY_RECORD_COUNT);
        chargingStations.count = chargingStationsNbrRecordsOnly.count;
      }
    } catch (error) {
      // Other common Error
      await Utils.handleHttpUnexpectedError(
        this.centralServerProvider,
        error,
        'chargers.chargerUnexpectedError',
        this.props.navigation,
        this.refresh.bind(this)
      );
    }
    return chargingStations;
  };

  public onEndScroll = async () => {
    const { count, skip, limit } = this.state;
    // No reached the end?
    if (skip + limit < count || count === -1) {
      // No: get next charging stations
      const chargingStations = await this.getChargingStations(this.searchText, skip + Constants.PAGING_SIZE, limit);
      // Add charging stations
      this.setState((prevState) => ({
        chargingStations: chargingStations ? [...prevState.chargingStations, ...chargingStations.result] : prevState.chargingStations,
        skip: prevState.skip + Constants.PAGING_SIZE,
        refreshing: false
      }));
    }
  };

  public onBack = (): boolean => {
    if (this.state.showMap && !Utils.isEmptyArray(this.state.chargingStations)) {
      this.setState({ showMap: false });
    } else {
      // Go back to the top
      this.props.navigation.goBack();
    }
    // Do not bubble up
    return true;
  };

  public refreshCurrentRegion(chargingStations: ChargingStation[], force = false) {
    // Set current region
    if (!this.currentRegion || force) {
      let gpsCoordinates: number[];
      if (!Utils.isEmptyArray(chargingStations) && Utils.containsGPSCoordinates(chargingStations[0].coordinates)) {
        gpsCoordinates = chargingStations[0].coordinates;
      }
      this.currentRegion = {
        longitude: gpsCoordinates ? gpsCoordinates[0] : 2.3514616,
        latitude: gpsCoordinates ? gpsCoordinates[1] : 48.8566969,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003
      };
    }
  }

  public refresh = async () => {
    // Component Mounted?
    if (this.isMounted()) {
      const { skip, limit } = this.state;
      // Refresh All
      const chargingStations = await this.getChargingStations(this.searchText, 0, skip + limit);
      // Refresh region
      if (chargingStations) {
        this.refreshCurrentRegion(chargingStations.result);
      }
      // Add ChargingStations
      this.setState(() => ({
        loading: false,
        chargingStations: chargingStations ? chargingStations.result : [],
        count: chargingStations ? chargingStations.count : 0,
        isAdmin: this.securityProvider ? this.securityProvider.isAdmin() : false
      }));
    }
  };

  public manualRefresh = async () => {
    // Display spinner
    this.setState({ refreshing: true });
    // Refresh
    await this.refresh();
    // Hide spinner
    this.setState({ refreshing: false });
  };

  public getSiteIDFromChargingStations(): string {
    const { chargingStations } = this.state;
    // Find the first available Site ID
    if (chargingStations && chargingStations.length > 0) {
      for (const chargingStation of chargingStations) {
        if (chargingStation.siteArea) {
          return chargingStation.siteArea.siteID;
        }
      }
    }
    return null;
  }

  public search = async (searchText: string) => {
    this.searchText = searchText;
    delete this.currentRegion;
    await this.refresh();
  };

  public onMapRegionChange = (region: Region) => {
    this.currentRegion = region;
  };

  public filterChanged(newFilters: ChargingStationsFiltersDef) {
    delete this.currentRegion;
    this.setState({ filters: newFilters }, async () => this.refresh());
  }

  public toggleDisplayMap = () => {
    // Refresh region
    this.refreshCurrentRegion(this.state.chargingStations, true);
    // Toggle map
    this.setState({ showMap: !this.state.showMap });
  };

  public showMapChargingStationDetail = (chargingStation: ChargingStation) => {
    this.setState({
      visible: true,
      chargingStationSelected: chargingStation
    });
  };

  public setModalHeightByNumberOfConnector(connectors: Connector[]): number {
    if (connectors.length <= 4) {
      return 80 + 95 * connectors.length;
    }
    return 80 + 95 * 4;
  }

  public buildModal(isAdmin: boolean, navigation: any, chargingStationSelected: ChargingStation, modalStyle: any) {
    // ChargeX setup have more than 4 connectors.
    if (Platform.OS === 'ios') {
      return (
        <Modal style={modalStyle.modalBottomHalf} isVisible={this.state.visible} onBackdropPress={() => this.setState({ visible: false })}>
          <Modalize
            alwaysOpen={this.setModalHeightByNumberOfConnector(chargingStationSelected.connectors)}
            modalStyle={modalStyle.modalContainer}>
            <ChargingStationComponent
              chargingStation={chargingStationSelected}
              isAdmin={isAdmin}
              onNavigate={() => this.setState({ visible: false })}
              navigation={navigation}
              isSiteAdmin={this.securityProvider?.isSiteAdmin(
                chargingStationSelected.siteArea ? chargingStationSelected.siteArea.siteID : ''
              )}
            />
          </Modalize>
        </Modal>
      );
    } else {
      return (
        <Modal style={modalStyle.modalBottomHalf} isVisible={this.state.visible} onBackdropPress={() => this.setState({ visible: false })}>
          <View style={[modalStyle.modalContainer, { height: this.setModalHeightByNumberOfConnector(chargingStationSelected.connectors) }]}>
            <ScrollView>
              <ChargingStationComponent
                chargingStation={chargingStationSelected}
                isAdmin={isAdmin}
                onNavigate={() => this.setState({ visible: false })}
                navigation={navigation}
                isSiteAdmin={this.securityProvider?.isSiteAdmin(
                  chargingStationSelected.siteArea ? chargingStationSelected.siteArea.siteID : ''
                )}
              />
            </ScrollView>
          </View>
        </Modal>
      );
    }
  }

  public render() {
    const style = computeStyleSheet();
    const modalStyle = computeModalStyle();
    const { navigation } = this.props;
    const {
      loading,
      chargingStations,
      isAdmin,
      initialFilters,
      skip,
      count,
      limit,
      filters,
      showMap,
      chargingStationSelected,
      refreshing
    } = this.state;
    const mapIsDisplayed = showMap && !Utils.isEmptyArray(this.state.chargingStations);
    const chargingStationsWithGPSCoordinates = chargingStations.filter((chargingStation) =>
      Utils.containsGPSCoordinates(chargingStation.coordinates)
    );
    const isDarkModeEnabled = ThemeManager.getInstance()?.isThemeTypeIsDark();
    return (
      <Container style={style.container}>
        <HeaderComponent
          ref={(headerComponent: HeaderComponent) => this.setHeaderComponent(headerComponent)}
          navigation={navigation}
          title={this.siteArea?.name ?? I18n.t('chargers.title')}
          subTitle={count > 0 ? `${I18nManager.formatNumber(count)} ${I18n.t('chargers.chargers')}` : null}
          leftAction={this.onBack}
          leftActionIcon={'navigate-before'}
          rightAction={() => {
            navigation.dispatch(DrawerActions.openDrawer());
            return true;
          }}
          rightActionIcon={'menu'}
          filters={filters}
          displayMap={!Utils.isEmptyArray(this.state.chargingStations)}
          mapIsDisplayed={mapIsDisplayed}
          displayMapAction={() => this.toggleDisplayMap()}
        />
        {loading ? (
          <Spinner style={style.spinner} color="grey" />
        ) : (
          <View style={style.content}>
            <View style={style.searchBar}>
              <SimpleSearchComponent onChange={async (searchText) => this.search(searchText)} navigation={navigation} />
            </View>
            <ChargingStationsFilters
              initialFilters={initialFilters}
              locationEnabled={this.locationEnabled}
              onFilterChanged={(newFilters: ChargingStationsFiltersDef) => this.filterChanged(newFilters)}
              ref={(chargingStationsFilters: ChargingStationsFilters) => this.setScreenFilters(chargingStationsFilters)}
            />
            {mapIsDisplayed ? (
              <View style={style.map}>
                {this.currentRegion && (
                  <ClusterMap
                    provider={'google'}
                    customMapStyle={isDarkModeEnabled && this.darkMapTheme}
                    style={style.map}
                    region={this.currentRegion}
                    onRegionChange={this.onMapRegionChange}>
                    {chargingStationsWithGPSCoordinates.map((chargingStation) => (
                      <Marker
                        image={Utils.buildChargingStationStatusMarker(chargingStation.connectors, chargingStation.inactive)}
                        key={chargingStation.id}
                        coordinate={{ longitude: chargingStation.coordinates[0], latitude: chargingStation.coordinates[1] }}
                        title={chargingStation.id}
                        onPress={() => this.showMapChargingStationDetail(chargingStation)}
                      />
                    ))}
                  </ClusterMap>
                )}
                {chargingStationSelected && this.buildModal(isAdmin, navigation, chargingStationSelected, modalStyle)}
              </View>
            ) : (
              <ItemsList<ChargingStation>
                skip={skip}
                count={count}
                onEndReached={this.onEndScroll}
                itemsSeparator={ItemsSeparatorType.DEFAULT}
                renderItem={(chargingStation: ChargingStation) => (
                  <ChargingStationComponent
                    chargingStation={chargingStation}
                    isAdmin={isAdmin}
                    navigation={navigation}
                    isSiteAdmin={this.securityProvider?.isSiteAdmin(chargingStation.siteArea ? chargingStation.siteArea.siteID : '')}
                  />
                )}
                data={chargingStations}
                manualRefresh={this.manualRefresh}
                refreshing={refreshing}
                emptyTitle={I18n.t('chargers.noChargers')}
                navigation={navigation}
                limit={limit}
              />
            )}
          </View>
        )}
      </Container>
    );
  }
}
