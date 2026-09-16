package com.personal.upiexpensetracker.service

import android.app.Notification
import android.content.Intent
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.personal.upiexpensetracker.MainActivity
import org.json.JSONObject

class PaymentNotificationListenerService : NotificationListenerService() {

    companion object {
        private const val TAG = "PaymentNotificationSvc"

        // Known UPI and banking package identifiers
        val SUPPORTED_PACKAGES = setOf(
            "com.google.android.apps.nbu.paisa.user", // Google Pay (Tez)
            "com.phonepe.app",                        // PhonePe
            "net.one97.paytm",                        // Paytm
            "in.org.npci.upiapp",                     // BHIM
            "com.dreamplug.androidapp",               // CRED
            "in.amazon.mShop.android.shopping",       // Amazon Pay
            "com.sbi.upi",                            // SBI Pay / Yono Lite
            "com.hdfcbank.payzapp",                   // HDFC PayZapp
            "com.icicibank.pockets",                  // ICICI Pockets
            "com.axis.mobile"                         // Axis Mobile
        )

        // Callback channel instance when Flutter engine is alive in foreground
        var notificationEventSink: ((Map<String, Any?>) -> Unit)? = null
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.i(TAG, "NotificationListenerService connected and active")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.w(TAG, "NotificationListenerService disconnected")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val packageName = sbn.packageName ?: return

        // 1. Filter: Process ONLY supported UPI and banking payment applications
        val isSupportedApp = SUPPORTED_PACKAGES.contains(packageName) || 
                             packageName.contains("upi", ignoreCase = true) ||
                             packageName.contains("pay", ignoreCase = true) ||
                             packageName.contains("bank", ignoreCase = true)

        if (!isSupportedApp) {
            return
        }

        val notification = sbn.notification ?: return
        val extras: Bundle = notification.extras ?: return

        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""
        val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString() ?: ""

        val postTime = sbn.postTime
        val notificationId = sbn.id

        // Compile extracted notification payload
        val payload = mapOf(
            "id" to notificationId,
            "packageName" to packageName,
            "title" to title,
            "text" to text,
            "bigText" to bigText,
            "subText" to subText,
            "timestamp" to postTime,
            "combinedText" to "$title $text $bigText $subText".trim()
        )

        Log.d(TAG, "Captured payment candidate notification from $packageName: title='$title', text='$text'")

        // Forward to Flutter via EventChannel or broadcast
        if (notificationEventSink != null) {
            notificationEventSink?.invoke(payload)
        } else {
            // If Flutter UI is not foregrounded, trigger headless background processor or broadcast receiver
            val intent = Intent("com.personal.upiexpensetracker.PAYMENT_NOTIFICATION_RECEIVED").apply {
                putExtra("payload_json", JSONObject(payload).toString())
                setPackage(applicationContext.packageName)
            }
            sendBroadcast(intent)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        super.onNotificationRemoved(sbn)
    }
}
