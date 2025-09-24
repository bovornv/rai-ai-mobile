const fs = require('fs');
const path = require('path');

// Read the App-expo-snack.js file
const appContent = fs.readFileSync('App-expo-snack.js', 'utf8');

// Create a simple package.json for Snack
const packageJson = {
  "name": "rai-ai-mobile-snack",
  "version": "1.0.0",
  "main": "App.js",
  "dependencies": {
    "expo": "~49.0.0",
    "expo-status-bar": "~1.6.0",
    "react": "18.2.0",
    "react-native": "0.72.6",
    "@expo/vector-icons": "^13.0.0"
  }
};

// Create the deployment directory
const deployDir = 'snack-deploy';
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir);
}

// Write the files
fs.writeFileSync(path.join(deployDir, 'App.js'), appContent);
fs.writeFileSync(path.join(deployDir, 'package.json'), JSON.stringify(packageJson, null, 2));

console.log('✅ Snack deployment files created in ./snack-deploy/');
console.log('📱 You can now:');
console.log('1. Go to https://snack.expo.dev/');
console.log('2. Create a new project');
console.log('3. Copy the contents of App.js from ./snack-deploy/App.js');
console.log('4. Copy the dependencies from ./snack-deploy/package.json');
console.log('5. Save and share your Snack!');
