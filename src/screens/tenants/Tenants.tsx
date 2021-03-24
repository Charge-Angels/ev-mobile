import { StackActions } from '@react-navigation/native';
import I18n from 'i18n-js';
import { Button, Icon, Text, View } from 'native-base';
import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { TenantConnection } from 'types/Tenant';

import HeaderComponent from '../../components/header/HeaderComponent';
import BaseProps from '../../types/BaseProps';
import Message from '../../utils/Message';
import SecuredStorage from '../../utils/SecuredStorage';
import Utils from '../../utils/Utils';
import BaseScreen from '../base-screen/BaseScreen';
import CreateTenantDialog from './CreateTenantDialog';
import CreateTenantQrCode from './TenantQrCode';
import computeTenantStyleSheet from './TenantsStyle';

export interface Props extends BaseProps {
}

interface State {
  tenants?: TenantConnection[];
  createTenantVisible?: boolean;
  createQrCodeTenantVisible?: boolean;
}

export default class Tenants extends BaseScreen<Props, State> {
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.state = {
      createQrCodeTenantVisible: false,
      createTenantVisible: false
    };
  }

  public async componentDidMount() {
    await super.componentDidMount();
    const tenants = await this.centralServerProvider.getTenants();
    const createQrCodeTenantVisible = Utils.getParamFromNavigation(
      this.props.route, 'openQRCode', this.state.createQrCodeTenantVisible);
    this.setState({
      tenants,
      createQrCodeTenantVisible
    });
  }

  public setState = (state: State | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Pick<State, never>) | Pick<State, never>, callback?: () => void) => {
    super.setState(state, callback);
  };

  public createTenant() {
    Alert.alert(
      I18n.t('authentication.createTenantTitle'),
      I18n.t('authentication.createTenantText'),
      [
        { text: I18n.t('qrCode.qrCode'), onPress: () => {
          this.setState({ createQrCodeTenantVisible: true });
        } },
        { text: I18n.t('general.manually'), onPress: () => {
          this.setState({ createTenantVisible: true });
        } },
        { text: I18n.t('general.close'), style: 'cancel' },
      ]
    );
  }

  private tenantCreated = async (newTenant: TenantConnection) => {
    const navigation = this.props.navigation;
    // Always close pop-up
    this.setState({
      createQrCodeTenantVisible: false,
      createTenantVisible: false,
    });
    if (newTenant) {
      const foundTenant = this.state.tenants.find((tenant: TenantConnection) => tenant.subdomain === newTenant.subdomain);
      if (foundTenant) {
        // Tenant already exists
        Message.showInfo(I18n.t('general.tenantExists', { tenantName: foundTenant.name }));
      } else {
        // Refresh
        const tenants = await this.centralServerProvider.getTenants();
        this.setState({
          tenants,
        });
        Message.showSuccess(I18n.t('general.createTenantSuccess', { tenantName: newTenant.name }));
        Alert.alert(
          I18n.t('general.registerToNewTenantTitle'),
          I18n.t('general.registerToNewTenant', { tenantName: newTenant.name }),
          [
            {
              text: I18n.t('authentication.signUp'),
              onPress: () => {
                navigation.navigate(
                  'SignUp',
                  {
                    tenantSubDomain: newTenant.subdomain
                  }
                );
              }
            },
            {
              text: I18n.t('authentication.signIn'), style: 'cancel', onPress: () => {
                navigation.navigate(
                  'Login',
                  {
                    tenantSubDomain: newTenant.subdomain
                  }
                );
              }
            },
            { text: I18n.t('general.close'), style: 'cancel' },
          ]
        );
      }
    }
  };

  private deleteTenant = async (index: number, subdomain: string) => {
    const tenants = this.state.tenants;
    // Remove
    const tenant = tenants.splice(index, 1)[0];
    // Save
    await SecuredStorage.saveTenants(tenants);
    // Remove cache
    await SecuredStorage.deleteUserCredentials(subdomain);
    this.setState({ tenants });
    Message.showSuccess(I18n.t('general.deleteTenantSuccess', { tenantName: tenant.name }));
  };

  public render() {
    const navigation = this.props.navigation;
    const { tenants, createTenantVisible, createQrCodeTenantVisible } = this.state;
    const tenantStyle = computeTenantStyleSheet();
    return (
      <View style={{ flex: 1 }}>
        {createQrCodeTenantVisible ? (
          <CreateTenantQrCode tenants={Utils.cloneObject(this.state.tenants)} navigation={navigation}
            close={(tenant: TenantConnection) => {
              this.tenantCreated(tenant);
              return true;
            }}
          />
        ) : (
          <View style={tenantStyle.container}>
            <HeaderComponent
              navigation={this.props.navigation}
              title={I18n.t('authentication.tenant')}
              rightActionIcon={null}
              hideHomeAction
              leftActionIcon='navigate-before'
              leftActionIconType='MaterialIcons'
              leftAction={() => {
                this.props.navigation.goBack();
                return true;
              }}
            />
            <View>
              <View style={tenantStyle.toolBar}>
                <Button style={tenantStyle.createTenantButton} transparent onPress={() => this.createTenant()}>
                  <Icon style={tenantStyle.icon} type={'MaterialIcons'} name='add' />
                </Button>
                {createTenantVisible &&
                    <CreateTenantDialog navigation={navigation} tenants={Utils.cloneObject(this.state.tenants)}
                      close={(newTenant: TenantConnection) => {
                        this.tenantCreated(newTenant);
                      }}
                    />
                }
              </View>
              <SwipeListView
                disableRightSwipe
                useFlatList
                data={tenants}
                renderItem={({ item }) => (
                  <View style={tenantStyle.tenantNameView}>
                    <TouchableOpacity onPress={() => {
                      this.props.navigation.dispatch(
                        StackActions.replace(
                          'AuthNavigator',
                          {
                            name: 'Login',
                            params: {
                              tenantSubDomain: item.subdomain,
                            },
                            key: `${Utils.randomNumber()}`,
                          }
                        ),
                      );
                    }}>
                      <Text style={tenantStyle.tenantNameText}>{item.name}</Text>
                    </TouchableOpacity>
                  </View>
                )}
                renderHiddenItem={({ item, index }) => (
                  <Button style={tenantStyle.trashIconButton} danger onPress={() => {
                    this.deleteTenant(index, item.subdomain);
                  }}>
                    <Icon style={tenantStyle.trashIcon} name='trash' />
                  </Button>
                )}
                rightOpenValue={-65}
                keyExtractor={(item) => item.subdomain}
              />
            </View>
          </View>
        )}
      </View>
    );
  }
}
