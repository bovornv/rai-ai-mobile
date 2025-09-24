import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LargeTitle, Body, SmallText } from '../../ui/Typography';
import LargeButton from '../../ui/LargeButton';
import Card from '../../components/Card';

interface ScanScreenProps {
  navigation: any;
}

interface DiseaseResult {
  id: string;
  name: string;
  confidence: number;
  description: string;
  treatment: string;
  prevention: string;
}

export default function ScanScreen({ navigation }: ScanScreenProps) {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DiseaseResult | null>(null);

  // Mock disease database
  const mockDiseases: DiseaseResult[] = [
    {
      id: '1',
      name: 'ใบไหม้',
      confidence: 85,
      description: 'โรคใบไหม้ที่เกิดจากเชื้อรา',
      treatment: 'ใช้ยาฆ่าเชื้อรา',
      prevention: 'ควบคุมความชื้นในแปลง',
    },
    {
      id: '2',
      name: 'ใบเหลือง',
      confidence: 72,
      description: 'อาการขาดธาตุอาหาร',
      treatment: 'ใส่ปุ๋ยไนโตรเจน',
      prevention: 'ตรวจสอบดินเป็นประจำ',
    },
    {
      id: '3',
      name: 'สุขภาพดี',
      confidence: 90,
      description: 'พืชมีสุขภาพแข็งแรง',
      treatment: 'ไม่ต้องรักษา',
      prevention: 'ดูแลต่อเนื่อง',
    },
  ];

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('error'), 'ต้องการสิทธิ์เข้าถึงรูปภาพ');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setAnalysisResult(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('error'), 'ต้องการสิทธิ์เข้าถึงกล้อง');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setAnalysisResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Randomly select a disease result
      const randomDisease = mockDiseases[Math.floor(Math.random() * mockDiseases.length)];
      setAnalysisResult(randomDisease);
    } catch (error) {
      Alert.alert(t('error'), t('error'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetScan = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#4CAF50';
    if (confidence >= 60) return '#FF9800';
    return '#F44336';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 80) return t('high');
    if (confidence >= 60) return t('medium');
    return t('low');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <LargeTitle style={styles.title}>{t('scan')}</LargeTitle>
          <Body style={styles.subtitle}>{t('disease_detection')}</Body>
        </View>

        {/* Image Selection */}
        {!selectedImage ? (
          <Card style={styles.imageCard}>
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={48} color="#CCCCCC" />
              <Body style={styles.placeholderText}>{t('choose_photo')}</Body>
            </View>
            
            <View style={styles.imageButtons}>
              <LargeButton
                label={t('take_photo')}
                onPress={takePhoto}
                style={styles.imageButton}
                variant="primary"
              />
              <LargeButton
                label={t('choose_photo')}
                onPress={pickImage}
                style={styles.imageButton}
                variant="outline"
              />
            </View>
          </Card>
        ) : (
          <Card style={styles.imageCard}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            
            <View style={styles.imageActions}>
              <LargeButton
                label={t('analyze')}
                onPress={analyzeImage}
                style={styles.analyzeButton}
                variant="primary"
                disabled={isAnalyzing}
              />
              <LargeButton
                label={t('retry')}
                onPress={resetScan}
                style={styles.retryButton}
                variant="outline"
              />
            </View>
          </Card>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <Card style={styles.loadingCard}>
            <View style={styles.loadingContent}>
              <Ionicons name="hourglass" size={32} color="#4CAF50" />
              <Body style={styles.loadingText}>{t('loading')}</Body>
              <SmallText style={styles.loadingSubtext}>กำลังวิเคราะห์ภาพ...</SmallText>
            </View>
          </Card>
        )}

        {/* Analysis Result */}
        {analysisResult && (
          <Card style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Body style={styles.resultTitle}>
                {analysisResult.name === 'สุขภาพดี' ? t('healthy') : t('disease_detected')}
              </Body>
              <View style={[
                styles.confidenceBadge,
                { backgroundColor: getConfidenceColor(analysisResult.confidence) }
              ]}>
                <SmallText style={styles.confidenceText}>
                  {analysisResult.confidence}% {t('confidence')}
                </SmallText>
              </View>
            </View>

            <View style={styles.resultContent}>
              <View style={styles.resultSection}>
                <Body style={styles.sectionTitle}>{t('description')}</Body>
                <SmallText style={styles.sectionText}>{analysisResult.description}</SmallText>
              </View>

              <View style={styles.resultSection}>
                <Body style={styles.sectionTitle}>{t('treatment')}</Body>
                <SmallText style={styles.sectionText}>{analysisResult.treatment}</SmallText>
              </View>

              <View style={styles.resultSection}>
                <Body style={styles.sectionTitle}>{t('prevention')}</Body>
                <SmallText style={styles.sectionText}>{analysisResult.prevention}</SmallText>
              </View>
            </View>

            <View style={styles.resultActions}>
              <LargeButton
                label={t('scan_again')}
                onPress={resetScan}
                style={styles.scanAgainButton}
                variant="primary"
              />
            </View>
          </Card>
        )}

        {/* Instructions */}
        <Card style={styles.instructionsCard}>
          <Body style={styles.instructionsTitle}>วิธีใช้</Body>
          <SmallText style={styles.instructionsText}>
            1. ถ่ายรูปหรือเลือกรูปใบพืช{'\n'}
            2. กดปุ่ม "วิเคราะห์" เพื่อตรวจสอบโรค{'\n'}
            3. ดูผลการวิเคราะห์และคำแนะนำ
          </SmallText>
        </Card>
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
  imageCard: {
    marginBottom: 24,
  },
  imagePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginBottom: 16,
  },
  placeholderText: {
    color: '#666666',
    marginTop: 12,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  analyzeButton: {
    flex: 1,
  },
  retryButton: {
    flex: 1,
  },
  loadingCard: {
    marginBottom: 24,
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: '#4CAF50',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    color: '#666666',
  },
  resultCard: {
    marginBottom: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  resultContent: {
    marginBottom: 16,
  },
  resultSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionText: {
    color: '#666666',
    lineHeight: 20,
  },
  resultActions: {
    marginTop: 8,
  },
  scanAgainButton: {
    // Primary button styling
  },
  instructionsCard: {
    marginBottom: 32,
  },
  instructionsTitle: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionsText: {
    color: '#666666',
    lineHeight: 20,
  },
});
