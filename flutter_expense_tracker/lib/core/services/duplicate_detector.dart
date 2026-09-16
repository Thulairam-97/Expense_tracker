import '../../domain/models/expense.dart';
import '../../domain/models/parsed_transaction.dart';

class DuplicateDetector {
  // In-memory cache of recent fingerprint hashes with expiration
  final Map<String, DateTime> _recentFingerprints = {};
  static const Duration _window = Duration(minutes: 5);

  /// Check if candidate transaction is a duplicate of recent in-memory items or existing records
  bool isDuplicate(
    ParsedTransaction candidate,
    List<Expense> recentExpenses,
  ) {
    _pruneExpiredFingerprints();

    // 1. Check in-memory fast hash
    final fastHash = candidate.duplicateHash;
    if (_recentFingerprints.containsKey(fastHash)) {
      return true;
    }

    // 2. Check by Reference / UTR ID if present
    if (candidate.referenceId != null && candidate.referenceId!.isNotEmpty) {
      for (final exp in recentExpenses) {
        if (exp.referenceId == candidate.referenceId) {
          return true;
        }
      }
    }

    // 3. Check fuzzy match within 5 minutes window
    final candidateNormMerchant = _normalizeString(candidate.merchant);

    for (final exp in recentExpenses) {
      final timeDifference = candidate.timestamp.difference(exp.timestamp).abs();
      if (timeDifference <= _window) {
        // Amounts must match exactly
        final amountDiff = (candidate.amount - exp.amount).abs();
        if (amountDiff < 0.01) {
          final existingNormMerchant = _normalizeString(exp.merchant);
          // Check if merchants match or one contains the other
          if (candidateNormMerchant == existingNormMerchant ||
              candidateNormMerchant.contains(existingNormMerchant) ||
              existingNormMerchant.contains(candidateNormMerchant)) {
            return true;
          }
        }
      }
    }

    // Mark as seen
    _recentFingerprints[fastHash] = DateTime.now();
    return false;
  }

  void recordAccepted(ParsedTransaction transaction) {
    _recentFingerprints[transaction.duplicateHash] = DateTime.now();
  }

  void _pruneExpiredFingerprints() {
    final now = DateTime.now();
    _recentFingerprints.removeWhere((_, time) => now.difference(time) > const Duration(minutes: 15));
  }

  String _normalizeString(String input) {
    return input.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]'), '');
  }
}
