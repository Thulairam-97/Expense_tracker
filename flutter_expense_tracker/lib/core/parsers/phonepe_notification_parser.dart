import '../../domain/models/parsed_transaction.dart';
import '../../domain/models/payment_source.dart';
import '../../domain/models/transaction_status.dart';
import 'base_notification_parser.dart';

class PhonePeNotificationParser extends BaseNotificationParser {
  @override
  String get parserName => 'PhonePeParser';

  @override
  PaymentSource get paymentSource => PaymentSource.phonepe;

  @override
  bool canHandle(String packageName, String title, String body) {
    return packageName == 'com.phonepe.app' ||
           packageName.toLowerCase().contains('phonepe') ||
           title.toLowerCase().contains('phonepe');
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

    // Ignore credits
    if (lowerText.contains('received') || lowerText.contains('credited') || lowerText.contains('cashback received')) {
      return ParsedTransaction(
        amount: extractAmount(fullText) ?? 0.0,
        merchant: 'Sender',
        source: paymentSource,
        status: TransactionStatus.credited,
        timestamp: timestamp,
        rawText: fullText,
      );
    }

    TransactionStatus status = TransactionStatus.success;
    if (lowerText.contains('failed') || lowerText.contains('declined')) {
      status = TransactionStatus.failed;
    } else if (lowerText.contains('pending') || lowerText.contains('processing')) {
      status = TransactionStatus.pending;
    } else if (lowerText.contains('reversed')) {
      status = TransactionStatus.reversed;
    } else if (lowerText.contains('refund')) {
      status = TransactionStatus.refunded;
    }

    final amount = extractAmount(fullText);
    if (amount == null) return null;

    String merchant = 'PhonePe Merchant';
    final merchantPatterns = [
      RegExp(r'(?:payment of|paid)\s+(?:₹|rs\.?|inr)?\s*[0-9\.,]+\s+to\s+([^,\.\n\r]+?)(?:\s+was\s+successful|\s+is\s+successful|\.|\,|$)', caseSensitive: false),
      RegExp(r'(?:paid to)\s+([^,\.\n\r]+)', caseSensitive: false),
      RegExp(r'to\s+([^,\.\n\r]+?)\s+successful', caseSensitive: false),
    ];

    for (final pattern in merchantPatterns) {
      final match = pattern.firstMatch(fullText);
      if (match != null && match.group(1) != null) {
        merchant = cleanMerchantName(match.group(1)!);
        break;
      }
    }

    // Reference ID
    String? refId;
    final refMatch = RegExp(r'(?:txn|reference|rrn|utr)\s*(?:id|no\.?|:)?\s*([A-Za-z0-9]{8,18})', caseSensitive: false).firstMatch(fullText);
    if (refMatch != null) {
      refId = refMatch.group(1);
    }

    return ParsedTransaction(
      amount: amount,
      merchant: merchant,
      source: paymentSource,
      status: status,
      referenceId: refId,
      timestamp: timestamp,
      rawText: fullText,
    );
  }
}
