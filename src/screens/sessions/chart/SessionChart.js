import React from "react";
import BaseAutoRefreshScreen from "../../base-screen/BaseAutoRefreshScreen";
import { View, processColor } from "react-native";
import Utils from "../../../utils/Utils";
import I18n from "../../../I18n/I18n";
import computeStyleSheet from "./SessionChartStyles";
import { scale } from "react-native-size-matters";
import commonColor from "../../../theme/variables/commonColor";
import { LineChart } from "react-native-charts-wrapper";
import PropTypes from "prop-types";
import BackgroundComponent from "../../../components/background/BackgroundComponent";

const EMPTY_CHART = [{ x: 0, y: 0 }];

export default class SessionChart extends BaseAutoRefreshScreen {
  constructor(props) {
    super(props);
    this.state = {
      values: [],
      consumptionValues: EMPTY_CHART,
      stateOfChargeValues: EMPTY_CHART
    };
  }

  async componentDidMount() {
    // Call parent
    await super.componentDidMount();
    // Get the Consumption
    this.refresh();
  }

  async componentWillUnmount() {
    // Call parent
    await super.componentWillUnmount();
  }

  _getChargingStationConsumption = async () => {
    const { sessionID } = this.props;
    try {
      // Active Transaction?
      if (sessionID) {
        // Get the consumption
        const result = await this.centralServerProvider.getChargingStationConsumption({
          TransactionId: sessionID
        });
        // At least 2 values for the chart!!!
        if (result.values && result.values.length > 1) {
          // Convert
          const consumptionValues = [],
            stateOfChargeValues = [];
          for (let index = 0; index < result.values.length; index++) {
            const value = result.values[index];
            const date = new Date(value.date).getTime();
            // Add
            consumptionValues.push({
              x: date,
              y: value.value ? value.value / 1000 : 0
            });
            if (value.stateOfCharge > 0) {
              stateOfChargeValues.push({
                x: date,
                y: value.stateOfCharge ? value.stateOfCharge : 0
              });
            }
          }
          // Set
          this.setState({
            values: result.values,
            consumptionValues,
            stateOfChargeValues
          });
        }
      } else {
        // Clear
        this.setState({
          values: null,
          consumptionValues: EMPTY_CHART,
          stateOfChargeValues: EMPTY_CHART
        });
      }
    } catch (error) {
      // Check if HTTP?
      if (!error.request || error.request.status !== 560) {
        // Other common Error
        Utils.handleHttpUnexpectedError(this.centralServerProvider, error, this.props.navigation, this.refresh);
      }
    }
  };

  refresh = async () => {
    // Component Mounted?
    if (this.isMounted()) {
      // Refresh Consumption
      await this._getChargingStationConsumption();
    }
  };

  computeChartDefinition(consumptionValues, stateOfChargeValues) {
    const chartDefinition = {};
    // Add Data
    chartDefinition.data = { dataSets: [] };
    // Check Consumptions
    if (consumptionValues && consumptionValues.length > 1) {
      chartDefinition.data.dataSets.push({
        values: consumptionValues,
        label: I18n.t("details.instantPowerChartLabel"),
        config: {
          mode: "LINEAR",
          drawValues: false,
          lineWidth: 2,
          drawCircles: false,
          circleColor: processColor(commonColor.brandInfo),
          drawCircleHole: false,
          circleRadius: 5,
          highlightColor: processColor("white"),
          color: processColor(commonColor.brandInfo),
          drawFilled: true,
          fillAlpha: 65,
          fillColor: processColor(commonColor.brandInfo),
          valueTextSize: scale(8)
        }
      });
    }
    // Check SoC
    if (stateOfChargeValues && stateOfChargeValues.length > 1) {
      chartDefinition.data.dataSets.push({
        values: stateOfChargeValues,
        label: I18n.t("details.batteryChartLabel"),
        config: {
          axisDependency: "RIGHT",
          mode: "LINEAR",
          drawValues: false,
          lineWidth: 2,
          drawCircles: false,
          circleColor: processColor(commonColor.brandSuccess),
          drawCircleHole: false,
          circleRadius: 5,
          highlightColor: processColor("white"),
          color: processColor(commonColor.brandSuccess),
          drawFilled: true,
          fillAlpha: 65,
          fillColor: processColor(commonColor.brandSuccess),
          valueTextSize: scale(8)
        }
      });
    }
    // X Axis
    chartDefinition.xAxis = {
      enabled: true,
      labelRotationAngle: -45,
      granularity: 1,
      drawLabels: true,
      position: "BOTTOM",
      drawAxisLine: true,
      drawGridLines: false,
      fontFamily: "HelveticaNeue-Medium",
      fontWeight: "bold",
      valueFormatter: "date",
      valueFormatterPattern: "HH:mm",
      textSize: scale(8),
      textColor: processColor(commonColor.brandInfo)
    };
    // Y Axis
    chartDefinition.yAxis = {};
    // Check Consumptions
    if (consumptionValues && consumptionValues.length > 1) {
      chartDefinition.yAxis.left = {
        enabled: true,
        valueFormatter: "##0 kW",
        axisMinimum: 0,
        textColor: processColor(commonColor.brandInfo),
        textSize: scale(8)
        // limitLines: [{
        //   limit: connector.power,
        //   label: I18n.t("details.connectorMax"),
        //   valueTextColor: processColor("white"),
        //   lineColor: processColor(commonColor.brandDanger),
        //   lineDashPhase: 2,
        //   lineWidth: 1,
        //   lineDashLengths: [10,10]
        // }]
      };
    } else {
      chartDefinition.yAxis.left = {
        enabled: false
      };
    }
    // Check SoC
    if (stateOfChargeValues && stateOfChargeValues.length > 1) {
      chartDefinition.yAxis.right = {
        enabled: true,
        valueFormatter: "##0",
        axisMinimum: 0,
        axisMaximum: 100,
        textColor: processColor(commonColor.brandSuccess),
        textSize: scale(8)
      };
    } else {
      chartDefinition.yAxis.right = {
        enabled: false
      };
    }
    // Return
    return chartDefinition;
  }

  render() {
    const style = computeStyleSheet();
    const { consumptionValues, stateOfChargeValues } = this.state;
    const chartDefinition = this.computeChartDefinition(consumptionValues, stateOfChargeValues);
    return (
      <View style={style.container}>
        <BackgroundComponent active={false}>
          <LineChart
            style={style.chart}
            data={chartDefinition.data}
            chartDescription={{ text: "" }}
            noDataText={"No Data"}
            legend={{
              enabled: true,
              textSize: scale(8),
              textColor: processColor(commonColor.brandPrimaryDark)
            }}
            marker={{
              enabled: true,
              markerColor: processColor(commonColor.brandPrimaryDark),
              textSize: scale(12),
              textColor: processColor(commonColor.inverseTextColor)
            }}
            xAxis={chartDefinition.xAxis}
            yAxis={chartDefinition.yAxis}
            autoScaleMinMaxEnabled={false}
            animation={{
              durationX: 1000,
              durationY: 1000,
              easingY: "EaseInOutQuart"
            }}
            drawGridBackground={false}
            drawBorders={false}
            touchEnabled={true}
            dragEnabled={true}
            scaleEnabled={false}
            scaleXEnabled={true}
            scaleYEnabled={false}
            pinchZoom={true}
            doubleTapToZoomEnabled={false}
            dragDecelerationEnabled={true}
            dragDecelerationFrictionCoef={0.99}
            keepPositionOnRotation={false}
          />
        </BackgroundComponent>
      </View>
    );
  }
}

SessionChart.propTypes = {
  sessionID: PropTypes.number
};

SessionChart.defaultProps = {};