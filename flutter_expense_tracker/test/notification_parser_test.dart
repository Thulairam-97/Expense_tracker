import 'package:flutter_test/flutter_test.dart';
import 'package:upi_expense_tracker/core/parsers/gpay_notification_parser.dart';
import 'package:upi_expense_tracker/core/parsers/phonepe_notification_parser.dart';
import 'package:upi_expense_tracker/core/parsers/paytm_notification_parser.dart';
import 'package:upi_expense_tracker/core/parsers/generic_upi_notification_parser.dart';
import 'package:upi_expense_tracker/core/parsers/notification_parser_factory.dart';
import 'package:upi_expense_tracker/domain/models/payment_source.dart';
import 'package:upi_expense_tracker/domain/models/transaction_status.dart';

void main() {
  group('Notification Parser Pipeline Tests', () {
    late NotificationParserFactory factory;

    setUp(() {
      factory = NotificationParserFactory();
    });

    test('GPay: Successful outgoing payment format', () {
      final now = DateTime.now();
      final result = factory.parseNotification(
        packageName: 'com.google.android.apps.nbu.paisa.user',
        title: 'Google Pay',
        body: 'Paid ₹450 to ABC Supermarket. Ref: 312345678901',
        timestamp: now,
      );

      expect(result, isNotNull);
      expect(result!.amount, 450.0);
      expect(result.merchant, 'ABC Supermarket');
      expect(result.source, PaymentSource.gpay);
      expect(result.status, TransactionStatus.success);
      expect(result.referenceId, '312345678901');
    });

    test('GPay: Ignores incoming / credited payment', () {
      final now = DateTime.now();
      final result = factory.parseNotification(
        packageName: 'com.google.android.apps.nbu.paisa.user',
        title: 'Google Pay',
        body: 'You received ₹1,200 from Rahul Verma',
        timestamp: now,
      );

      expect(result, isNotNull);
      expect(result!.status, TransactionStatus.credited);
      expect(result.status.isSuccessfulExpense, isFalse);
    });

    test('GPay: Detects payment failed', () {
      final now = DateTime.now();
      final result = factory.parseNotification(
        packageName: 'com.google.android.apps.nbu.paisa.user',
        title: 'Google Pay',
        body: 'Payment of ₹250 to Star Cafe failed. Your bank declined the request.',
        timestamp: now,
      );

      expect(result, isNotNull);
      expect(result!.status, TransactionStatus.failed);
      expect(result.status.isSuccessfulExpense, isFalse);
    });

    test('PhonePe: Successful payment format', () {
      final now = DateTime.now();
      final result = factory.parseNotification(
        packageName: 'com.phonepe.app',
        title: 'PhonePe',
        body: 'Payment of ₹820 to Blue Tokai Coffee was successful. Txn ID: T240914123456',
        timestamp: now,
      );

      expect(result, isNotNull);
      expect(result!.amount, 820.0);
      expect(result.merchant, 'Blue Tokai Coffee');
      expect(result.source, PaymentSource.phonepe);
      expect(result.status, TransactionStatus.success);
      expect(result.referenceId, 'T240914123456');
    });

    test('Paytm: Paid at merchant format', () {
      final now = DateTime.now();
      final result = factory.parseNotification(
        packageName: 'net.one97.paytm',
        title: 'Paytm',
        body: 'Paid ₹120 at Chai Point. Order ID: PT10023490',
        timestamp: now,
      );

      expect(result, isNotNull);
      expect(result!.amount, 120.0);
      expect(result.merchant, 'Chai Point');
      expect(result.source, PaymentSource.paytm);
      expect(result.status, TransactionStatus.success);
      expect(result.referenceId, 'PT10023490');
    });

    test('Generic UPI / Bank notification: Debited format', () {
      final now = DateTime.now();
      final result = factory.parseNotification(
        packageName: 'in.org.npci.upiapp',
        title: 'UPI Transaction Alert',
        body: 'Rs. 650.00 debited from a/c **4120 towards Swiggy on 14-Sep. UPI Ref: 425619283741',
        timestamp: now,
      );

      expect(result, isNotNull);
      expect(result!.amount, 650.0);
      expect(result.merchant, 'Swiggy');
      expect(result.status, TransactionStatus.success);
      expect(result.referenceId, '425619283741');
    });
  });
}
