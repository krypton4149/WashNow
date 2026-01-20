package com.cars

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onCreate() {
        super.onCreate()
        Log.d("FirebaseMsg", "🔥 MyFirebaseMessagingService created and ready!")
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("FirebaseToken", "═══════════════════════════════════════════════════════")
        Log.d("FirebaseToken", "🔄 FCM Token Refreshed")
        Log.d("FirebaseToken", "New Token: $token")
        Log.d("FirebaseToken", "═══════════════════════════════════════════════════════")
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        Log.d("FirebaseMsg", "═══════════════════════════════════════════════════════")
        Log.d("FirebaseMsg", "📨 MESSAGE RECEIVED FROM BACKEND 📨")
        Log.d("FirebaseMsg", "═══════════════════════════════════════════════════════")
        Log.d("FirebaseMsg", "Message ID: ${remoteMessage.messageId}")
        Log.d("FirebaseMsg", "From: ${remoteMessage.from}")
        Log.d("FirebaseMsg", "Message Type: ${remoteMessage.messageType}")
        
        var title = "New Message"
        var body = ""
        var messageType = ""
        
        // Check if message contains a notification payload
        remoteMessage.notification?.let { notification ->
            Log.d("FirebaseMsg", "📬 NOTIFICATION PAYLOAD DETECTED")
            Log.d("FirebaseMsg", "Notification Title: ${notification.title}")
            Log.d("FirebaseMsg", "Notification Body: ${notification.body}")
            Log.d("FirebaseMsg", "Notification Icon: ${notification.icon}")
            Log.d("FirebaseMsg", "Notification Sound: ${notification.sound}")
            
            title = notification.title ?: "New Message"
            body = notification.body ?: ""
        }
        
        // Check if message contains a data payload
        if (remoteMessage.data.isNotEmpty()) {
            Log.d("FirebaseMsg", "📦 DATA PAYLOAD DETECTED")
            Log.d("FirebaseMsg", "Data: ${remoteMessage.data}")
            
            // Override with data payload if present
            title = remoteMessage.data["Title"] ?: remoteMessage.data["title"] ?: title
            body = remoteMessage.data["Body"] ?: remoteMessage.data["body"] ?: remoteMessage.data["message"] ?: body
            messageType = remoteMessage.data["Type"] ?: remoteMessage.data["type"] ?: ""
            
            Log.d("FirebaseMsg", "Extracted Title: $title")
            Log.d("FirebaseMsg", "Extracted Body: $body")
            Log.d("FirebaseMsg", "Extracted Type: $messageType")
        }
        
        // Always show notification if we have a body
        if (body.isNotEmpty()) {
            Log.d("FirebaseMsg", "🚀 Sending notification...")
            sendNotification(title, body, messageType)
        } else {
            Log.w("FirebaseMsg", "⚠️ No body found, skipping notification")
        }
        
        Log.d("FirebaseMsg", "═══════════════════════════════════════════════════════")
    }

    private fun sendNotification(title: String, messageBody: String, type: String = "") {
        try {
            Log.d("FirebaseMsg", "Creating notification with title: $title, body: $messageBody")
            
            val intent = Intent(this, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
                putExtra("notification_title", title)
                putExtra("notification_body", messageBody)
                putExtra("notification_type", type)
            }
            
            val requestCode = System.currentTimeMillis().toInt()
            val pendingIntent = PendingIntent.getActivity(
                this, requestCode, intent,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )

            val channelId = getString(R.string.default_notification_channel_id)
            val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            
            // Use notification icon (white/transparent drawable required)
            var smallIcon = android.R.drawable.ic_dialog_info
            try {
                val drawableResId = resources.getIdentifier("ic_notification", "drawable", packageName)
                if (drawableResId != 0) {
                    smallIcon = drawableResId
                    Log.d("FirebaseMsg", "Using custom notification icon: $drawableResId")
                } else {
                    Log.w("FirebaseMsg", "Custom icon not found, using system icon")
                }
            } catch (e: Exception) {
                Log.w("FirebaseMsg", "Error loading icon: ${e.message}, using system icon")
            }
            
            val notificationBuilder = NotificationCompat.Builder(this, channelId)
                .setSmallIcon(smallIcon)
                .setContentTitle(title)
                .setContentText(messageBody)
                .setAutoCancel(true)
                .setSound(defaultSoundUri)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setDefaults(NotificationCompat.DEFAULT_ALL)
                .setStyle(NotificationCompat.BigTextStyle().bigText(messageBody))
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Since android Oreo notification channel is needed
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                // Check if channel already exists
                var channel = notificationManager.getNotificationChannel(channelId)
                if (channel == null) {
                    channel = NotificationChannel(
                        channelId,
                        "Firebase Cloud Messaging Channel",
                        NotificationManager.IMPORTANCE_HIGH
                    ).apply {
                        description = "Channel for Firebase Cloud Messaging"
                        enableVibration(true)
                        enableLights(true)
                        setShowBadge(true)
                        vibrationPattern = longArrayOf(0, 250, 250, 250)
                        setSound(defaultSoundUri, null)
                    }
                    notificationManager.createNotificationChannel(channel)
                    Log.d("FirebaseMsg", "✅ Notification channel created: $channelId")
                } else {
                    Log.d("FirebaseMsg", "✅ Notification channel already exists: $channelId")
                }
                
                // Verify channel importance
                val importance = channel.importance
                Log.d("FirebaseMsg", "Channel importance: $importance (HIGH=${NotificationManager.IMPORTANCE_HIGH})")
            }

            // Check if notifications are enabled
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                val areNotificationsEnabled = notificationManager.areNotificationsEnabled()
                Log.d("FirebaseMsg", "Notifications enabled: $areNotificationsEnabled")
                if (!areNotificationsEnabled) {
                    Log.w("FirebaseMsg", "⚠️ WARNING: Notifications are disabled for this app!")
                }
            }

            val notificationId = System.currentTimeMillis().toInt()
            val notification = notificationBuilder.build()
            
            Log.d("FirebaseMsg", "Posting notification with ID: $notificationId")
            notificationManager.notify(notificationId, notification)
            
            // Verify notification was posted
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val activeNotifications = notificationManager.activeNotifications
                val posted = activeNotifications.any { it.id == notificationId }
                Log.d("FirebaseMsg", "Notification posted successfully: $posted")
                Log.d("FirebaseMsg", "Active notifications count: ${activeNotifications.size}")
            }
            
            Log.d("FirebaseMsg", "✅ Notification sent successfully!")
            Log.d("FirebaseMsg", "   Title: $title")
            Log.d("FirebaseMsg", "   Body: $messageBody")
            Log.d("FirebaseMsg", "   Notification ID: $notificationId")
            Log.d("FirebaseMsg", "   Channel ID: $channelId")
            
            // Also log to System.out for console visibility
            System.out.println("═══════════════════════════════════════════════════════")
            System.out.println("✅ NOTIFICATION SENT")
            System.out.println("Title: $title")
            System.out.println("Body: $messageBody")
            System.out.println("═══════════════════════════════════════════════════════")
            
        } catch (e: Exception) {
            Log.e("FirebaseMsg", "❌ Error sending notification: ${e.message}")
            Log.e("FirebaseMsg", "Stack trace: ${e.stackTraceToString()}")
            e.printStackTrace()
        }
    }
}
