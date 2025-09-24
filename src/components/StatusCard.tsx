import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';

interface StatusCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'warning' | 'error' | 'info';
  icon?: keyof typeof Ionicons.glyphMap;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  subtitle?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  value,
  unit,
  status,
  icon,
  trend,
  trendValue,
  subtitle,
  onPress,
  style,
}) => {
  const getStatusColor = (): string => {
    const colors = {
      good: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      info: '#2196F3',
    };
    return colors[status];
  };

  const getStatusBackgroundColor = (): string => {
    const colors = {
      good: '#E8F5E8',
      warning: '#FFF3E0',
      error: '#FFEBEE',
      info: '#E3F2FD',
    };
    return colors[status];
  };

  const getTrendIcon = (): keyof typeof Ionicons.glyphMap | null => {
    if (!trend) return null;
    const icons = {
      up: 'trending-up',
      down: 'trending-down',
      stable: 'remove',
    };
    return icons[trend];
  };

  const getTrendColor = (): string => {
    if (!trend) return '#9E9E9E';
    const colors = {
      up: '#4CAF50',
      down: '#F44336',
      stable: '#9E9E9E',
    };
    return colors[trend];
  };

  return (
    <Card
      variant="elevated"
      padding="medium"
      onPress={onPress}
      style={[
        styles.container,
        { backgroundColor: getStatusBackgroundColor() },
        style,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={getStatusColor()}
              style={styles.icon}
            />
          )}
          <Text style={[styles.title, { color: getStatusColor() }]}>
            {title}
          </Text>
        </View>
        
        {trend && trendValue && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={getTrendIcon()!}
              size={16}
              color={getTrendColor()}
            />
            <Text style={[styles.trendValue, { color: getTrendColor() }]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: getStatusColor() }]}>
          {value}
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </Text>
      </View>

      {subtitle && (
        <Text style={[styles.subtitle, { color: getStatusColor() }]}>
          {subtitle}
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  valueContainer: {
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.8,
  },
});
