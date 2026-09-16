import '../../domain/models/parsed_transaction.dart';
import '../../domain/models/payment_source.dart';
import '../../domain/models/transaction_status.dart';
import 'base_notification_parser.dart';

class GPayNotificationParser extends BaseNotificationParser {
  @override
  String get parserName => 'GooglePayParser';

  @override
  PaymentSource get paymentSource => PaymentSource.gpay;

  @override
  bool canHandle(String packageName, String title, String body) {
    return packageName == 'com.google.android.apps.nbu.paisa.user' ||
           packageName.toLowerCase().contains('gpay') ||
           title.toLowerCase().contains('google pay');
  }

  @override
  ParsedTransaction? parse({
    required String packageName,
    required String title,
    required String body,
    required DateTime timestamp,
  }) {
    final fullText = '$title $body'.trim();
    final lowerText = fullText.toLowerCase();

    // 1. Filter out received/credited notifications immediately
    if (lowerText.contains('received') ||
        lowerText.contains('credited') ||
        lowerText.contains('sent you') ||
        lowerText.contains('received from')) {
      return ParsedTransaction(
        amount: extractAmount(fullText) ?? 0.0,
        merchant: 'Sender',
        source: paymentSource,
        status: TransactionStatus.credited,
        timestamp: timestamp,
        rawText: fullText,
      );
    }

    // 2. Identify transaction status
    TransactionStatus status = TransactionStatus.success;
    if (lowerText.contains('failed') || lowerText.contains('declined') || lowerText.contains('unsuccessful')) {
      status = TransactionStatus.failed;
    } else if (lowerText.contains('pending') || lowerText.contains('processing') || lowerText.contains('in progress')) {
      status = TransactionStatus.pending;
    } else if (lowerText.contains('reversed')) {
      status = TransactionStatus.reversed;
    } else if (lowerText.contains('refund')) {
      status = TransactionStatus.refunded;
    }

    // 3. Extract Amount
    final amount = extractAmount(fullText);
    if (amount == null) {
      return null;
    }

    // 4. Extract Merchant
    // Patterns:
    // "Paid ₹450 to ABC Supermarket"
    // "₹450 paid to ABC Supermarket"
    // "You paid ₹450 to ABC Supermarket"
    // "Payment of ₹450 to ABC Supermarket"
    String merchant = 'UPI Payee';
    final merchantPatterns = [
      RegExp(r'(?:paid|sent|payment of)\s+(?:₹|rs\.?|inr)?\s*[0-9\.,]+\s+to\s+([^,\.\n\r]+)', caseSensitive: false),
      RegExp(r'(?:to)\s+([^,\.\n\r]+?)\s+(?:using|for|successful|completed)', caseSensitive: false),
      RegExp(r'(?:paid to)\s+([^,\.\n\r]+)', caseSensitive: false),
    ];

    for (final pattern in merchantPatterns) {
      final match = pattern.firstMatch(fullText);
      if (match != null && match.group(1) != null) {
        merchant = cleanMerchantName(match.group(1)!);
        break;
      }
    }

    // 5. Extract Reference / UTR ID if present
    String? refId;
    final refMatch = RegExp(r'(?:ref|utr|txn|upi ref)\s*(?:no\.?|id)?[:\s]*([0-9]{10,14}|[A-Za-z0-9]{8,18})', caseSensitive: false).firstMatch(fullText);
    if (refMatch != null) {
      refId = refMatch.group(1);
    }

    // 6. Category Auto-heuristics (Optional initial suggestion)
    String? categorySuggestion;
    final lowMerchant = merchant.toLowerCase();
    if (lowMerchant.contains('swiggy') || lowMerchant.contains('zomato') || lowMerchant.contains('cafe') || lowMerchant.contains('baker') || lowMerchant.contains('restaurant')) {
      categorySuggestion = 'cat_food';
    } else if (lowMerchant.contains('mart') || lowMerchant.contains('grocery') || lowMerchant.contains('supermarket') || lowMerchant.contains('blinkit') || lowMerchant.contains('zepto') || lowMerchant.contains('instamart')) {
      categorySuggestion = 'cat_groceries';
    } else if (lowMerchant.contains('petrol') || lowMerchant.contains('fuel') || lowMerchant.contains('hp ') || lowMerchant.contains('indian oil') || lowMerchant.contains('bharat petroleum')) {
      categorySuggestion = 'cat_fuel';
    } else if (lowMerchant.contains('airtel') || lowMerchant.contains('jio') || lowMerchant.contains('vi ') || lowMerchant.contains('vodafone')) {
      categorySuggestion = 'cat_recharge';
    }

    return ParsedTransaction(
      amount: amount,
      merchant: merchant,
      source: paymentSource,
      status: status,
      referenceId: refId,
      timestamp: timestamp,
      rawText: fullText,
      suggestedCategoryId: categorySuggestion,
    );
  }
}
