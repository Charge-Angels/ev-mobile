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

import HeaderComponent from '../../components/header/HeaderComponent';
import ItemsList from '../../components/list/ItemsList';
import SimpleSearchComponent from '../../components/search/simple/SimpleSearchComponent';
import SiteAreaComponent from '../../components/site-area/SiteAreaComponent';
import ThemeManager from '../../custom-theme/ThemeManager';
import I18nManager from '../../I18n/I18nManager';
import LocationManager from '../../location/LocationManager';
import computeModalStyle from '../../ModalStyles';
import ProviderFactory from '../../provider/ProviderFactory';
import BaseProps from '../../types/BaseProps';
import { DataResult } from '../../types/DataResult';
import { GlobalFilters } from '../../types/Filter';
import SiteArea from '../../types/SiteArea';
import Constants from '../../utils/Constants';
import SecuredStorage from '../../utils/SecuredStorage';
import Utils from '../../utils/Utils';
import BaseAutoRefreshScreen from '../base-screen/BaseAutoRefreshScreen';
import SiteAreasFilters, { SiteAreasFiltersDef } from './SiteAreasFilters';
import computeStyleSheet from './SiteAreasStyles';
import Site from '../../types/Site';

export interface Props extends BaseProps {}

interface State {
  siteAreas?: SiteArea[];
  loading?: boolean;
  refreshing?: boolean;
  skip?: number;
  limit?: number;
  count?: number;
  initialFilters?: SiteAreasFiltersDef;
  filters?: SiteAreasFiltersDef;
  showMap?: boolean;
  visible?: boolean;
  siteAreaSelected?: SiteArea;
}

export default class SiteAreas extends BaseAutoRefreshScreen<Props, State> {
  public state: State;
  public props: Props;
  private searchText: string;
  private site: Site;
  private currentLocation: Location;
  private locationEnabled: boolean;
  private currentRegion: Region;
  private darkMapTheme = require('../../utils/map/google-maps-night-style.json');

  public constructor(props: Props) {
    super(props);
    this.state = {
      siteAreas: [],
      loading: true,
      refreshing: false,
      skip: 0,
      limit: Constants.PAGING_SIZE,
      count: 0,
      initialFilters: {},
      showMap: false,
      visible: false,
      siteAreaSelected: null
    };
  }

  public setState = (
    state: State | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Pick<State, never>) | Pick<State, never>,
    callback?: () => void
  ) => {
    super.setState(state, callback);
  };

  public async componentDidMount() {
    // Get initial filters
    await this.loadInitialFilters();
    // Get initial filters
    this.site = Utils.getParamFromNavigation(this.props.route, 'site', null) as unknown as Site;
    await super.componentDidMount();
  }

  public async loadInitialFilters() {
    const centralServerProvider = await ProviderFactory.getProvider();
    let location = Utils.convertToBoolean(
      await SecuredStorage.loadFilterValue(centralServerProvider.getUserInfo(), GlobalFilters.LOCATION)
    );
    if (!location) {
      location = false;
    }
    this.setState({
      initialFilters: { location },
      filters: { location }
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

  public getSiteAreas = async (searchText: string, skip: number, limit: number): Promise<DataResult<SiteArea>> => {
    try {
      // Get current location
      this.currentLocation = await this.getCurrentLocation();
      const params = {
        Search: searchText,
        SiteID: this.site?.id,
        Issuer: true,
        WithAvailableChargers: true,
        LocLatitude: this.currentLocation ? this.currentLocation.latitude : null,
        LocLongitude: this.currentLocation ? this.currentLocation.longitude : null,
        LocMaxDistanceMeters: this.currentLocation ? Constants.MAX_DISTANCE_METERS : null
      };
      // Get the Site Areas
      const siteAreas = await this.centralServerProvider.getSiteAreas(params, { skip, limit }, ['name']);
      // Get total number of records
      if ((siteAreas.count === -1) && Utils.isEmptyArray(this.state.siteAreas)) {
        const sitesAreasNbrRecordsOnly = await this.centralServerProvider.getSites(params, Constants.ONLY_RECORD_COUNT);
        siteAreas.count = sitesAreasNbrRecordsOnly.count;
      }
      return siteAreas;
    } catch (error) {
      // Other common Error
      await Utils.handleHttpUnexpectedError(
        this.centralServerProvider,
        error,
        'siteAreas.siteAreaUnexpectedError',
        this.props.navigation,
        this.refresh.bind(this)
      );
    }
    return null;
  };

  public onBack = () => {
    // Back mobile button: Force navigation
    if (this.state.showMap && !Utils.isEmptyArray(this.state.siteAreas)) {
      this.setState({ showMap: false });
    } else {
      this.props.navigation.goBack();
    }
    // Do not bubble up
    return true;
  };

  public refreshCurrentRegion(siteAreas: SiteArea[], force = false) {
    // Set current region
    if (!this.currentRegion || force) {
      let gpsCoordinates: number[];
      if (!Utils.isEmptyArray(siteAreas) && Utils.containsAddressGPSCoordinates(siteAreas[0].address)) {
        gpsCoordinates = siteAreas[0].address.coordinates;
      }
      this.currentRegion = {
        longitude: gpsCoordinates ? gpsCoordinates[0] : 2.3514616,
        latitude: gpsCoordinates ? gpsCoordinates[1] : 48.8566969,
        latitudeDelta: 0.009,
        longitudeDelta: 0.009
      };
    }
  }

  public refresh = async () => {
    // Component Mounted?
    if (this.isMounted()) {
      const { skip, limit } = this.state;
      // Refresh All
      const siteAreas = await this.getSiteAreas(this.searchText, 0, skip + limit);
      // Refresh region
      this.refreshCurrentRegion(siteAreas.result);
      // Set Site Areas
      this.setState({
        loading: false,
        siteAreas: siteAreas ? siteAreas.result : [],
        count: siteAreas ? siteAreas.count : 0
      });
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

  public onEndScroll = async () => {
    const { count, skip, limit } = this.state;
    // No reached the end?
    if (skip + limit < count || count === -1) {
      // No: get next sites
      const siteAreas = await this.getSiteAreas(this.searchText, skip + Constants.PAGING_SIZE, limit);
      // Add sites
      this.setState((prevState, props) => ({
        siteAreas: [...prevState.siteAreas, ...siteAreas.result],
        skip: prevState.skip + Constants.PAGING_SIZE,
        refreshing: false
      }));
    }
  };

  public search = async (searchText: string) => {
    this.searchText = searchText;
    await this.refresh();
  };

  public onMapRegionChange = (region: Region) => {
    this.currentRegion = region;
  };

  public filterChanged(newFilters: SiteAreasFiltersDef) {
    delete this.currentRegion;
    this.setState({ filters: newFilters }, async () => this.refresh());
  }

  public toggleDisplayMap = () => {
    // Refresh region
    this.refreshCurrentRegion(this.state.siteAreas, true);
    // Toggle map
    this.setState({ showMap: !this.state.showMap });
  };

  public showMapSiteDetail = (siteArea: SiteArea) => {
    this.setState({
      visible: true,
      siteAreaSelected: siteArea
    });
  };

  public buildModal(navigation: any, siteAreaSelected: SiteArea, modalStyle: any) {
    if (Platform.OS === 'ios') {
      return (
        <Modal style={modalStyle.modalBottomHalf} isVisible={this.state.visible} onBackdropPress={() => this.setState({ visible: false })}>
          <Modalize alwaysOpen={175} modalStyle={modalStyle.modalContainer}>
            <SiteAreaComponent siteArea={siteAreaSelected} navigation={navigation} onNavigate={() => this.setState({ visible: false })} />
          </Modalize>
        </Modal>
      );
    } else {
      return (
        <Modal style={modalStyle.modalBottomHalf} isVisible={this.state.visible} onBackdropPress={() => this.setState({ visible: false })}>
          <View style={modalStyle.modalContainer}>
            <ScrollView>
              <SiteAreaComponent siteArea={siteAreaSelected} navigation={navigation} onNavigate={() => this.setState({ visible: false })} />
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
    const { loading, skip, count, limit, initialFilters, showMap, siteAreaSelected, siteAreas, refreshing } = this.state;
    const mapIsDisplayed = showMap && !Utils.isEmptyArray(this.state.siteAreas);
    const siteAreasWithGPSCoordinates = siteAreas.filter((siteArea) => Utils.containsAddressGPSCoordinates(siteArea.address));
    const isDarkModeEnabled = ThemeManager.getInstance()?.isThemeTypeIsDark();
    return (
      <Container style={style.container}>
        <HeaderComponent
          navigation={navigation}
          title={this.site?.name}
          subTitle={count > 0 ? `${I18nManager.formatNumber(count)} ${I18n.t('siteAreas.siteAreas')}` : null}
          leftAction={this.onBack}
          leftActionIcon={'navigate-before'}
          rightAction={() => {
            navigation.dispatch(DrawerActions.openDrawer());
            return true;
          }}
          rightActionIcon={'menu'}
          displayMap={!Utils.isEmptyArray(this.state.siteAreas)}
          mapIsDisplayed={mapIsDisplayed}
          displayMapAction={() => this.toggleDisplayMap()}
        />
        {loading ? (
          <Spinner style={style.spinner} color="grey" />
        ) : (
          <View style={style.content}>
            <SimpleSearchComponent onChange={async (searchText) => this.search(searchText)} navigation={navigation} />
            <SiteAreasFilters
              initialFilters={initialFilters}
              locationEnabled={this.locationEnabled}
              onFilterChanged={(newFilters: SiteAreasFiltersDef) => this.setState({ filters: newFilters }, async () => this.refresh())}
              ref={(siteAreasFilters: SiteAreasFilters) => this.setScreenFilters(siteAreasFilters)}
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
                    {siteAreasWithGPSCoordinates.map((siteArea: SiteArea) => (
                      <Marker
                        image={Utils.buildSiteStatusMarker(siteArea.connectorStats)}
                        key={siteArea.id}
                        coordinate={{ longitude: siteArea.address.coordinates[0], latitude: siteArea.address.coordinates[1] }}
                        title={siteArea.name}
                        onPress={() => this.showMapSiteDetail(siteArea)}
                      />
                    ))}
                  </ClusterMap>
                )}
                {siteAreaSelected && this.buildModal(navigation, siteAreaSelected, modalStyle)}
              </View>
            ) : (
              <ItemsList<SiteArea>
                skip={skip}
                count={count}
                onEndReached={this.onEndScroll}
                renderItem={(site: SiteArea) => <SiteAreaComponent siteArea={site} navigation={this.props.navigation} />}
                data={siteAreas}
                manualRefresh={this.manualRefresh}
                refreshing={refreshing}
                emptyTitle={I18n.t('siteAreas.noSiteAreas')}
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
