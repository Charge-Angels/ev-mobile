import { ResponsiveStyleSheet } from "react-native-responsive-ui";
import deepmerge from "deepmerge";
import commonColor from "../../theme/variables/commonColor";
import { Platform } from "react-native";
import { ScaledSheet } from "react-native-size-matters";

const commonStyles = ScaledSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    height: "122@s",
    paddingTop: "5@s",
    paddingBottom: "5@s",
    borderBottomWidth: 1,
    borderBottomColor: commonColor.listBorderColor,
    backgroundColor: "rgba(255,255,255,0.2)"
  },
  mainContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: "5@s",
    borderBottomWidth: 1,
    borderBottomColor: commonColor.listBorderColor
  },
  name: {
    paddingLeft: "10@s",
    fontSize: "20@s",
    color: commonColor.textColor,
    fontWeight: "bold"
  },
  icon: {
    fontSize: "25@s",
    marginLeft: "10@s",
    marginRight: "10@s"
  },
  iconHidden: {
    opacity: 0
  },
  detailedContent: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center"
  },
  badgeContainer: {
    paddingTop: "5@s",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  badgeSuccessContainer: {},
  badgeOccupiedContainer: {},
  connectorText: {
    color: commonColor.textColor,
    marginTop: "-15@s",
    marginRight: "10@s",
    fontSize: "20@s"
  },
  connectorBadge: {
    marginTop: "5@s"
  },
  freeConnectorBadge: {
    backgroundColor: commonColor.brandSecondary
  },
  occupiedConnectorBadge: {
    backgroundColor: commonColor.brandDanger
  },
  connectorBadgeTitle: {
    minWidth: "35@s",
    textAlign: "center",
    fontSize: "25@s",
    paddingTop: Platform.OS === "ios" ? "3@s" : 0,
    paddingBottom: Platform.OS === "ios" ? "3@s" : 0,
    fontWeight: "bold",
    color: commonColor.textColor
  },
  connectorSubTitle: {
    fontSize: "15@s",
    paddingBottom: "5@s",
    marginTop: "5@s",
    marginBottom: "5@s",
    marginLeft: "10@s",
    marginRight: "10@s",
    color: commonColor.textColor
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
