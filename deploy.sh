#!/bin/bash

# RAI AI Mobile App - Deployment Script
# John Deere-Inspired Farming App for Thai Farmers

echo "🌾 RAI AI Mobile App - Deployment Script"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
    echo "📦 Installing Expo CLI..."
    npm install -g @expo/cli
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check for environment variables
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating template..."
    cat > .env << EOF
# API Keys for RAI AI Mobile App
METEOSOURCE_API_KEY=your_meteosource_key_here
OPENWEATHER_API_KEY=your_openweather_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
SCAN_API_ENDPOINT=https://api.raiai.app/scan
EOF
    echo "📝 Please update .env file with your API keys before deployment."
fi

# Build options
echo ""
echo "🚀 Deployment Options:"
echo "1. Development build (APK for Android)"
echo "2. Production build (App Bundle for Android)"
echo "3. iOS Simulator build"
echo "4. Web build"
echo "5. EAS Build (Recommended for production)"

read -p "Select deployment option (1-5): " choice

case $choice in
    1)
        echo "🔨 Building development APK..."
        npx expo build:android --type apk
        ;;
    2)
        echo "🔨 Building production App Bundle..."
        npx expo build:android --type app-bundle
        ;;
    3)
        echo "🔨 Building iOS Simulator..."
        npx expo build:ios --type simulator
        ;;
    4)
        echo "🔨 Building for Web..."
        npx expo build:web
        ;;
    5)
        echo "🔨 EAS Build (Production Ready)..."
        if ! command -v eas &> /dev/null; then
            echo "📦 Installing EAS CLI..."
            npm install -g @expo/eas-cli
        fi
        
        echo "🔐 Please login to Expo..."
        eas login
        
        echo "⚙️  Configuring EAS..."
        eas build:configure
        
        echo "🔨 Building for Android..."
        eas build --platform android
        
        echo "🔨 Building for iOS..."
        eas build --platform ios
        ;;
    *)
        echo "❌ Invalid option. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment completed!"
echo "📱 Your RAI AI Mobile App is ready for distribution."
echo ""
echo "🌾 Built with ❤️ for Thai farmers"
echo "John Deere-Inspired Design | Real Data Integration | Professional UI"
