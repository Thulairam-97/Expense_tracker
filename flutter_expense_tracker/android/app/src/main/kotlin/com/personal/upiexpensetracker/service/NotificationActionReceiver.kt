package com.personal.upiexpensetracker.service

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

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

                // Update database or notify Flutter bridge
                val forwardIntent = Intent("com.personal.upiexpensetracker.CATEGORY_SELECTED").apply {
                    putExtra("transaction_id", transactionId)
                    putExtra("category_id", categoryId)
                    setPackage(context.packageName)
                }
                context.sendBroadcast(forwardIntent)

                // Dismiss notification after category selection
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
