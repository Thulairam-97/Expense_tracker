import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/parsers/notification_parser_factory.dart';
import 'core/services/duplicate_detector.dart';
import 'core/services/local_expense_storage.dart';
import 'domain/models/category.dart';
import 'domain/models/expense.dart';
import 'domain/models/parsed_transaction.dart';
import 'domain/models/payment_source.dart';
import 'domain/models/transaction_status.dart';
import 'presentation/screens/login_screen.dart';
import 'presentation/screens/settings_screen.dart';
import 'presentation/screens/trends_screen.dart';
import 'presentation/theme/app_theme.dart';
import 'presentation/widgets/app_logo.dart';

void main() {
  runZonedGuarded(() {
    WidgetsFlutterBinding.ensureInitialized();
    runApp(const UPIExpenseTrackerApp());
  }, (error, stackTrace) {
    debugPrint('Uncaught Flutter startup error: $error\n$stackTrace');
  });
}

class UPIExpenseTrackerApp extends StatefulWidget {
  const UPIExpenseTrackerApp({super.key});

  @override
  State<UPIExpenseTrackerApp> createState() => _UPIExpenseTrackerAppState();
}

class _UPIExpenseTrackerAppState extends State<UPIExpenseTrackerApp> {
  bool _isAuthenticated = false;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'UPI Expense Tracker',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      home: _isAuthenticated
          ? HomeScreen(onLockApp: () => setState(() => _isAuthenticated = false))
          : LoginScreen(onAuthenticated: () => setState(() => _isAuthenticated = true)),
    );
  }
}

class HomeScreen extends StatefulWidget {
  final VoidCallback onLockApp;

  const HomeScreen({super.key, required this.onLockApp});

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
  bool _isLoadingData = true;
  ParsedTransaction? _pendingNotification;

  // Real live expenses list (starts empty for real live tracking)
  List<Expense> _expenses = [];

  final List<ExpenseCategory> _categories = ExpenseCategory.defaultCategories;
  String _searchQuery = '';
  String _selectedCategoryFilter = 'all';
  String? _currentUserName;
  int _currentTabIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadInitialData();
      _checkPermissionStatus();
      _initNotificationStream();
    });
  }

  @override
  void dispose() {
    _notificationSubscription?.cancel();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    final savedExpenses = await LocalExpenseStorage.loadExpenses();
    final name = await LocalExpenseStorage.getUserName();
    setState(() {
      _expenses = savedExpenses ?? [];
      _currentUserName = name;
      _isLoadingData = false;
    });
  }

  Future<void> _persistExpenses() async {
    await LocalExpenseStorage.saveExpenses(_expenses);
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
    try {
      _notificationSubscription = _eventChannel.receiveBroadcastStream().listen(
        (dynamic event) {
          if (event is Map) {
            // Check if this is a category quick-action from notification buttons
            final actionType = event['actionType'] as String?;
            if (actionType == 'category_selected') {
              final catId = event['categoryId'] as String? ?? 'cat_other';
              _recordCategoryForPending(catId);
              return;
            }

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
    } catch (e) {
      debugPrint('Failed to initialize notification stream: $e');
    }
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

    // 2. Reject non-expenses (incoming money, refunds, failed)
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
              'Duplicate blocked: ₹${parsed.amount.toStringAsFixed(0)} at ${parsed.merchant}'),
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
    _persistExpenses();

    final catName =
        _categories.firstWhere((c) => c.id == categoryId, orElse: () => _categories.first).name;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Recorded ₹${newExpense.amount.toStringAsFixed(0)} under $catName'),
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
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: merchantController,
                    decoration: const InputDecoration(
                      labelText: 'Merchant / Recipient Name',
                      hintText: 'e.g. Swiggy, Chai Point',
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
                      DropdownMenuItem(value: PaymentSource.gpay, child: Text('Google Pay')),
                      DropdownMenuItem(value: PaymentSource.phonepe, child: Text('PhonePe')),
                      DropdownMenuItem(value: PaymentSource.paytm, child: Text('Paytm')),
                      DropdownMenuItem(value: PaymentSource.manual, child: Text('Cash / Manual')),
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
                      _persistExpenses();

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

  void _showClearDataConfirmation() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear All Expense Data?'),
        content: const Text(
          'This will remove all tracked expenses so you can test and calculate solely with your live UPI spending from today onwards. This cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              await LocalExpenseStorage.clearExpenses();
              setState(() {
                _expenses.clear();
                _pendingNotification = null;
              });
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('All data cleared. Waiting for your live UPI payments!'),
                  backgroundColor: Color(0xFF0F766E),
                ),
              );
            },
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }

  void _showTransactionDetail(Expense expense) {
    String currentCatId = expense.categoryId;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final cat = _categories.firstWhere(
              (c) => c.id == currentCatId,
              orElse: () => _categories.first,
            );

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

                  // Quick Category Editor
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Category', style: TextStyle(color: Colors.grey, fontSize: 13)),
                      DropdownButton<String>(
                        value: currentCatId,
                        underline: const SizedBox(),
                        items: _categories.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))).toList(),
                        onChanged: (newCatId) {
                          if (newCatId != null) {
                            setModalState(() => currentCatId = newCatId);
                            final updatedIndex = _expenses.indexWhere((e) => e.id == expense.id);
                            if (updatedIndex != -1) {
                              setState(() {
                                _expenses[updatedIndex] = _expenses[updatedIndex].copyWith(categoryId: newCatId);
                              });
                              _persistExpenses();
                            }
                          }
                        },
                      ),
                    ],
                  ),

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
                      _persistExpenses();
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

    Widget bodyContent;
    String screenTitle = 'UPI Expense Tracker';

    if (_currentTabIndex == 1) {
      screenTitle = 'Spending Trends';
      bodyContent = TrendsScreen(expenses: _expenses, categories: _categories);
    } else if (_currentTabIndex == 2) {
      screenTitle = 'Settings & Security';
      bodyContent = SettingsScreen(
        isPermissionGranted: _isPermissionGranted,
        onOpenSettings: _openNotificationSettings,
        onClearAllData: _showClearDataConfirmation,
        onLockApp: widget.onLockApp,
      );
    } else {
      screenTitle = 'UPI Expense Tracker';
      bodyContent = _buildExpensesTab(filtered, todaySpent, monthSpent);
    }

    return Scaffold(
      appBar: AppBar(
        leading: const Padding(
          padding: EdgeInsets.only(left: 14, right: 6, top: 10, bottom: 10),
          child: AppLogo(size: 34, showGlow: false),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(screenTitle, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            if (_currentTabIndex == 0)
              Text(
                _currentUserName != null && _currentUserName!.isNotEmpty
                    ? 'Hi, $_currentUserName • Zero-manual live'
                    : 'Zero-manual live tracking',
                style: const TextStyle(fontSize: 11, color: Colors.grey),
              )
            else if (_currentTabIndex == 1)
              const Text('Analytics & category breakdown', style: TextStyle(fontSize: 11, color: Colors.grey))
            else
              const Text('Privacy, PIN & notification rules', style: TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
        actions: [
          if (_currentTabIndex == 0) ...[
            IconButton(
              icon: const Icon(Icons.delete_sweep_outlined, color: Colors.redAccent),
              tooltip: 'Clear All Data',
              onPressed: _showClearDataConfirmation,
            ),
            IconButton(
              icon: const Icon(Icons.refresh),
              tooltip: 'Check Permission Status',
              onPressed: _checkPermissionStatus,
            ),
          ],
          IconButton(
            icon: const Icon(Icons.lock_outline),
            tooltip: 'Lock App',
            onPressed: widget.onLockApp,
          ),
        ],
      ),
      floatingActionButton: _currentTabIndex == 0
          ? FloatingActionButton.extended(
              onPressed: _showAddManualExpenseDialog,
              icon: const Icon(Icons.add),
              label: const Text('Add Expense'),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentTabIndex,
        onDestinationSelected: (idx) => setState(() => _currentTabIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long_rounded, color: Color(0xFF0F766E)),
            label: 'Expenses',
          ),
          NavigationDestination(
            icon: Icon(Icons.insights_outlined),
            selectedIcon: Icon(Icons.insights_rounded, color: Color(0xFF0F766E)),
            label: 'Trends',
          ),
          NavigationDestination(
            icon: Icon(Icons.tune_outlined),
            selectedIcon: Icon(Icons.tune_rounded, color: Color(0xFF0F766E)),
            label: 'Settings',
          ),
        ],
      ),
      body: _isLoadingData
          ? const Center(
              child: LoadingLogo(
                size: 70,
                statusMessage: 'Syncing live expense data...',
              ),
            )
          : bodyContent,
    );
  }

  Widget _buildExpensesTab(List<Expense> filtered, double todaySpent, double monthSpent) {
    return RefreshIndicator(
      onRefresh: () async {
        await _loadInitialData();
        await _checkPermissionStatus();
      },
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
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle, color: Color(0xFF0F766E), size: 18),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Active & Listening for UPI Payments (GPay, PhonePe, Paytm)',
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
                      '₹${_pendingNotification!.amount.toStringAsFixed(0)} paid to ${_pendingNotification!.merchant}',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Tap a category to quickly record (or select from top notification):',
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

          // 3. Stats Grid (Calculated from real live expenses)
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
                        Text('₹${todaySpent.toStringAsFixed(0)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
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
                        Text('₹${monthSpent.toStringAsFixed(0)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0F766E))),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Transactions',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
              Text(
                '${filtered.length} items',
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
          const SizedBox(height: 8),

          if (filtered.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
                child: Column(
                  children: [
                    Icon(Icons.receipt_long_outlined, size: 48, color: Colors.grey.shade400),
                    const SizedBox(height: 12),
                    const Text(
                      'Ready to track your live expenses!',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Whenever you pay via GPay, PhonePe, or Paytm, the notification popup will let you categorize it right from the top drawer.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
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
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '₹${exp.amount.toStringAsFixed(0)}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      const Icon(Icons.chevron_right, size: 18, color: Colors.grey),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}
