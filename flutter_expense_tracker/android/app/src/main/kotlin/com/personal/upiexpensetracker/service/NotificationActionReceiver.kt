package com.personal.upiexpensetracker.service

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import org.json.JSONArray

class NotificationActionReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_RECORD_CATEGORY = "com.personal.upiexpensetracker.ACTION_RECORD_CATEGORY"
        const val ACTION_DISMISS = "com.personal.upiexpensetracker.ACTION_DISMISS_NOTIFICATION"

        const val EXTRA_TRANSACTION_ID = "transaction_id"
        const val EXTRA_CATEGORY_ID = "category_id"
        const val EXTRA_NOTIFICATION_ID = "notification_id"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        val notificationId = intent.getIntExtra(EXTRA_NOTIFICATION_ID, -1)
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        when (action) {
            ACTION_RECORD_CATEGORY -> {
                val transactionId = intent.getStringExtra(EXTRA_TRANSACTION_ID) ?: ""
                val categoryId = intent.getStringExtra(EXTRA_CATEGORY_ID) ?: ""

                Log.d("NotificationAction", "Action received: Record expense $transactionId with category $categoryId")

                // 1. Directly update category in SharedPreferences
                try {
                    val prefs = context.getSharedPreferences(PaymentNotificationListenerService.PREFS_NAME, Context.MODE_PRIVATE)
                    val existingJson = prefs.getString(PaymentNotificationListenerService.KEY_EXPENSES, "[]") ?: "[]"
                    val jsonArray = JSONArray(existingJson)

                    for (i in 0 until jsonArray.length()) {
                        val obj = jsonArray.getJSONObject(i)
                        if (obj.optString("id", "") == transactionId) {
                            obj.put("categoryId", categoryId)
                            break
                        }
                    }

                    prefs.edit().putString(PaymentNotificationListenerService.KEY_EXPENSES, jsonArray.toString()).apply()
                    Log.d("NotificationAction", "Updated category for $transactionId to $categoryId in SharedPreferences")
                } catch (e: Exception) {
                    Log.e("NotificationAction", "Failed to update category in SharedPreferences", e)
                }

                // 2. Forward to Flutter via PaymentNotificationListenerService's eventSink if app is open
                PaymentNotificationListenerService.notificationEventSink?.invoke(
                    mapOf(
                        "actionType" to "category_selected",
                        "transactionId" to transactionId,
                        "categoryId" to categoryId,
                    )
                )

                // 3. Dismiss notification after category selection
                if (notificationId != -1) {
                    notificationManager.cancel(notificationId)
                }
            }
            ACTION_DISMISS -> {
                if (notificationId != -1) {
                    notificationManager.cancel(notificationId)
                }
            }
        }
    }
}
