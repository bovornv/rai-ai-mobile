import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LargeTitle, Body, SmallText } from '../../ui/Typography';
import LargeButton from '../../ui/LargeButton';
import Card from '../../components/Card';
import { setLang } from '../../i18n';

interface SettingsScreenProps {
  navigation: any;
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { t } = useTranslation();
  const [currentLang, setCurrentLang] = useState<'th' | 'en'>('th');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(true);
  const [weatherAlertsEnabled, setWeatherAlertsEnabled] = useState(false);

  const switchLanguage = async (lang: 'th' | 'en') => {
    await setLang(lang);
    setCurrentLang(lang);
  };

  const handleClearData = () => {
    Alert.alert(
      t('clear_data'),
      t('clear_data_warning'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('clear'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(t('success'), t('all_data_cleared'));
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      t('are_you_sure_logout'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: () => {
            // Navigate back to welcome screen
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          },
        },
      ]
    );
  };

  const settingsSections = [
    {
      title: t('language'),
      items: [
        {
          type: 'language',
          label: t('thai'),
          value: currentLang === 'th',
          onPress: () => switchLanguage('th'),
        },
        {
          type: 'language',
          label: t('english'),
          value: currentLang === 'en',
          onPress: () => switchLanguage('en'),
        },
      ],
    },
    {
      title: t('alerts'),
      items: [
        {
          type: 'switch',
          label: t('enable_alerts'),
          value: notificationsEnabled,
          onValueChange: setNotificationsEnabled,
        },
        {
          type: 'switch',
          label: t('price_alert'),
          value: priceAlertsEnabled,
          onValueChange: setPriceAlertsEnabled,
        },
        {
          type: 'switch',
          label: 'แจ้งเตือนอากาศ',
          value: weatherAlertsEnabled,
          onValueChange: setWeatherAlertsEnabled,
        },
      ],
    },
    {
      title: 'ข้อมูล',
      items: [
        {
          type: 'action',
          label: 'สำรองข้อมูล',
          icon: 'cloud-upload',
          onPress: () => Alert.alert(t('info'), 'ฟีเจอร์จะมาในอนาคต'),
        },
        {
          type: 'action',
          label: 'ซิงค์ข้อมูล',
          icon: 'refresh',
          onPress: () => Alert.alert(t('info'), 'ฟีเจอร์จะมาในอนาคต'),
        },
        {
          type: 'action',
          label: t('clear_data'),
          icon: 'trash',
          onPress: handleClearData,
          destructive: true,
        },
      ],
    },
    {
      title: 'เกี่ยวกับ',
      items: [
        {
          type: 'action',
          label: 'เวอร์ชัน',
          icon: 'information-circle',
          onPress: () => Alert.alert('เวอร์ชัน', '1.0.0'),
        },
        {
          type: 'action',
          label: 'ติดต่อเรา',
          icon: 'mail',
          onPress: () => Alert.alert(t('info'), 'ติดต่อ: support@rai-ai.com'),
        },
        {
          type: 'action',
          label: 'นโยบายความเป็นส่วนตัว',
          icon: 'shield-checkmark',
          onPress: () => Alert.alert(t('info'), 'นโยบายความเป็นส่วนตัว'),
        },
      ],
    },
  ];

  const renderSettingItem = (item: any, index: number) => {
    switch (item.type) {
      case 'language':
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.settingItem,
              item.value && styles.settingItemActive
            ]}
            onPress={item.onPress}
          >
            <Body style={[
              styles.settingLabel,
              item.value && styles.settingLabelActive
            ]}>
              {item.label}
            </Body>
            {item.value && (
              <Ionicons name="checkmark" size={20} color="#4CAF50" />
            )}
          </TouchableOpacity>
        );

      case 'switch':
        return (
          <View key={index} style={styles.settingItem}>
            <Body style={styles.settingLabel}>{item.label}</Body>
            <Switch
              value={item.value}
              onValueChange={item.onValueChange}
              trackColor={{ false: '#E0E0E0', true: '#4CAF50' }}
              thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        );

      case 'action':
        return (
          <TouchableOpacity
            key={index}
            style={styles.settingItem}
            onPress={item.onPress}
          >
            <View style={styles.settingAction}>
              <Ionicons 
                name={item.icon} 
                size={20} 
                color={item.destructive ? '#F44336' : '#666666'} 
              />
              <Body style={[
                styles.settingLabel,
                item.destructive && styles.settingLabelDestructive
              ]}>
                {item.label}
              </Body>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <LargeTitle style={styles.title}>{t('settings')}</LargeTitle>
          <Body style={styles.subtitle}>การตั้งค่าแอป</Body>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <Card key={sectionIndex} style={styles.sectionCard}>
            <Body style={styles.sectionTitle}>{section.title}</Body>
            {section.items.map((item, itemIndex) => renderSettingItem(item, itemIndex))}
          </Card>
        ))}

        {/* App Info */}
        <Card style={styles.appInfoCard}>
          <View style={styles.appInfo}>
            <View style={styles.appIcon}>
              <LargeTitle style={styles.appIconText}>🌱</LargeTitle>
            </View>
            <View style={styles.appDetails}>
              <Body style={styles.appName}>{t('app_name')}</Body>
              <SmallText style={styles.appVersion}>เวอร์ชัน 1.0.0</SmallText>
              <SmallText style={styles.appDescription}>
                แอปเกษตรอัจฉริยะสำหรับเกษตรกรไทย
              </SmallText>
            </View>
          </View>
        </Card>

        {/* Logout Button */}
        <LargeButton
          label={t('logout')}
          onPress={handleLogout}
          style={styles.logoutButton}
          variant="outline"
        />

        {/* Footer */}
        <View style={styles.footer}>
          <SmallText style={styles.footerText}>
            © 2024 RAI AI Farming. สงวนลิขสิทธิ์
          </SmallText>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
    paddingHorizontal: 16,
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
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingItemActive: {
    backgroundColor: '#F1F8E9',
  },
  settingLabel: {
    color: '#333333',
    fontSize: 16,
  },
  settingLabelActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  settingLabelDestructive: {
    color: '#F44336',
  },
  settingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appInfoCard: {
    marginBottom: 24,
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  appIconText: {
    fontSize: 32,
  },
  appDetails: {
    flex: 1,
  },
  appName: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  appVersion: {
    color: '#666666',
    marginBottom: 4,
  },
  appDescription: {
    color: '#666666',
    lineHeight: 20,
  },
  logoutButton: {
    marginBottom: 24,
    borderColor: '#F44336',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    color: '#999999',
    textAlign: 'center',
  },
});
