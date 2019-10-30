import I18n from "i18n-js";
import { Body, Card, CardItem, Container, Content, DatePicker, Icon, Left, Spinner, Text, View } from "native-base";
import React from "react";
import { Alert, BackHandler } from "react-native";
import BackgroundComponent from "../../../components/background/BackgroundComponent";
import HeaderComponent from "../../../components/header/HeaderComponent";
import ComplexSearchComponent from "../../../components/search/complex/ComplexSearchComponent";
import I18nManager from "../../../I18n/I18nManager";
import ProviderFactory from "../../../provider/ProviderFactory";
import BaseProps from "../../../types/BaseProps";
import Constants from "../../../utils/Constants";
import Utils from "../../../utils/Utils";
import BaseAutoRefreshScreen from "../../base-screen/BaseAutoRefreshScreen";
import computeStyleSheet from "./HomeStatsStyles";

export interface Props extends BaseProps {
}

interface State {
  loading?: boolean;
  isAdmin?: boolean;
  startDate?: Date;
  endDate?: Date;
  totalNumberOfSession?: number;
  totalConsumptionWattHours?: number;
  totalDurationSecs?: number;
  totalInactivitySecs?: number;
  totalPrice?: number;
  priceCurrency?: string;
  isPricingActive?: boolean;
  showFilter?: boolean;
}

export default class HomeStats extends BaseAutoRefreshScreen<Props, State> {
  public state: State;
  public props: Props;
  private filters: { "StartDateTime"?: string; "EndDateTime"?: string } = {};
  private headerComponentRef: HeaderComponent;
  private searchComponentRef: ComplexSearchComponent;

  constructor(props: Props) {
    super(props);
    // Init State
    this.state = {
      loading: true,
      isAdmin: false,
      totalNumberOfSession: 0,
      totalConsumptionWattHours: 0,
      totalDurationSecs: 0,
      totalInactivitySecs: 0,
      startDate: null,
      endDate: null,
      totalPrice: 0,
      isPricingActive: false,
      showFilter: false
    };
    this.setRefreshPeriodMillis(Constants.AUTO_REFRESH_LONG_PERIOD_MILLIS);
  }

  public setState = (state: State | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Pick<State, never>) | Pick<State, never>, callback?: () => void) => {
    super.setState(state, callback);
  }

  public async componentDidMount() {
    await super.componentDidMount();
    // Refresh
    await this.refresh();
  }

  public refresh = async () => {
    // Get the provider
    const centralServerProvider = await ProviderFactory.getProvider();
    const securityProvider = centralServerProvider.getSecurityProvider();
    // Get the ongoing Transaction
    await this.getTransactions();
    // Set
    this.setState({
      isPricingActive: securityProvider.isComponentPricingActive(),
      loading: false
    });
  };

  public getTransactions = async () => {
    try {
      // Get active transaction
      const transactions = await this.centralServerProvider.getTransactions(
        { Statistics: 'history', ...this.filters },
        Constants.ONLY_RECORD_COUNT_PAGING
      );
      // Set
      this.setState({
        startDate: !this.state.startDate ? new Date(transactions.stats.firstTimestamp) : this.state.startDate,
        endDate: !this.state.endDate ? new Date(transactions.stats.lastTimestamp) : this.state.endDate,
        totalNumberOfSession: transactions.stats.count,
        totalConsumptionWattHours: transactions.stats.totalConsumptionWattHours,
        totalDurationSecs: transactions.stats.totalDurationSecs,
        totalInactivitySecs: transactions.stats.totalInactivitySecs,
        totalPrice: transactions.stats.totalPrice
      });
    } catch (error) {
      // Check if HTTP?
      if (!error.request || error.request.status !== 560) {
        Utils.handleHttpUnexpectedError(this.centralServerProvider, error, this.props.navigation, this.refresh);
      }
    }
  };

  public onBack = (): boolean => {
    Alert.alert(
      I18n.t("general.exitApp"),
      I18n.t("general.exitAppConfirm"),
      [{ text: I18n.t("general.no"), style: "cancel" }, { text: I18n.t("general.yes"), onPress: () => BackHandler.exitApp() }],
      { cancelable: false }
    );
    return true;
  }

  public onFilterChanged = async (filters: any) => {
    this.filters = filters;
    // Refresh
    await this.refresh();
  }

  public render = () => {
    const style = computeStyleSheet();
    const { navigation } = this.props;
    const { loading, totalNumberOfSession, totalConsumptionWattHours, startDate, endDate,
      totalDurationSecs, totalInactivitySecs, totalPrice, isPricingActive } = this.state;
    return (
      <Container style={style.container}>
        <BackgroundComponent navigation={navigation} active={false}>
          <HeaderComponent
            ref={(ref: HeaderComponent) => {
              this.headerComponentRef = ref;
            }}
            navigation={navigation}
            title={I18n.t("home.summary")}
            rightAction={navigation.openDrawer}
            rightActionIcon={"menu"}
          />
          {loading ? (
            <Spinner style={style.spinner} />
          ) : (
            <Content style={style.content}>
              <ComplexSearchComponent
                navigation={navigation}
                onFilterChanged={this.onFilterChanged}
                ref={(ref: ComplexSearchComponent) => {
                  this.searchComponentRef = ref;
                  if (this.headerComponentRef) {
                    this.headerComponentRef.setSearchComplexComponentRef(ref);
                  }
                }}
              >
                <View style={style.rowFilter}>
                  <Text style={style.textFilter}>Date From:</Text>
                  <DatePicker
                    defaultDate={this.filters.StartDateTime ? new Date(this.filters.StartDateTime) : startDate}
                    minimumDate={startDate}
                    maximumDate={this.filters.EndDateTime ? new Date(this.filters.EndDateTime) : endDate}
                    locale={this.centralServerProvider.getUserLanguage()}
                    timeZoneOffsetInMinutes={undefined}
                    modalTransparent={false}
                    animationType={"fade"}
                    androidMode={"spinner"}
                    textStyle={style.dateValue}
                    placeHolderTextStyle={style.dateValue}
                    onDateChange={(date: Date) => this.searchComponentRef.setFilter("StartDateTime",  date.toISOString())}
                    disabled={false}
                    formatChosenDate={(date) => I18nManager.formatDateTime(date, 'LL')}
                  />
                </View>
                <View style={style.rowFilter}>
                  <Text style={style.textFilter}>Date To:</Text>
                  <DatePicker
                    defaultDate={this.filters.EndDateTime ? new Date(this.filters.EndDateTime) : endDate}
                    minimumDate={this.filters.StartDateTime ? new Date(this.filters.StartDateTime) : startDate}
                    maximumDate={endDate}
                    locale={this.centralServerProvider.getUserLanguage()}
                    timeZoneOffsetInMinutes={undefined}
                    modalTransparent={false}
                    animationType={"fade"}
                    androidMode={"spinner"}
                    textStyle={style.dateValue}
                    placeHolderTextStyle={style.dateValue}
                    onDateChange={(date: Date) => this.searchComponentRef.setFilter("EndDateTime",  date.toISOString())}
                    disabled={false}
                    formatChosenDate={(date) => I18nManager.formatDateTime(date, 'LL')}
                  />
                </View>
              </ComplexSearchComponent>
              <Card>
                <CardItem>
                  <Left>
                    <Icon style={style.cardIcon} type="MaterialIcons" name="history" />
                    <Body>
                      <Text style={style.cardText}>{I18n.t("home.numberOfSessions",
                        { nbrSessions: I18nManager.formatNumber(totalNumberOfSession)})}</Text>
                      <Text note={true} style={style.cardNote}>{I18n.t("home.numberOfSessionsNote")}</Text>
                    </Body>
                  </Left>
                </CardItem>
              </Card>
              <Card>
                <CardItem>
                  <Left>
                    <Icon style={style.cardIcon} type="FontAwesome" name="bolt" />
                    <Body>
                      <Text style={style.cardText}>{I18n.t("home.totalConsumptiom",
                        { totalConsumptiom: I18nManager.formatNumber(Math.round(totalConsumptionWattHours / 1000))})}</Text>
                      <Text note={true} style={style.cardNote}>{I18n.t("home.totalConsumptiomNote")}</Text>
                    </Body>
                  </Left>
                </CardItem>
              </Card>
              <Card>
                <CardItem>
                  <Left>
                    <Icon style={style.cardIcon} type="MaterialIcons" name="timer" />
                    <Body>
                      <Text style={style.cardText}>{I18n.t("home.totalDuration",
                        { totalDuration: Utils.formatDuration(totalDurationSecs) })}</Text>
                      <Text note={true} style={style.cardNote}>{I18n.t("home.totalDurationNote")}</Text>
                    </Body>
                  </Left>
                </CardItem>
              </Card>
              <Card>
                <CardItem>
                  <Left>
                    <Icon style={style.cardIcon} type="MaterialIcons" name="timer-off" />
                    <Body>
                      <Text style={style.cardText}>{I18n.t("home.totalInactivity",
                        { totalInactivity: Utils.formatDuration(totalInactivitySecs),
                          totalInactivityPercent: I18nManager.formatPercentage((totalInactivitySecs / totalDurationSecs)) })}</Text>
                      <Text note={true} style={style.cardNote}>{I18n.t("home.totalInactivityNote")}</Text>
                    </Body>
                  </Left>
                </CardItem>
              </Card>
              { isPricingActive &&
                <Card>
                  <CardItem>
                    <Left>
                      <Icon style={style.cardIcon} type="FontAwesome" name="money" />
                      <Body>
                        <Text style={style.cardText}>{I18n.t("home.totalPrice",
                          { totalPrice: I18nManager.formatCurrency(totalPrice) }) }</Text>
                        <Text note={true} style={style.cardNote}>{I18n.t("home.totalPriceNote")}</Text>
                      </Body>
                    </Left>
                  </CardItem>
                </Card>
              }
            </Content>
          )}
        </BackgroundComponent>
      </Container>
    );
  };
}