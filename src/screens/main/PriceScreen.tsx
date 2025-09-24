import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LargeTitle, Body, SmallText } from '../../ui/Typography';
import LargeButton from '../../ui/LargeButton';
import Card from '../../components/Card';

interface PriceScreenProps {
  navigation: any;
}

interface PriceData {
  id: string;
  name: string;
  currentPrice: number;
  previousPrice: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercent: number;
  region: string;
  lastUpdated: string;
}

interface PriceAlert {
  id: string;
  crop: string;
  targetPrice: number;
  isActive: boolean;
}

export default function PriceScreen({ navigation }: PriceScreenProps) {
  const { t } = useTranslation();
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Mock price data
  const mockPrices: PriceData[] = [
    {
      id: '1',
      name: t('rice'),
      currentPrice: 12.50,
      previousPrice: 12.20,
      unit: t('per_kg'),
      trend: 'up',
      change: 0.30,
      changePercent: 2.46,
      region: 'ภาคกลาง',
      lastUpdated: t('just_now'),
    },
    {
      id: '2',
      name: t('durian'),
      currentPrice: 85.00,
      previousPrice: 88.00,
      unit: t('per_kg'),
      trend: 'down',
      change: -3.00,
      changePercent: -3.41,
      region: 'ภาคใต้',
      lastUpdated: '2 ' + t('hours_ago'),
    },
    {
      id: '3',
      name: t('corn'),
      currentPrice: 8.75,
      previousPrice: 8.75,
      unit: t('per_kg'),
      trend: 'stable',
      change: 0.00,
      changePercent: 0.00,
      region: 'ภาคเหนือ',
      lastUpdated: '1 ' + t('days_ago'),
    },
    {
      id: '4',
      name: t('sugarcane'),
      currentPrice: 850.00,
      previousPrice: 820.00,
      unit: t('per_ton'),
      trend: 'up',
      change: 30.00,
      changePercent: 3.66,
      region: 'ภาคกลาง',
      lastUpdated: t('just_now'),
    },
  ];

  const regions = [
    { id: 'all', name: 'ทั้งหมด' },
    { id: 'central', name: 'ภาคกลาง' },
    { id: 'north', name: 'ภาคเหนือ' },
    { id: 'northeast', name: 'ภาคอีสาน' },
    { id: 'south', name: 'ภาคใต้' },
  ];

  const loadPriceData = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPrices(mockPrices);
      setAlerts([
        { id: '1', crop: t('rice'), targetPrice: 15.00, isActive: true },
        { id: '2', crop: t('durian'), targetPrice: 90.00, isActive: false },
      ]);
    } catch (error) {
      console.error('Price data loading error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPriceData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPriceData();
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return '#4CAF50';
      case 'down': return '#F44336';
      default: return '#666666';
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}`;
  };

  const formatChangePercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : '';
    return `${sign}${percent.toFixed(2)}%`;
  };

  const filteredPrices = selectedRegion === 'all' 
    ? prices 
    : prices.filter(price => price.region === regions.find(r => r.id === selectedRegion)?.name);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="trending-up" size={48} color="#4CAF50" />
          <Body style={styles.loadingText}>{t('loading')}</Body>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <LargeTitle style={styles.title}>{t('price')}</LargeTitle>
          <Body style={styles.subtitle}>{t('market_price')}</Body>
        </View>

        {/* Region Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.regionFilter}
        >
          {regions.map((region) => (
            <TouchableOpacity
              key={region.id}
              style={[
                styles.regionButton,
                selectedRegion === region.id && styles.regionButtonActive
              ]}
              onPress={() => setSelectedRegion(region.id)}
            >
              <SmallText style={[
                styles.regionButtonText,
                selectedRegion === region.id && styles.regionButtonTextActive
              ]}>
                {region.name}
              </SmallText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Price Cards */}
        {filteredPrices.map((price) => (
          <Card key={price.id} style={styles.priceCard}>
            <View style={styles.priceHeader}>
              <View style={styles.priceInfo}>
                <Body style={styles.priceName}>{price.name}</Body>
                <SmallText style={styles.priceRegion}>{price.region}</SmallText>
              </View>
              <View style={styles.priceValue}>
                <Body style={styles.currentPrice}>
                  {formatPrice(price.currentPrice)} {price.unit}
                </Body>
                <View style={styles.priceChange}>
                  <Ionicons 
                    name={getTrendIcon(price.trend) as any} 
                    size={16} 
                    color={getTrendColor(price.trend)} 
                  />
                  <SmallText style={[
                    styles.changeText,
                    { color: getTrendColor(price.trend) }
                  ]}>
                    {formatChange(price.change)} ({formatChangePercent(price.changePercent)})
                  </SmallText>
                </View>
              </View>
            </View>
            
            <View style={styles.priceFooter}>
              <SmallText style={styles.lastUpdated}>
                {t('last_sync')}: {price.lastUpdated}
              </SmallText>
              <TouchableOpacity style={styles.alertButton}>
                <Ionicons name="notifications" size={16} color="#4CAF50" />
                <SmallText style={styles.alertButtonText}>{t('set_alert')}</SmallText>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {/* Price Alerts */}
        <Card style={styles.alertsCard}>
          <Body style={styles.alertsTitle}>{t('price_alert')}</Body>
          
          {alerts.map((alert) => (
            <View key={alert.id} style={styles.alertItem}>
              <View style={styles.alertInfo}>
                <Body style={styles.alertCrop}>{alert.crop}</Body>
                <SmallText style={styles.alertTarget}>
                  เป้าหมาย: {formatPrice(alert.targetPrice)} {t('per_kg')}
                </SmallText>
              </View>
              <View style={[
                styles.alertToggle,
                alert.isActive && styles.alertToggleActive
              ]}>
                <Ionicons 
                  name={alert.isActive ? 'checkmark' : 'close'} 
                  size={16} 
                  color={alert.isActive ? '#FFFFFF' : '#666666'} 
                />
              </View>
            </View>
          ))}
          
          <LargeButton
            label={t('set_alert')}
            onPress={() => {
              // Navigate to alert setting screen
            }}
            style={styles.addAlertButton}
            variant="outline"
          />
        </Card>

        {/* Price Trends */}
        <Card style={styles.trendsCard}>
          <Body style={styles.trendsTitle}>แนวโน้มราคา</Body>
          
          <View style={styles.trendItem}>
            <View style={styles.trendInfo}>
              <Body style={styles.trendCrop}>{t('rice')}</Body>
              <SmallText style={styles.trendDescription}>
                ราคาข้าวมีแนวโน้มเพิ่มขึ้น เนื่องจากความต้องการสูง
              </SmallText>
            </View>
            <Ionicons name="trending-up" size={24} color="#4CAF50" />
          </View>
          
          <View style={styles.trendItem}>
            <View style={styles.trendInfo}>
              <Body style={styles.trendCrop}>{t('durian')}</Body>
              <SmallText style={styles.trendDescription}>
                ราคาทุเรียนลดลง เนื่องจากผลผลิตออกมาก
              </SmallText>
            </View>
            <Ionicons name="trending-down" size={24} color="#F44336" />
          </View>
        </Card>

        {/* Market News */}
        <Card style={styles.newsCard}>
          <Body style={styles.newsTitle}>ข่าวตลาด</Body>
          
          <View style={styles.newsItem}>
            <Body style={styles.newsHeadline}>
              ราคาข้าวในตลาดโลกเพิ่มขึ้น 5%
            </Body>
            <SmallText style={styles.newsTime}>
              {t('just_now')}
            </SmallText>
          </View>
          
          <View style={styles.newsItem}>
            <Body style={styles.newsHeadline}>
              ฤดูทุเรียนเริ่มต้น ราคาเริ่มปรับตัว
            </Body>
            <SmallText style={styles.newsTime}>
              2 {t('hours_ago')}
            </SmallText>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#4CAF50',
    marginTop: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666666',
    fontSize: 16,
  },
  regionFilter: {
    marginBottom: 20,
  },
  regionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  regionButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  regionButtonText: {
    color: '#666666',
    fontSize: 14,
  },
  regionButtonTextActive: {
    color: '#FFFFFF',
  },
  priceCard: {
    marginBottom: 16,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  priceInfo: {
    flex: 1,
  },
  priceName: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceRegion: {
    color: '#666666',
  },
  priceValue: {
    alignItems: 'flex-end',
  },
  currentPrice: {
    color: '#333333',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastUpdated: {
    color: '#666666',
  },
  alertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertButtonText: {
    color: '#4CAF50',
    fontSize: 12,
  },
  alertsCard: {
    marginBottom: 20,
  },
  alertsTitle: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  alertInfo: {
    flex: 1,
  },
  alertCrop: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertTarget: {
    color: '#666666',
  },
  alertToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertToggleActive: {
    backgroundColor: '#4CAF50',
  },
  addAlertButton: {
    marginTop: 16,
  },
  trendsCard: {
    marginBottom: 20,
  },
  trendsTitle: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  trendInfo: {
    flex: 1,
  },
  trendCrop: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendDescription: {
    color: '#666666',
    lineHeight: 20,
  },
  newsCard: {
    marginBottom: 32,
  },
  newsTitle: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  newsItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  newsHeadline: {
    color: '#333333',
    fontSize: 16,
    marginBottom: 4,
  },
  newsTime: {
    color: '#666666',
    fontSize: 12,
  },
});
