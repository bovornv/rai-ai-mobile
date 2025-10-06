# 📱 Expo Snack Deployment Guide

## Quick Preview Options

### Option 1: Web Preview (Instant)
Open `expo-snack-preview.html` in your browser for an instant preview of the mobile app UI.

### Option 2: Expo Snack (Full Mobile Experience)
Follow these steps to create a shareable Snack URL:

## 🚀 Deploy to Expo Snack

### Step 1: Create New Snack
1. Go to [https://snack.expo.dev](https://snack.expo.dev)
2. Click "Create new Snack"
3. Choose "Blank" template

### Step 2: Copy App Code
1. Open `expo-snack-preview.js` in this repository
2. Copy all the code
3. Replace the default `App.js` content in Snack

### Step 3: Update Dependencies
1. In Snack, go to "Dependencies" tab
2. Add these dependencies:
   ```json
   {
     "expo": "~49.0.0",
     "expo-status-bar": "~1.6.0",
     "react": "18.2.0",
     "react-native": "0.72.6",
     "@expo/vector-icons": "^13.0.0"
   }
   ```

### Step 4: Configure App
1. Go to "App.js" tab
2. Make sure the code is properly formatted
3. Save the project

### Step 5: Test & Share
1. Click "Run" to test the app
2. Use "Share" to get the Snack URL
3. Share the URL with stakeholders

## 📱 App Features Preview

### 🏠 Home Screen
- **Weather Information**: Current temperature, humidity, 4-day forecast
- **Field Overview**: Single field with crop details and health score
- **Task Management**: Daily tasks with completion status
- **Quick Actions**: Scan button for disease detection

### 📍 Fields Management
- **Field Details**: Area, soil type, crop information
- **Health Monitoring**: Crop health score and growth stage
- **Action Buttons**: Edit and view detailed information
- **MVP Notice**: Shows limitation (1 field max)

### 📱 Disease Scanning
- **Camera Interface**: Placeholder for camera functionality
- **Scan Tips**: Best practices for taking photos
- **AI Analysis**: Loading state for disease detection
- **Results**: Would show disease diagnosis and treatment

### 📈 Market Prices
- **Price Cards**: Current prices for different rice types
- **Price Changes**: Percentage changes with color coding
- **MVP Notice**: Read-only mode limitation

## 🔒 Security Features

### ✅ Implemented
- **No API Keys**: All external calls use server-side proxies
- **Environment Config**: Centralized configuration management
- **Secret Scanning**: Gitleaks integration for CI/CD
- **Pre-commit Hooks**: Prevent secret commits

### 🛡️ Server-Side Proxies
All external API calls go through your backend:
- `GET /api/geocode` - Geocoding services
- `GET /api/weather` - Weather data
- `POST /api/scan` - Disease detection
- `GET /api/prices` - Market prices

## 🎯 MVP Limitations

### Current Limits
- **Fields**: Maximum 1 field
- **Scans**: 1 scan per day
- **Alerts**: 1 alert maximum
- **Prices**: Read-only mode

### Upgrade Path
- Remove limits for full version
- Add real-time notifications
- Enable price alerts
- Add multiple field support

## 📊 Technical Stack

### Frontend
- **React Native**: Cross-platform mobile development
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe development
- **Ionicons**: Icon library

### Backend (Required)
- **API Proxies**: Server-side API calls
- **Environment Variables**: Secure key management
- **Authentication**: User management
- **Database**: Field and crop data storage

## 🚨 Next Steps

### Immediate
1. **Set up backend APIs** for the proxy endpoints
2. **Configure environment variables** in production
3. **Test the Snack preview** with stakeholders
4. **Gather feedback** on UI/UX

### Development
1. **Implement real camera** functionality
2. **Add data persistence** with AsyncStorage
3. **Connect to real APIs** via server proxies
4. **Add user authentication** flow

### Production
1. **Deploy backend services** with API proxies
2. **Set up CI/CD** with secret scanning
3. **Configure monitoring** and analytics
4. **Prepare app store** submission

## 📞 Support

For questions or issues:
- Check the [SECURITY.md](./SECURITY.md) for security guidelines
- Review the [README.md](./README.md) for general information
- Create an issue in the repository for bugs or feature requests

---

**Ready to preview?** Open `expo-snack-preview.html` in your browser or follow the Snack deployment steps above! 🚀
