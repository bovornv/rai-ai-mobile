import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { ChartData } from '../types';

interface ChartProps {
  data: ChartData;
  type: 'line' | 'bar' | 'pie';
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  showDots?: boolean;
  style?: ViewStyle;
}

const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 32; // Account for padding

export const Chart: React.FC<ChartProps> = ({
  data,
  type,
  title,
  height = 220,
  showLegend = true,
  showGrid = true,
  showDots = true,
  style,
}) => {
  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#4CAF50',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#E0E0E0',
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 12,
    },
  };

  const pieChartConfig = {
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withDots={showDots}
            withShadow={false}
            withScrollableDot={false}
            withInnerLines={showGrid}
            withOuterLines={showGrid}
            withVerticalLines={showGrid}
            withHorizontalLines={showGrid}
          />
        );
      
      case 'bar':
        return (
          <BarChart
            data={data}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            style={styles.chart}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            withInnerLines={showGrid}
            withOuterLines={showGrid}
            showBarTops={false}
            fromZero={true}
          />
        );
      
      case 'pie':
        return (
          <PieChart
            data={data.datasets[0].data.map((value, index) => ({
              name: data.labels[index],
              population: value,
              color: data.datasets[0].color || '#4CAF50',
              legendFontColor: '#7F7F7F',
              legendFontSize: 12,
            }))}
            width={chartWidth}
            height={height}
            chartConfig={pieChartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
            absolute={false}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {renderChart()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
