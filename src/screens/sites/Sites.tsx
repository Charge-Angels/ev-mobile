import { DrawerActions } from '@react-navigation/native';
import I18n from 'i18n-js';
import { Container, Spinner, View } from 'native-base';
import React from 'react';
import { Platform } from 'react-native';
import { ClusterMap } from 'react-native-cluster-map';
import { ScrollView } from 'react-native-gesture-handler';
import { Location } from 'react-native-location';
import { Marker, Region } from 'react-native-maps';
import Modal from 'react-native-modal';
import { Modalize } from 'react-native-modalize';

import HeaderComponent from '../../components/header/HeaderComponent';
import ItemsList, { ItemsSeparatorType } from '../../components/list/ItemsList';
import SimpleSearchComponent from '../../components/search/simple/SimpleSearchComponent';
import SiteComponent from '../../components/site/SiteComponent';
import ThemeManager from '../../custom-theme/ThemeManager';
import I18nManager from '../../I18n/I18nManager';
import LocationManager from '../../location/LocationManager';
import computeModalStyle from '../../ModalStyles';
import ProviderFactory from '../../provider/ProviderFactory';
import BaseProps from '../../types/BaseProps';
import { DataResult } from '../../types/DataResult';
import { GlobalFilters } from '../../types/Filter';
import Site from '../../types/Site';
import Constants from '../../utils/Constants';
import SecuredStorage from '../../utils/SecuredStorage';
import Utils from '../../utils/Utils';
import BaseAutoRefreshScreen from '../base-screen/BaseAutoRefreshScreen';
import SitesFilters, { SitesFiltersDef } from './SitesFilters';
import computeStyleSheet from './SitesStyles';

export interface Props extends BaseProps {}

interface State {
  sites?: Site[];
  loading?: boolean;
  refreshing?: boolean;
  skip?: number;
  limit?: number;
  initialFilters?: SitesFiltersDef;
  filters?: SitesFiltersDef;
  count?: number;
  showMap?: boolean;
  visible?: boolean;
  siteSelected?: Site;
}

export default class Sites extends BaseAutoRefreshScreen<Props, State> {
  public state: State;
  public props: Props;
  private searchText: string;
  private currentLocation: Location;
  private locationEnabled: boolean;
  private currentRegion: Region;
  private darkMapTheme = require('../../utils/map/google-maps-night-style.json');

  public constructor(props: Props) {
    super(props);
    this.state = {
      sites: [],
      loading: true,
      refreshing: false,
      skip: 0,
      initialFilters: {},
      limit: Constants.PAGING_SIZE,
      count: 0,
      showMap: false,
      visible: false,
      siteSelected: null
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
    // Call parent
    await super.componentDidMount();
    // No Site Management: Go to chargers
    if (this.securityProvider && !this.securityProvider.isComponentOrganizationActive()) {
      this.props.navigation.navigate('ChargingStations', { key: `${Utils.randomNumber()}` });
    }
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

  public getSites = async (searchText = '', skip: number, limit: number): Promise<DataResult<Site>> => {
    try {
      // Get current location
      this.currentLocation = await this.getCurrentLocation();
      const params = {
        Search: searchText,
        Issuer: true,
        WithAvailableChargers: true,
        LocLatitude: this.currentLocation ? this.currentLocation.latitude : null,
        LocLongitude: this.currentLocation ? this.currentLocation.longitude : null,
        LocMaxDistanceMeters: this.currentLocation ? Constants.MAX_DISTANCE_METERS : null
      };
      // Get the Sites
      const sites = await this.centralServerProvider.getSites(params, { skip, limit }, ['name']);
      // Get total number of records
      if ((sites.count === -1) && Utils.isEmptyArray(this.state.sites)) {
        const sitesNbrRecordsOnly = await this.centralServerProvider.getSites(params, Constants.ONLY_RECORD_COUNT);
        sites.count = sitesNbrRecordsOnly.count;
      }
      return sites;
    } catch (error) {
      // Other common Error
      await Utils.handleHttpUnexpectedError(
        this.centralServerProvider,
        error,
        'sites.siteUnexpectedError',
        this.props.navigation,
        this.refresh.bind(this)
      );
    }
  };

  public onBack = () => {
    // Back mobile button: Force navigation
    if (this.state.showMap && !Utils.isEmptyArray(this.state.sites)) {
      this.setState({ showMap: false });
    } else {
      this.props.navigation.goBack();
    }
    // Do not bubble up
    return true;
  };

  public refreshCurrentRegion(sites: Site[], force = false) {
    // Set current region
    if (!this.currentRegion || force) {
      let gpsCoordinates: number[];
      if (!Utils.isEmptyArray(sites) && Utils.containsAddressGPSCoordinates(sites[0].address)) {
        gpsCoordinates = sites[0].address.coordinates;
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
      const sites = await this.getSites(this.searchText, 0, skip + limit);
      // Refresh region
      this.refreshCurrentRegion(sites.result);
      // Add sites
      this.setState({
        loading: false,
        sites: sites ? sites.result : [],
        count: sites ? sites.count : 0
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
      const sites = await this.getSites(this.searchText, skip + Constants.PAGING_SIZE, limit);
      // Add sites
      this.setState((prevState, props) => ({
        sites: sites ? [...prevState.sites, ...sites.result] : prevState.sites,
        skip: prevState.skip + Constants.PAGING_SIZE,
        refreshing: false
      }));
    }
  };

  public search = async (searchText: string) => {
    this.searchText = searchText;
    delete this.currentRegion;
    await this.refresh();
  };

  public onMapRegionChange = (region: Region) => {
    this.currentRegion = region;
  };

  public filterChanged(newFilters: SitesFiltersDef) {
    delete this.currentRegion;
    this.setState({ filters: newFilters }, async () => this.refresh());
  }

  public toggleDisplayMap = () => {
    // Refresh region
    this.refreshCurrentRegion(this.state.sites, true);
    // Toggle map
    this.setState({ showMap: !this.state.showMap });
  };

  public showMapSiteDetail = (site: Site) => {
    this.setState({
      visible: true,
      siteSelected: site
    });
  };

  public buildModal(navigation: any, siteSelected: Site, modalStyle: any) {
    if (Platform.OS === 'ios') {
      return (
        <Modal style={modalStyle.modalBottomHalf} isVisible={this.state.visible} onBackdropPress={() => this.setState({ visible: false })}>
          <Modalize alwaysOpen={175} modalStyle={modalStyle.modalContainer}>
            <SiteComponent site={siteSelected} navigation={navigation} onNavigate={() => this.setState({ visible: false })} />
          </Modalize>
        </Modal>
      );
    } else {
      return (
        <Modal style={modalStyle.modalBottomHalf} isVisible={this.state.visible} onBackdropPress={() => this.setState({ visible: false })}>
          <View style={modalStyle.modalContainer}>
            <ScrollView>
              <SiteComponent site={siteSelected} navigation={navigation} onNavigate={() => this.setState({ visible: false })} />
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
    const { loading, skip, count, limit, initialFilters, showMap, siteSelected, refreshing, sites } = this.state;
    const mapIsDisplayed = showMap && !Utils.isEmptyArray(this.state.sites);
    const sitesWithGPSCoordinates = sites.filter((site) => Utils.containsAddressGPSCoordinates(site.address));
    const isDarkModeEnabled = ThemeManager.getInstance()?.isThemeTypeIsDark();
    return (
      <Container style={style.container}>
        <HeaderComponent
          navigation={navigation}
          title={I18n.t('sidebar.sites')}
          subTitle={count > 0 ? `${I18nManager.formatNumber(count)} ${I18n.t('sites.sites')}` : null}
          leftAction={this.onBack}
          leftActionIcon={'navigate-before'}
          rightAction={() => {
            navigation.dispatch(DrawerActions.openDrawer());
            return true;
          }}
          rightActionIcon={'menu'}
          displayMap={!Utils.isEmptyArray(this.state.sites)}
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
            <SitesFilters
              initialFilters={initialFilters}
              locationEnabled={this.locationEnabled}
              onFilterChanged={(newFilters: SitesFiltersDef) => this.filterChanged(newFilters)}
              ref={(sitesFilters: SitesFilters) => this.setScreenFilters(sitesFilters)}
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
                    {sitesWithGPSCoordinates.map((site: Site) => (
                      <Marker
                        image={Utils.buildSiteStatusMarker(site.connectorStats)}
                        key={site.id}
                        coordinate={{ longitude: site.address.coordinates[0], latitude: site.address.coordinates[1] }}
                        title={site.name}
                        onPress={() => this.showMapSiteDetail(site)}
                      />
                    ))}
                  </ClusterMap>
                )}
                {siteSelected && this.buildModal(navigation, siteSelected, modalStyle)}
              </View>
            ) : (
              <ItemsList<Site>
                skip={skip}
                count={count}
                onEndReached={this.onEndScroll}
                renderItem={(site: Site) => <SiteComponent site={site} navigation={navigation}/>}
                data={sites}
                manualRefresh={this.manualRefresh}
                refreshing={refreshing}
                emptyTitle={I18n.t('sites.noSites')}
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
