import React from "react";
import { Container, Tab, Tabs, TabHeading, Spinner, Icon } from "native-base";
import { ScrollView, RefreshControl } from "react-native";
import ChargerDetails from "../charger-details/ChargerDetails";
import ChartDetails from "../chart-details/ChartDetails";
import ConnectorDetails from "../connector-details/ConnectorDetails";
import BaseScreen from "../../base-screen/BaseScreen";
import ProviderFactory from "../../../provider/ProviderFactory";
import HeaderComponent from "../../../components/Header/HeaderComponent";
import I18n from "../../../I18n/I18n";
import computeStyleSheet from "./ChargerTabStyles";
import Utils from "../../../utils/Utils";
import Constants from "../../../utils/Constants";

const _provider = ProviderFactory.getProvider();

export default class ChargerTab extends BaseScreen {
  constructor(props) {
    super(props);
    this.state = {
      charger: null,
      connector: null,
      selectedTabIndex: 0,
      firstLoad: true,
      isAuthorizedToStopTransaction: false,
      isAdmin: false,
      refreshing: false
    };
    // Override
    this.refreshPeriodMillis = Constants.AUTO_REFRESH_SHORT_PERIOD_MILLIS;
  }

  async componentDidMount() {
    // Call parent
    super.componentDidMount();
    // Refresh Charger
    if (this.isMounted()) {
      await this._getCharger();
    }
    // Set if Admin
    const isAdmin = (await _provider.getSecurityProvider()).isAdmin();
    if (this.isMounted()) {
      // eslint-disable-next-line react/no-did-mount-set-state
      this.setState({
        firstLoad: false,
        isAdmin
      });
    }
  }

  componentWillUnmount() {
    // Call parent
    super.componentWillUnmount();
  }

  _refresh = async () => {
    // Component Mounted?
    if (this.isMounted()) {
      // Refresh Charger
      await this._getCharger();
    }
  };

  _manualRefresh = async () => {
    // Display spinner
    this.setState({ refreshing: true });
    // Refresh
    await this._refresh();
    // Hide spinner
    this.setState({ refreshing: false });
  };

  _getCharger = async () => {
    // Get IDs
    const chargerID = Utils.getParamFromNavigation(
      this.props.navigation,
      "chargerID",
      null
    );
    const connectorID = Utils.getParamFromNavigation(
      this.props.navigation,
      "connectorID",
      null
    );
    try {
      const charger = await _provider.getCharger({ ID: chargerID });
      this.setState(
        {
          charger,
          connector: charger.connectors[connectorID - 1]
        },
        async () => {
          // Check Auth
          await this._isAuthorizedStopTransaction();
        }
      );
    } catch (error) {
      // Other common Error
      Utils.handleHttpUnexpectedError(error, this.props);
    }
  };

  _isAuthorizedStopTransaction = async () => {
    const { charger, connector } = this.state;
    try {
      // Transaction?
      if (connector.activeTransactionID !== 0) {
        // Call
        const result = await _provider.isAuthorizedStopTransaction({
          Action: "StopTransaction",
          Arg1: charger.id,
          Arg2: connector.activeTransactionID
        });
        if (result) {
          // Assign
          this.setState({
            isAuthorizedToStopTransaction: result.IsAuthorized
          });
        }
      } else {
        // Not Authorized
        this.setState({
          isAuthorizedToStopTransaction: false
        });
      }
    } catch (error) {
      // Other common Error
      Utils.handleHttpUnexpectedError(error, this.props);
    }
  };

  render() {
    const style = computeStyleSheet();
    const connectorID = Utils.getParamFromNavigation(
      this.props.navigation,
      "connectorID",
      null
    );
    const {
      charger,
      connector,
      isAdmin,
      isAuthorizedToStopTransaction,
      firstLoad
    } = this.state;
    const { navigation } = this.props;
    const connectorLetter = String.fromCharCode(64 + connectorID);
    return firstLoad ? (
      <Container style={style.container}>
        <Spinner color="white" style={style.spinner} />
      </Container>
    ) : (
      <ScrollView
        contentContainerStyle={style.container}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this._manualRefresh}
          />
        }
      >
        <HeaderComponent
          title={charger.id}
          subTitle={`(${I18n.t("details.connector")} ${connectorLetter})`}
          leftAction={() =>
            navigation.navigate("Chargers", { siteAreaID: charger.siteAreaID })
          }
          leftActionIcon={"arrow-back"}
          rightAction={navigation.openDrawer}
          rightActionIcon={"menu"}
        />
        <Tabs tabBarPosition="bottom" locked={true} initialPage={0}>
          <Tab
            heading={
              <TabHeading style={style.tabHeader}>
                <Icon style={style.tabIcon} type="FontAwesome" name="bolt" />
              </TabHeading>
            }
          >
            <ConnectorDetails
              charger={charger}
              connector={connector}
              isAdmin={isAdmin}
              navigation={navigation}
            />
          </Tab>
          {connector.activeTransactionID && isAuthorizedToStopTransaction ? (
            <Tab
              heading={
                <TabHeading style={style.tabHeader}>
                  <Icon
                    style={style.tabIcon}
                    type="AntDesign"
                    name="linechart"
                  />
                </TabHeading>
              }
            >
              <ChartDetails
                transactionID={connector.activeTransactionID}
                isAdmin={isAdmin}
                navigation={navigation}
              />
            </Tab>
          ) : (
            undefined
          )}
          {isAdmin ? (
            <Tab
              heading={
                <TabHeading style={style.tabHeader}>
                  <Icon
                    style={style.tabIcon}
                    type="MaterialIcons"
                    name="info"
                  />
                </TabHeading>
              }
            >
              <ChargerDetails
                charger={charger}
                connector={connector}
                isAdmin={isAdmin}
                navigation={navigation}
              />
            </Tab>
          ) : (
            undefined
          )}
        </Tabs>
      </ScrollView>
    );
  }
}
