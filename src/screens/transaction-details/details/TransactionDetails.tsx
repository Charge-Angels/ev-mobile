import { Container, Icon, Text, Thumbnail, View } from "native-base";
import React from "react";
import { Image, ScrollView } from "react-native";
import BackgroundComponent from "../../../components/background/BackgroundComponent";
import I18n from "../../../I18n/I18n";
import ProviderFactory from "../../../provider/ProviderFactory";
import BaseScreen from "../../../screens/base-screen/BaseScreen";
import BaseProps from "../../../types/BaseProps";
import Transaction from "../../../types/Transaction";
import User from "../../../types/User";
import Constants from "../../../utils/Constants";
import Utils from "../../../utils/Utils";
import computeStyleSheet from "./TransactionDetailsStyles";

const noPhoto = require("../../../../assets/no-photo.png");
const noPhotoActive = require("../../../../assets/no-photo-active.png");
const noSite = require("../../../../assets/no-site.png");

export interface Props extends BaseProps {
  transaction: Transaction;
  isAdmin: boolean;
}

interface State {
  userImageLoaded?: boolean;
  userImage?: string;
  siteImage?: string;
  elapsedTimeFormatted?: string;
  totalInactivitySecs?: number;
  inactivityFormatted?: string;
  startTransactionNbTrial?: number;
  isPricingActive?: boolean;
  buttonDisabled?: boolean;
  refreshing?: boolean;
}

export default class TransactionDetails extends BaseScreen<Props, State> {
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.state = {
      userImageLoaded: false,
      userImage: null,
      siteImage: null,
      elapsedTimeFormatted: "-",
      totalInactivitySecs: 0,
      inactivityFormatted: "-",
      startTransactionNbTrial: 0,
      isPricingActive: false,
      buttonDisabled: true,
      refreshing: false
    };
  }

  public setState = (state: State | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Pick<State, never>) | Pick<State, never>, callback?: () => void) => {
    super.setState(state, callback);
  }

  public async componentDidMount() {
    const { transaction } = this.props;
    await super.componentDidMount();
    // Get the Site Image
    if (transaction.siteID && this.isMounted()) {
      await this.getSiteImage(transaction.siteID);
    }
    // Get the User Image
    if (transaction.user && this.isMounted()) {
      await this.getUserImage(transaction.user);
    }
    // Compute Duration
    this.computeDurationInfos();
    // Get the provider
    const centralServerProvider = await ProviderFactory.getProvider();
    const securityProvider = centralServerProvider.getSecurityProvider();
    this.setState({
      isPricingActive: securityProvider.isComponentPricingActive()
    });
  }

  public async componentWillUnmount() {
    await super.componentWillUnmount();
  }

  public getSiteImage = async (siteID: string) => {
    try {
      if (!this.state.siteImage) {
        // Get it
        const image = await this.centralServerProvider.getSiteImage(siteID);
        if (image) {
          this.setState({ siteImage: image });
        } else {
          this.setState({ siteImage: null });
        }
      }
    } catch (error) {
      Utils.handleHttpUnexpectedError(this.centralServerProvider, error, this.props.navigation);
    }
  };

  public getUserImage = async (user: User) => {
    const { userImageLoaded } = this.state;
    try {
      // User provided?
      if (user) {
        // Not already loaded?
        if (!userImageLoaded) {
          // Get it
          const image = await this.centralServerProvider.getUserImage({ ID: user.id });
          this.setState({
            userImageLoaded: true,
            userImage: image ? image : null
          });
        }
      } else {
        // Set
        this.setState({
          userImageLoaded: false,
          userImage: null
        });
      }
    } catch (error) {
      // Other common Error
      Utils.handleHttpUnexpectedError(this.centralServerProvider, error, this.props.navigation);
    }
  };

  public computeDurationInfos = () => {
    const { transaction } = this.props;
    // Component Mounted?
    if (this.isMounted()) {
      // Compute duration
      const elapsedTimeFormatted = Utils.formatDurationHHMMSS(((Date.now() - new Date(transaction.timestamp).getTime()) / 1000), false);
      // Compute Inactivity
      const totalInactivitySecs = transaction.stop.totalInactivitySecs +
        (transaction.stop.extraInactivitySecs ? transaction.stop.extraInactivitySecs : 0);
      const inactivityFormatted = Utils.formatDurationHHMMSS(totalInactivitySecs, false);
      // Set
      this.setState({
        totalInactivitySecs,
        elapsedTimeFormatted,
        inactivityFormatted
      });
    }
  };

  public renderUserInfo = (style: any) => {
    const { transaction, isAdmin } = this.props;
    const { userImage } = this.state;
    return transaction ? (
      <View style={style.columnContainer}>
        <Thumbnail style={[style.userImage]} source={userImage ? { uri: userImage } : noPhotoActive} />
        <Text numberOfLines={1} style={[style.label, style.labelUser, style.info]}>
          {Utils.buildUserName(transaction.user)}
        </Text>
        {isAdmin ? <Text style={[style.subLabel, style.subLabelUser, style.info]}>({transaction.tagID})</Text> : undefined}
      </View>
    ) : (
      <View style={style.columnContainer}>
        <Thumbnail style={[style.userImage]} source={userImage ? { uri: userImage } : noPhoto} />
        <Text style={[style.label, style.disabled]}>-</Text>
      </View>
    );
  };

  public renderPrice = (style: any) => {
    const { transaction } = this.props;
    const price = Math.round(transaction.stop.price * 100) / 100;
    return (
      <View style={style.columnContainer}>
        <Icon type="FontAwesome" name="money" style={[style.icon, style.info]} />
        <Text style={[style.label, style.labelValue, style.info]}>{price}</Text>
        <Text style={[style.subLabel, style.info]}>({transaction.priceUnit})</Text>
      </View>
    );
  };

  public renderElapsedTime = (style: any) => {
    const { elapsedTimeFormatted } = this.state;
    return (
      <View style={style.columnContainer}>
        <Icon type="MaterialIcons" name="timer" style={[style.icon, style.info]} />
        <Text style={[style.label, style.labelValue, style.info]}>{elapsedTimeFormatted}</Text>
        <Text style={[style.subLabel, style.info]}>{I18n.t("details.duration")}</Text>
      </View>
    );
  };

  public renderInactivity = (style: any) => {
    const { inactivityFormatted, totalInactivitySecs } = this.state;
    const inactivityStyle = Utils.computeInactivityStyle(totalInactivitySecs);
    return (
      <View style={style.columnContainer}>
        <Icon type="MaterialIcons" name="timer-off" style={[style.icon, inactivityStyle]} />
        <Text style={[style.label, style.labelValue, inactivityStyle]}>{inactivityFormatted}</Text>
        <Text style={[style.subLabel, inactivityStyle]}>{I18n.t("details.duration")}</Text>
      </View>
    );
  };

  public renderTotalConsumption = (style: any) => {
    const { transaction } = this.props;
    return (
      <View style={style.columnContainer}>
        <Icon style={[style.icon, style.info]} type="MaterialIcons" name="ev-station" />
        <Text style={[style.label, style.labelValue, style.info]}>{(transaction.stop.totalConsumption / 1000).toFixed(1)}</Text>
        <Text style={[style.subLabel, style.info]}>{I18n.t("details.total")} (kW.h)</Text>
      </View>
    );
  };

  public renderBatteryLevel = (style: any) => {
    const { transaction } = this.props;
    return (
      <View style={style.columnContainer}>
        <Icon type="MaterialIcons" name="battery-charging-full" style={[style.icon, style.info]} />
        <Text style={[style.label, style.labelValue, style.info]}>{transaction.stateOfCharge} > {transaction.stop.stateOfCharge}</Text>
        <Text style={[style.subLabel, style.info]}>(%)</Text>
      </View>
    );
  };

  public render() {
    const style = computeStyleSheet();
    const { siteImage, isPricingActive } = this.state;
    return (
      <Container style={style.container}>
        {/* Site Image */}
        <Image style={style.backgroundImage} source={siteImage ? { uri: siteImage } : noSite} />
        <BackgroundComponent navigation={this.props.navigation} active={false}>
          <ScrollView
            style={style.scrollViewContainer}>
            <View style={style.detailsContainer}>
              <View style={style.rowContainer}>
                {this.renderUserInfo(style)}
                {this.renderTotalConsumption(style)}
              </View>
              <View style={style.rowContainer}>
                {this.renderElapsedTime(style)}
                {this.renderInactivity(style)}
              </View>
              <View style={style.rowContainer}>
                {this.renderBatteryLevel(style)}
                {isPricingActive ? this.renderPrice(style) : <View style={style.columnContainer} />}
              </View>
            </View>
          </ScrollView>
        </BackgroundComponent>
      </Container>
    );
  }
}