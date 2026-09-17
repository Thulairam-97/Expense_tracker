import React, { useMemo } from 'react';
import { Expense, Category, PaymentSource } from '../types';
import {
  TrendingUp,
  PieChart,
  BarChart3,
  Calendar,
  Store,
  CreditCard,
  Zap,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';

interface TrendsViewProps {
  expenses: Expense[];
  categories: Category[];
}

export const TrendsView: React.FC<TrendsViewProps> = ({ expenses, categories }) => {
  // Category map for quick lookup
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Aggregated calculations
  const analytics = useMemo(() => {
    let total = 0;
    const catMap: Record<string, { amount: number; count: number }> = {};
    const merchantMap: Record<string, { amount: number; count: number }> = {};
    const sourceMap: Record<string, number> = {};
    const dayOfWeekMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    expenses.forEach((e) => {
      total += e.amount;

      // Category breakdown
      if (!catMap[e.categoryId]) {
        catMap[e.categoryId] = { amount: 0, count: 0 };
      }
      catMap[e.categoryId].amount += e.amount;
      catMap[e.categoryId].count += 1;

      // Merchant breakdown
      if (!merchantMap[e.merchant]) {
        merchantMap[e.merchant] = { amount: 0, count: 0 };
      }
      merchantMap[e.merchant].amount += e.amount;
      merchantMap[e.merchant].count += 1;

      // Payment source
      sourceMap[e.paymentSource] = (sourceMap[e.paymentSource] || 0) + e.amount;

      // Day of week (0 = Sun, 1 = Mon ... 6 = Sat)
      const day = new Date(e.timestamp).getDay();
      dayOfWeekMap[day] += e.amount;
    });

    const sortedCategories = Object.entries(catMap)
      .map(([catId, data]) => ({
        categoryId: catId,
        amount: data.amount,
        count: data.count,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
        category: categoryMap.get(catId),
      }))
      .sort((a, b) => b.amount - a.amount);

    const sortedMerchants = Object.entries(merchantMap)
      .map(([merchant, data]) => ({
        merchant,
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    const avgSpend = expenses.length > 0 ? total / expenses.length : 0;
    const maxDaySpend = Math.max(...Object.values(dayOfWeekMap), 1);

    return {
      total,
      count: expenses.length,
      avgSpend,
      sortedCategories,
      sortedMerchants,
      sourceMap,
      dayOfWeekMap,
      maxDaySpend,
    };
  }, [expenses, categoryMap]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="w-14 h-14 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-4">
          <TrendingUp className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Spending Trends Recorded</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          When UPI transactions occur from Google Pay, PhonePe, or Paytm, dynamic category distributions, merchant rankings, and 7-day spending velocity will render here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Velocity Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute right-3 top-3 opacity-15">
            <TrendingUp className="w-20 h-20" />
          </div>
          <span className="text-[11px] font-bold tracking-wider text-teal-300 uppercase">
            Total Spend Velocity
          </span>
          <p className="text-3xl font-extrabold mt-1 tracking-tight">
            ₹{analytics.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-teal-200">
            <span className="bg-teal-700/60 px-2 py-0.5 rounded-md font-semibold">
              {analytics.count} transactions
            </span>
            <span>recorded</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Average Per Payment
          </span>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            ₹{analytics.avgSpend.toFixed(0)}
          </p>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Mean ticket size across all UPI apps</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Top Spend Category
          </span>
          <p className="text-2xl font-bold text-teal-700 mt-1 truncate">
            {analytics.sortedCategories[0]?.category?.name || 'N/A'}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {analytics.sortedCategories[0]
              ? `₹${analytics.sortedCategories[0].amount.toFixed(0)} (${analytics.sortedCategories[0].percentage.toFixed(1)}% of total)`
              : 'No categories recorded'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-teal-700" />
              <h3 className="text-sm font-bold text-slate-900">Category Distribution</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">By expenditure</span>
          </div>

          <div className="space-y-3.5">
            {analytics.sortedCategories.map((item) => {
              const catColor = item.category?.color || '#0F766E';
              return (
                <div key={item.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: catColor }}
                      />
                      <span className="font-semibold text-slate-800">
                        {item.category?.name || 'Other'}
                      </span>
                      <span className="text-slate-400 font-normal">
                        ({item.count} {item.count === 1 ? 'txn' : 'txns'})
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-1.5">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: catColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-Day Expenditure Bars */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">Day-of-Week Activity</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">Spending pattern</span>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-6 pb-2 items-end h-44">
              {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                const dayAmount = analytics.dayOfWeekMap[dayIdx] || 0;
                const heightPct = Math.max(
                  (dayAmount / analytics.maxDaySpend) * 100,
                  dayAmount > 0 ? 8 : 3
                );
                const isPeak = dayAmount > 0 && dayAmount === analytics.maxDaySpend;

                return (
                  <div
                    key={dayIdx}
                    className="flex flex-col items-center justify-end h-full gap-2 group"
                  >
                    <span className="text-[10px] font-semibold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {dayAmount > 0 ? `₹${Math.round(dayAmount)}` : '-'}
                    </span>
                    <div className="w-full max-w-[28px] h-28 bg-slate-100 rounded-t-lg flex items-end overflow-hidden p-0.5">
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          isPeak ? 'bg-teal-600' : dayAmount > 0 ? 'bg-teal-700/80' : 'bg-transparent'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span
                      className={`text-[11px] font-semibold ${
                        isPeak ? 'text-teal-700 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {dayNames[dayIdx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Hover bars for exact daily values</span>
            <span className="text-teal-700 font-medium">Peak: ₹{analytics.maxDaySpend.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Top Merchants List */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Top Merchants / Payees</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {analytics.sortedMerchants.length} unique merchants
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {analytics.sortedMerchants.slice(0, 6).map((m, idx) => (
            <div
              key={m.merchant}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{m.merchant}</p>
                  <p className="text-[10px] text-slate-400">
                    {m.count} {m.count === 1 ? 'payment' : 'payments'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-900 shrink-0 ml-2">
                ₹{m.amount.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
