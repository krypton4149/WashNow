# App Icon & Notification (Message) Icon

## App icon – where to update

### Android
- **Launcher icon**: Replace PNGs in:
  - `android/app/src/main/res/mipmap-mdpi/` (ic_launcher.png, ic_launcher_foreground.png, ic_launcher_round.png)
  - `android/app/src/main/res/mipmap-hdpi/`
  - `android/app/src/main/res/mipmap-xhdpi/`
  - `android/app/src/main/res/mipmap-xxhdpi/`
  - `android/app/src/main/res/mipmap-xxxhdpi/`
- **Foreground only (fix circle crop)**: Replace **ic_launcher_foreground.png** in each `mipmap-*` folder with a new image where the logo is **smaller and centered**, leaving **~20–25% empty space (padding) around the logo** so it doesn’t get cut by the circular mask.
- **Adaptive icon**: Update `ic_launcher_foreground.png` and optionally `drawable/ic_launcher_background.xml` in each density, or use Android Studio: **File → New → Image Asset** and choose Launcher Icons.

### iOS
- **App icon**: Replace all images in:
  - `ios/Cars/Images.xcassets/AppIcon.appiconset/`
- Use a 1024×1024 master and export required sizes, or use Xcode: select **AppIcon** in the asset catalog and drag in the new images.

---

## Notification / message icon (Firebase-style)

### Android (FCM notification icon)
- **Custom icon** is set and used for the status bar when a push notification arrives.
- **Location**: `android/app/src/main/res/drawable/ic_notification.xml`
- **Rules**: Use a **white** icon on **transparent** background (Android uses only the alpha channel for the small icon). The file is a vector drawable; you can replace it with another white silhouette (e.g. bell, message) by editing the `path` in `ic_notification.xml` or adding a new drawable and updating the manifest (see below).
- **Manifest**: In `android/app/src/main/AndroidManifest.xml`, the default notification icon is set with:
  ```xml
  <meta-data
      android:name="com.google.firebase.messaging.default_notification_icon"
      android:resource="@drawable/ic_notification" />
  ```
  To use a different drawable, create it in `res/drawable/` and change `android:resource` to that name (e.g. `@drawable/ic_notification_message`).
- **Accent color**: `res/values/colors.xml` defines `notification_color` (#0358a8); it is referenced as `com.google.firebase.messaging.default_notification_color` in the manifest. Change the color there if you want a different notification accent.

### iOS
- **Push notifications** use the **app icon** by default; there is no separate “notification icon” to set.
- **Messages app sticker icon** (if you use iMessage stickers): Replace images in:
  - `ios/Cars/Images.xcassets/Messages Icon.stickersiconset/`
  So the message icon matches your branding in the same way the Android notification icon does.

---

## Summary

| Platform | App icon | Notification / message icon |
|----------|----------|-----------------------------|
| **Android** | `res/mipmap-*/ic_launcher*.png` + `ic_launcher_foreground.png` | `res/drawable/ic_notification.xml` (white on transparent) + manifest meta-data |
| **iOS** | `ios/Cars/Images.xcassets/AppIcon.appiconset/` | Uses app icon; optional: `Messages Icon.stickersiconset/` for Messages |

After changing any of these, rebuild the app (Android: `npx react-native run-android`, iOS: rebuild in Xcode or `npx react-native run-ios`).
