#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 RAI AI Farming - Deployment Script');
console.log('=====================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('📁 Created assets directory');
}

// Create placeholder assets
const createPlaceholderAsset = (filename, size = '512x512') => {
  const assetPath = path.join(assetsDir, filename);
  if (!fs.existsSync(assetPath)) {
    // Create a simple SVG placeholder
    const svgContent = `
<svg width="${size.split('x')[0]}" height="${size.split('x')[1]}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#4CAF50"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="48">🌱</text>
</svg>`;
    fs.writeFileSync(assetPath, svgContent);
    console.log(`📄 Created placeholder ${filename}`);
  }
};

// Create required assets
createPlaceholderAsset('icon.png');
createPlaceholderAsset('splash.png', '1242x2436');
createPlaceholderAsset('adaptive-icon.png');
createPlaceholderAsset('favicon.png', '32x32');

console.log('\n📦 Deployment Options:');
console.log('1. Web Deployment (HTML)');
console.log('2. Expo Development Build');
console.log('3. Android APK Build');
console.log('4. iOS Build');
console.log('5. All Platforms\n');

const choice = process.argv[2] || '1';

switch (choice) {
  case '1':
    deployWeb();
    break;
  case '2':
    deployExpoDev();
    break;
  case '3':
    deployAndroid();
    break;
  case '4':
    deployiOS();
    break;
  case '5':
    deployAll();
    break;
  default:
    console.log('Usage: node deploy.js [1|2|3|4|5]');
    console.log('1 - Web, 2 - Expo Dev, 3 - Android, 4 - iOS, 5 - All');
}

function deployWeb() {
  console.log('🌐 Deploying Web Version...');
  
  if (fs.existsSync('index.html')) {
    console.log('✅ Web version ready!');
    console.log('📁 Open index.html in your browser');
    console.log('🌍 Or upload to any web hosting service:');
    console.log('   - Netlify: drag & drop index.html');
    console.log('   - Vercel: vercel --prod');
    console.log('   - GitHub Pages: push to gh-pages branch');
  } else {
    console.error('❌ index.html not found');
  }
}

function deployExpoDev() {
  console.log('📱 Starting Expo Development Server...');
  try {
    execSync('npx expo start --tunnel', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to start Expo server:', error.message);
  }
}

function deployAndroid() {
  console.log('🤖 Building Android APK...');
  try {
    execSync('npx eas build --platform android --profile preview', { stdio: 'inherit' });
    console.log('✅ Android APK build started!');
    console.log('📱 Check your Expo dashboard for the build status');
  } catch (error) {
    console.error('❌ Failed to build Android APK:', error.message);
    console.log('💡 Make sure you have EAS CLI installed: npm install -g @expo/eas-cli');
  }
}

function deployiOS() {
  console.log('🍎 Building iOS App...');
  try {
    execSync('npx eas build --platform ios --profile preview', { stdio: 'inherit' });
    console.log('✅ iOS build started!');
    console.log('📱 Check your Expo dashboard for the build status');
  } catch (error) {
    console.error('❌ Failed to build iOS app:', error.message);
    console.log('💡 Make sure you have EAS CLI installed: npm install -g @expo/eas-cli');
  }
}

function deployAll() {
  console.log('🚀 Deploying to All Platforms...');
  deployWeb();
  console.log('\n');
  deployExpoDev();
}
