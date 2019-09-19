import { Container, Spinner, View } from "native-base";
import React from "react";
import { Alert, BackHandler, FlatList, Platform, RefreshControl } from "react-native";
import BackgroundComponent from "../../components/background/BackgroundComponent";
import ChargerComponent from "../../components/charger/ChargerComponent";
import HeaderComponent from "../../components/header/HeaderComponent";
import ListEmptyTextComponent from "../../components/list/empty-text/ListEmptyTextComponent";
import ListFooterComponent from "../../components/list/footer/ListFooterComponent";
import SearchHeaderComponent from "../../components/search-header/SearchHeaderComponent";
import Constants from "../../utils/Constants";
import Utils from "../../utils/Utils";
import BaseAutoRefreshScreen from "../base-screen/BaseAutoRefreshScreen";
import computeStyleSheet from "./ChargersStyles";

import I18n from "../../I18n/I18n";
export default class Chargers extends BaseAutoRefreshScreen {
  constructor(props) {
    super(props);
    // Init State
    this.state = {
      chargers: [],
      siteAreaID: Utils.getParamFromNavigation(this.props.navigation, "siteAreaID", null),
      loading: true,
      refreshing: false,
      skip: 0,
      limit: Constants.PAGING_SIZE,
      count: 0
    };
  }

  async componentDidMount() {
    // Call parent
    await super.componentDidMount();
    // Get Chargers
    await this.refresh();
  }

  _getChargers = async (searchText, skip, limit) => {
    const { siteAreaID } = this.state;
    let chargers = [];
    try {
      // Get Chargers
      if (siteAreaID) {
        // Get with the Site Area
        chargers = await this.centralServerProvider.getChargers({ Search: searchText, SiteAreaID: siteAreaID }, { skip, limit });
      } else {
        // Get without the Site
        chargers = await this.centralServerProvider.getChargers({ Search: searchText }, { skip, limit });
      }
    } catch (error) {
      // Other common Error
      Utils.handleHttpUnexpectedError(this.centralServerProvider, error, this.props.navigation, this.refresh);
    }
    return chargers;
  };

  _onEndScroll = async () => {
    const { count, skip, limit } = this.state;
    // No reached the end?
    if (skip + limit < count || count === -1) {
      // No: get next sites
      const chargers = await this._getChargers(this.searchText, skip + Constants.PAGING_SIZE, limit);
      // Add sites
      this.setState((prevState, props) => ({
        chargers: [...prevState.chargers, ...chargers.result],
        skip: prevState.skip + Constants.PAGING_SIZE,
        refreshing: false
      }));
    }
  };

  onBack = () => {
    const { siteAreaID } = this.state;
    if (siteAreaID) {
      // Go Back
      this.props.navigation.goBack();
    } else {
      // Exit?
      Alert.alert(
        I18n.t("general.exitApp"),
        I18n.t("general.exitAppConfirm"),
        [{ text: I18n.t("general.no"), style: "cancel" }, { text: I18n.t("general.yes"), onPress: () => BackHandler.exitApp() }],
        { cancelable: false }
      );
    }
    // Do not bubble up
    return true;
  };

  refresh = async () => {
    // Component Mounted?
    if (this.isMounted()) {
      const { skip, limit } = this.state;
      // Refresh All
      const chargers = await this._getChargers(this.searchText, 0, skip + limit);
      // Add Chargers
      this.setState((prevState, props) => ({
        loading: false,
        chargers: chargers.result,
        count: chargers.count
      }));
    }
  };

  _manualRefresh = async () => {
    // Display spinner
    this.setState({ refreshing: true });
    // Refresh
    await this.refresh();
    // Hide spinner
    this.setState({ refreshing: false });
  };

  _getSiteIDFromChargers() {
    const { chargers } = this.state;
    // Find the first available Site ID
    if (chargers && chargers.length > 0) {
      for (const charger of chargers) {
        if (charger.siteArea) {
          return charger.siteArea.siteID;
        }
      }
    }
  }

  render() {
    const style = computeStyleSheet();
    const { navigation } = this.props;
    const { siteAreaID, loading, chargers, skip, count, limit } = this.state;
    return (
      <Container style={style.container}>
        <BackgroundComponent active={false}>
          <HeaderComponent
            title={I18n.t("chargers.title")}
            showSearchAction={true}
            searchRef={this.searchRef}
            leftAction={siteAreaID ? this.onBack : null}
            leftActionIcon={siteAreaID ? "navigate-before" : null}
            rightAction={navigation.openDrawer}
            rightActionIcon={"menu"}
          />
          <SearchHeaderComponent
            initialVisibility={false}
            ref={(ref) => {
              this.searchRef = ref;
            }}
            onChange={(searchText) => this._search(searchText)}
            navigation={navigation}
          />
          <View style={style.content}>
            {loading ? (
              <Spinner style={style.spinner} />
            ) : (
              <FlatList
                data={chargers}
                renderItem={({ item }) => <ChargerComponent charger={item} navigation={navigation} siteAreaID={siteAreaID} />}
                keyExtractor={(item) => item.id}
                refreshControl={<RefreshControl onRefresh={this._manualRefresh} refreshing={this.state.refreshing} />}
                onEndReached={this._onEndScroll}
                onEndReachedThreshold={Platform.OS === "android" ? 1 : 0.1}
                ListFooterComponent={() => <ListFooterComponent skip={skip} count={count} limit={limit} />}
                ListEmptyComponent={() => <ListEmptyTextComponent text={I18n.t("chargers.noChargers")} />}
              />
            )}
          </View>
        </BackgroundComponent>
      </Container>
    );
  }
}