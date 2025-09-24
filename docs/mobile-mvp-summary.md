# RAI • Mobile App MVP — Implementation Summary

## 🎯 Strategic Overview
RAI operates on a **Web + Mobile** strategy:
- **Web (raiai.app)**: Funnel + Partner Hub → drives app downloads, hosts partner tools
- **Mobile App**: Habit Engine → daily farmer engagement through Spray Window, Scan→Action, Tasks
- **Monetization**: Freemium subscriptions + Marketplace commission + B2B data/API + Co-op SaaS tools

## 📊 **DEVELOPMENT PHASES**

### **Phase 1: MVP (Months 0-2) ✅ COMPLETED**
- **Status**: Mobile MVP fully implemented with strict scope enforcement + John Deere-inspired UI
- **Features**: Spray Window, Scan (1/day), Fields (1 field), Weather (7-day), Guest auth, Real data APIs
- **UI Design**: John Deere-inspired professional design with big fonts for Thai farmers
- **Limits**: 1 scan/day, 1 field, 1 alert, overwrite previous results
- **Revenue**: None (build DAU)

### **Phase 2: V1 (Months 3-6) 🎯 NEXT PRIORITY**
- **Web**: Landing page, marketplace teaser, blog/SEO
- **Mobile**: Advisory tips, task reminders, push notifications, unlimited fields, scan history
- **Monetization**: Hidden Pro testing at ฿59/month
- **Target**: 50 farmers + 5 shops pilot

### **Phase 3: V2 (Months 7-9)**
- **Web**: Lead forms, partner articles
- **Mobile**: ROI snapshots, price alerts, buyer directory, outbreak radar, shop tickets
- **Monetization**: Official Pro launch at ฿59-99/month
- **Target**: 10K farmers, 2 co-ops, 50 shops

### **Phase 4: V3 (Months 10-12)**
- **Web**: Partner case studies
- **Mobile**: Referral QR, before/after cards, month-end summaries
- **Monetization**: Push Pro subscriptions, target 10K subs (~฿700K MRR)
- **Target**: Scale to 10K+ farmers

## Core Goals

### Target Users
Farmers in rural Thailand.

### Languages
- **Thai = default UI language** (ignore device locale).
- **English available**, switchable in Settings.
- **Persist choice** with AsyncStorage.

### UI Design
- **John Deere-inspired design** with clean, professional appearance
- **Big fonts** (titles ≥32sp, body ≥18sp) for rural farmers
- **Noto Sans Thai** (Google font) with text shadows for readability
- **Big buttons** (≥64dp, 2–3 word labels) with enhanced touch targets
- **John Deere green** (#2E7D32) as primary color for trust and recognition
- **Professional cards** with rounded corners, subtle borders, and shadows
- **Text must be short**, simple, easy to understand
- **Contrast ratio ≥4.5:1** with high visibility for outdoor use

## Feature Distribution (MVP)

### Welcome Screen
- **Guest start** (no login) + optional sign-in with OTP.

### Auth
- **OTP only**, optional. Farmers can use app without account.

### Tabs
- **Home**: App name, "Scan Now" shortcut.
- **Fields**: Placeholder (map/polygon editor to come later).
- **Scan**: Pick photo → mock disease detection result.
- **Weather**: 7-day forecast placeholder.
- **Settings**: Switch language (TH/EN), alert toggle placeholder.

## Tech Setup

### Framework
- **Expo + React Native**.

### Navigation
- **@react-navigation/native** + stack + tabs.

### State/Data
- **@tanstack/react-query** (for API), **MMKV** (fast local storage).

### Localization
- **i18next + react-i18next + react-native-localize**.

### Fonts
- **@expo-google-fonts/noto-sans-thai**.

### Async Storage
- **Persist language** and session state.

### Expo libs
- **ImagePicker**, **Notifications**, **Location**, **SQLite**.

## File Structure
```
src/
  App.tsx                   // navigation + providers
  linking.ts                // deep linking
  i18n/                     // translations (th.json, en.json, index.ts)
  providers/LanguageProvider.tsx
  services/                 // api.ts, storage.ts, queue.ts
  ui/                       // Typography.tsx, LargeButton.tsx
  screens/
    auth/Welcome.tsx
    auth/OTPRequest.tsx
    auth/OTPVerify.tsx
    main/Home.tsx
    main/Fields.tsx
    main/Scan.tsx
    main/Weather.tsx
    main/Settings.tsx
```

## Key Rules

1. **Default Thai always**, unless user changes to English.
2. **Simple farmer-friendly terms** in translations (th.json, en.json).
3. **No English leaks** when Thai is selected.
4. **Optional Auth**: app must be usable without login.
5. **Future-ready stubs**: API, Queue, Fields map editor, Alerts.

## Acceptance Criteria

1. **App launches in Thai** every time by default.
2. **Switching to English** updates all screens immediately and persists.
3. **Fonts load correctly**, text is big and readable.
4. **Buttons meet accessibility/tap target** requirements.
5. **Farmers can use core features** (Scan, Weather, Fields (placeholder)) without logging in.
6. **Settings shows working language switch**.

## Core Features Implementation ✅ COMPLETED

### 1. Scan Feature ✅
- **Image picker** for crop photos (gallery + camera)
- **Real AI disease detection** with crop-specific accuracy (rice & durian)
- **Action Sheet** with 3-step disease management
- **PPE requirements** and safety guidance
- **Mixing Calculator** for precise chemical application
- **Scan history** with searchable records (last 50 scans)
- **Advisory tips** in Thai/English
- **John Deere-inspired UI** with big fonts and professional design

### 2. Dashboard/Home ✅
- **Spray Window Badge** with real-time weather logic and live data
- **1-tap reminder** for optimal spray conditions
- **Outbreak Radar** with hyperlocal disease warnings
- **Quick actions** (Scan, Fields navigation) with John Deere styling
- **Crop selection** (Rice vs Durian) with prominent tabs
- **Today's tasks** with completion tracking
- **Outstanding app branding** (ไร่ AI / Rai AI) with 36px font and John Deere green

### 3. Weather Forecast ✅
- **7-day forecast** with live data from MeteoSource and OpenWeatherMap APIs
- **Field-specific weather** with lat/lng inputs and real-time updates
- **Alert preferences** (rain %, heat index)
- **Visual alerts** when thresholds exceeded
- **Heat index calculations** for plant stress
- **Real-time data** with no mock data fallbacks
- **John Deere-inspired cards** with big fonts for outdoor readability

### 4. Field Management ✅
- **Complete CRUD operations** (Create, Read, Update, Delete)
- **Field coordinates** (latitude, longitude)
- **Field status** indicators (Active, Growing, Harvested)
- **Offline sync** indicators
- **Empty state** with call-to-action
- **Form validation** and error handling

### 5. Habit & Viral Features ✅
- **Spray Window System** with smart weather logic
- **Outbreak Radar** with shareable warnings
- **Action Sheets** with step-by-step guidance
- **Mixing Calculator** for chemical application
- **Sharing functionality** (LINE integration ready)
- **Offline-first architecture** with sync queue

### 6. Localization ✅
- **Thai as default** language (100% coverage)
- **English support** with complete translations
- **Farmer-friendly terminology** throughout
- **Cultural adaptation** of farming terms
- **Big fonts and buttons** for accessibility
- **John Deere-inspired design** with professional appearance for rural farmers

### 7. Real Data Integration ✅
- **Live Weather APIs** (MeteoSource + OpenWeatherMap) with no mock data
- **Real Price APIs** for agricultural commodities (rice & durian)
- **Live Scan APIs** with crop-specific disease detection
- **Google Geocoding API** for accurate location services
- **Error handling** with user-friendly alerts instead of mock data fallbacks

## Technical Requirements

### Performance
- **Fast loading** on low-end Android devices
- **Offline capability** for basic features
- **Efficient image processing** for scan feature

### Accessibility
- **Large touch targets** (≥56dp)
- **High contrast** text and backgrounds
- **Simple navigation** with clear labels
- **Voice-over support** for screen readers

### Localization
- **Complete Thai translations** for all UI elements
- **Cultural adaptation** of farming terms
- **RTL support** if needed for future languages
- **Number formatting** for Thai locale

### Data Management
- **Local storage** for user preferences
- **Offline data** caching
- **Sync when online** for cloud features
- **Data export** for backup

## Next Phase Priorities (Q1 2025 - V1 Development)

### **Web MVP (raiai.app) - V1 (Months 3-6)**
- [ ] **Landing Page MVP**
  - Weather demo with 3-5 day forecast
  - Interactive scan demo with sample photos
  - Fields demo with map visualization
  - Clear "Download App" call-to-action

- [ ] **Marketplace Teaser**
  - Product showcase for inputs and crops
  - "Coming Soon" messaging
  - Lead capture for early access

- [ ] **SEO & Content Marketing**
  - Blog with farming tips and disease prevention
  - Partner success stories
  - Google Analytics and conversion tracking

### **Mobile V1 Features (Months 3-6)**
- [ ] **Advisory Tips System**
  - Context-aware tips based on scan results
  - Weather-based recommendations
  - Crop-specific advice (rice vs durian)

- [ ] **Task Reminders**
  - 48h recheck tasks after scanning
  - Push notification scheduling
  - Task completion tracking

- [ ] **Push Notifications**
  - Spray window alerts
  - Task reminders
  - Weather warnings

- [ ] **Unlimited Fields**
  - Remove single field limit
  - Multi-field management
  - Field comparison features

- [ ] **Scan History**
  - Local storage of all scan results
  - Search and filter functionality
  - Export capabilities

- [ ] **Pro Subscription Testing**
  - Hidden Pro features for testing
  - ฿59/month pricing
  - Unlimited scans, 5 alerts, multi-field ROI

### **User Growth Features (Q1 2025)**
- [ ] **Referral System**
  - QR code sharing (1 farmer brings 3 friends)
  - PPE rewards for successful referrals
  - Community leaderboard
  - Viral coefficient >1.5

- [ ] **Gamification**
  - Daily check-in streaks
  - Disease detection accuracy scores
  - Field health improvement tracking
  - Achievement badges

- [ ] **Content & Education**
  - Video tutorials in Thai
  - Disease prevention guides
  - Seasonal farming calendars
  - Expert Q&A sessions

## Future Enhancements

### Phase 2 (Q2-Q3 2025)
- **Monetization Features**
  - Freemium model (10 scans/month free)
  - Pro subscription ($5/month)
  - Premium features ($15/month)
  - Marketplace commission (3-10%)

- **B2B Expansion**
  - Cooperative partnerships
  - Government contracts
  - White-label solutions
  - Data licensing

- **Geographic Expansion**
  - Vietnam launch (Vietnamese localization)
  - Indonesia pilot (palm oil focus)
  - Regional disease intelligence

### Phase 3 (Q4 2025 - Q2 2026)
- **Platform Evolution**
  - Multi-crop AI (20+ crop types)
  - IoT integration (soil sensors, drones)
  - Advanced analytics and predictions
  - Developer platform and APIs

- **Financial Services**
  - Micro-loans based on field health
  - Crop insurance with AI assessment
  - Equipment financing
  - Payment processing

### Phase 4 (Q3-Q4 2026)
- **Regional Dominance**
  - Southeast Asia coverage (5M+ farmers)
  - Global expansion (India, Africa, Latin America)
  - Strategic partnerships with global agri-tech

- **Platform Moat**
  - Largest agricultural disease database
  - AI leadership in farming intelligence
  - Network effects and community features
  - Supply chain optimization

## Success Metrics

### **Product Metrics**
- Monthly Active Users (MAU)
- Daily Active Users (DAU) 
- User Retention (1-day, 7-day, 30-day)
- Feature Adoption Rate
- Net Promoter Score (NPS)

### **Business Metrics**
- Annual Recurring Revenue (ARR)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Gross Margin
- Burn Rate

### **Technical Metrics**
- Disease Detection Accuracy (>95%)
- App Performance (load time, crash rate)
- Offline Sync Success Rate
- API Response Time
- System Uptime
