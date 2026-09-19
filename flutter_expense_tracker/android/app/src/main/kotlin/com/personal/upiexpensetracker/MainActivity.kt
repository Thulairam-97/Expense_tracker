package com.personal.upiexpensetracker

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.annotation.NonNull
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.personal.upiexpensetracker.service.PaymentNotificationListenerService
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

    private val METHOD_CHANNEL = "com.personal.upiexpensetracker/notification_control"
    private val EVENT_CHANNEL = "com.personal.upiexpensetracker/notification_stream"
    private val NOTIFICATION_PERMISSION_REQ_CODE = 101

    private var eventSink: EventChannel.EventSink? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        checkAndRequestPostNotificationPermission()
    }

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        try {
            // 1. MethodChannel for permission check, settings launch, and actionable notification trigger
            MethodChannel(flutterEngine.dartExecutor.binaryMessenger, METHOD_CHANNEL).setMethodCallHandler { call, result ->
                when (call.method) {
                    "isNotificationPermissionGranted" -> {
                        val isGranted = isNotificationAccessGranted()
                        result.success(isGranted)
                    }
                    "isPostNotificationGranted" -> {
                        val isGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
                        } else {
                            true
                        }
                        result.success(isGranted)
                    }
                    "requestPostNotificationPermission" -> {
                        checkAndRequestPostNotificationPermission()
                        result.success(true)
                    }
                    "openNotificationSettings" -> {
                        openNotificationListenerSettings()
                        result.success(true)
                    }
                    "openAppSettings" -> {
                        openAppDetailsSettings()
                        result.success(true)
                    }
                    "simulatePaymentNotification" -> {
                        val amount = call.argument<Double>("amount") ?: 1.0
                        val merchant = call.argument<String>("merchant") ?: "Rahul"
                        val source = call.argument<String>("source") ?: "phonepe"
                        val rawText = call.argument<String>("rawText") ?: "Paid ₹$amount to $merchant"

                        val success = PaymentNotificationListenerService.processPaymentPayload(
                            context = applicationContext,
                            packageName = "com.phonepe.app",
                            title = "PhonePe",
                            text = rawText,
                            bigText = rawText,
                            subText = "UPI Payment Successful",
                            postTime = System.currentTimeMillis()
                        )
                        result.success(success)
                    }
                    "showActionableCategoryNotification" -> {
                        val amount = call.argument<Double>("amount") ?: 0.0
                        val merchant = call.argument<String>("merchant") ?: "Merchant"
                        val transactionId = call.argument<String>("transactionId") ?: ""
                        val notificationId = call.argument<Int>("notificationId") ?: 1001

                        PaymentNotificationListenerService.showActionableCategoryNotification(
                            context = applicationContext,
                            amount = amount,
                            merchant = merchant,
                            transactionId = transactionId,
                            notificationId = notificationId,
                            sourceName = "UPI"
                        )
                        result.success(true)
                    }
                    "saveLocalData" -> {
                        val key = call.argument<String>("key") ?: ""
                        val value = call.argument<String>("value") ?: ""
                        val prefs = getSharedPreferences(PaymentNotificationListenerService.PREFS_NAME, Context.MODE_PRIVATE)
                        prefs.edit().putString(key, value).apply()
                        result.success(true)
                    }
                    "getLocalData" -> {
                        val key = call.argument<String>("key") ?: ""
                        val prefs = getSharedPreferences(PaymentNotificationListenerService.PREFS_NAME, Context.MODE_PRIVATE)
                        val value = prefs.getString(key, null)
                        result.success(value)
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
        } catch (e: Exception) {
            // Prevent fatal startup crash if channel registration has an exception
        }
    }

    private fun checkAndRequestPostNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                    NOTIFICATION_PERMISSION_REQ_CODE
                )
            }
        }
    }

    private fun isNotificationAccessGranted(): Boolean {
        return try {
            val enabledPackages = NotificationManagerCompat.getEnabledListenerPackages(this)
            if (enabledPackages.contains(packageName) ||
                enabledPackages.contains("com.personal.upiexpensetracker") ||
                enabledPackages.contains("com.personal.upi_expense_tracker")) {
                return true
            }
            val flat = Settings.Secure.getString(contentResolver, "enabled_notification_listeners")
            flat != null && (flat.contains(packageName) ||
                             flat.contains("com.personal.upiexpensetracker") ||
                             flat.contains("com.personal.upi_expense_tracker"))
        } catch (e: Exception) {
            false
        }
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

    private fun openAppDetailsSettings() {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", packageName, null)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
        } catch (e: Exception) {
            openNotificationListenerSettings()
        }
    }
}
