import deepmerge from 'deepmerge';
import { StyleSheet } from 'react-native';
import ResponsiveStylesSheet from 'react-native-responsive-stylesheet';
import { ScaledSheet } from 'react-native-size-matters';

import Utils from '../../utils/Utils';

/**
 *
 */
export default function computeStyleSheet(): StyleSheet.NamedStyles<any> {
  const commonColor = Utils.getCurrentCommonColor();
  const commonStyles = ScaledSheet.create({
    modal: {
      backgroundColor: commonColor.containerBgColor,
      margin: 0,
      marginTop: '100@s',
      width: '100%'
    },
    modalContainer: {
      flexDirection: 'column',
      height: '100%'
    },
    modalHeader: {
      width: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      borderBottomColor: commonColor.listBorderColor,
      borderTopColor: commonColor.listBorderColor,
      borderBottomWidth: 1,
      borderTopWidth: 1,
      padding: '5@s'
    },
    modalTitle: {
      fontSize: '16@s'
    },
    listContainer: {
      width: '100%',
      flex: 1
    },
    bottomButtonContainer: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      height: '80@s',
      alignItems: 'center',
      borderTopWidth: 1,
      paddingBottom: '20@s',
      borderTopColor: commonColor.listBorderColor
    },
    button: {
      marginTop: '15@s',
      width: '100%',
      backgroundColor: commonColor.buttonBg
    },
    buttonDisabled: {
      opacity: 0.3
    },
    buttonEnabled: {
      opacity: 1
    },
    buttonText: {
      fontSize: '15@s',
      color: commonColor.textColor
    }
  });
  const portraitStyles = {};
  const landscapeStyles = {};
  return ResponsiveStylesSheet.createOriented({
    landscape: deepmerge(commonStyles, landscapeStyles) as StyleSheet.NamedStyles<any>,
    portrait: deepmerge(commonStyles, portraitStyles) as StyleSheet.NamedStyles<any>
  });
}
