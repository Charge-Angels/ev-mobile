import { Platform } from 'react-native';

import palette from '../custom-theme/theme/palette';
import commonColor, { PLATFORM } from '../theme/variables/commonColor';
import ThemeDefinition from '../types/Theme';
import ThemeManager from './ThemeManager';

export const buildCommonColor = (currentTheme: ThemeDefinition) => ({
  ...commonColor,
  primary: currentTheme.primary,
  brandPrimary: palette.primary,
  brandPrimaryLight: palette.primaryLight,
  brandPrimaryDark: palette.primaryDark,

  info: currentTheme.info,
  brandInfo: palette.info,
  brandInfoLight: palette.infoLight,
  brandInfoDark: palette.infoDark,

  success: currentTheme.success,
  brandSuccess: palette.success,
  brandSuccessLight: palette.successLight,
  brandSuccessDark: palette.successDark,

  danger: currentTheme.danger,
  brandDanger: palette.danger,
  brandDangerLight: palette.dangerLight,
  brandDangerDark: palette.dangerDark,

  warning: currentTheme.warning,
  brandWarning: palette.warning,
  brandWarningLight: palette.warningLight,
  brandWarningDark: palette.warningDark,

  disabled: currentTheme.disabled,
  brandDisabled: palette.disabled,
  brandDisabledLight: palette.disabledLight,
  brandDisabledDark: palette.disabledDark,

  brandBackground: currentTheme.background,

  brandDark: palette.dark,
  brandLight: palette.light,

  listBorderColor: palette.disabledDark,
  listItemSelected: currentTheme.listItemSelected,
  cardBorderColor: currentTheme.textColor,

  containerBgColor: currentTheme.background,
  containerTouchableBackgroundColor: currentTheme.touchableBackgroundColor,
  listHeaderBgColor: currentTheme.listBackgroundHeader,
  headerBgColor: currentTheme.backgroundHeader,
  headerTextColor: currentTheme.textColor,
  textColor: currentTheme.textColor,
  inverseTextColor: currentTheme.inverseTextColor,
  buttonBg: currentTheme.buttonBg,
  subTextColor: currentTheme.subTextColor,
  placeholderTextColor: currentTheme.placeholderTextColor,

  topTabBarActiveTextColor: currentTheme.textColor,

  CheckboxIconMarginTop: Platform.OS === PLATFORM.IOS ? 3 : 2,
  CheckboxPaddingLeft: Platform.OS === PLATFORM.IOS ? 0 : 2,
  checkboxSize: 23,
  checkboxTickColor: currentTheme.textColor,
  checkboxDefaultColor: 'transparent',

  borderRadiusBase: 0,

  buttonDangerBg: currentTheme.danger,
  buttonWarningBg: currentTheme.warning,
  buttonInfoBg: currentTheme.info,
  buttonSuccessBg: currentTheme.success,
  buttonDisabledBg: palette.disabledDark
});

const themeManager = ThemeManager.getInstance();
const currentThemeDef = themeManager.getCurrentThemeDefinition();

export default buildCommonColor(currentThemeDef);
