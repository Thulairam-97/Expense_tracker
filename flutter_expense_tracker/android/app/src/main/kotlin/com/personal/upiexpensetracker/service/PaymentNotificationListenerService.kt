package com.personal.upiexpensetracker.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import androidx.core.app.NotificationCompat
import com.personal.upiexpensetracker.MainActivity
import org.json.JSONArray
import org.json.JSONObject
import java.util.regex.Pattern

class PaymentNotificationListenerService : NotificationListenerService() {

    companion object {
        private const val TAG = "PaymentNotificationSvc"
        const val CHANNEL_ID = "upi_expense_actions_channel"
        const val PREFS_NAME = "upi_tracker_local_prefs"
        const val KEY_EXPENSES = "persisted_user_expenses_v1"

        // Known UPI and banking package identifiers
        val SUPPORTED_UPI_PACKAGES = setOf(
            "com.google.android.apps.nbu.paisa.user", // Google Pay (Tez)
            "com.phonepe.app",                        // PhonePe
            "net.one97.paytm",                        // Paytm
            "in.org.npci.upiapp",                     // BHIM
            "com.dreamplug.androidapp",               // CRED
            "in.amazon.mShop.android.shopping",       // Amazon Pay
            "com.sbi.upi",                            // SBI Pay / Yono Lite
            "com.hdfcbank.payzapp",                   // HDFC PayZapp
            "com.icicibank.pockets",                  // ICICI Pockets
            "com.axis.mobile",                        // Axis Mobile
            "com.msf.kopl",                           // Kotak Bank
            "com.bankofbaroda.mconnect"               // BOB World
        )

        // Known SMS applications that deliver Bank Transaction alerts
        val SMS_PACKAGES = setOf(
            "com.google.android.apps.messaging",      // Google Messages
            "com.samsung.android.messaging",          // Samsung Messages
            "com.android.mms",                        // AOSP MMS
            "com.android.messaging",                  // Stock Android SMS
            "com.truecaller",                         // Truecaller
            "com.xiaomi.channel"                      // Mi Messaging
        )

        // Callback channel instance when Flutter engine is alive in foreground
        var notificationEventSink: ((Map<String, Any?>) -> Unit)? = null

        /**
         * Global processor for an incoming notification payload (used by live service and test simulator)
         */
        fun processPaymentPayload(
            context: Context,
            packageName: String,
            title: String,
            text: String,
            bigText: String,
            subText: String,
            postTime: Long
        ): Boolean {
            val combinedText = "$title $text $bigText $subText".trim()
            val lowerText = combinedText.lowercase()

            // 1. Filter: Reject non-payment / money received alerts
            if (lowerText.contains("received") || 
                lowerText.contains("credited") || 
                lowerText.contains("deposited") ||
                lowerText.contains("cashback received") ||
                lowerText.contains("refund received") ||
                lowerText.contains("salary")) {
                Log.d(TAG, "Ignored credit/income notification: $combinedText")
                return false
            }

            // Reject failed or declined transactions
            if (lowerText.contains("failed") || 
                lowerText.contains("declined") || 
                lowerText.contains("insufficient balance") ||
                lowerText.contains("unable to process")) {
                Log.d(TAG, "Ignored failed transaction notification: $combinedText")
                return false
            }

            // 2. Filter: Must contain payment/debit intent
            val hasPaymentKeywords = lowerText.contains("paid") ||
                    lowerText.contains("debited") ||
                    lowerText.contains("sent") ||
                    lowerText.contains("transfer") ||
                    lowerText.contains("transferred") ||
                    lowerText.contains("spent") ||
                    lowerText.contains("payment") ||
                    lowerText.contains("vpa") ||
                    lowerText.contains("upi")

            if (!hasPaymentKeywords) {
                Log.d(TAG, "No payment keywords found: $combinedText")
                return false
            }

            // 3. Extract Amount
            val amount = extractAmount(combinedText) ?: return false

            // 4. Extract Merchant / Recipient
            val merchant = extractMerchant(combinedText, packageName)

            // 5. Extract Reference ID / UTR
            val referenceId = extractReferenceId(combinedText)

            // 6. Detect Payment Source
            val paymentSource = determinePaymentSource(packageName, combinedText)

            val transactionId = "exp_${System.currentTimeMillis()}"

            // 7. Auto-persist directly to SharedPreferences (Zero-touch local storage)
            val isSaved = saveExpenseToLocalPrefs(
                context = context,
                id = transactionId,
                amount = amount,
                merchant = merchant,
                categoryId = "cat_other", // Default category, user can change via notification
                timestamp = postTime,
                paymentSource = paymentSource,
                referenceId = referenceId,
                rawText = combinedText
            )

            // 8. Trigger Actionable Android Notification with Category Buttons
            val notifId = (System.currentTimeMillis() % 100000).toInt()
            showActionableCategoryNotification(
                context = context,
                amount = amount,
                merchant = merchant,
                transactionId = transactionId,
                notificationId = notifId,
                sourceName = paymentSource.replaceFirstChar { it.uppercase() }
            )

            // 9. Notify Flutter UI if foregrounded
            notificationEventSink?.invoke(
                mapOf(
                    "actionType" to "expense_recorded",
                    "id" to transactionId,
                    "amount" to amount,
                    "merchant" to merchant,
                    "categoryId" to "cat_other",
                    "timestamp" to postTime,
                    "paymentSource" to paymentSource,
                    "referenceId" to referenceId,
                    "rawText" to combinedText
                )
            )

            Log.i(TAG, "Successfully captured and auto-recorded expense: ₹$amount to $merchant ($paymentSource)")
            return true
        }

        private fun extractAmount(text: String): Double? {
            // Case 1: ₹ / Rs. / INR followed by amount (e.g. ₹1, Rs. 450, INR 1.00)
            val prefixRegex = Pattern.compile(
                "(?:₹|rs\\.?|inr)\\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\\.[0-9]{1,2})?|[0-9]+(?:\\.[0-9]{1,2})?)",
                Pattern.CASE_INSENSITIVE
            )
            val prefixMatcher = prefixRegex.matcher(text)
            if (prefixMatcher.find()) {
                val cleanStr = prefixMatcher.group(1)?.replace(",", "")
                val parsed = cleanStr?.toDoubleOrNull()
                if (parsed != null && parsed > 0) return parsed
            }

            // Case 2: Amount followed by currency symbol / code (e.g. 1.00 INR, 50 Rs)
            val suffixRegex = Pattern.compile(
                "([0-9]{1,3}(?:,[0-9]{2,3})*(?:\\.[0-9]{1,2})?|[0-9]+(?:\\.[0-9]{1,2})?)\\s*(?:₹|rs\\.?|inr)",
                Pattern.CASE_INSENSITIVE
            )
            val suffixMatcher = suffixRegex.matcher(text)
            if (suffixMatcher.find()) {
                val cleanStr = suffixMatcher.group(1)?.replace(",", "")
                val parsed = cleanStr?.toDoubleOrNull()
                if (parsed != null && parsed > 0) return parsed
            }

            // Case 3: "debited by/for" or "paid" followed by numeric value
            val debitRegex = Pattern.compile(
                "(?:debited\\s*(?:by|for|with)?|paid|sent)\\s*(?:₹|rs\\.?|inr)?\\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\\.[0-9]{1,2})?|[0-9]+(?:\\.[0-9]{1,2})?)",
                Pattern.CASE_INSENSITIVE
            )
            val debitMatcher = debitRegex.matcher(text)
            if (debitMatcher.find()) {
                val cleanStr = debitMatcher.group(1)?.replace(",", "")
                val parsed = cleanStr?.toDoubleOrNull()
                if (parsed != null && parsed > 0) return parsed
            }

            return null
        }

        private fun extractMerchant(text: String, packageName: String): String {
            val merchantPatterns = listOf(
                Pattern.compile("(?:payment of|paid|sent|transferred)\\s+(?:₹|rs\\.?|inr)?\\s*[0-9\\.,]+\\s+to\\s+([^,\\.\n\r]+?)(?:\\s+was\\s+successful|\\s+is\\s+successful|\\.|\\,|$)", Pattern.CASE_INSENSITIVE),
                Pattern.compile("(?:₹|rs\\.?|inr)?\\s*[0-9\\.,]+\\s+(?:sent|paid|transferred)\\s+to\\s+([^,\\.\n\r]+?)(?:\\s+was\\s+successful|\\s+is\\s+successful|\\.|\\,|$)", Pattern.CASE_INSENSITIVE),
                Pattern.compile("(?:paid to|sent to|transferred to)\\s+([^,\\.\n\r]+?)(?:\\s+was|\\s+is|\\.|\\,|$)", Pattern.CASE_INSENSITIVE),
                Pattern.compile("to\\s+([^,\\.\n\r]+?)\\s+(?:was\\s+successful|is\\s+successful|successful)", Pattern.CASE_INSENSITIVE),
                Pattern.compile("(?:money sent to)\\s+([^,\\.\n\r]+)", Pattern.CASE_INSENSITIVE),
                Pattern.compile("(?:at|towards)\\s+([^,\\.\n\r]+?)(?:\\s+on|\\s+ref|\\s+via|\\s+using|\\.|\\,|$)", Pattern.CASE_INSENSITIVE),
                Pattern.compile("(?:vpa|upi id)\\s*[:]?\\s*([a-zA-Z0-9\\.\\_\\-]+@[a-zA-Z0-9]+)", Pattern.CASE_INSENSITIVE)
            )

            for (pattern in merchantPatterns) {
                val matcher = pattern.matcher(text)
                if (matcher.find()) {
                    val rawName = matcher.group(1) ?: continue
                    val cleaned = cleanMerchantName(rawName)
                    if (cleaned.isNotEmpty() && !cleaned.equals("account", ignoreCase = true) && !cleaned.equals("bank", ignoreCase = true)) {
                        return cleaned
                    }
                }
            }

            if (packageName.contains("phonepe", ignoreCase = true)) return "PhonePe Recipient"
            if (packageName.contains("nbu.paisa", ignoreCase = true)) return "Google Pay Merchant"
            if (packageName.contains("paytm", ignoreCase = true)) return "Paytm Merchant"
            return "UPI Recipient"
        }

        private fun cleanMerchantName(raw: String): String {
            return raw.replace(Regex("^(to|at|for|paid to|sent to)\\s+", RegexOption.IGNORE_CASE), "")
                .replace(Regex("\\s+(using|via|on|ref|upi|txn).*$", RegexOption.IGNORE_CASE), "")
                .replace(Regex("[\\.\\,\\!\\?]+$"), "")
                .trim()
        }

        private fun extractReferenceId(text: String): String? {
            val refRegex = Pattern.compile(
                "(?:txn|reference|rrn|utr|upi ref)\\s*(?:id|no\\.?)?[:\\s#]*([A-Za-z0-9]{8,22})",
                Pattern.CASE_INSENSITIVE
            )
            val matcher = refRegex.matcher(text)
            return if (matcher.find()) matcher.group(1) else null
        }

        private fun determinePaymentSource(packageName: String, text: String): String {
            if (packageName.contains("phonepe", ignoreCase = true) || text.contains("phonepe", ignoreCase = true)) return "phonepe"
            if (packageName.contains("nbu.paisa", ignoreCase = true) || text.contains("google pay", ignoreCase = true) || text.contains("gpay", ignoreCase = true)) return "gpay"
            if (packageName.contains("paytm", ignoreCase = true) || text.contains("paytm", ignoreCase = true)) return "paytm"
            if (packageName.contains("dreamplug", ignoreCase = true) || text.contains("cred", ignoreCase = true)) return "cred"
            if (packageName.contains("amazon", ignoreCase = true)) return "amazonpay"
            if (packageName.contains("npci", ignoreCase = true) || text.contains("bhim", ignoreCase = true)) return "bhim"
            return "bank"
        }

        private fun saveExpenseToLocalPrefs(
            context: Context,
            id: String,
            amount: Double,
            merchant: String,
            categoryId: String,
            timestamp: Long,
            paymentSource: String,
            referenceId: String?,
            rawText: String
        ): Boolean {
            return try {
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val existingJson = prefs.getString(KEY_EXPENSES, "[]") ?: "[]"
                val jsonArray = JSONArray(existingJson)

                // Check for duplicate within last 90 seconds
                for (i in 0 until jsonArray.length()) {
                    val obj = jsonArray.getJSONObject(i)
                    val existingRef = obj.optString("referenceId", "")
                    val existingAmount = obj.optDouble("amount", 0.0)
                    val existingTime = obj.optLong("timestamp", 0L)
                    val existingMerchant = obj.optString("merchant", "")

                    if (referenceId != null && referenceId.isNotEmpty() && referenceId == existingRef) {
                        Log.w(TAG, "Duplicate blocked by referenceId: $referenceId")
                        return false
                    }

                    if (Math.abs(existingAmount - amount) < 0.01 &&
                        Math.abs(existingTime - timestamp) < 90000 &&
                        existingMerchant.equals(merchant, ignoreCase = true)) {
                        Log.w(TAG, "Duplicate blocked by amount & time window: ₹$amount to $merchant")
                        return false
                    }
                }

                val newExpense = JSONObject().apply {
                    put("id", id)
                    put("amount", amount)
                    put("merchant", merchant)
                    put("categoryId", categoryId)
                    put("timestamp", timestamp)
                    put("paymentSource", paymentSource)
                    put("status", "success")
                    if (referenceId != null) put("referenceId", referenceId)
                    put("rawNotificationText", rawText)
                    put("notes", "Auto-recorded from $paymentSource")
                    put("createdAt", System.currentTimeMillis())
                }

                // Prepend new expense at index 0
                val updatedArray = JSONArray()
                updatedArray.put(newExpense)
                for (i in 0 until jsonArray.length()) {
                    updatedArray.put(jsonArray.getJSONObject(i))
                }

                prefs.edit().putString(KEY_EXPENSES, updatedArray.toString()).apply()
                Log.d(TAG, "Saved expense to SharedPreferences. Total entries: ${updatedArray.length()}")
                true
            } catch (e: Exception) {
                Log.e(TAG, "Error saving expense to SharedPreferences", e)
                false
            }
        }

        fun showActionableCategoryNotification(
            context: Context,
            amount: Double,
            merchant: String,
            transactionId: String,
            notificationId: Int,
            sourceName: String
        ) {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Ensure channel exists
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "UPI Expense Categorization",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Actionable notifications to quick-categorize UPI payments"
                    enableVibration(true)
                }
                notificationManager.createNotificationChannel(channel)
            }

            // Intent to open App
            val contentIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("transaction_id", transactionId)
            }
            val contentPendingIntent = PendingIntent.getActivity(
                context,
                notificationId,
                contentIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            // Helper to build Action PendingIntents for Category Buttons
            fun createCategoryActionPendingIntent(catId: String): PendingIntent {
                val intent = Intent(context, NotificationActionReceiver::class.java).apply {
                    action = NotificationActionReceiver.ACTION_RECORD_CATEGORY
                    putExtra(NotificationActionReceiver.EXTRA_TRANSACTION_ID, transactionId)
                    putExtra(NotificationActionReceiver.EXTRA_CATEGORY_ID, catId)
                    putExtra(NotificationActionReceiver.EXTRA_NOTIFICATION_ID, notificationId)
                }
                return PendingIntent.getBroadcast(
                    context,
                    (transactionId + catId).hashCode(),
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
            }

            val amountFormatted = if (amount % 1.0 == 0.0) amount.toInt().toString() else String.format("%.2f", amount)

            val builder = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("₹$amountFormatted paid to $merchant")
                .setContentText("Auto-recorded ($sourceName) • Tap a category:")
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(contentPendingIntent)
                .addAction(android.R.drawable.ic_menu_compass, "🍔 Food", createCategoryActionPendingIntent("cat_food"))
                .addAction(android.R.drawable.ic_menu_add, "🛒 Grocery", createCategoryActionPendingIntent("cat_groceries"))
                .addAction(android.R.drawable.ic_menu_directions, "⛽ Fuel", createCategoryActionPendingIntent("cat_fuel"))
                .addAction(android.R.drawable.ic_menu_myplaces, "👥 Friend", createCategoryActionPendingIntent("cat_transfer"))

            try {
                notificationManager.notify(notificationId, builder.build())
            } catch (e: Exception) {
                Log.e(TAG, "Failed to post actionable notification", e)
            }
        }
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.i(TAG, "PaymentNotificationListenerService connected and active")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.w(TAG, "PaymentNotificationListenerService disconnected")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return

        val packageName = sbn.packageName ?: return

        // Filter: Allow UPI apps, bank apps, OR SMS apps
        val isUpiOrBankApp = SUPPORTED_UPI_PACKAGES.contains(packageName) || 
                             packageName.contains("upi", ignoreCase = true) ||
                             packageName.contains("pay", ignoreCase = true) ||
                             packageName.contains("bank", ignoreCase = true) ||
                             packageName.contains("wallet", ignoreCase = true)

        val isSmsApp = SMS_PACKAGES.contains(packageName) ||
                       packageName.contains("messaging", ignoreCase = true) ||
                       packageName.contains("mms", ignoreCase = true)

        if (!isUpiOrBankApp && !isSmsApp) {
            return
        }

        val notification = sbn.notification ?: return
        val extras: Bundle = notification.extras ?: return

        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString() ?: ""
        val subText = extras.getCharSequence(Notification.EXTRA_SUB_TEXT)?.toString() ?: ""
        val ticker = notification.tickerText?.toString() ?: ""

        val combined = "$title $text $bigText $subText $ticker".trim()

        // For SMS apps, only process if the message contains financial transaction indicators
        if (isSmsApp) {
            val lower = combined.lowercase()
            val hasMoneyTerms = lower.contains("debited") || 
                                lower.contains("paid") || 
                                lower.contains("spent") ||
                                lower.contains("upi") || 
                                lower.contains("vpa") || 
                                lower.contains("inr") || 
                                lower.contains("₹")
            if (!hasMoneyTerms) {
                return
            }
        }

        val postTime = if (sbn.postTime > 0) sbn.postTime else System.currentTimeMillis()

        // Process, auto-record, and trigger category notification
        processPaymentPayload(
            context = applicationContext,
            packageName = packageName,
            title = title,
            text = text,
            bigText = bigText,
            subText = subText,
            postTime = postTime
        )
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        super.onNotificationRemoved(sbn)
    }
}
