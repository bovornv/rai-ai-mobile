import React from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LargeTitle, Body } from '../../ui/Typography';
import LargeButton from '../../ui/LargeButton';
import { LinearGradient } from 'expo-linear-gradient';

interface WelcomeScreenProps {
  navigation: any;
}

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { t } = useTranslation();

  const handleStartAsGuest = () => {
    // Navigate to main app without authentication
    navigation.replace('Main');
  };

  const handleSignIn = () => {
    navigation.navigate('OTPRequest');
  };

  return (
    <LinearGradient
      colors={['#4CAF50', '#2E7D32']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* App Logo/Icon */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <LargeTitle style={styles.logoText}>🌱</LargeTitle>
          </View>
        </View>

        {/* App Name */}
        <LargeTitle style={styles.appName}>{t('app_name')}</LargeTitle>
        <Body style={styles.subtitle}>{t('smart_farming')}</Body>
        <Body style={styles.subtitle}>{t('powered_by_ai')}</Body>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Body style={styles.description}>
            {t('no_login_needed')}
          </Body>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <LargeButton
            label={t('start_as_guest')}
            onPress={handleStartAsGuest}
            style={styles.primaryButton}
            variant="primary"
          />
          
          <LargeButton
            label={t('sign_in')}
            onPress={handleSignIn}
            style={styles.secondaryButton}
            variant="outline"
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Body style={styles.footerText}>
            {t('backup_when_ready')}
          </Body>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 48,
    color: '#FFFFFF',
  },
  appName: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#E8F5E8',
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 4,
  },
  descriptionContainer: {
    marginVertical: 32,
    paddingHorizontal: 16,
  },
  description: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 32,
  },
  primaryButton: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  secondaryButton: {
    borderColor: '#FFFFFF',
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 32,
    right: 32,
  },
  footerText: {
    color: '#E8F5E8',
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.8,
  },
});
