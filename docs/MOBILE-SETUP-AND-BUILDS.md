# Sahyātri Mobile Application Setup & Build Guide

This document provides a comprehensive guide for configuring, building, testing, and submitting the **Sahyātri Mobile Application** (built with Expo SDK 52, React Native 0.76, React Navigation 7, TanStack Query 5, and EAS).

---

## 1. Overview & Architecture

- **Project Root:** `mobile/`
- **Framework:** Expo SDK 52 + React Native 0.76 (Fabric Architecture ready)
- **State & Data Fetching:** TanStack React Query v5 + Custom Fetch API Client with auto 401 token refresh
- **Secure Token Storage:** `expo-secure-store` (Encrypted SharedPreferences on Android, Keychain on iOS, localStorage fallback on web)
- **Push Notifications:** `expo-notifications` + `expo-device` (FCM on Android, APNs on iOS)
- **Deep Linking:** `sahyatri://` scheme (e.g. `sahyatri://trek/kedarkantha-trek`, `sahyatri://booking/bkg_123`)
- **Payment Integration:** Razorpay Sandbox Checkout with test payment simulation and dual-phase server verification

---

## 2. Configuration Files

### `app.json`
- **App Name:** `Sahyātri`
- **Android Package Name:** `com.sahyatri.app`
- **iOS Bundle Identifier:** `com.sahyatri.app`
- **Scheme:** `sahyatri`
- **Permissions:** Camera, Media/Photos, Post Notifications
- **Plugins:** `expo-secure-store`, `expo-notifications`

### `eas.json`
- **Development Profile:** `development` (Internal distribution)
- **Preview Profile:** `preview` (`apk` build type for Android manual sideloading testing)
- **Production Profile:** `production` (`app-bundle` / `.aab` for Android Google Play Console, `.ipa` for Apple App Store / TestFlight)

---

## 3. Local Setup & Verification

### Installation
```bash
cd mobile
npm install
```

### TypeScript Verification
```bash
npx tsc --noEmit
```

### Running in Expo Go / Development
```bash
# Start Metro bundler
npm start

# Android Emulator
npm run android

# iOS Simulator
npm run ios
```

---

## 4. Production Build Commands

### Android Production Build (`.aab` / App Bundle)
```bash
eas build --platform android --profile production
```

### Android APK Build for Local Device Testing
```bash
eas build --platform android --profile preview
```

### iOS Production Build (`.ipa`)
```bash
eas build --platform ios --profile production
```

---

## 5. Required External Accounts & Credentials

Before executing production builds on Expo Application Services (EAS) or submitting to stores, the following external credentials must be configured:

| Platform / Service | Requirement | Purpose | Status |
| :--- | :--- | :--- | :--- |
| **Google Play Console** | Developer Account (\$25 one-time) | Google Play Store publishing | REQUIRES EXTERNAL CONFIGURATION |
| **Google Play Credentials** | Service Account JSON (`api-xxx.json`) | Automated EAS upload to Play Store | REQUIRES EXTERNAL CONFIGURATION |
| **Apple Developer Program** | Developer Account (\$99/year) | iOS App Store & TestFlight distribution | REQUIRES EXTERNAL CONFIGURATION |
| **Apple Certificates** | App Store Distribution Cert + Provisioning Profile | Signing iOS production `.ipa` | REQUIRES EXTERNAL CONFIGURATION |
| **Firebase Cloud Messaging (FCM)** | `google-services.json` | Android push notifications | REQUIRES EXTERNAL CONFIGURATION |
| **Apple Push Notification Service (APNs)** | `.p8` Push Key | iOS push notifications | REQUIRES EXTERNAL CONFIGURATION |
| **Razorpay Live Account** | Production Key ID & Secret (`rzp_live_...`) | Real monetary payment processing | REQUIRES EXTERNAL CONFIGURATION |

---

## 6. Store Submission Checklist

- [x] Complete mobile UI screens (Auth, Catalog, Bookings, Profile, Notifications, Support, Role Dashboards)
- [x] Secure storage & JWT token lifecycle management
- [x] Android back button & gesture navigation support
- [x] iOS safe area & swipe-back gesture support
- [x] Dark / Light theme support
- [x] Razorpay mobile checkout integration
- [x] Push notification registration & notification channel
- [ ] Upload final high-res 1024x1024 app icon & splash screen
- [ ] Add privacy policy URL in `app.json`
- [ ] Fill registered business address & GST details in `docs/LAUNCH-READINESS.md`
