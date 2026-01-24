# FCM Token Save API Implementation

## Overview
This document explains the implementation of the FCM (Firebase Cloud Messaging) token save API integration.

## What Was Added

### 1. API Method in `authService.ts`
- **Location**: `src/services/authService.ts`
- **Method**: `saveFCMToken(deviceToken: string, platform: 'android' | 'ios')`
- **Endpoint**: `POST /api/v1/visitor/savefcmtoken`
- **Authentication**: Requires Bearer token
- **Fields**: 
  - `deviceToken`: The FCM token string
  - `platform`: Either 'android' or 'ios'

### 2. FCM Service Utility
- **Location**: `src/services/fcmService.ts`
- **Purpose**: Handles FCM token retrieval and saving to backend
- **Key Methods**:
  - `getFCMToken()`: Retrieves FCM token from Firebase
  - `saveFCMTokenToBackend()`: Saves token to backend API
  - `getAndSaveFCMToken()`: Combined method to get and save token
  - `saveTokenFromNative()`: For saving token received from native code

### 3. Integration in App.tsx
- **Location**: `App.tsx`
- **When Called**:
  1. **After successful login/registration** - In `handleAuthSuccess()` function
  2. **On app start if user is already authenticated** - In `checkAuthStatus()` function

## Why These Locations?

### 1. After Login (`handleAuthSuccess`)
- **Reason**: User is authenticated and has a valid token to make API calls
- **Benefit**: Token is saved immediately after user logs in, ensuring backend has the latest device token for push notifications

### 2. On App Start (`checkAuthStatus`)
- **Reason**: If user is already logged in (from previous session), we need to save the token when app starts
- **Benefit**: Ensures token is always up-to-date even if user didn't log in during this session

## Setup Instructions

### Option 1: Using @react-native-firebase/messaging (Recommended)

This is the easiest approach and works seamlessly with your existing native Firebase setup.

1. **Install the package**:
```bash
npm install @react-native-firebase/messaging
```

2. **For iOS**, run:
```bash
cd ios && pod install && cd ..
```

3. **The FCM service will automatically use this package** - no code changes needed!

### Option 2: Using Native Bridge (If you prefer not to install the package)

If you want to use your existing native Firebase setup without installing `@react-native-firebase/messaging`, you'll need to:

1. Create a native module bridge to pass the FCM token from native code to React Native
2. Call `fcmService.saveTokenFromNative(token, platform)` when token is received

**Example for iOS** (in `AppDelegate.swift`):
```swift
// After receiving token in messaging(_:didReceiveRegistrationToken:)
// You would need to create a bridge module to send token to React Native
// Then call: fcmService.saveTokenFromNative(token, 'ios')
```

**Example for Android** (in `MainApplication.kt`):
```kotlin
// After receiving token
// You would need to create a bridge module to send token to React Native
// Then call: fcmService.saveTokenFromNative(token, 'android')
```

## Current Implementation Status

✅ **Completed**:
- API method added to `authService.ts`
- FCM service utility created
- Integration in App.tsx (called after login and on app start)

⚠️ **Requires Setup**:
- Install `@react-native-firebase/messaging` OR create native bridge
- The service will work once FCM token can be retrieved

## Testing

1. **After Login**: 
   - Log in to the app
   - Check console logs for "✅ FCM token saved successfully"
   - Verify API call in network logs

2. **On App Start**:
   - Close and reopen the app while logged in
   - Check console logs for token save confirmation

3. **Verify Backend**:
   - Check your backend database/logs to confirm token is being saved
   - Token should be associated with the logged-in user

## API Details

- **Endpoint**: `https://carwashapp.shoppypie.in/api/v1/visitor/savefcmtoken`
- **Method**: POST
- **Headers**:
  - `Accept: application/json`
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "deviceToken": "fcm_token_string",
    "platform": "android" // or "ios"
  }
  ```

## Notes

- The FCM token save happens **silently in the background** - it won't block the UI
- If token retrieval fails, it will log a warning but won't crash the app
- The token is saved automatically whenever user logs in or app starts with authenticated user
- Token refresh handling: If you need to handle token refresh, you can call `fcmService.getAndSaveFCMToken()` when token is refreshed
