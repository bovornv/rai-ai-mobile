# ไร่ AI - Mobile App MVP

## 🌾 John Deere-Inspired Farming App for Thai Farmers

A professional mobile application designed specifically for Thai farmers in rural areas, featuring real-time weather data, AI-powered disease detection, and John Deere-inspired UI design.

## ✨ Features

### 🎯 Core MVP Features
- **Spray Window Badge**: Real-time weather logic with Good/Caution/Don't spray indicators
- **AI Disease Detection**: Crop-specific scanning for rice and durian with real AI APIs
- **Weather Intelligence**: 7-day forecast with live data from MeteoSource and OpenWeatherMap
- **Field Management**: Single field CRUD with offline storage
- **Price Tracking**: Live agricultural commodity prices for rice and durian
- **Guest-First Auth**: Anonymous device ID with optional OTP

### 🎨 John Deere-Inspired Design
- **Professional UI**: Clean, trustworthy interface inspired by agricultural equipment leader
- **Big Fonts**: 32px+ titles, 18px+ body text optimized for rural outdoor use
- **John Deere Green**: #2E7D32 primary color for trust and recognition
- **Touch-Friendly**: 64dp+ buttons optimized for farmers wearing gloves
- **Outstanding Branding**: 36px "ไร่ AI / Rai AI" with text shadows

### 🌐 Real Data Integration
- **Live Weather APIs**: MeteoSource + OpenWeatherMap with no mock data
- **Real Price APIs**: Agricultural commodity prices
- **Live Scan APIs**: Crop-specific disease detection
- **Google Geocoding**: Accurate location services

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Security Notice

🔒 **This app uses server-side proxies for all external API calls. No API keys are stored in the mobile app.**

See [SECURITY.md](./SECURITY.md) for detailed security guidelines and best practices.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/rai-ai-mobile.git
   cd rai-ai-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   
   # Web
   npm run web
   ```

## 📱 Deployment

### Development Build
```bash
# Create development build
npx expo build:android --type apk
npx expo build:ios --type simulator
```

### Production Build
```bash
# Create production build
npx expo build:android --type app-bundle
npx expo build:ios --type archive
```

### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## 🔧 Configuration

### API Keys
The app uses real APIs that require configuration:

1. **Weather APIs**:
   - MeteoSource API key
   - OpenWeatherMap API key

2. **Geocoding**:
   - Google Maps API key

3. **Scan API**:
   - Disease detection API endpoint

### Environment Variables
Create a `.env` file in the root directory:
```env
METEOSOURCE_API_KEY=your_meteosource_key
OPENWEATHER_API_KEY=your_openweather_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
SCAN_API_ENDPOINT=your_scan_api_endpoint
```

## 📋 MVP Scope

### ✅ Included Features
- Spray Window badge with real-time weather logic
- Scan system (1/day limit) with real AI disease detection
- Fields management (1 field limit)
- Weather forecast (7-day with live data)
- Price tracking (rice and durian)
- Guest-first authentication
- Thai/English language support
- John Deere-inspired UI design

### ❌ Excluded Features (V1+)
- Push notifications
- Unlimited fields
- Scan history
- Advanced alerts
- Share functionality

## 🎯 Target Users

- **Primary**: Thai farmers in rural areas
- **Secondary**: Agricultural advisors and extension workers
- **Tertiary**: Agricultural input suppliers and cooperatives

## 🌍 Localization

- **Default Language**: Thai (ไทย)
- **Secondary Language**: English
- **Font**: Noto Sans Thai for optimal Thai text rendering
- **Cultural Adaptation**: Farming terms and practices specific to Thailand

## 📊 Technical Specifications

- **Framework**: React Native with Expo
- **State Management**: React Query + MMKV
- **Navigation**: React Navigation 6
- **Localization**: i18next + react-i18next
- **Storage**: AsyncStorage + MMKV
- **APIs**: RESTful with offline-first architecture

## 🔒 Security & Privacy

- **Guest Mode**: App works without login
- **Data Privacy**: Opt-in model improvement
- **Offline Storage**: Local data encryption
- **API Security**: Secure token-based authentication

## 📈 Performance

- **Fast Loading**: Optimized for low-end Android devices
- **Offline Capability**: Core features work without internet
- **Efficient Image Processing**: Optimized scan feature
- **Memory Management**: Efficient state management

## 🐛 Troubleshooting

### Common Issues

1. **Font Loading Issues**
   ```bash
   npx expo install @expo-google-fonts/noto-sans-thai
   ```

2. **API Connection Issues**
   - Check API keys in environment variables
   - Verify network connectivity
   - Check API endpoint URLs

3. **Build Issues**
   ```bash
   # Clear cache
   npx expo start --clear
   
   # Reset Metro bundler
   npx expo start --reset-cache
   ```

## 📞 Support

- **Email**: support@raiai.app
- **LINE**: @raiai-support
- **Documentation**: [docs.raiai.app](https://docs.raiai.app)

## 📄 License

Copyright © 2024 RAI AI Farming. All rights reserved.

## 🚀 Next Steps (V1 Development)

- Advisory tips system
- Task reminders with push notifications
- Unlimited fields management
- Scan history and analytics
- Pro subscription testing

---

**Built with ❤️ for Thai farmers**