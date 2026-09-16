enum TransactionStatus {
  success('Successful payment'),
  pending('Pending confirmation'),
  failed('Payment failed'),
  reversed('Transaction reversed'),
  refunded('Refund received'),
  credited('Money received / credited');

  final String description;
  const TransactionStatus(this.description);

  bool get isSuccessfulExpense => this == TransactionStatus.success;
}
