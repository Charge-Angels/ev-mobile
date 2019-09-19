import deepmerge from "deepmerge";
import { ResponsiveStyleSheet } from "react-native-responsive-ui";
import { ScaledSheet } from "react-native-size-matters";
import commonColor from "../../theme/variables/commonColor";

const commonStyles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: commonColor.containerBgColor
  },
  content: {
    flex: 1
  },
  spinner: {
    flex: 1
  },
  noRecordFound: {
    flex: 1,
    paddingTop: "10@s",
    alignSelf: "center"
  }
});

const portraitStyles = {};

const landscapeStyles = {};

export default function computeStyleSheet() {
  return ResponsiveStyleSheet.select([
    {
      query: { orientation: "landscape" },
      style: deepmerge(commonStyles, landscapeStyles)
    },
    {
      query: { orientation: "portrait" },
      style: deepmerge(commonStyles, portraitStyles)
    }
  ]);
}