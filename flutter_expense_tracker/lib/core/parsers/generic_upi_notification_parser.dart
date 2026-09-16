import '../../domain/models/parsed_transaction.dart';
import '../../domain/models/payment_source.dart';
import '../../domain/models/transaction_status.dart';
import 'base_notification_parser.dart';

class GenericUPINotificationParser extends BaseNotificationParser {
  @override
  String get parserName => 'GenericUPIParser';

  @override
  PaymentSource get paymentSource => PaymentSource.bhim;

  @override
  bool canHandle(String packageName, String title, String body) {
    // Acts as the universal fallback for banking / UPI notifications
    final fullText = '$title $body'.toLowerCase();
    return fullText.contains('debited') ||
           fullText.contains('paid') ||
           fullText.contains('sent') ||
           fullText.contains('upi') ||
           fullText.contains('vpa') ||
           fullText.contains('inr') ||
           fullText.contains('₹');
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

    // 1. Never treat credits/deposits as expenses
    if (lowerText.contains('credited') ||
        lowerText.contains('deposited') ||
        lowerText.contains('received') ||
        lowerText.contains('salary') ||
        lowerText.contains('refund received')) {
      return ParsedTransaction(
        amount: extractAmount(fullText) ?? 0.0,
        merchant: 'Deposit',
        source: PaymentSource.fromPackageName(packageName),
        status: TransactionStatus.credited,
        timestamp: timestamp,
        rawText: fullText,
      );
    }

    // 2. Status detection
    TransactionStatus status = TransactionStatus.success;
    if (lowerText.contains('failed') || lowerText.contains('declined') || lowerText.contains('insufficient balance')) {
      status = TransactionStatus.failed;
    } else if (lowerText.contains('pending') || lowerText.contains('in-process')) {
      status = TransactionStatus.pending;
    } else if (lowerText.contains('reversed')) {
      status = TransactionStatus.reversed;
    } else if (lowerText.contains('refund')) {
      status = TransactionStatus.refunded;
    }

    // 3. Amount extraction
    final amount = extractAmount(fullText);
    if (amount == null) return null;

    // 4. Merchant / Payee extraction
    String merchant = 'UPI Recipient';
    final patterns = [
      RegExp(r'(?:to|towards|for)\s+([A-Za-z0-9\.\_\-\s]{2,35}?)(?:\s+on|\s+ref|\s+via|\s+using|\s+avl|\s+bal|\.|\,|$)', caseSensitive: false),
      RegExp(r'(?:vpa|upi id)\s*[:]?\s*([a-zA-Z0-9\.\_\-]+@[a-zA-Z0-9]+)', caseSensitive: false),
      RegExp(r'(?:paid to)\s+([^,\.\n\r]+)', caseSensitive: false),
    ];

    for (final pattern in patterns) {
      final match = pattern.firstMatch(fullText);
      if (match != null && match.group(1) != null) {
        final candidate = cleanMerchantName(match.group(1)!);
        if (candidate.isNotEmpty && !candidate.toLowerCase().contains('account') && !candidate.toLowerCase().contains('bank')) {
          merchant = candidate;
          break;
        }
      }
    }

    // 5. Reference ID
    String? refId;
    final refMatch = RegExp(r'(?:upi ref|ref no|utr|rrn)\s*[:#]?\s*([0-9]{10,14}|[A-Za-z0-9]{8,18})', caseSensitive: false).firstMatch(fullText);
    if (refMatch != null) {
      refId = refMatch.group(1);
    }

    return ParsedTransaction(
      amount: amount,
      merchant: merchant,
      source: PaymentSource.fromPackageName(packageName),
      status: status,
      referenceId: refId,
      timestamp: timestamp,
      rawText: fullText,
    );
  }
}
