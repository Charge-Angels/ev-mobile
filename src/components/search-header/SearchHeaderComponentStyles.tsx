import deepmerge from 'deepmerge';
import ResponsiveStylesheet from 'react-native-responsive-stylesheet'
import { ScaledSheet } from 'react-native-size-matters';
import commonColor from '../../theme/variables/commonColor';

const commonStyles = ScaledSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '0@s',
    opacity: 0,
    paddingLeft: '10@s',
    paddingRight: '10@s',
    borderBottomWidth: 1,
    borderBottomColor: commonColor.listBorderColor,
    backgroundColor: commonColor.containerBgColor
  },
  visible: {
    height: '45@s',
    opacity: 1
  },
  hidden: {
    height: '0@s',
    opacity: 0
  },
  inputField: {
    flex: 1,
    paddingLeft: '5@s',
    fontSize: '18@s'
  },
  icon: {
    fontSize: '25@s'
  }
});

const portraitStyles = {};

const landscapeStyles = {};

export default function computeStyleSheet(): any {
  return ResponsiveStylesheet.createOriented({
    landscape: deepmerge(commonStyles, landscapeStyles),
    portrait: deepmerge(commonStyles, portraitStyles)
  });
}
