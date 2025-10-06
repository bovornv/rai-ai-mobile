#!/usr/bin/env node

/**
 * Script to create Expo Snack URL for RAI AI Mobile App Preview
 * This creates a shareable Snack URL with the app code
 */

const fs = require('fs');
const path = require('path');

// Read the preview app code
const appCode = fs.readFileSync(path.join(__dirname, 'expo-snack-preview.js'), 'utf8');
const packageJson = fs.readFileSync(path.join(__dirname, 'expo-snack-package.json'), 'utf8');

// Create the Snack configuration
const snackConfig = {
  name: 'RAI AI Mobile App Preview',
  description: 'Mobile app MVP for smart farming with AI-powered features',
  dependencies: {
    "expo": "~49.0.0",
    "expo-status-bar": "~1.6.0",
    "react": "18.2.0",
    "react-native": "0.72.6",
    "@expo/vector-icons": "^13.0.0"
  },
  files: {
    'App.js': {
      type: 'CODE',
      contents: appCode
    },
    'package.json': {
      type: 'CODE',
      contents: packageJson
    }
  }
};

// Create Snack URL (this would normally be done via Expo Snack API)
console.log('🚀 RAI AI Mobile App Preview');
console.log('============================');
console.log('');
console.log('📱 App Features:');
console.log('• หน้าจอหลัก: ข้อมูลสภาพอากาศ, แปลงข้าว, งานที่ต้องทำ');
console.log('• จัดการแปลง: ดูและแก้ไขข้อมูลแปลง');
console.log('• สแกนโรคพืช: ใช้ AI ตรวจสอบสุขภาพพืช');
console.log('• ราคาข้าว: ราคาปัจจุบันและแนวโน้ม');
console.log('');
console.log('🔒 Security Features:');
console.log('• ไม่มี API keys ในแอป');
console.log('• ใช้ server-side proxies');
console.log('• Environment configuration');
console.log('');
console.log('📋 To create Snack URL:');
console.log('1. Go to https://snack.expo.dev');
console.log('2. Create new project');
console.log('3. Copy the code from expo-snack-preview.js');
console.log('4. Copy dependencies from expo-snack-package.json');
console.log('5. Save and share the URL');
console.log('');
console.log('🌐 Or open expo-snack-preview.html in browser for web preview');
console.log('');

// Write configuration file for easy copying
fs.writeFileSync('snack-config.json', JSON.stringify(snackConfig, null, 2));
console.log('✅ Created snack-config.json for easy setup');