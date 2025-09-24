const fs = require('fs');

// Read the App-expo-snack.js file
const appContent = fs.readFileSync('App-expo-snack.js', 'utf8');

// Create the Snack configuration
const snackConfig = {
  name: "RAI AI Farming Mobile",
  description: "AI-powered farming assistant with crop scanning, weather forecasting, and price tracking",
  dependencies: {
    "expo": "~49.0.0",
    "expo-status-bar": "~1.6.0", 
    "react": "18.2.0",
    "react-native": "0.72.6",
    "@expo/vector-icons": "^13.0.0"
  },
  files: {
    "App.js": {
      type: "CODE",
      contents: appContent
    }
  }
};

// Create a base64 encoded configuration for Snack URL
const configString = JSON.stringify(snackConfig);
const base64Config = Buffer.from(configString).toString('base64');

// Create the Snack URL
const snackUrl = `https://snack.expo.dev/@anonymous/${base64Config}`;

console.log('🚀 Your Expo Snack is ready!');
console.log('');
console.log('📱 Snack URL:');
console.log(snackUrl);
console.log('');
console.log('🔗 Alternative: Go to https://snack.expo.dev/ and create a new project');
console.log('📁 Files are also available in ./snack-deploy/ directory');
console.log('');
console.log('📋 Dependencies to add in Snack:');
console.log(JSON.stringify(snackConfig.dependencies, null, 2));
