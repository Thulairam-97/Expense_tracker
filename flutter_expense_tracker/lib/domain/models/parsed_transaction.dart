import 'payment_source.dart';
import 'transaction_status.dart';

class ParsedTransaction {
  final double amount;
  final String merchant;
  final PaymentSource source;
  final TransactionStatus status;
  final String? referenceId;
  final DateTime timestamp;
  final String rawText;
  final double confidenceScore;
  final String? suggestedCategoryId;

  const ParsedTransaction({
    required this.amount,
    required this.merchant,
    required this.source,
    required this.status,
    this.referenceId,
    required this.timestamp,
    required this.rawText,
    this.confidenceScore = 1.0,
    this.suggestedCategoryId,
  });

  /// Generate a unique fingerprint for duplicate detection
  String get duplicateHash {
    // Normalizing merchant name (removing spaces, lowercase)
    final normMerchant = merchant.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
    final timeWindow = timestamp.millisecondsSinceEpoch ~/ (1000 * 60 * 3); // 3-minute bucket
    return '${amount.toStringAsFixed(2)}_$normMerchant}_${referenceId ?? 'noref'}_$timeWindow';
  }
}
