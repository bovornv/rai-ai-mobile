import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LargeTitle, Body } from '../../ui/Typography';
import LargeButton from '../../ui/LargeButton';
import Input from '../../components/Input';

interface OTPRequestScreenProps {
  navigation: any;
}

export default function OTPRequestScreen({ navigation }: OTPRequestScreenProps) {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert(t('error'), t('please_fill_all_fields'));
      return;
    }

    // Validate phone number format (Thai format)
    const phoneRegex = /^(\+66|0)[0-9]{8,9}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      Alert.alert(t('error'), 'กรุณาใส่เบอร์โทรศัพท์ที่ถูกต้อง');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        t('success'),
        t('otp_sent'),
        [
          {
            text: t('ok'),
            onPress: () => navigation.navigate('OTPVerify', { phoneNumber }),
          },
        ]
      );
    } catch (error) {
      Alert.alert(t('error'), t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <LargeTitle style={styles.title}>{t('otp_request')}</LargeTitle>
          <Body style={styles.subtitle}>{t('enter_phone')}</Body>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label={t('phone_number')}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="0812345678"
            keyboardType="phone-pad"
            autoFocus
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <LargeButton
            label={t('send_otp')}
            onPress={handleSendOTP}
            style={styles.primaryButton}
            variant="primary"
            disabled={isLoading}
          />
          
          <LargeButton
            label={t('back')}
            onPress={handleBack}
            style={styles.secondaryButton}
            variant="outline"
          />
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Body style={styles.infoText}>
            {t('backup_when_ready')}
          </Body>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    color: '#666666',
    textAlign: 'center',
    fontSize: 16,
  },
  form: {
    marginBottom: 32,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  primaryButton: {
    marginBottom: 16,
  },
  secondaryButton: {
    // Outline button styling
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    color: '#666666',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});
