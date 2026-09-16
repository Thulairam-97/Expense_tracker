package com.personal.upiexpensetracker

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.annotation.NonNull
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.personal.upiexpensetracker.service.NotificationActionReceiver
import com.personal.upiexpensetracker.service.PaymentNotificationListenerService
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

    private val METHOD_CHANNEL = "com.personal.upiexpensetracker/notification_control"
    private val EVENT_CHANNEL = "com.personal.upiexpensetracker/notification_stream"
    private val CHANNEL_ID = "upi_expense_actions_channel"

    private var eventSink: EventChannel.EventSink? = null

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        createNotificationChannel()

        // 1. MethodChannel for permission check, settings launch, and actionable notification trigger
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, METHOD_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "isNotificationPermissionGranted" -> {
                    val isGranted = isNotificationAccessGranted()
                    result.success(isGranted)
                }
                "openNotificationSettings" -> {
                    openNotificationListenerSettings()
                    result.success(true)
                }
                "showActionableCategoryNotification" -> {
                    val amount = call.argument<Double>("amount") ?: 0.0
                    val merchant = call.argument<String>("merchant") ?: "Merchant"
                    val transactionId = call.argument<String>("transactionId") ?: ""
                    val notificationId = call.argument<Int>("notificationId") ?: 1001

                    showCategoryPickerNotification(amount, merchant, transactionId, notificationId)
                    result.success(true)
                }
                else -> {
                    result.notImplemented()
                }
            }
        }

        // 2. EventChannel for streaming notifications to Flutter Dart
        EventChannel(flutterEngine.dartExecutor.binaryMessenger, EVENT_CHANNEL).setStreamHandler(
            object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    eventSink = events
                    PaymentNotificationListenerService.notificationEventSink = { payload ->
                        runOnUiThread {
                            eventSink?.success(payload)
                        }
                    }
                }

                override fun onCancel(arguments: Any?) {
                    eventSink = null
                    PaymentNotificationListenerService.notificationEventSink = null
                }
            }
        )
    }

    private fun isNotificationAccessGranted(): Boolean {
        val packageName = packageName
        val flat = Settings.Secure.getString(contentResolver, "enabled_notification_listeners")
        return flat != null && flat.contains(packageName)
    }

    private fun openNotificationListenerSettings() {
        try {
            val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
                Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            } else {
                Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS")
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
        } catch (e: Exception) {
            val intent = Intent(Settings.ACTION_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "UPI Expense Categorization"
            val descriptionText = "Actionable notifications to quick-categorize UPI payments"
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
                enableVibration(true)
            }
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun showCategoryPickerNotification(
        amount: Double,
        merchant: String,
        transactionId: String,
        notificationId: Int
    ) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Intent to open App when tapping the notification body
        val contentIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("transaction_id", transactionId)
        }
        val contentPendingIntent = PendingIntent.getActivity(
            this,
            notificationId,
            contentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Helper to build Action PendingIntents for Category Buttons
        fun createCategoryActionPendingIntent(catId: String): PendingIntent {
            val intent = Intent(this, NotificationActionReceiver::class.java).apply {
                action = NotificationActionReceiver.ACTION_RECORD_CATEGORY
                putExtra(NotificationActionReceiver.EXTRA_TRANSACTION_ID, transactionId)
                putExtra(NotificationActionReceiver.EXTRA_CATEGORY_ID, catId)
                putExtra(NotificationActionReceiver.EXTRA_NOTIFICATION_ID, notificationId)
            }
            return PendingIntent.getBroadcast(
                this,
                (transactionId + catId).hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_agenda)
            .setContentTitle("₹${amount.toInt()} paid to $merchant")
            .setContentText("Tap a category to quickly record this expense:")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(contentPendingIntent)
            // Action 1: Food
            .addAction(
                android.R.drawable.ic_menu_compass,
                "🍔 Food",
                createCategoryActionPendingIntent("cat_food")
            )
            // Action 2: Grocery
            .addAction(
                android.R.drawable.ic_menu_add,
                "🛒 Grocery",
                createCategoryActionPendingIntent("cat_groceries")
            )
            // Action 3: Fuel
            .addAction(
                android.R.drawable.ic_menu_directions,
                "⛽ Fuel",
                createCategoryActionPendingIntent("cat_fuel")
            )

        notificationManager.notify(notificationId, builder.build())
    }
}
