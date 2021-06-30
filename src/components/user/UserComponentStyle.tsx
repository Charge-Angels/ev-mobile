import deepmerge from 'deepmerge';
import { StyleSheet } from 'react-native';
import ResponsiveStylesSheet from 'react-native-responsive-stylesheet';
import { ScaledSheet } from 'react-native-size-matters';

import Utils from '../../utils/Utils';

export default function computeStyleSheet(): StyleSheet.NamedStyles<any> {
  const commonColor = Utils.getCurrentCommonColor();
  const commonStyles = ScaledSheet.create({
    container: {
      flex: 1,
      width: '97%',
      height: '80@s',
      alignSelf: 'center',
      borderColor: 'transparent',
      shadowColor: commonColor.cardShadowColor,
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.23,
      shadowRadius: 3.62,
      marginBottom: '8@s'
    },
    selected: {
      backgroundColor: commonColor.listItemSelected
    },
    unselected: {
      backgroundColor: commonColor.listHeaderBgColor
    },
    userContent: {
      width: '100%',
      height: '100%',
      justifyContent: 'space-between',
      flexDirection: 'row',
      margin: 0,
      flex: 1,
      paddingLeft: 0,
      paddingTop: 0,
      paddingBottom: 0,
      paddingRight: 0
    },
    statusIndicator: {
      height: '100%',
      width: '5@s'
    },
    statusInactive: {
      backgroundColor: commonColor.brandDanger
    },
    statusActive: {
      backgroundColor: commonColor.brandSuccess
    },
    avatarContainer: {
      paddingLeft: '10@s',
      paddingRight: '15@s'
    },
    userContainer: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center'
    },
    userFullnameStatusContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingRight: '10@s',
      alignItems: 'center'
    },
    fullNameContainer: {
      width: '70%'
    },
    fullName: {
      fontSize: '17@s',
      color: commonColor.textColor
    },
    emailRoleContainer: {
      width: '90%'
    },
    email: {
      fontSize: '15@s',
      color: commonColor.textColor
    },
    role: {
      fontSize: '12@s',
      paddingTop: '3@s',
      color: commonColor.textColor
    },
    roleContainer: {
      marginTop: '2@s'
    }
  });
  const portraitStyles = {};
  const landscapeStyles = {};
  return ResponsiveStylesSheet.createOriented({
    landscape: deepmerge(commonStyles, landscapeStyles) as StyleSheet.NamedStyles<any>,
    portrait: deepmerge(commonStyles, portraitStyles) as StyleSheet.NamedStyles<any>
  });
}
