import 'package:equatable/equatable.dart';
import 'payment_source.dart';
import 'transaction_status.dart';

class Expense extends Equatable {
  final String id;
  final double amount;
  final String merchant;
  final String categoryId;
  final DateTime timestamp;
  final PaymentSource paymentSource;
  final TransactionStatus status;
  final String? referenceId;
  final String? rawNotificationText;
  final String? notes;
  final DateTime createdAt;

  const Expense({
    required this.id,
    required this.amount,
    required this.merchant,
    required this.categoryId,
    required this.timestamp,
    required this.paymentSource,
    this.status = TransactionStatus.success,
    this.referenceId,
    this.rawNotificationText,
    this.notes,
    required this.createdAt,
  });

  Expense copyWith({
    String? id,
    double? amount,
    String? merchant,
    String? categoryId,
    DateTime? timestamp,
    PaymentSource? paymentSource,
    TransactionStatus? status,
    String? referenceId,
    String? rawNotificationText,
    String? notes,
    DateTime? createdAt,
  }) {
    return Expense(
      id: id ?? this.id,
      amount: amount ?? this.amount,
      merchant: merchant ?? this.merchant,
      categoryId: categoryId ?? this.categoryId,
      timestamp: timestamp ?? this.timestamp,
      paymentSource: paymentSource ?? this.paymentSource,
      status: status ?? this.status,
      referenceId: referenceId ?? this.referenceId,
      rawNotificationText: rawNotificationText ?? this.rawNotificationText,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'amount': amount,
      'merchant': merchant,
      'categoryId': categoryId,
      'timestamp': timestamp.millisecondsSinceEpoch,
      'paymentSource': paymentSource.name,
      'status': status.name,
      'referenceId': referenceId,
      'rawNotificationText': rawNotificationText,
      'notes': notes,
      'createdAt': createdAt.millisecondsSinceEpoch,
    };
  }

  factory Expense.fromMap(Map<String, dynamic> map) {
    return Expense(
      id: map['id'] as String,
      amount: (map['amount'] as num).toDouble(),
      merchant: map['merchant'] as String,
      categoryId: map['categoryId'] as String,
      timestamp: DateTime.fromMillisecondsSinceEpoch(map['timestamp'] as int),
      paymentSource: PaymentSource.values.firstWhere(
        (e) => e.name == map['paymentSource'],
        orElse: () => PaymentSource.other,
      ),
      status: TransactionStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => TransactionStatus.success,
      ),
      referenceId: map['referenceId'] as String?,
      rawNotificationText: map['rawNotificationText'] as String?,
      notes: map['notes'] as String?,
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['createdAt'] as int),
    );
  }

  @override
  List<Object?> get props => [
        id,
        amount,
        merchant,
        categoryId,
        timestamp,
        paymentSource,
        status,
        referenceId,
        rawNotificationText,
        notes,
        createdAt,
      ];
}
