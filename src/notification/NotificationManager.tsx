import I18n from "i18n-js";
import { Platform } from "react-native";
import firebase from 'react-native-firebase';
import { Notification, NotificationOpen } from 'react-native-firebase/notifications';
import { NavigationActions, NavigationContainerComponent } from "react-navigation";
import CentralServerProvider from '../provider/CentralServerProvider';
import { UserNotificationType } from "../types/UserNotifications";
import Message from "../utils/Message";
import Utils from "../utils/Utils";

export default class NotificationManager {
  private static notificationManager: NotificationManager;
  private token: string;
  private navigator: NavigationContainerComponent;
  private removeNotificationDisplayedListener: () => any;
  private removeNotificationListener: () => any;
  private removeNotificationOpenedListener: () => any;
  private removeTokenRefreshListener: () => any;
  private messageListener: () => any;
  private centralServerProvider: CentralServerProvider;
  private lastNotification: NotificationOpen

  public static getInstance(): NotificationManager {
    if (!this.notificationManager) {
      this.notificationManager = new NotificationManager();
    }
    return this.notificationManager;
  }

  public setCentralServerProvider(centralServerProvider: CentralServerProvider) {
    this.centralServerProvider = centralServerProvider;
  }

  public async initialize(navigator: NavigationContainerComponent) {
    // Keep the nav
    this.navigator = navigator;
    // Check if user has given permission
    let enabled = await firebase.messaging().hasPermission();
    if (!enabled) {
      // Request permission
      try {
        await firebase.messaging().requestPermission();
        // User has authorised
      } catch (error) {
        // User has rejected permissions
      }
    }
    // Check again
    enabled = await firebase.messaging().hasPermission();
    if (enabled) {
      const fcmToken = await firebase.messaging().getToken();
      if (fcmToken) {
        this.token = fcmToken;
        console.log('initialize ====================================');
        console.log({fcmToken});
        console.log('====================================');
      }
    }
  }

  public async start() {
    // Check Initial Notification
    const initialNotificationOpen = await firebase.notifications().getInitialNotification();
    if (initialNotificationOpen) {
      this.lastNotification = initialNotificationOpen;
    }
    // Notification Displayed
    this.removeNotificationDisplayedListener = firebase.notifications().onNotificationDisplayed((notification: Notification) => {
      console.log('onNotificationDisplayed ====================================');
      console.log({notification});
      console.log('====================================');
        this.processNotification(notification);
    });
    // Notification Received
    this.removeNotificationListener = firebase.notifications().onNotification((notification: Notification) => {
      console.log('onNotification ====================================');
      console.log({notification});
      console.log('====================================');
      this.processNotification(notification);
    });
    // Notification Received and User opened it
    this.removeNotificationOpenedListener = firebase.notifications().onNotificationOpened((notificationOpen: NotificationOpen) => {
      console.log('onNotificationOpened ====================================');
      console.log({notificationOpen});
      console.log('====================================');
      this.processOpenedNotification(notificationOpen);
    });
    // Get Firebase messages
    this.messageListener = firebase.messaging().onMessage((message) => {
      console.log('onMessage ====================================');
      console.log(JSON.stringify(message));
      console.log('====================================');
    });
    // Token has changed
     this.removeTokenRefreshListener = firebase.messaging().onTokenRefresh(async (newFcmToken) => {
      // Process your token as required
      this.token = newFcmToken;
      console.log('onTokenRefresh ====================================');
      console.log({newFcmToken});
      console.log('====================================');
      try {
        // Save the User's token
        if (this.centralServerProvider.isUserConnected()) {
          await this.centralServerProvider.saveUserMobileToken({
            id: this.centralServerProvider.getUserInfo().id,
            mobileToken: this.getToken(),
            mobileOS: this.getOs()
          });
        }
      } catch (error) {
        // tslint:disable-next-line: no-console
        console.log("Error saving Mobile Token:", error);
      }
    });
  }

  public async stop() {
    console.log('NotificationManager - Stop ====================================');
    this.removeNotificationDisplayedListener();
    this.removeNotificationListener();
    this.removeNotificationOpenedListener();
    this.removeTokenRefreshListener();
    this.messageListener();
  }

  public getToken(): string {
    console.log('NotificationManager - getToken ====================================');
    console.log({token: this.token});
    console.log('====================================');
    return this.token;
  }

  public getOs(): string {
    return Platform.OS;
  }

  public async checkOnHoldNotification() {
    console.log('NotificationManager - checkOnHoldNotification ====================================');
    console.log({lastNotification: this.lastNotification});
    console.log('====================================');
    if (this.lastNotification) {
      const notificationProcessed = await this.processOpenedNotification(this.lastNotification);
      if (notificationProcessed) {
        this.lastNotification = null;
      }
    }
  }

  public async processNotification(notification: Notification): Promise<boolean> {
    // Do nothing when notification is received but user has not pressed it
    console.log('processNotification ====================================');
    console.log({notification});
    console.log('====================================');
    return true;
  }

  public async processOpenedNotification(notificationOpen: NotificationOpen): Promise<boolean> {
    console.log('processOpenedNotification ====================================');
    console.log({notificationOpen});
    console.log('====================================');
    // Get information about the notification that was opened
    const notification: Notification = notificationOpen.notification;
    // No: meaning the user got the notif and clicked on it, then navigate to the right screen
    // User must be logged and Navigation available
    if (!this.centralServerProvider.isUserConnectionValid() || !this.navigator) {
        // Process it later
      this.lastNotification = notificationOpen;
      return false;
    }
    // Check Tenant
    if (this.centralServerProvider.getUserInfo().tenantID !== notification.data.tenantID) {
      Message.showError(I18n.t("general.wrongTenant"));
      return false;
    }
    // Check
    switch (notification.data.notificationType) {
      // End of Transaction
      case UserNotificationType.END_OF_SESSION:
        // Navigate
        this.navigator.dispatch(
          NavigationActions.navigate({
            routeName: 'TransactionHistoryNavigator',
            key: `${Utils.randomNumnber()}`,
            action: NavigationActions.navigate({
              routeName: 'TransactionDetailsTabs',
              key: `${Utils.randomNumnber()}`,
              params: {
                transactionID: parseInt(notification.data.transactionID, 10)
              }
            }),
          })
        );
        break;

      // Session In Progress
      case UserNotificationType.SESSION_STARTED:
      case UserNotificationType.END_OF_CHARGE:
      case UserNotificationType.OPTIMAL_CHARGE_REACHED:
        // Navigate
        this.navigator.dispatch(
          NavigationActions.navigate({
            routeName: 'TransactionInProgressNavigator',
            key: `${Utils.randomNumnber()}`,
            action: NavigationActions.navigate({
              routeName: 'ChargerDetailsTabs',
              key: `${Utils.randomNumnber()}`,
              params: {
                chargerID: notification.data.chargeBoxID,
                connectorID: Utils.getConnectorIDFromConnectorLetter(notification.data.connectorId)
              }
            }),
          })
        );
        break;

      case UserNotificationType.CHARGING_STATION_STATUS_ERROR:
      case UserNotificationType.PREPARING_SESSION_NOT_STARTED:
        // Navigate
        this.navigator.dispatch(
          NavigationActions.navigate({
            routeName: 'ChargersNavigator',
            key: `${Utils.randomNumnber()}`,
            action: NavigationActions.navigate({
              routeName: 'ChargerDetailsTabs',
              key: `${Utils.randomNumnber()}`,
              params: {
                chargerID: notification.data.chargeBoxID,
                connectorID: Utils.getConnectorIDFromConnectorLetter(notification.data.connectorId)
              }
            }),
          })
        );
        break;

      // Charger just connected
      case UserNotificationType.CHARGING_STATION_REGISTERED:
        // Navigate
        this.navigator.dispatch(
          NavigationActions.navigate({
            routeName: 'ChargersNavigator',
            key: `${Utils.randomNumnber()}`,
            action: NavigationActions.navigate({
              routeName: 'ChargerDetailsTabs',
              key: `${Utils.randomNumnber()}`,
              params: {
                chargerID: notification.data.chargeBoxID,
                connectorID: 1
              }
            }),
          })
        );
        break;

      // Go to Charger list
      case UserNotificationType.OFFLINE_CHARGING_STATION:
        // Navigate
        this.navigator.dispatch(
          NavigationActions.navigate({
            routeName: 'Chargers',
            key: `${Utils.randomNumnber()}`
          })
        );
        break;

      // No need to navigate
      case UserNotificationType.UNKNOWN_USER_BADGED:
      case UserNotificationType.OCPI_PATCH_STATUS_ERROR:
      case UserNotificationType.SMTP_AUTH_ERROR:
      case UserNotificationType.USER_ACCOUNT_STATUS_CHANGED:
      case UserNotificationType.USER_ACCOUNT_INACTIVITY:
        break;
    }
    return true;
  }
}
