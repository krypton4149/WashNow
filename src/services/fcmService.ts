/**
 * FCM (Firebase Cloud Messaging) Service
 * Handles FCM token retrieval and saving to backend
 */

import { Platform } from 'react-native';
import authService from './authService';

// Try to import @react-native-firebase/messaging
let messaging: any = null;
try {
  messaging = require('@react-native-firebase/messaging').default;
} catch (error) {
  // Silently handle - only log in dev mode
  if (__DEV__) {
    console.warn('@react-native-firebase/messaging not installed. FCM token will need to be passed from native code.');
  }
}

class FCMService {
  /**
   * Get FCM token from Firebase
   * @returns Promise<string | null> - FCM token or null if unavailable
   */
  async getFCMToken(): Promise<string | null> {
    try {
      if (messaging) {
        // Using @react-native-firebase/messaging
        const token = await messaging().getToken();
        return token;
      } else {
        // Native Firebase is set up, but we need token from native code
        // This will be handled by native modules or passed from App.tsx
        // Silently return null - only log in dev mode
        return null;
      }
    } catch (error: any) {
      // Silently fail - don't log errors that could trigger error overlays
      return null;
    }
  }

  /**
   * Save FCM token to backend with retry logic
   * Completely silent - never throws errors or shows error dialogs
   * @param deviceToken - FCM device token
   * @param platform - Platform ('android' | 'ios')
   * @param retries - Number of retry attempts (default: 1)
   * @returns Promise<boolean> - Success status
   */
  async saveFCMTokenToBackend(
    deviceToken: string, 
    platform: 'android' | 'ios' = Platform.OS as 'android' | 'ios',
    retries: number = 1
  ): Promise<boolean> {
    // Wrap everything in try-catch to ensure no errors escape
    try {
      if (!deviceToken) {
        return false;
      }

      // Use Promise.resolve to ensure errors are caught
      const result = await Promise.resolve(authService.saveFCMToken(deviceToken, platform)).catch(() => ({
        success: false,
        error: 'Network error'
      }));
      
      if (result?.success) {
        if (__DEV__) {
          console.log('✅ FCM token saved successfully');
        }
        return true;
      } else {
        // Retry once on timeout or network errors
        if (retries > 0 && result?.error && (
          result.error.includes('timeout') || 
          result.error.includes('Network error') ||
          result.error.includes('connection')
        )) {
          // Wait 3 seconds before retry
          await new Promise(resolve => setTimeout(resolve, 3000));
          return await this.saveFCMTokenToBackend(deviceToken, platform, retries - 1);
        }
        
        // Silently fail - don't log anything to avoid error overlays
        return false;
      }
    } catch (error: any) {
      // Completely swallow all errors - FCM token saving is not critical
      // Never throw or log errors that could trigger React Native error overlay
      return false;
    }
  }

  /**
   * Get and save FCM token in one call
   * This is the main method to use after login or on app start
   * Completely silent - never throws errors or shows error dialogs
   * @returns Promise<boolean> - Success status
   */
  async getAndSaveFCMToken(): Promise<boolean> {
    // Wrap in try-catch and use Promise.resolve to ensure all errors are caught
    try {
      const token = await Promise.resolve(this.getFCMToken()).catch(() => null);
      if (!token) {
        return false;
      }

      const platform = Platform.OS as 'android' | 'ios';
      // Save token in background - completely silent, all errors caught internally
      const result = await Promise.resolve(
        this.saveFCMTokenToBackend(token, platform)
      ).catch(() => false);
      
      return result || false;
    } catch (error: any) {
      // Completely swallow all errors - never throw
      return false;
    }
  }

  /**
   * Save FCM token when received from native code
   * This can be called from native modules or when token is available
   * @param deviceToken - FCM device token from native code
   * @param platform - Platform ('android' | 'ios'), defaults to current platform
   */
  async saveTokenFromNative(deviceToken: string, platform?: 'android' | 'ios'): Promise<boolean> {
    const platformToUse = platform || (Platform.OS as 'android' | 'ios');
    return await this.saveFCMTokenToBackend(deviceToken, platformToUse);
  }
}

const fcmService = new FCMService();
export default fcmService;
