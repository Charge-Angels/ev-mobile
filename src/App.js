import React from "react";
import { StatusBar, Dimensions } from "react-native";
import {
  createSwitchNavigator,
  createStackNavigator,
  createDrawerNavigator,
  createAppContainer
} from "react-navigation";
import { Root } from "native-base";
import Login from "./screens/auth/Login/Login";
import Eula from "./screens/auth/Eula/Eula";
import RetrievePassword from "./screens/auth/retrieve-password/RetrievePassword";
import SignUp from "./screens/auth/sign-up/SignUp";
import Sidebar from "./screens/Sidebar/SideBar";
import Sites from "./screens/Sites/Sites";
import SiteAreas from "./screens/site-areas/SiteAreas";
import Chargers from "./screens/Chargers/Chargers";
import ChargerTab from "./screens/charger-details/charger-tab/ChargerTab";
import NotificationManager from "./notification/NotificationManager";

// Get the Notification Scheduler
const _notificationManager = NotificationManager.getInstance();
// Initialize
_notificationManager.initialize();

// Drawer Navigation
const AppDrawerNavigator = createDrawerNavigator(
  {
    Sites: {
      screen: props => {
        // Set the navigation to the notification
        _notificationManager.setNavigation(props.navigation);
        // Start
        _notificationManager.start();
        // Return the sites
        return <Sites {...props} />;
      }
    },
    SiteAreas: { screen: SiteAreas },
    Chargers: { screen: Chargers },
    ChargerTab: { screen: ChargerTab }
  },
  {
    navigationOptions: {
      swipeEnabled: true
    },
    drawerWidth: Dimensions.get("window").width / 1.5,
    initialRouteName: "Sites",
    unmountInactiveRoutes: true,
    drawerPosition: "right",
    contentComponent: props => <Sidebar {...props} />
  }
);

// Stack Navigation
const AuthNavigator = createStackNavigator(
  {
    Login: { screen: Login },
    Eula: { screen: Eula },
    SignUp: { screen: SignUp },
    RetrievePassword: { screen: RetrievePassword }
  },
  {
    initialRouteName: "Login",
    headerMode: "none"
  }
);

const RootNavigator = createSwitchNavigator(
  {
    AuthNavigator,
    AppDrawerNavigator
  },
  {
    initialRouteName: "AuthNavigator"
  }
);

// Create a container to wrap the main navigator
const RootContainer = createAppContainer(RootNavigator);

export default class App extends React.Component {
  async componentDidMount() {
    // Activate
    _notificationManager.setActive(true);
  }

  async componentWillUnmount() {
    // Deactivate
    this._notificationManager.setActive(false);
  }

  render() {
    return (
      <Root>
        <StatusBar hidden />
        <RootContainer />
      </Root>
    );
  }
}
