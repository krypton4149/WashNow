import Foundation
import React

private let kFCMTokenUserDefaultsKey = "FCMToken"
private let kFCMTokenNotificationName = Notification.Name("FCMTokenReceived")

@objc(FCMTokenModule)
class FCMTokenModule: RCTEventEmitter {

  private static var sharedInstance: FCMTokenModule?

  override init() {
    super.init()
    FCMTokenModule.sharedInstance = self
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleFCMTokenReceived(_:)),
      name: kFCMTokenNotificationName,
      object: nil
    )
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
    FCMTokenModule.sharedInstance = nil
  }

  @objc
  static func sendTokenToJS(_ token: String) {
    guard !token.isEmpty else { return }
    UserDefaults.standard.set(token, forKey: kFCMTokenUserDefaultsKey)
    NotificationCenter.default.post(name: kFCMTokenNotificationName, object: nil, userInfo: ["token": token])
  }

  @objc
  private func handleFCMTokenReceived(_ notification: Notification) {
    guard let token = notification.userInfo?["token"] as? String, !token.isEmpty else { return }
    sendEvent(withName: "FCMTokenReceived", body: ["token": token])
  }

  override func supportedEvents() -> [String]! {
    return ["FCMTokenReceived"]
  }

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func startObserving() {
    if let token = UserDefaults.standard.string(forKey: kFCMTokenUserDefaultsKey), !token.isEmpty {
      sendEvent(withName: "FCMTokenReceived", body: ["token": token])
    }
  }

  override func stopObserving() {}
}
