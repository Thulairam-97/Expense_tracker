package com.personal.upiexpensetracker.service

import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.app.RemoteInput
import org.json.JSONArray
import org.json.JSONObject

class NotificationActionReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_RECORD_CATEGORY = "com.personal.upiexpensetracker.ACTION_RECORD_CATEGORY"
        const val ACTION_ADD_CUSTOM_CATEGORY = "com.personal.upiexpensetracker.ACTION_ADD_CUSTOM_CATEGORY"
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

                updateExpenseCategoryInPrefs(context, transactionId, categoryId)

                // Forward to Flutter via PaymentNotificationListenerService's eventSink if app is open
                PaymentNotificationListenerService.notificationEventSink?.invoke(
                    mapOf(
                        "actionType" to "category_selected",
                        "transactionId" to transactionId,
                        "categoryId" to categoryId,
                    )
                )

                // Dismiss notification after category selection
                if (notificationId != -1) {
                    notificationManager.cancel(notificationId)
                }
            }
            ACTION_ADD_CUSTOM_CATEGORY -> {
                val transactionId = intent.getStringExtra(EXTRA_TRANSACTION_ID) ?: ""
                val remoteInputBundle = RemoteInput.getResultsFromIntent(intent)
                val rawCategoryName = remoteInputBundle
                    ?.getCharSequence(PaymentNotificationListenerService.KEY_REMOTE_INPUT_CATEGORY)
                    ?.toString()
                    ?.trim() ?: ""

                if (rawCategoryName.isNotEmpty()) {
                    val cleanName = rawCategoryName.replaceFirstChar { it.uppercase() }
                    val slug = cleanName.lowercase().replace(Regex("[^a-z0-9]+"), "_").trim('_')
                    val customCategoryId = "cat_custom_${if (slug.isNotEmpty()) slug else System.currentTimeMillis()}"

                    // 1. Save custom category in SharedPreferences if not already present
                    saveCustomCategoryInPrefs(context, customCategoryId, cleanName)

                    // 2. Update the expense with this new dynamic category
                    updateExpenseCategoryInPrefs(context, transactionId, customCategoryId)

                    // 3. Notify Flutter UI if foregrounded
                    PaymentNotificationListenerService.notificationEventSink?.invoke(
                        mapOf(
                            "actionType" to "custom_category_created",
                            "transactionId" to transactionId,
                            "categoryId" to customCategoryId,
                            "categoryName" to cleanName
                        )
                    )
                    Log.d("NotificationAction", "Created custom category '$cleanName' ($customCategoryId) for $transactionId")
                }

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

    private fun updateExpenseCategoryInPrefs(context: Context, transactionId: String, categoryId: String) {
        try {
            val prefs = context.getSharedPreferences(PaymentNotificationListenerService.PREFS_NAME, Context.MODE_PRIVATE)
            val existingJson = prefs.getString(PaymentNotificationListenerService.KEY_EXPENSES, "[]") ?: "[]"
            val jsonArray = JSONArray(existingJson)

            var matched = false
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                if (obj.optString("id", "") == transactionId) {
                    obj.put("categoryId", categoryId)
                    matched = true
                    break
                }
            }

            // Fallback: if transactionId was from simulator/pending, update the most recent expense
            if (!matched && jsonArray.length() > 0) {
                jsonArray.getJSONObject(0).put("categoryId", categoryId)
            }

            prefs.edit().putString(PaymentNotificationListenerService.KEY_EXPENSES, jsonArray.toString()).apply()
        } catch (e: Exception) {
            Log.e("NotificationAction", "Failed to update category in SharedPreferences", e)
        }
    }

    private fun saveCustomCategoryInPrefs(context: Context, categoryId: String, categoryName: String) {
        try {
            val prefs = context.getSharedPreferences(PaymentNotificationListenerService.PREFS_NAME, Context.MODE_PRIVATE)
            val existingJson = prefs.getString(PaymentNotificationListenerService.KEY_CUSTOM_CATEGORIES, "[]") ?: "[]"
            val jsonArray = JSONArray(existingJson)

            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                if (obj.optString("id", "") == categoryId ||
                    obj.optString("name", "").equals(categoryName, ignoreCase = true)) {
                    return // Already exists
                }
            }

            val palette = listOf(
                0xFF0D9488.toInt(), // Teal
                0xFF7C3AED.toInt(), // Violet
                0xFFDB2777.toInt(), // Pink
                0xFF2563EB.toInt(), // Blue
                0xFFD97706.toInt(), // Amber
                0xFF059669.toInt()  // Emerald
            )
            val chosenColor = palette[Math.abs(categoryName.hashCode()) % palette.size]

            val newCat = JSONObject().apply {
                put("id", categoryId)
                put("name", categoryName)
                put("iconName", "label")
                put("colorValue", chosenColor)
                put("isDefault", 0)
                put("displayOrder", 20 + jsonArray.length())
            }

            jsonArray.put(newCat)
            prefs.edit().putString(PaymentNotificationListenerService.KEY_CUSTOM_CATEGORIES, jsonArray.toString()).apply()
        } catch (e: Exception) {
            Log.e("NotificationAction", "Failed to save custom category in SharedPreferences", e)
        }
    }
}
