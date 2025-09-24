@echo off
REM RAI AI Mobile App - Deployment Script for Windows
REM John Deere-Inspired Farming App for Thai Farmers

echo 🌾 RAI AI Mobile App - Deployment Script
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if Expo CLI is installed
expo --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Installing Expo CLI...
    npm install -g @expo/cli
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Check for environment variables
if not exist .env (
    echo ⚠️  No .env file found. Creating template...
    (
        echo # API Keys for RAI AI Mobile App
        echo METEOSOURCE_API_KEY=your_meteosource_key_here
        echo OPENWEATHER_API_KEY=your_openweather_key_here
        echo GOOGLE_MAPS_API_KEY=your_google_maps_key_here
        echo SCAN_API_ENDPOINT=https://api.raiai.app/scan
    ) > .env
    echo 📝 Please update .env file with your API keys before deployment.
)

REM Build options
echo.
echo 🚀 Deployment Options:
echo 1. Development build (APK for Android)
echo 2. Production build (App Bundle for Android)
echo 3. iOS Simulator build
echo 4. Web build
echo 5. EAS Build (Recommended for production)

set /p choice="Select deployment option (1-5): "

if "%choice%"=="1" (
    echo 🔨 Building development APK...
    npx expo build:android --type apk
) else if "%choice%"=="2" (
    echo 🔨 Building production App Bundle...
    npx expo build:android --type app-bundle
) else if "%choice%"=="3" (
    echo 🔨 Building iOS Simulator...
    npx expo build:ios --type simulator
) else if "%choice%"=="4" (
    echo 🔨 Building for Web...
    npx expo build:web
) else if "%choice%"=="5" (
    echo 🔨 EAS Build (Production Ready)...
    eas --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo 📦 Installing EAS CLI...
        npm install -g @expo/eas-cli
    )
    
    echo 🔐 Please login to Expo...
    eas login
    
    echo ⚙️  Configuring EAS...
    eas build:configure
    
    echo 🔨 Building for Android...
    eas build --platform android
    
    echo 🔨 Building for iOS...
    eas build --platform ios
) else (
    echo ❌ Invalid option. Please run the script again.
    pause
    exit /b 1
)

echo.
echo ✅ Deployment completed!
echo 📱 Your RAI AI Mobile App is ready for distribution.
echo.
echo 🌾 Built with ❤️ for Thai farmers
echo John Deere-Inspired Design ^| Real Data Integration ^| Professional UI
pause
