import '../../domain/models/parsed_transaction.dart';
import '../../domain/models/payment_source.dart';
import '../../domain/models/transaction_status.dart';
import 'base_notification_parser.dart';

class PaytmNotificationParser extends BaseNotificationParser {
  @override
  String get parserName => 'PaytmParser';

  @override
  PaymentSource get paymentSource => PaymentSource.paytm;

  @override
  bool canHandle(String packageName, String title, String body) {
    return packageName == 'net.one97.paytm' ||
           packageName.toLowerCase().contains('paytm') ||
           title.toLowerCase().contains('paytm');
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

    // Ignore incoming money
    if (lowerText.contains('received') ||
        lowerText.contains('added to wallet') ||
        lowerText.contains('cashback') ||
        lowerText.contains('credited')) {
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

    String merchant = 'Paytm Payee';
    final merchantPatterns = [
      RegExp(r'(?:paid|sent)\s+(?:₹|rs\.?|inr)?\s*[0-9\.,]+\s+(?:at|to)\s+([^,\.\n\r]+)', caseSensitive: false),
      RegExp(r'(?:paid successfully at|paid at)\s+([^,\.\n\r]+)', caseSensitive: false),
      RegExp(r'(?:recharge of)\s+(?:₹|rs\.?|inr)?\s*[0-9\.,]+\s+successful for\s+([0-9]+)', caseSensitive: false),
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
    final refMatch = RegExp(r'(?:order id|txn id|ref|rrn)\s*[:#]?\s*([A-Za-z0-9]{8,22})', caseSensitive: false).firstMatch(fullText);
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
