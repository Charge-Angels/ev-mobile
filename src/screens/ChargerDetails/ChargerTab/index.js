import React from "react";
import { Container, Tab, Tabs, TabHeading, Spinner, Icon, Text } from "native-base";
import ChargerDetails from "../ChargerDetails";
import ChartDetails from "../ChartDetails";
import ConnectorDetails from "../ConnectorDetails";
import BaseScreen from "../../BaseScreen"
import ProviderFactory from "../../../provider/ProviderFactory";
import HeaderComponent from "../../../components/Header";
import I18n from "../../../I18n/I18n";
import computeStyleSheet from "./styles";
import Utils from "../../../utils/Utils";
import Constants from "../../../utils/Constants";

const _provider = ProviderFactory.getProvider();

export default class ChargerTab extends  BaseScreen {
  constructor(props) {
    super(props);
    this.state = {
      charger: null,
      connector: null,
      firstLoad: true,
      isAdmin: false
    };
    // Override
    this.refreshPeriodMillis = Constants.AUTO_REFRESH_SHORT_PERIOD_MILLIS;
  }

  async componentDidMount() {
    // Call parent
    super.componentDidMount();
    // Refresh Charger
    await this._getCharger();
    // Set if Admin
    const isAdmin = (await _provider.getSecurityProvider()).isAdmin();
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({
      firstLoad: false,
      isAdmin
    });
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
  }

  _getCharger = async () => {
    // Get IDs
    const chargerID = Utils.getParamFromNavigation(this.props.navigation, "chargerID", null);
    const connectorID = Utils.getParamFromNavigation(this.props.navigation, "connectorID", null);
    try {
      let charger = await _provider.getCharger(
        { ID: chargerID }
      );
      this.setState({
        charger: charger,
        connector: charger.connectors[connectorID - 1]
      });
    } catch (error) {
      // Other common Error
      Utils.handleHttpUnexpectedError(error, this.props);
    }
  }

  render() {
    const style = computeStyleSheet();
    const connectorID = Utils.getParamFromNavigation(this.props.navigation, "connectorID", null);
    const { charger, connector, isAdmin, firstLoad } = this.state;
    const { navigation } = this.props;
    const connectorLetter = String.fromCharCode(64 + connectorID);
    return (
      firstLoad ?
        <Container style={style.container}>
          <Spinner color="white" style={style.spinner} />
        </Container>
      :
        <Container style={style.container}>
          <HeaderComponent
            title={charger.id} subTitle={`${I18n.t("details.connector")} ${connectorLetter}`}
            leftAction={() => navigation.navigate("Chargers", { siteAreaID: charger.siteAreaID })} leftActionIcon={"arrow-back" } />
          <Tabs tabBarPosition="bottom" locked={true}>
            <Tab heading={
                  <TabHeading>
                    <Icon type="FontAwesome" name="bolt" />
                    <Text>{I18n.t("details.connector")}</Text>
                  </TabHeading>
                }>
              <ConnectorDetails charger={charger} connector={connector} isAdmin={isAdmin} navigation={navigation}/>
            </Tab>
            <Tab heading={
                  <TabHeading>
                    <Icon type="AntDesign" name="linechart" />
                    <Text>{I18n.t("details.graph")}</Text>
                  </TabHeading>
                }>
              <ChartDetails charger={charger} connector={connector} isAdmin={isAdmin} navigation={navigation}/>
            </Tab>
            { isAdmin ?
              <Tab heading={
                    <TabHeading>
                      <Icon type="MaterialIcons" name="info" />
                      <Text>{I18n.t("details.informations")}</Text>
                    </TabHeading>
                  }>
                <ChargerDetails charger={charger} connector={connector} isAdmin={isAdmin}  navigation={navigation}/>
              </Tab>
            :
              undefined
            }
          </Tabs>
        </Container>
    );
  }
}
