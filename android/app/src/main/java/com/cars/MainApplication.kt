package com.cars

import android.app.Application
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.google.firebase.messaging.FirebaseMessaging

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    
    // Get Firebase device token and log to console and logcat
    FirebaseMessaging.getInstance().token.addOnSuccessListener { token: String ->
      // Log to Android Logcat (visible in adb logcat and Android Studio)
      Log.v("FirebaseToken", "═══════════════════════════════════════════════════════")
      Log.v("FirebaseToken", "═══════════════════════════════════════════════════════")
      Log.i("FirebaseToken", "🔥 FIREBASE DEVICE TOKEN RECEIVED 🔥")
      Log.v("FirebaseToken", "═══════════════════════════════════════════════════════")
      Log.w("FirebaseToken", "TOKEN: $token")
      Log.v("FirebaseToken", "═══════════════════════════════════════════════════════")
      Log.v("FirebaseToken", "═══════════════════════════════════════════════════════")
      
      // Also print to System.out (sometimes visible in console)
      System.out.println("═══════════════════════════════════════════════════════")
      System.out.println("🔥 FIREBASE DEVICE TOKEN 🔥")
      System.out.println("═══════════════════════════════════════════════════════")
      System.out.println("TOKEN: $token")
      System.out.println("═══════════════════════════════════════════════════════")
      
      // Log with different levels for better visibility
      Log.d("FirebaseToken", "Device Token (DEBUG): $token")
      Log.i("FirebaseToken", "Device Token (INFO): $token")
      Log.w("FirebaseToken", "Device Token (WARN): $token")
      
      val body = mapOf(
        "token" to token,
        "platform" to "android"
      )
      
      // Uncomment the line below if you have an API service to save the token
      // api.saveDeviceToken(body)
    }.addOnFailureListener { exception: Exception ->
      val errorMsg = exception.localizedMessage ?: exception.toString()
      Log.e("FirebaseToken", "═══════════════════════════════════════════════════════")
      Log.e("FirebaseToken", "❌ ERROR GETTING FIREBASE TOKEN ❌")
      Log.e("FirebaseToken", "Error: $errorMsg")
      Log.e("FirebaseToken", "")
      Log.e("FirebaseToken", "📋 TO FIX THIS:")
      Log.e("FirebaseToken", "1. Go to https://console.firebase.google.com")
      Log.e("FirebaseToken", "2. Create/Select a Firebase project")
      Log.e("FirebaseToken", "3. Add Android app with package: com.cars")
      Log.e("FirebaseToken", "4. Download google-services.json")
      Log.e("FirebaseToken", "5. Replace android/app/google-services.json")
      Log.e("FirebaseToken", "6. Rebuild the app")
      Log.e("FirebaseToken", "═══════════════════════════════════════════════════════")
      System.out.println("═══════════════════════════════════════════════════════")
      System.out.println("❌ ERROR GETTING FIREBASE TOKEN ❌")
      System.out.println("Error: $errorMsg")
      System.out.println("")
      System.out.println("📋 TO FIX: Replace android/app/google-services.json with your real Firebase config")
      System.out.println("═══════════════════════════════════════════════════════")
    }
  }
}
