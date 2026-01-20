import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseCore
import FirebaseMessaging
import UserNotifications

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Initialize Firebase only if GoogleService-Info.plist exists
    if let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
       FileManager.default.fileExists(atPath: path) {
      FirebaseApp.configure()
      print("═══════════════════════════════════════════════════════")
      print("🔥 Firebase initialized for iOS")
      print("═══════════════════════════════════════════════════════")
      
      // Set up Firebase Messaging
      Messaging.messaging().delegate = self
      
      // Request notification permissions
      UNUserNotificationCenter.current().delegate = self
      UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
        if let error = error {
          print("❌ Notification permission error: \(error.localizedDescription)")
        } else {
          print("✅ Notification permission granted: \(granted)")
        }
      }
      
      // Register for remote notifications
      application.registerForRemoteNotifications()
    } else {
      print("═══════════════════════════════════════════════════════")
      print("⚠️ GoogleService-Info.plist not found. Firebase initialization skipped.")
      print("═══════════════════════════════════════════════════════")
    }
    
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "Cars",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
  
  // Handle device token registration
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    // Only set APNS token if Firebase is configured
    if FirebaseApp.app() != nil {
      Messaging.messaging().apnsToken = deviceToken
    }
    let tokenString = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    print("═══════════════════════════════════════════════════════")
    print("📱 APNS Device Token: \(tokenString)")
    print("═══════════════════════════════════════════════════════")
  }
  
  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("❌ Failed to register for remote notifications: \(error.localizedDescription)")
  }
  
  // Firebase Messaging Delegate - Get FCM Token
  func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
    // Only process FCM token if Firebase is configured
    guard FirebaseApp.app() != nil else {
      return
    }
    
    guard let token = fcmToken else {
      print("❌ FCM Token is nil")
      return
    }
    
    print("═══════════════════════════════════════════════════════")
    print("═══════════════════════════════════════════════════════")
    print("🔥 FIREBASE DEVICE TOKEN RECEIVED (iOS) 🔥")
    print("═══════════════════════════════════════════════════════")
    print("TOKEN: \(token)")
    print("═══════════════════════════════════════════════════════")
    print("═══════════════════════════════════════════════════════")
    
    // Log to console
    NSLog("🔥 FIREBASE DEVICE TOKEN (iOS): %@", token)
    
    let body = [
      "token": token,
      "platform": "ios"
    ]
    
    // Uncomment the line below if you have an API service to save the token
    // api.saveDeviceToken(body)
  }
  
  // Handle foreground notifications
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    let userInfo = notification.request.content.userInfo
    print("═══════════════════════════════════════════════════════")
    print("📨 NOTIFICATION RECEIVED (FOREGROUND) 📨")
    print("Title: \(notification.request.content.title)")
    print("Body: \(notification.request.content.body)")
    print("UserInfo: \(userInfo)")
    print("═══════════════════════════════════════════════════════")
    
    // Show notification even when app is in foreground
    completionHandler([[.banner, .sound, .badge]])
  }
  
  // Handle notification tap
  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    let userInfo = response.notification.request.content.userInfo
    print("═══════════════════════════════════════════════════════")
    print("👆 NOTIFICATION TAPPED 👆")
    print("Title: \(response.notification.request.content.title)")
    print("Body: \(response.notification.request.content.body)")
    print("UserInfo: \(userInfo)")
    print("═══════════════════════════════════════════════════════")
    
    completionHandler()
  }
  
  // Handle background notifications
  func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    print("═══════════════════════════════════════════════════════")
    print("📨 BACKGROUND NOTIFICATION RECEIVED 📨")
    print("UserInfo: \(userInfo)")
    print("═══════════════════════════════════════════════════════")
    
    completionHandler(.newData)
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
