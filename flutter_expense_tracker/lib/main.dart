import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/parsers/notification_parser_factory.dart';
import 'core/services/duplicate_detector.dart';
import 'domain/models/category.dart';
import 'domain/models/expense.dart';
import 'domain/models/parsed_transaction.dart';
import 'domain/models/payment_source.dart';
import 'domain/models/transaction_status.dart';
import 'presentation/theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const UPIExpenseTrackerApp());
}

class UPIExpenseTrackerApp extends StatelessWidget {
  const UPIExpenseTrackerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'UPI Expense Tracker',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  static const MethodChannel _methodChannel =
      MethodChannel('com.personal.upiexpensetracker/notification_control');
  static const EventChannel _eventChannel =
      EventChannel('com.personal.upiexpensetracker/notification_stream');

  final NotificationParserFactory _parserFactory = NotificationParserFactory();
  final DuplicateDetector _duplicateDetector = DuplicateDetector();

  StreamSubscription? _notificationSubscription;
  bool _isPermissionGranted = false;
  ParsedTransaction? _pendingNotification;

  // In-memory list initialized with realistic samples
  final List<Expense> _expenses = [
    Expense(
      id: 'exp_init_1',
      amount: 450.0,
      merchant: 'ABC Supermarket',
      categoryId: 'cat_groceries',
      timestamp: DateTime.now().subtract(const Duration(minutes: 42)),
      paymentSource: PaymentSource.gpay,
      status: TransactionStatus.success,
      referenceId: '312345678901',
      rawNotificationText: 'Paid ₹450 to ABC Supermarket. Ref: 312345678901',
      createdAt: DateTime.now(),
    ),
    Expense(
      id: 'exp_init_2',
      amount: 820.0,
      merchant: 'Blue Tokai Coffee',
      categoryId: 'cat_food',
      timestamp: DateTime.now().subtract(const Duration(hours: 3)),
      paymentSource: PaymentSource.phonepe,
      status: TransactionStatus.success,
      referenceId: 'T240914123456',
      rawNotificationText:
          'Payment of ₹820 to Blue Tokai Coffee was successful. Txn ID: T240914123456',
      createdAt: DateTime.now(),
    ),
    Expense(
      id: 'exp_init_3',
      amount: 1500.0,
      merchant: 'Indian Oil Petrol Pump',
      categoryId: 'cat_fuel',
      timestamp: DateTime.now().subtract(const Duration(days: 1)),
      paymentSource: PaymentSource.paytm,
      status: TransactionStatus.success,
      referenceId: 'PT9912401',
      rawNotificationText:
          'Paid ₹1,500 at Indian Oil Petrol Pump. Txn ID: PT9912401',
      createdAt: DateTime.now(),
    ),
  ];

  final List<ExpenseCategory> _categories = ExpenseCategory.defaultCategories;
  String _searchQuery = '';
  String _selectedCategoryFilter = 'all';

  @override
  void initState() {
    super.initState();
    _checkPermissionStatus();
    _initNotificationStream();
  }

  @override
  void dispose() {
    _notificationSubscription?.cancel();
    super.dispose();
  }

  Future<void> _checkPermissionStatus() async {
    try {
      final bool granted =
          await _methodChannel.invokeMethod('isNotificationPermissionGranted') ??
              false;
      setState(() {
        _isPermissionGranted = granted;
      });
    } catch (e) {
      debugPrint('Error checking permission: $e');
    }
  }

  Future<void> _openNotificationSettings() async {
    try {
      await _methodChannel.invokeMethod('openNotificationSettings');
    } catch (e) {
      debugPrint('Error opening settings: $e');
    }
  }

  void _initNotificationStream() {
    _notificationSubscription = _eventChannel.receiveBroadcastStream().listen(
      (dynamic event) {
        if (event is Map) {
          final packageName = event['packageName'] as String? ?? '';
          final title = event['title'] as String? ?? '';
          final text = event['text'] as String? ?? '';
          final postTime = event['timestamp'] as int? ?? DateTime.now().millisecondsSinceEpoch;

          _handleIncomingNotification(
            packageName: packageName,
            title: title,
            body: text,
            timestamp: DateTime.fromMillisecondsSinceEpoch(postTime),
          );
        }
      },
      onError: (dynamic error) {
        debugPrint('Error on notification stream: $error');
      },
    );
  }

  void _handleIncomingNotification({
    required String packageName,
    required String title,
    required String body,
    required DateTime timestamp,
  }) {
    // 1. Parse using extensible parser factory
    final parsed = _parserFactory.parseNotification(
      packageName: packageName,
      title: title,
      body: body,
      timestamp: timestamp,
    );

    if (parsed == null) return;

    // 2. Reject non-expenses (incoming money, failed, pending)
    if (!parsed.status.isSuccessfulExpense) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Filtered non-expense (${parsed.status.description}): ${parsed.merchant}'),
          backgroundColor: Colors.blueGrey,
          duration: const Duration(seconds: 3),
        ),
      );
      return;
    }

    // 3. Check for duplicates
    if (_duplicateDetector.isDuplicate(parsed, _expenses)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Duplicate blocked: ₹${parsed.amount} at ${parsed.merchant}'),
          backgroundColor: Colors.amber.shade800,
          duration: const Duration(seconds: 4),
        ),
      );
      return;
    }

    // 4. Trigger actionable native Android notification with category action buttons
    _showActionableAndroidNotification(parsed);

    // 5. Update in-app state for immediate response if app is open
    setState(() {
      _pendingNotification = parsed;
    });
  }

  Future<void> _showActionableAndroidNotification(ParsedTransaction parsed) async {
    try {
      await _methodChannel.invokeMethod('showActionableCategoryNotification', {
        'amount': parsed.amount,
        'merchant': parsed.merchant,
        'transactionId': 'tx_${DateTime.now().millisecondsSinceEpoch}',
        'notificationId': DateTime.now().millisecondsSinceEpoch ~/ 1000,
      });
    } catch (e) {
      debugPrint('Error invoking native notification: $e');
    }
  }

  void _recordCategoryForPending(String categoryId) {
    if (_pendingNotification == null) return;

    final newExpense = Expense(
      id: 'exp_${DateTime.now().millisecondsSinceEpoch}',
      amount: _pendingNotification!.amount,
      merchant: _pendingNotification!.merchant,
      categoryId: categoryId,
      timestamp: _pendingNotification!.timestamp,
      paymentSource: _pendingNotification!.source,
      status: TransactionStatus.success,
      referenceId: _pendingNotification!.referenceId,
      rawNotificationText: _pendingNotification!.rawText,
      createdAt: DateTime.now(),
    );

    setState(() {
      _expenses.insert(0, newExpense);
      _duplicateDetector.recordAccepted(_pendingNotification!);
      _pendingNotification = null;
    });

    final catName =
        _categories.firstWhere((c) => c.id == categoryId, orElse: () => _categories.first).name;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Recorded ₹${newExpense.amount.toInt()} under $catName'),
        backgroundColor: const Color(0xFF0F766E),
      ),
    );
  }

  void _showAddManualExpenseDialog() {
    final amountController = TextEditingController();
    final merchantController = TextEditingController();
    String selectedCatId = _categories.first.id;
    PaymentSource selectedSource = PaymentSource.manual;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Add Expense Manually',
                    style: Theme.of(ctx).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: amountController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Amount (₹)',
                      prefixText: '₹ ',
                      border: OutlineInputBorder(),
                    ),
                    autofocus: true,
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: merchantController,
                    decoration: const InputDecoration(
                      labelText: 'Merchant / Payee',
                      hintText: 'e.g. Starbucks, Local Store',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: selectedCatId,
                    decoration: const InputDecoration(
                      labelText: 'Category',
                      border: OutlineInputBorder(),
                    ),
                    items: _categories.map((cat) {
                      return DropdownMenuItem(
                        value: cat.id,
                        child: Text(cat.name),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setModalState(() => selectedCatId = val);
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<PaymentSource>(
                    value: selectedSource,
                    decoration: const InputDecoration(
                      labelText: 'Payment Method',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: PaymentSource.manual, child: Text('Cash / Manual')),
                      DropdownMenuItem(value: PaymentSource.gpay, child: Text('Google Pay (UPI)')),
                      DropdownMenuItem(value: PaymentSource.phonepe, child: Text('PhonePe')),
                      DropdownMenuItem(value: PaymentSource.paytm, child: Text('Paytm')),
                      DropdownMenuItem(value: PaymentSource.bhim, child: Text('BHIM / Bank UPI')),
                    ],
                    onChanged: (val) {
                      if (val != null) setModalState(() => selectedSource = val);
                    },
                  ),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: () {
                      final amount = double.tryParse(amountController.text);
                      final merchant = merchantController.text.trim();
                      if (amount == null || amount <= 0 || merchant.isEmpty) return;

                      final newExpense = Expense(
                        id: 'exp_${DateTime.now().millisecondsSinceEpoch}',
                        amount: amount,
                        merchant: merchant,
                        categoryId: selectedCatId,
                        timestamp: DateTime.now(),
                        paymentSource: selectedSource,
                        status: TransactionStatus.success,
                        createdAt: DateTime.now(),
                      );

                      setState(() {
                        _expenses.insert(0, newExpense);
                      });

                      Navigator.pop(ctx);
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF0F766E),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Save Expense', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showTransactionDetail(Expense expense) {
    final cat = _categories.firstWhere((c) => c.id == expense.categoryId, orElse: () => _categories.first);

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '₹${expense.amount.toStringAsFixed(2)}',
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Color(0xFF191C1B)),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFCCE8E3),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      expense.paymentSource.displayName,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0F766E)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                expense.merchant,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF4A5568)),
              ),
              const Divider(height: 28),
              _detailRow('Category', cat.name),
              _detailRow('Date & Time', expense.timestamp.toString().substring(0, 16)),
              if (expense.referenceId != null)
                _detailRow('Reference / UTR ID', expense.referenceId!),
              if (expense.rawNotificationText != null) ...[
                const SizedBox(height: 8),
                const Text('Original Notification:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(expense.rawNotificationText!, style: const TextStyle(fontSize: 11, fontFamily: 'monospace')),
                ),
              ],
              const SizedBox(height: 20),
              OutlinedButton.icon(
                onPressed: () {
                  setState(() {
                    _expenses.removeWhere((e) => e.id == expense.id);
                  });
                  Navigator.pop(ctx);
                },
                icon: const Icon(Icons.delete_outline, color: Colors.red),
                label: const Text('Delete Transaction', style: TextStyle(color: Colors.red)),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    final monthStart = DateTime(now.year, now.month, 1);

    double todaySpent = 0;
    double monthSpent = 0;
    for (final exp in _expenses) {
      if (exp.timestamp.isAfter(todayStart)) todaySpent += exp.amount;
      if (exp.timestamp.isAfter(monthStart)) monthSpent += exp.amount;
    }

    final filtered = _expenses.where((exp) {
      final matchesQuery = exp.merchant.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (exp.referenceId?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
      final matchesCat = _selectedCategoryFilter == 'all' || exp.categoryId == _selectedCategoryFilter;
      return matchesQuery && matchesCat;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('UPI Expense Tracker'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Check Permission',
            onPressed: _checkPermissionStatus,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddManualExpenseDialog,
        icon: const Icon(Icons.add),
        label: const Text('Add Expense'),
      ),
      body: RefreshIndicator(
        onRefresh: _checkPermissionStatus,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // 1. Android Permission Status Banner
            if (!_isPermissionGranted)
              Card(
                color: Colors.amber.shade50,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: Colors.amber.shade300),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.warning_amber_rounded, color: Colors.amber.shade900),
                          const SizedBox(width: 8),
                          const Text(
                            'Notification Access Required',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'To automatically detect GPay, PhonePe & Paytm payments with zero manual entry, grant notification access in Android Settings.',
                        style: TextStyle(fontSize: 12, color: Colors.black87),
                      ),
                      const SizedBox(height: 12),
                      FilledButton.icon(
                        onPressed: _openNotificationSettings,
                        icon: const Icon(Icons.settings, size: 16),
                        label: const Text('Enable in Settings'),
                        style: FilledButton.styleFrom(
                          backgroundColor: Colors.amber.shade900,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: Colors.emerald.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.emerald.shade200),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Color(0xFF0F766E), size: 18),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Notification Listener is Active and listening for UPI payments.',
                        style: TextStyle(fontSize: 12, color: Color(0xFF0F766E), fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),

            // 2. Actionable Category Prompt (When payment detected)
            if (_pendingNotification != null) ...[
              Card(
                color: const Color(0xFF0F766E),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${_pendingNotification!.source.displayName.toUpperCase()} PAYMENT DETECTED',
                            style: const TextStyle(fontSize: 10, color: Colors.white70, fontWeight: FontWeight.bold, letterSpacing: 1),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close, color: Colors.white70, size: 18),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            onPressed: () => setState(() => _pendingNotification = null),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '₹${_pendingNotification!.amount.toInt()} paid to ${_pendingNotification!.merchant}',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Tap a category to quickly record:',
                        style: TextStyle(fontSize: 12, color: Colors.white70),
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: _categories.take(5).map((cat) {
                          return ActionChip(
                            label: Text(cat.name),
                            backgroundColor: Colors.white.withOpacity(0.15),
                            labelStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12),
                            onPressed: () => _recordCategoryForPending(cat.id),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],

            // 3. Stats Grid
            Row(
              children: [
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Today', style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('₹${todaySpent.toInt()}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('This Month', style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('₹${monthSpent.toInt()}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0F766E))),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // 4. Search & Filter
            Row(
              children: [
                Expanded(
                  child: TextField(
                    onChanged: (val) => setState(() => _searchQuery = val),
                    decoration: InputDecoration(
                      hintText: 'Search merchant, ref...',
                      prefixIcon: const Icon(Icons.search, size: 20),
                      isDense: true,
                      contentPadding: const EdgeInsets.all(10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                DropdownButton<String>(
                  value: _selectedCategoryFilter,
                  underline: const SizedBox(),
                  items: [
                    const DropdownMenuItem(value: 'all', child: Text('All')),
                    ..._categories.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))),
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedCategoryFilter = val);
                  },
                ),
              ],
            ),

            const SizedBox(height: 12),

            // 5. Transactions List
            const Text(
              'Transactions',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),

            if (filtered.isEmpty)
              const Padding(
                padding: EdgeInsets.all(32),
                child: Center(
                  child: Text('No transactions recorded yet.', style: TextStyle(color: Colors.grey)),
                ),
              )
            else
              ...filtered.map((exp) {
                final cat = _categories.firstWhere(
                  (c) => c.id == exp.categoryId,
                  orElse: () => _categories.first,
                );

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    onTap: () => _showTransactionDetail(exp),
                    leading: CircleAvatar(
                      backgroundColor: Color(cat.colorValue).withOpacity(0.15),
                      child: Text(
                        cat.name.substring(0, 1),
                        style: TextStyle(fontWeight: FontWeight.bold, color: Color(cat.colorValue)),
                      ),
                    ),
                    title: Text(exp.merchant, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: Text(
                      '${cat.name} • ${exp.paymentSource.displayName}',
                      style: const TextStyle(fontSize: 11),
                    ),
                    trailing: Text(
                      '₹${exp.amount.toInt()}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
