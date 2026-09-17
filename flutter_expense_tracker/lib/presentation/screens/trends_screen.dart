import 'package:flutter/material.dart';
import '../../domain/models/category.dart';
import '../../domain/models/expense.dart';
import '../../domain/models/payment_source.dart';

class TrendsScreen extends StatelessWidget {
  final List<Expense> expenses;
  final List<ExpenseCategory> categories;

  const TrendsScreen({
    super.key,
    required this.expenses,
    required this.categories,
  });

  @override
  Widget build(BuildContext context) {
    if (expenses.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFFCCFBF1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.trending_up_rounded,
                  size: 48,
                  color: Color(0xFF0F766E),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'No Expense Trends Yet',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF191C1B),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'As soon as you make payments via Google Pay, PhonePe, or Paytm, real-time analytics and category trends will appear here.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
      );
    }

    // Calculations
    double totalSpent = 0;
    final Map<String, double> categoryTotals = {};
    final Map<String, double> merchantTotals = {};
    final Map<PaymentSource, double> sourceTotals = {};
    final Map<int, double> dayOfWeekTotals = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0};

    for (final e in expenses) {
      totalSpent += e.amount;
      categoryTotals[e.categoryId] = (categoryTotals[e.categoryId] ?? 0) + e.amount;
      merchantTotals[e.merchant] = (merchantTotals[e.merchant] ?? 0) + e.amount;
      sourceTotals[e.paymentSource] = (sourceTotals[e.paymentSource] ?? 0) + e.amount;
      final weekday = e.timestamp.weekday; // 1 = Mon, 7 = Sun
      dayOfWeekTotals[weekday] = (dayOfWeekTotals[weekday] ?? 0) + e.amount;
    }

    final sortedCategories = categoryTotals.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final sortedMerchants = merchantTotals.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final double avgSpend = expenses.isNotEmpty ? totalSpent / expenses.length : 0;
    final maxDaySpend = dayOfWeekTotals.values.fold<double>(0.0, (prev, curr) => curr > prev ? curr : prev);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Total Overview Card
        Card(
          elevation: 0,
          color: const Color(0xFF0F766E),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'TOTAL SPEND RECORDED',
                      style: TextStyle(
                        fontSize: 11,
                        letterSpacing: 1.2,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF99F6E4),
                      ),
                    ),
                    Icon(Icons.insights_rounded, color: Colors.white70, size: 20),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  '₹${totalSpent.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    _metricChip('Transactions', '${expenses.length}'),
                    const SizedBox(width: 12),
                    _metricChip('Avg / Payment', '₹${avgSpend.toStringAsFixed(0)}'),
                  ],
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 20),

        // Category Breakdown Card
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Category Breakdown',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    Icon(Icons.pie_chart_outline_rounded, size: 20, color: Color(0xFF0F766E)),
                  ],
                ),
                const SizedBox(height: 16),
                ...sortedCategories.map((entry) {
                  final cat = categories.firstWhere(
                    (c) => c.id == entry.key,
                    orElse: () => ExpenseCategory(
                      id: entry.key,
                      name: 'Other',
                      iconName: 'tag',
                      colorValue: 0xFF64748B,
                    ),
                  );
                  final pct = totalSpent > 0 ? (entry.value / totalSpent) : 0.0;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 10,
                                  height: 10,
                                  decoration: BoxDecoration(
                                    color: Color(cat.colorValue),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  cat.name,
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                ),
                              ],
                            ),
                            Text(
                              '₹${entry.value.toStringAsFixed(0)} (${(pct * 100).toStringAsFixed(1)}%)',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: pct,
                            backgroundColor: const Color(0xFFF1F5F9),
                            valueColor: AlwaysStoppedAnimation<Color>(Color(cat.colorValue)),
                            minHeight: 6,
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ),

        const SizedBox(height: 20),

        // Day of Week Activity
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Spending by Day of Week',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 18),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    _dayBar('Mon', dayOfWeekTotals[1] ?? 0, maxDaySpend),
                    _dayBar('Tue', dayOfWeekTotals[2] ?? 0, maxDaySpend),
                    _dayBar('Wed', dayOfWeekTotals[3] ?? 0, maxDaySpend),
                    _dayBar('Thu', dayOfWeekTotals[4] ?? 0, maxDaySpend),
                    _dayBar('Fri', dayOfWeekTotals[5] ?? 0, maxDaySpend),
                    _dayBar('Sat', dayOfWeekTotals[6] ?? 0, maxDaySpend),
                    _dayBar('Sun', dayOfWeekTotals[7] ?? 0, maxDaySpend),
                  ],
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 20),

        // Top Merchants
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Top Merchants / Payees',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                ...sortedMerchants.take(5).map((entry) {
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    leading: CircleAvatar(
                      backgroundColor: const Color(0xFFF1F5F9),
                      child: const Icon(Icons.storefront_outlined, color: Color(0xFF0F766E), size: 18),
                    ),
                    title: Text(
                      entry.key,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                    trailing: Text(
                      '₹${entry.value.toStringAsFixed(0)}',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F766E)),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
      ],
    );
  }

  static Widget _metricChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$label: ',
            style: const TextStyle(color: Colors.white70, fontSize: 11),
          ),
          Text(
            value,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
          ),
        ],
      ),
    );
  }

  static Widget _dayBar(String day, double amount, double maxAmount) {
    final double ratio = maxAmount > 0 ? (amount / maxAmount) : 0.0;
    final double barHeight = 70 * ratio;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          amount > 0 ? '₹${amount.toStringAsFixed(0)}' : '-',
          style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 4),
        Container(
          width: 14,
          height: barHeight < 4 && amount > 0 ? 4 : (barHeight < 2 ? 2 : barHeight),
          decoration: BoxDecoration(
            color: amount > 0 ? const Color(0xFF0F766E) : const Color(0xFFE2E8F0),
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          day,
          style: TextStyle(
            fontSize: 11,
            fontWeight: amount > 0 ? FontWeight.bold : FontWeight.normal,
            color: amount > 0 ? const Color(0xFF1E293B) : const Color(0xFF94A3B8),
          ),
        ),
      ],
    );
  }
}
