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
        const val ACTION_ADD_DESCRIPTION = "com.personal.upiexpensetracker.ACTION_ADD_DESCRIPTION"
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

                updateExpenseInPrefs(context, transactionId, categoryId = categoryId, notes = null)

                PaymentNotificationListenerService.notificationEventSink?.invoke(
                    mapOf(
                        "actionType" to "category_selected",
                        "transactionId" to transactionId,
                        "categoryId" to categoryId,
                    )
                )

                if (notificationId != -1) {
                    notificationManager.cancel(notificationId)
                }
            }
            ACTION_ADD_CUSTOM_CATEGORY -> {
                val transactionId = intent.getStringExtra(EXTRA_TRANSACTION_ID) ?: ""
                val amount = intent.getDoubleExtra("amount", 0.0)
                val merchant = intent.getStringExtra("merchant") ?: "Merchant"
                val sourceName = intent.getStringExtra("sourceName") ?: "UPI"

                val remoteInputBundle = RemoteInput.getResultsFromIntent(intent)
                val rawInput = remoteInputBundle
                    ?.getCharSequence(PaymentNotificationListenerService.KEY_REMOTE_INPUT_CATEGORY)
                    ?.toString()
                    ?.trim() ?: ""

                if (rawInput.isNotEmpty()) {
                    // Support optional "Category : Description" or "Category - Description" shorthand
                    val parts = rawInput.split(Regex("\\s*[:\\-]\\s*"), limit = 2)
                    val rawCategoryName = parts[0].trim()
                    val inlineDesc = if (parts.size > 1) parts[1].trim() else null

                    val cleanName = rawCategoryName.replaceFirstChar { it.uppercase() }
                    val slug = cleanName.lowercase().replace(Regex("[^a-z0-9]+"), "_").trim('_')
                    val customCategoryId = "cat_custom_${if (slug.isNotEmpty()) slug else System.currentTimeMillis()}"

                    // 1. Save custom category in SharedPreferences
                    saveCustomCategoryInPrefs(context, customCategoryId, cleanName)

                    // 2. Update the expense with this new dynamic category (and optional inline description)
                    val hasDescriptionAlready = updateExpenseInPrefs(
                        context,
                        transactionId,
                        categoryId = customCategoryId,
                        notes = inlineDesc
                    ).second

                    // 3. Notify Flutter UI if foregrounded
                    PaymentNotificationListenerService.notificationEventSink?.invoke(
                        mapOf(
                            "actionType" to "custom_category_created",
                            "transactionId" to transactionId,
                            "categoryId" to customCategoryId,
                            "categoryName" to cleanName,
                            "description" to (inlineDesc ?: "")
                        )
                    )

                    // 4. If description is already set, dismiss notification; otherwise update notification so user can also tap 📝 Description
                    if (notificationId != -1) {
                        if (hasDescriptionAlready || !inlineDesc.isNullOrEmpty()) {
                            notificationManager.cancel(notificationId)
                        } else if (amount > 0) {
                            PaymentNotificationListenerService.showActionableCategoryNotification(
                                context = context,
                                amount = amount,
                                merchant = merchant,
                                transactionId = transactionId,
                                notificationId = notificationId,
                                sourceName = sourceName,
                                statusSubtitle = "✅ Category: $cleanName • Tap 📝 Description to add note, or ✓ Done",
                                showDoneButton = true
                            )
                        } else {
                            notificationManager.cancel(notificationId)
                        }
                    }
                } else if (notificationId != -1) {
                    notificationManager.cancel(notificationId)
                }
            }
            ACTION_ADD_DESCRIPTION -> {
                val transactionId = intent.getStringExtra(EXTRA_TRANSACTION_ID) ?: ""
                val amount = intent.getDoubleExtra("amount", 0.0)
                val merchant = intent.getStringExtra("merchant") ?: "Merchant"
                val sourceName = intent.getStringExtra("sourceName") ?: "UPI"

                val remoteInputBundle = RemoteInput.getResultsFromIntent(intent)
                val rawDescription = remoteInputBundle
                    ?.getCharSequence(PaymentNotificationListenerService.KEY_REMOTE_INPUT_DESCRIPTION)
                    ?.toString()
                    ?.trim() ?: ""

                if (rawDescription.isNotEmpty()) {
                    val (hasCustomCatAlready, _) = updateExpenseInPrefs(
                        context,
                        transactionId,
                        categoryId = null,
                        notes = rawDescription
                    )

                    PaymentNotificationListenerService.notificationEventSink?.invoke(
                        mapOf(
                            "actionType" to "description_updated",
                            "transactionId" to transactionId,
                            "description" to rawDescription
                        )
                    )

                    if (notificationId != -1) {
                        if (hasCustomCatAlready) {
                            notificationManager.cancel(notificationId)
                        } else if (amount > 0) {
                            PaymentNotificationListenerService.showActionableCategoryNotification(
                                context = context,
                                amount = amount,
                                merchant = merchant,
                                transactionId = transactionId,
                                notificationId = notificationId,
                                sourceName = sourceName,
                                statusSubtitle = "✅ Note: \"$rawDescription\" • Tap ➕ Category or ✓ Done",
                                showDoneButton = true
                            )
                        } else {
                            notificationManager.cancel(notificationId)
                        }
                    }
                } else if (notificationId != -1) {
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

    /**
     * Updates categoryId and/or notes (description) for the transaction in SharedPreferences.
     * Returns Pair(hasNonDefaultCategory, hasNonEmptyNotes) after update.
     */
    private fun updateExpenseInPrefs(
        context: Context,
        transactionId: String,
        categoryId: String?,
        notes: String?
    ): Pair<Boolean, Boolean> {
        var hasCategory = false
        var hasNotes = false
        try {
            val prefs = context.getSharedPreferences(PaymentNotificationListenerService.PREFS_NAME, Context.MODE_PRIVATE)
            val existingJson = prefs.getString(PaymentNotificationListenerService.KEY_EXPENSES, "[]") ?: "[]"
            val jsonArray = JSONArray(existingJson)

            var targetObj: JSONObject? = null
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                if (obj.optString("id", "") == transactionId) {
                    targetObj = obj
                    break
                }
            }

            if (targetObj == null && jsonArray.length() > 0) {
                targetObj = jsonArray.getJSONObject(0)
            }

            if (targetObj != null) {
                if (!categoryId.isNullOrEmpty()) {
                    targetObj.put("categoryId", categoryId)
                }
                if (!notes.isNullOrEmpty()) {
                    targetObj.put("notes", notes)
                }
                val currentCat = targetObj.optString("categoryId", "cat_other")
                val currentNotes = targetObj.optString("notes", "")
                hasCategory = currentCat.isNotEmpty() && currentCat != "cat_other"
                hasNotes = currentNotes.isNotEmpty() && !currentNotes.startsWith("Auto-recorded")
            }

            prefs.edit().putString(PaymentNotificationListenerService.KEY_EXPENSES, jsonArray.toString()).apply()
        } catch (e: Exception) {
            Log.e("NotificationAction", "Failed to update expense in SharedPreferences", e)
        }
        return Pair(hasCategory, hasNotes)
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

            // Use 64-bit positive ARGB Longs so Dart Color(int) parses them identically
            val palette = listOf(
                0xFF0D9488L, // Teal
                0xFF7C3AEDL, // Violet
                0xFFDB2777L, // Pink
                0xFF2563EBL, // Blue
                0xFFD97706L, // Amber
                0xFF059669L  // Emerald
            )
            val chosenColor = palette[(categoryName.hashCode() and 0x7FFFFFFF) % palette.size]

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
