import I18n from 'i18n-js';
import { Container, Spinner, Text, View } from 'native-base';
import React from 'react';
import { FlatList, RefreshControl, ScrollView } from 'react-native';
import { DrawerActions } from 'react-navigation-drawer';
import HeaderComponent from '../../../components/header/HeaderComponent';
import ListEmptyTextComponent from '../../../components/list/empty-text/ListEmptyTextComponent';
import I18nManager from '../../../I18n/I18nManager';
import BaseProps from '../../../types/BaseProps';
import ChargingStation, { ChargingStationCapabilities, OcppAdvancedCommands, OcppCommand } from '../../../types/ChargingStation';
import { KeyValue, PropertyDisplay } from '../../../types/Global';
import Utils from '../../../utils/Utils';
import BaseScreen from '../../base-screen/BaseScreen';
import computeStyleSheet from './ChargerPropertiesStyles';

export interface Props extends BaseProps {
}

interface State {
  loading?: boolean;
  refreshing?: boolean;
  charger: ChargingStation;
}

export default class ChargerProperties extends BaseScreen<Props, State> {
  public state: State;
  public props: Props;
  private displayedProperties: PropertyDisplay[] = [
    { key: 'chargePointVendor', title: 'details.vendor' },
    { key: 'chargePointModel', title: 'details.model' },
    { key: 'chargeBoxSerialNumber', title: 'details.serialNumber' },
    { key: 'firmwareVersion', title: 'details.firmwareVersion' },
    { key: 'endpoint', title: 'details.privateURL' },
    { key: 'chargingStationURL', title: 'details.publicURL' },
    { key: 'currentIPAddress', title: 'details.currentIP' },
    { key: 'ocppVersion', title: 'details.ocppVersion' },
    {
      key: 'lastReboot', title: 'details.lastReboot', formatter: (lastReboot: Date): string => {
        return I18nManager.formatDateTime(lastReboot);
      },
    },
    {
      key: 'createdOn', title: 'general.createdOn', formatter: (createdOn: Date): string => {
        return I18nManager.formatDateTime(createdOn);
      },
    },
    {
      key: 'capabilities', title: 'details.capabilities', formatterWithComponents: true,
      formatter: (capabilities: ChargingStationCapabilities): Element[] => {
        const formatterValues: Element[] = [];
        if (capabilities) {
          const style = computeStyleSheet();
          for (const key in capabilities) {
            if (capabilities.hasOwnProperty(key)) {
              // @ts-ignore
              formatterValues.push(<Text style={style.values}>{`${key}: ${capabilities[key]}`}</Text>);
            }
          }
        }
        return formatterValues;
      },
    },
    {
      key: 'ocppStandardParameters', title: 'details.ocppStandardParams', formatterWithComponents: true,
      formatter: (ocppStandardParameters: KeyValue[]): Element[] => {
        const formatterValues: Element[] = [];
        if (ocppStandardParameters) {
          const style = computeStyleSheet();
          for (const ocppStandardParameter of ocppStandardParameters) {
            formatterValues.push(<Text style={style.values}>{`${ocppStandardParameter.key}: ${ocppStandardParameter.value}`}</Text>);
          }
        }
        return formatterValues;
      },
    },
    {
      key: 'ocppVendorParameters', title: 'details.ocppVendorParams', formatterWithComponents: true,
      formatter: (ocppVendorParameters: KeyValue[]): Element[] => {
        const formatterValues: Element[] = [];
        if (ocppVendorParameters) {
          const style = computeStyleSheet();
          for (const ocppVendorParameter of ocppVendorParameters) {
              formatterValues.push(<Text style={style.values}>{`${ocppVendorParameter.key}: ${ocppVendorParameter.value}`}</Text>);
          }
        }
        return formatterValues;
      },
    },
    {
      key: 'ocppAdvancedCommands', title: 'details.ocppAdvancedCommands', formatterWithComponents: true,
      formatter: (ocppAdvancedCommands: OcppAdvancedCommands[]): Element[] => {
        const formatterValues: Element[] = [];
        if (ocppAdvancedCommands) {
          const style = computeStyleSheet();
          for (const ocppAdvancedCommand of ocppAdvancedCommands) {
            if (typeof ocppAdvancedCommand === 'object') {
              const advancedCommand = ocppAdvancedCommand as OcppCommand;
              formatterValues.push(<Text style={style.values}>{`${advancedCommand.command} ${advancedCommand.parameters ? '(' + advancedCommand.parameters.join(', ') + ')' : ''}`}</Text>);
            } else {
              formatterValues.push(<Text style={style.values}>{ocppAdvancedCommand}</Text>);
            }
          }
        }
        return formatterValues;
      },
    },
  ];

  constructor(props: Props) {
    super(props);
    this.state = {
      loading: true,
      refreshing: false,
      charger: null,
    }
  }

  public setState = (state: State | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Pick<State, never>) | Pick<State, never>, callback?: () => void) => {
    super.setState(state, callback);
  }

  public async componentDidMount() {
    // Call parent
    await super.componentDidMount();
    await this.refresh();
  }

  public refresh = async () => {
    // Component Mounted?
    if (this.isMounted()) {
      const chargerID = Utils.getParamFromNavigation(this.props.navigation, 'chargerID', null);
      // Get Charger
      const charger = await this.getCharger(chargerID);
      // Build props
      const chargerProperties = this.buildChargerProperties(charger);
      // Set
      this.setState({
        loading: false,
        charger,
        chargerProperties,
      });
    }
  };

  public getCharger = async (chargerID: string): Promise<ChargingStation> => {
    try {
      // Get Charger
      const charger = await this.centralServerProvider.getCharger({ ID: chargerID });
      return charger;
    } catch (error) {
      // Other common Error
      Utils.handleHttpUnexpectedError(this.centralServerProvider, error,
        'chargers.chargerUnexpectedError', this.props.navigation);
    }
    return null;
  };

  public manualRefresh = async () => {
    // Display spinner
    this.setState({ refreshing: true });
    // Refresh
    await this.refresh();
    // Hide spinner
    this.setState({ refreshing: false });
  };

  public onBack = () => {
    // Back mobile button: Force navigation
    this.props.navigation.goBack(null);
    // Do not bubble up
    return true;
  };

  private buildChargerProperties(charger: ChargingStation) {
    if (charger) {
      for (const displayedProperty of this.displayedProperties) {
        // @ts-ignore
        displayedProperty.value = charger && charger[displayedProperty.key] ? charger[displayedProperty.key] : '-';
      }
    }
  }

  public render() {
    const { navigation } = this.props;
    const style = computeStyleSheet();
    const { loading, charger } = this.state;
    return (
      <Container style={style.container}>
        <HeaderComponent
          navigation={this.props.navigation}
          title={charger ? charger.id : I18n.t('connector.unknown')}
          subTitle={charger && charger.inactive ? `(${I18n.t('details.inactive')})` : null}
          leftAction={() => this.onBack()}
          leftActionIcon={'navigate-before'}
          rightAction={() => navigation.dispatch(DrawerActions.openDrawer())}
          rightActionIcon={'menu'}
        />
        {loading ? (
          <Spinner style={style.spinner} />
        ) : (
          <FlatList
            data={this.displayedProperties}
            renderItem={({ item, index }) => (
              <View style={index % 2 ? [style.descriptionContainer, style.rowBackground] : style.descriptionContainer}>
                <Text style={style.label}>{I18n.t(item.title)}</Text>
                {item.formatter && item.value !== '-' ?
                  item.formatterWithComponents ?
                    <ScrollView horizontal={true} alwaysBounceHorizontal={false} contentContainerStyle={style.scrollViewValues}>
                      {item.formatter(item.value)}
                    </ScrollView>
                  :
                    <ScrollView horizontal={true} alwaysBounceHorizontal={false} contentContainerStyle={style.scrollViewValue}>
                      <Text style={style.value}>{item.formatter(item.value)}</Text>
                    </ScrollView>
                :
                  <ScrollView horizontal={true} alwaysBounceHorizontal={false} contentContainerStyle={style.scrollViewValue}>
                    <Text style={style.value}>{item.value}</Text>
                  </ScrollView>
                }
              </View>
            )}
            keyExtractor={(item) => `${item.key}`}
            refreshControl={<RefreshControl onRefresh={this.manualRefresh} refreshing={this.state.refreshing} />}
            ListEmptyComponent={() => <ListEmptyTextComponent navigation={navigation} text={I18n.t('chargers.noChargerParameters')} />}
          />
        )}
      </Container>
    );
  }
}
