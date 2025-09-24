import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LargeTitle, Body } from '../../ui/Typography';
import LargeButton from '../../ui/LargeButton';

interface OTPVerifyScreenProps {
  navigation: any;
  route: {
    params: {
      phoneNumber: string;
    };
  };
}

export default function OTPVerifyScreen({ navigation, route }: OTPVerifyScreenProps) {
  const { t } = useTranslation();
  const { phoneNumber } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert(t('error'), 'กรุณาใส่รหัส OTP ให้ครบ 6 หลัก');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock verification (accept any 6-digit code)
      if (otpCode.length === 6) {
        Alert.alert(
          t('success'),
          t('otp_verified'),
          [
            {
              text: t('ok'),
              onPress: () => {
                // Navigate to main app
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' }],
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(t('error'), t('invalid_otp'));
      }
    } catch (error) {
      Alert.alert(t('error'), t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert(t('success'), t('otp_sent'));
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
          <LargeTitle style={styles.title}>{t('otp_verification')}</LargeTitle>
          <Body style={styles.subtitle}>
            {t('enter_otp')} {phoneNumber}
          </Body>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null,
              ]}
              value={digit}
              onChangeText={(value) => handleOTPChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <LargeButton
            label={t('verify')}
            onPress={handleVerify}
            style={styles.primaryButton}
            variant="primary"
            disabled={isLoading || otp.join('').length !== 6}
          />
          
          <LargeButton
            label={t('resend_otp')}
            onPress={handleResendOTP}
            style={styles.secondaryButton}
            variant="outline"
            disabled={isLoading}
          />
          
          <LargeButton
            label={t('back')}
            onPress={handleBack}
            style={styles.tertiaryButton}
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  otpInputFilled: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  buttonContainer: {
    marginBottom: 32,
  },
  primaryButton: {
    marginBottom: 16,
  },
  secondaryButton: {
    marginBottom: 16,
  },
  tertiaryButton: {
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
