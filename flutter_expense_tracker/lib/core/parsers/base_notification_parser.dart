import '../../domain/models/parsed_transaction.dart';
import '../../domain/models/payment_source.dart';

abstract class BaseNotificationParser {
  /// Unique identifier of the parser
  String get parserName;

  /// The payment source this parser caters to
  PaymentSource get paymentSource;

  /// Checks if this parser can handle the notification from package and text
  bool canHandle(String packageName, String title, String body);

  /// Main parsing logic extracting amount, payee, status, reference ID
  ParsedTransaction? parse({
    required String packageName,
    required String title,
    required String body,
    required DateTime timestamp,
  });

  /// Helper to extract numeric amount from currency string like "₹450", "Rs. 1,200.50", "INR 80", "1.00 INR"
  double? extractAmount(String text) {
    // 1. Regex matching ₹, Rs, Rs., INR followed by optional spaces and amount
    final regExpPrefix = RegExp(
      r'(?:₹|Rs\.?|INR)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)',
      caseSensitive: false,
    );
    final matchPrefix = regExpPrefix.firstMatch(text);
    if (matchPrefix != null && matchPrefix.group(1) != null) {
      final cleanStr = matchPrefix.group(1)!.replaceAll(',', '');
      return double.tryParse(cleanStr);
    }

    // 2. Regex matching amount followed by INR or Rs (e.g. "1.00 INR" or "100 Rs")
    final regExpSuffix = RegExp(
      r'([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(?:₹|Rs\.?|INR)',
      caseSensitive: false,
    );
    final matchSuffix = regExpSuffix.firstMatch(text);
    if (matchSuffix != null && matchSuffix.group(1) != null) {
      final cleanStr = matchSuffix.group(1)!.replaceAll(',', '');
      return double.tryParse(cleanStr);
    }

    // 3. Regex matching "debited by/for" or "paid" followed by numeric value
    final regExpDebit = RegExp(
      r'(?:debited\s*(?:by|for|with)?|paid|sent)\s*(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)',
      caseSensitive: false,
    );
    final matchDebit = regExpDebit.firstMatch(text);
    if (matchDebit != null && matchDebit.group(1) != null) {
      final cleanStr = matchDebit.group(1)!.replaceAll(',', '');
      return double.tryParse(cleanStr);
    }

    return null;
  }

  /// Helper to sanitize merchant or recipient name
  String cleanMerchantName(String raw) {
    var cleaned = raw
        .replaceAll(RegExp(r'^(to|at|for|paid to|sent to)\s+', caseSensitive: false), '')
        .replaceAll(RegExp(r'\s+(using|via|on|ref|upi|txn).*$', caseSensitive: false), '')
        .replaceAll(RegExp(r'[\.\,\!\?]+$'), '')
        .trim();
    if (cleaned.isEmpty) return 'Unknown Merchant';
    return cleaned;
  }
}
