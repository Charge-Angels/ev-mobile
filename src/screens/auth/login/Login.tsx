import I18n from 'i18n-js';
import { Button, CheckBox, Form, Icon, Item, Spinner, Text, View } from 'native-base';
import React from 'react';
import { Alert, BackHandler, Keyboard, KeyboardAvoidingView, ScrollView, TextInput } from 'react-native';

import computeFormStyleSheet from '../../../FormStyles';
import BaseProps from '../../../types/BaseProps';
import { HTTPError } from '../../../types/HTTPError';
import { TenantConnection } from '../../../types/Tenant';
import Message from '../../../utils/Message';
import SecuredStorage from '../../../utils/SecuredStorage';
import Utils from '../../../utils/Utils';
import BaseScreen from '../../base-screen/BaseScreen';
import AuthHeader from '../AuthHeader';
import computeStyleSheet from '../AuthStyles';
import Tenants from "../../tenants/Tenants";

export interface Props extends BaseProps {
}

interface State {
  activeFab?: boolean;
  eula?: boolean;
  password?: string;
  email?: string;
  tenantName?: string;
  tenantSubDomain?: string;
  tenantLogo?: string;
  loading?: boolean;
  initialLoading?: boolean;
  hidePassword?: boolean;
  errorEula?: Record<string, unknown>[];
  errorPassword?: Record<string, unknown>[];
  errorTenantSubDomain?: Record<string, unknown>[];
  errorEmail?: Record<string, unknown>[];
  errorNewTenantName?: Record<string, unknown>[];
  errorNewTenantSubDomain?: Record<string, unknown>[];
}

export default class Login extends BaseScreen<Props, State> {
  public state: State;
  public props: Props;
  private tenants: TenantConnection[] = [];
  private passwordInput: TextInput;
  private formValidationDef = {
    tenantSubDomain: {
      presence: {
        allowEmpty: false,
        message: '^' + I18n.t('authentication.mandatoryTenant')
      }
    },
    email: {
      presence: {
        allowEmpty: false,
        message: '^' + I18n.t('authentication.mandatoryEmail')
      },
      email: {
        message: '^' + I18n.t('authentication.invalidEmail')
      }
    },
    password: {
      presence: {
        allowEmpty: false,
        message: '^' + I18n.t('authentication.mandatoryPassword')
      }
    },
    eula: {
      equality: {
        attribute: 'ghost',
        message: '^' + I18n.t('authentication.eulaNotAccepted'),
        comparator(v1: boolean, v2: boolean) {
          // True if EULA is checked
          return v1;
        }
      }
    }
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      activeFab: false,
      eula: false,
      password: null,
      email: Utils.getParamFromNavigation(this.props.route, 'email', '') as string,
      tenantSubDomain: Utils.getParamFromNavigation(this.props.route, 'tenantSubDomain', '') as string,
      tenantName: I18n.t('authentication.tenant'),
      loading: false,
      initialLoading: true,
      hidePassword: true,
    };
  }

  public setState = (state: State | ((prevState: Readonly<State>, props: Readonly<Props>) => State | Pick<State, never>) | Pick<State, never>, callback?: () => void) => {
    super.setState(state, callback);
  }

  public async componentDidMount() {
    await super.componentDidMount();
    let email = this.state.email = '';
    let password = this.state.password = '';
    let tenant: TenantConnection;
    let tenantLogo: string;
    // Get tenants
    this.tenants = await this.centralServerProvider.getTenants();
    if(this.tenants?.length === 0){
      this.noTenantFoundMessage();
    }

    // Check if sub-domain is provided
    if (!this.state.tenantSubDomain) {
      // Not provided: display latest saved credentials
      const userCredentials = await SecuredStorage.getUserCredentials();
      if (userCredentials) {
        tenant = await this.centralServerProvider.getTenant(userCredentials.tenantSubDomain);
        email = userCredentials.email;
        password = userCredentials.password;
      }
    } else {
      // Get the Tenant
      tenant = await this.centralServerProvider.getTenant(this.state.tenantSubDomain);
      // Get user connection
      if (tenant) {
        const userCredentials = await SecuredStorage.getUserCredentials(tenant.subdomain);
        if (userCredentials) {
          email = userCredentials.email;
          password = userCredentials.password;
        }
      }
    }
    // Get logo
    if (tenant) {
      tenantLogo = await this.centralServerProvider.getTenantLogoBySubdomain(tenant);
    }
    // Set
    this.setState({
      email,
      password,
      tenantLogo,
      tenantName: tenant ? tenant.name : I18n.t('authentication.tenant'),
      tenantSubDomain: tenant ? tenant.subdomain : null,
      initialLoading: false
    }, async () => await this.checkAutoLogin(tenant, email, password));

  }

  public async componentDidFocus() {
    super.componentDidFocus();
    // Check if current Tenant selection is still valid (handle delete tenant usee case)
    if (this.state.tenantSubDomain) {
      // Get the current Tenant
      const tenant = await this.centralServerProvider.getTenant(this.state.tenantSubDomain);
      if (!tenant) {
        // Refresh
        this.tenants = await this.centralServerProvider.getTenants();
        this.setState({
          tenantSubDomain: null,
          tenantName: I18n.t('authentication.tenant'),
        });
      }
    }
  }

  private noTenantFoundMessage(){
    Alert.alert(
      I18n.t('authentication.noTenantFoundTitle'),
      I18n.t('authentication.noTenantFoundMessage'),
      [
        {text: I18n.t('authentication.addTenantButton') , onPress:() => {this.goToTenants(true)}},
        {text: I18n.t('general.close'), style: 'cancel' }
      ]
    )

  }
  private goToTenants(openQRCode = false) {
    this.props.navigation.navigate(
      'Tenants',
      {
        key: `${Utils.randomNumber()}`,
        openQRCode
      }
    )
  }
  public async checkAutoLogin(tenant: TenantConnection, email: string, password: string) {
    // Check if user can be logged
    if (!this.centralServerProvider.hasAutoLoginDisabled() &&
        !Utils.isNullOrEmptyString(tenant?.subdomain) &&
        !Utils.isNullOrEmptyString(email) &&
        !Utils.isNullOrEmptyString(password)) {
      try {
        // Check EULA
        const result = await this.centralServerProvider.checkEndUserLicenseAgreement(
          { email, tenantSubDomain: tenant.subdomain });
        // Try to login
        if (result.eulaAccepted) {
          this.setState({ eula: true }, () => this.login());
        }
      } catch (error) {
        // Do nothing: user must log on
      }
    }
  }

  public login = async () => {
    // Check field
    const formIsValid = Utils.validateInput(this, this.formValidationDef);
    if (formIsValid) {
      const { password, email, eula, tenantSubDomain } = this.state;
      try {
        // Loading
        this.setState({ loading: true } as State);
        // Login
        await this.centralServerProvider.login(email, password, eula, tenantSubDomain);
        // Login Success
        this.setState({ loading: false });
        // Navigate
        this.navigateToApp();
      } catch (error) {
        // Login failed
        this.setState({ loading: false });
        // Check request?
        if (error.request) {
          // Show error
          switch (error.request.status) {
            // Unknown Email
            case HTTPError.OBJECT_DOES_NOT_EXIST_ERROR:
              Message.showError(I18n.t('authentication.wrongEmailOrPassword'));
              break;
            // Account is locked
            case HTTPError.USER_ACCOUNT_LOCKED_ERROR:
              Message.showError(I18n.t('authentication.accountLocked'));
              break;
            // Account not Active
            case HTTPError.USER_ACCOUNT_INACTIVE_ERROR:
              Message.showError(I18n.t('authentication.accountNotActive'));
              break;
            // Account Pending
            case HTTPError.USER_ACCOUNT_PENDING_ERROR:
              Message.showError(I18n.t('authentication.accountPending'));
              break;
            // Eula no accepted
            case HTTPError.USER_EULA_ERROR:
              Message.showError(I18n.t('authentication.eulaNotAccepted'));
              break;
            default:
              // Other common Error
              Utils.handleHttpUnexpectedError(this.centralServerProvider, error,
                'authentication.loginUnexpectedError');
          }
        }
      }
    }
  };

  public onBack = () => {
    // Exit?
    Alert.alert(
      I18n.t('general.exitApp'),
      I18n.t('general.exitAppConfirm'),
      [{ text: I18n.t('general.no'), style: 'cancel' }, { text: I18n.t('general.yes'), onPress: () => BackHandler.exitApp() }],
      { cancelable: false }
    );
    // Do not bubble up
    return true;
  };

  public navigateToApp() {
    // Navigate to App
    this.props.navigation.navigate('AppDrawerNavigator', { key: `${Utils.randomNumber()}` });
  }

  public setTenantWithIndex = async (buttonIndex: number) => {
    // Provided?
    if (buttonIndex !== undefined && this.tenants[buttonIndex]) {
      const tenant = this.tenants[buttonIndex];
      const tenantLogo = await this.centralServerProvider.getTenantLogoBySubdomain(tenant);
      // Get stored data
      const credentials = await SecuredStorage.getUserCredentials(
        this.tenants[buttonIndex].subdomain);
      if (credentials) {
        // Set Tenant
        this.setState({
          email: credentials.email,
          password: credentials.password,
          tenantSubDomain: tenant.subdomain,
          tenantName: tenant.name,
          tenantLogo,
        });
      } else {
        // Set Tenant
        this.setState({
          email: null,
          password: null,
          tenantSubDomain: tenant.subdomain,
          tenantName: tenant.name,
          tenantLogo,
        });
      }
    }
  };

  public newUser = () => {
    const navigation = this.props.navigation;
    // Tenant selected?
    if (this.state.tenantSubDomain) {
      navigation.navigate(
        'SignUp',
        {
          params: {
            tenantSubDomain: this.state.tenantSubDomain,
            email: this.state.email
          }
        }
      );
    } else {
      Message.showError(I18n.t('authentication.mustSelectTenant'));
    }
  };

  public forgotPassword = () => {
    const navigation = this.props.navigation;
    // Tenant selected?
    if (this.state.tenantSubDomain) {
      navigation.navigate(
        'RetrievePassword',
        {
          params: {
            tenantSubDomain: this.state.tenantSubDomain,
            email: this.state.email
          }
        });
    } else {
      // Error
      Message.showError(I18n.t('authentication.mustSelectTenant'));
    }
  };

  public async selectTenant(searchTenant: TenantConnection) {
    if (searchTenant) {
      // Search index
      const index = this.tenants.findIndex((tenant) => tenant.subdomain === searchTenant.subdomain);
      if (index !== -1) {
        await this.setTenantWithIndex(index);
      }
    }
  }

  public render() {
    const style = computeStyleSheet();
    const formStyle = computeFormStyleSheet();
    const commonColor = Utils.getCurrentCommonColor();
    const navigation = this.props.navigation;
    const { tenantLogo, eula, loading, initialLoading, hidePassword } = this.state;
    // Render
    return initialLoading ? (
      <Spinner style={formStyle.spinner} color='grey'/>
    ) : (
      <View style={style.container}>
        <ScrollView contentContainerStyle={style.scrollContainer}>
          <KeyboardAvoidingView style={style.keyboardContainer} behavior='padding'>
            <AuthHeader navigation={this.props.navigation} tenantLogo={tenantLogo}/>
            <Button small={true} transparent={true} style={[style.linksButton]}
                    onPress={() => this.newUser()}>
              <Text style={style.linksTextButton}
                    uppercase={false}>{I18n.t('authentication.newUser')}</Text>
            </Button>
            <Form style={formStyle.form}>
              <Button block={true} style={formStyle.button} onPress={() => this.goToTenants()}>
                <Text style={formStyle.buttonText} uppercase={false}>{this.state.tenantName}</Text>
              </Button>
              {this.state.errorTenantSubDomain &&
              this.state.errorTenantSubDomain.map((errorMessage, index) => (
                <Text style={formStyle.formErrorText} key={index}>
                  {errorMessage}
                </Text>
              ))
              }
              <Item inlineLabel={true} style={formStyle.inputGroup}>
                <Icon active={true} name='email' type='MaterialCommunityIcons'
                      style={formStyle.inputIcon}/>
                <TextInput
                  returnKeyType='next'
                  selectionColor={commonColor.textColor}
                  placeholder={I18n.t('authentication.email')}
                  placeholderTextColor={commonColor.placeholderTextColor}
                  onSubmitEditing={() => this.passwordInput.focus()}
                  style={formStyle.inputField}
                  autoCapitalize='none'
                  blurOnSubmit={false}
                  autoCorrect={false}
                  keyboardType={'email-address'}
                  secureTextEntry={false}
                  onChangeText={(text) => this.setState({email: text})}
                  value={this.state.email}
                />
              </Item>
              {this.state.errorEmail &&
              this.state.errorEmail.map((errorMessage, index) => (
                <Text style={formStyle.formErrorText} key={index}>
                  {errorMessage}
                </Text>
              ))
              }
              <Item inlineLabel={true} style={formStyle.inputGroup}>
                <Icon active={true} name='lock' type='MaterialCommunityIcons'
                      style={formStyle.inputIcon}/>
                <TextInput
                  returnKeyType='go'
                  selectionColor={commonColor.textColor}
                  ref={(ref: TextInput) => (this.passwordInput = ref)}
                  onSubmitEditing={() => Keyboard.dismiss()}
                  placeholder={I18n.t('authentication.password')}
                  placeholderTextColor={commonColor.placeholderTextColor}
                  style={formStyle.inputField}
                  autoCapitalize='none'
                  blurOnSubmit={false}
                  autoCorrect={false}
                  keyboardType={'default'}
                  secureTextEntry={hidePassword}
                  onChangeText={(text) => this.setState({password: text})}
                  value={this.state.password}
                />
                <Icon active={true} name={hidePassword ? 'eye' : 'eye-off'} type='Ionicons'
                      onPress={() => this.setState({hidePassword: !hidePassword})}
                      style={formStyle.inputIcon}/>
              </Item>
              {this.state.errorPassword &&
              this.state.errorPassword.map((errorMessage, index) => (
                <Text style={formStyle.formErrorText} key={index}>
                  {errorMessage}
                </Text>
              ))
              }
              <Button small={true} transparent={true} style={[style.linksButton]}
                      onPress={() => this.forgotPassword()}>
                <Text style={[style.linksTextButton, style.linksTextButton]}
                      uppercase={false}>{I18n.t('authentication.forgotYourPassword')}</Text>
              </Button>
              <View style={formStyle.formCheckboxContainer}>
                <CheckBox style={formStyle.checkbox} checked={eula}
                          onPress={() => this.setState({eula: !eula})}/>
                <Text style={formStyle.checkboxText}>
                  {I18n.t('authentication.acceptEula')}
                  <Text onPress={() => navigation.navigate('Eula')} style={style.eulaLink}>
                    {I18n.t('authentication.eula')}
                  </Text>
                </Text>
              </View>
              {this.state.errorEula &&
              this.state.errorEula.map((errorMessage, index) => (
                <Text style={[formStyle.formErrorText, style.formErrorTextEula]} key={index}>
                  {errorMessage}
                </Text>
              ))
              }
              {loading ? (
                <Spinner style={formStyle.spinner} color='grey'/>
              ) : (
                <Button primary={true} block={true} style={formStyle.button}
                        onPress={() => this.login()}>
                  <Text style={formStyle.buttonText}
                        uppercase={false}>{I18n.t('authentication.login')}</Text>
                </Button>
              )}
            </Form>
          </KeyboardAvoidingView>
        </ScrollView>
      </View>
    );
  }


}
