

---

## Hotfixes (Oct 2025 — Spray Window card details)

### Spray Window (Today tab)
- **Status badge**: must show `Good / Caution / Don't spray` based on 12h forecast thresholds.
- **Reason text**: short explanation for farmers, e.g., "เนื่องจากมีโอกาสฝนตก" / "Because of expected rain".
- **Weather factors**: display supporting values on the card — wind speed (km/h), rain probability (%), and temperature (°C).
- **Last updated**: show timestamp of last weather fetch (e.g., "อัปเดตล่าสุด 00:54").
- **Share button**: **NOT in MVP** (defer to V1+).
- **Rain alert button**: **NOT in MVP** (reserved for V1+ with push notifications).

### Crop tabs
- Tabs for **ข้าว** and **ทุเรียน** are allowed, but only today's **reference prices** must be functional in MVP.  
- Reference prices should respect earlier rules: **Rice (หอมมะลิ)** in `บ./ตัน` or `฿/Ton`, **Durian (หมอนทอง)** in `บ./กก.` or `฿/Kg`, with small **source line**.

## MVP Principles (Keep It Lean)

### ✅ What's IN MVP
- **Spray Window badge**: Main daily habit driver (Good/Caution/Don't spray)
- **Local weather forecast**: 7-day forecast with real data
- **Today's crop prices**: Rice and Durian reference prices
- **Location selection**: Editable location with geocoding

### ❌ What's NOT in MVP (Reserved for V1+)
- **Rain alert button**: Requires background scheduling + server triggers
- **Push notifications**: Complex infrastructure for 0-2 month MVP
- **Share buttons**: Network effect features for later
- **Advanced alerts**: Keep UI clean and focused

### 🎯 Focus
Farmers already see "Don't spray" or "Caution" directly on the Today tab. This is the core value proposition. Additional alert buttons would clutter the interface and add unnecessary complexity for the initial adoption phase.

## UI Design Requirements (John Deere-Inspired)

### Design Philosophy
- **John Deere-inspired design** with clean, professional appearance for rural farmers
- **Trust and recognition** through familiar agricultural equipment styling
- **Outdoor visibility** optimized for field conditions

### Typography
- **Big fonts** (titles ≥32sp, body ≥18sp) for rural farmers
- **Noto Sans Thai** (Google font) with text shadows for readability
- **John Deere green** (#2E7D32) as primary color for trust and recognition
- **Text shadows** for better outdoor visibility

### Interactive Elements
- **Big buttons** (≥64dp, 2–3 word labels) with enhanced touch targets
- **Professional cards** with rounded corners (16px), subtle borders, and shadows
- **High contrast** text and backgrounds for outdoor use
- **Touch-friendly** design for farmers wearing gloves

### Visual Hierarchy
- **Outstanding app branding** (ไร่ AI / Rai AI) with 36px font and John Deere green
- **Clear information hierarchy** with prominent spray window status
- **Consistent spacing** and professional layout
- **Clean, uncluttered interface** focusing on essential features

---

## Settings (Mobile App MVP)

### What users can do
1. **Language** — ไทย (default) / English; switch applies immediately.
2. **Weather Location (when no Field exists)** — show current label (ตำบล, จังหวัด / Sub-district, Province) with:
   - **Use my location** (coarse GPS → server `/api/geocode(reverse)` optional; or just store coords)
   - **Edit location** (search box; calls `/api/geocode?query=...`)
   - When a **Field exists**, show caption: *“ตำแหน่งดึงจากแปลงของคุณ” / “Location is driven by your Field”* and disable the buttons.
3. **Notifications (local only)** — toggle **Spray Window reminder** and a **time picker** (default 06:00). No server push in MVP.
4. **Data & Privacy** — toggle **“Allow my scans to improve the model (opt-in)”**; button **Clear cached data** (weather/prices only).
5. **Account** — Guest mode shown; **Sign in** button routes to Auth (can be placeholder).
6. **Help & About** — **Contact support (LINE/tel)**; show **Version/Build**; links to **Terms & Privacy** (static).

### Storage (MMKV)
```ts
prefs {
  lang: 'th'|'en',
  weatherPlaceText?: string,
  weatherLatLng?: { lat: number, lng: number },
  notifySprayWindow?: boolean,
  notifyTime?: string,              // '06:00'
  improveModelOptIn?: boolean
}
```

### Behavior details
- **Language:** update `prefs.lang`; trigger app-wide re-render.
- **Weather Location:**
  - If **no Field** → allow **Use my location** and **Edit location**. Save to `prefs.*`. Main/Spray consume `prefs.*` (as per Location Logic).
  - If **Field exists** → location buttons disabled; caption visible.
- **Notifications (local):**
  - If toggle ON → schedule a **daily local notification** at `prefs.notifyTime`. At fire time, compute Spray Window state from cached 12h; only notify when **state = Good**.
  - When time changes → reschedule.
- **Data & Privacy:**
  - Toggle persists `prefs.improveModelOptIn`.
  - **Clear cached data**: wipe weather & prices cache; keep Field, Scan, and prefs intact.
- **Account:** stays in Guest for MVP; Sign in optional link.
- **Help & About:** open LINE/tel deeplink, show version/build.

### i18n (add if missing)
```json
// th.json
{
  "settings": "การตั้งค่า",
  "language": "ภาษา",
  "thai": "ไทย",
  "english": "English",
  "weather_location": "ตำแหน่งพยากรณ์อากาศ",
  "use_my_location": "ใช้ตำแหน่งของฉัน",
  "edit_location": "แก้ไขตำแหน่ง",
  "location_from_field": "ตำแหน่งดึงจากแปลงของคุณ",
  "notifications": "การแจ้งเตือน",
  "spray_reminder": "เตือนหน้าต่างฉีดพ่น",
  "remind_at": "เตือนเวลา",
  "data_privacy": "ข้อมูลและความเป็นส่วนตัว",
  "improve_model": "อนุญาตให้ใช้การสแกนของฉันเพื่อพัฒนาระบบ",
  "clear_cache": "ล้างแคชข้อมูล",
  "account": "บัญชี",
  "guest_mode": "โหมดผู้ใช้ชั่วคราว",
  "sign_in": "เข้าสู่ระบบ",
  "help_about": "ช่วยเหลือและเกี่ยวกับ",
  "contact_support": "ติดต่อฝ่ายสนับสนุน",
  "version": "เวอร์ชัน"
}

// en.json
{
  "settings": "Settings",
  "language": "Language",
  "thai": "Thai",
  "english": "English",
  "weather_location": "Weather Location",
  "use_my_location": "Use my location",
  "edit_location": "Edit location",
  "location_from_field": "Location is driven by your Field",
  "notifications": "Notifications",
  "spray_reminder": "Spray Window reminder",
  "remind_at": "Remind at",
  "data_privacy": "Data & Privacy",
  "improve_model": "Allow my scans to improve the model",
  "clear_cache": "Clear cached data",
  "account": "Account",
  "guest_mode": "Guest mode",
  "sign_in": "Sign in",
  "help_about": "Help & About",
  "contact_support": "Contact support",
  "version": "Version"
}
```

### Acceptance criteria (QA)
- Language switch updates UI immediately; default is Thai.
- **No Field:** Use my location & Edit location update `prefs.*` and Main/Spray reflect prefs.
- **Field exists:** location controls disabled, caption shown; Main/Spray use field location.
- Spray reminder schedules a local notification at selected time; reschedules on time change; only fires when state = Good.
- Clear cached data wipes weather/prices cache, leaves Field/Scan/prefs.
- Support link opens; Version/Build visible.
