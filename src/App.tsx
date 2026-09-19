import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Tag,
  Calendar,
  Layers,
  FileCode,
  ShieldCheck,
  CheckCircle,
  Smartphone,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Trash2,
  Lock,
  Play,
  Video,
} from 'lucide-react';
import { Expense, Category, PaymentSource, TransactionStatus } from './types';
import { DEFAULT_CATEGORIES } from './data/defaultCategories';
import { ActionableNotificationBar } from './components/ActionableNotificationBar';
import { NotificationTestbench } from './components/NotificationTestbench';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { ManualExpenseModal } from './components/ManualExpenseModal';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { CodeExplorer } from './components/CodeExplorer';
import { PhoneSimulatorVideo } from './components/PhoneSimulatorVideo';
import { AppLogo } from './components/AppLogo';
import { PinScreen } from './components/PinScreen';
import { TrendsView } from './components/TrendsView';
import { SettingsView } from './components/SettingsView';

// Initial sample transactions to showcase rich state
const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    amount: 450,
    merchant: 'ABC Supermarket',
    categoryId: 'cat_groceries',
    timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(), // 42 mins ago
    paymentSource: 'gpay',
    status: 'success',
    referenceId: '312345678901',
    rawNotificationText: 'Paid ₹450 to ABC Supermarket. Ref: 312345678901',
  },
  {
    id: 'exp_2',
    amount: 820,
    merchant: 'Blue Tokai Coffee',
    categoryId: 'cat_food',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
    paymentSource: 'phonepe',
    status: 'success',
    referenceId: 'T240914123456',
    rawNotificationText: 'Payment of ₹820 to Blue Tokai Coffee was successful. Txn ID: T240914123456',
  },
  {
    id: 'exp_3',
    amount: 1500,
    merchant: 'Indian Oil Petrol Pump',
    categoryId: 'cat_fuel',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // Yesterday
    paymentSource: 'paytm',
    status: 'success',
    referenceId: 'PT9912401',
    rawNotificationText: 'Paid ₹1,500 at Indian Oil Petrol Pump. Txn ID: PT9912401',
  },
  {
    id: 'exp_4',
    amount: 299,
    merchant: 'Jio Prepaid Recharge',
    categoryId: 'cat_recharge',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(), // 2 days ago
    paymentSource: 'gpay',
    status: 'success',
    referenceId: '3998124501',
    rawNotificationText: 'Paid ₹299 to Jio Prepaid. Ref: 3998124501',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'app' | 'video' | 'architecture' | 'code'>('app');
  const [appSubTab, setAppSubTab] = useState<'expenses' | 'trends' | 'simulator' | 'settings'>('expenses');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [savedPin, setSavedPin] = useState<string>('1234');
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(30000);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Modals
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Active Pending Notification for One-Tap Category assignment
  const [pendingNotification, setPendingNotification] = useState<{
    id: string;
    amount: number;
    merchant: string;
    source: PaymentSource;
    referenceId?: string;
    rawText: string;
    suggestedCategoryId?: string;
    timestamp: number;
  } | null>(null);

  // Status message for notification simulations (e.g. "Duplicate blocked", "Income ignored")
  const [simulationBanner, setSimulationBanner] = useState<{
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
  } | null>(null);

  // Computed Metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let todaySpending = 0;
    let weekSpending = 0;
    let monthSpending = 0;

    const categoryMap: Record<string, number> = {};

    expenses.forEach((exp) => {
      if (exp.status !== 'success') return;
      const expTime = new Date(exp.timestamp).getTime();

      if (expTime >= todayStart) {
        todaySpending += exp.amount;
      }
      if (expTime >= weekStart) {
        weekSpending += exp.amount;
      }
      if (expTime >= monthStart) {
        monthSpending += exp.amount;
      }

      categoryMap[exp.categoryId] = (categoryMap[exp.categoryId] || 0) + exp.amount;
    });

    return {
      todaySpending,
      weekSpending,
      monthSpending,
      transactionCount: expenses.length,
      categoryMap,
    };
  }, [expenses]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchesSearch =
        exp.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.referenceId && exp.referenceId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategoryFilter === 'all' || exp.categoryId === selectedCategoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [expenses, searchQuery, selectedCategoryFilter]);

  // Handle incoming notification simulation
  const handleSimulateNotification = ({
    packageName,
    source,
    title,
    body,
  }: {
    packageName: string;
    source: PaymentSource;
    title: string;
    body: string;
  }) => {
    const fullText = `${title} ${body}`;
    const lower = fullText.toLowerCase();

    // 1. Check for Credit / Money Received
    if (lower.includes('received') || lower.includes('credited') || lower.includes('sent you')) {
      setSimulationBanner({
        type: 'info',
        message: '⚡ Notification Filtered: Incoming money detected. Not counted as an expense.',
      });
      setTimeout(() => setSimulationBanner(null), 4000);
      return;
    }

    // 2. Check for Failed / Declined transaction
    if (lower.includes('failed') || lower.includes('declined')) {
      setSimulationBanner({
        type: 'warning',
        message: '⚠️ Notification Filtered: Payment failed/declined. Not counted as an expense.',
      });
      setTimeout(() => setSimulationBanner(null), 4000);
      return;
    }

    // 3. Extract Amount
    const amountMatch = fullText.match(/(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
    if (!amountMatch) {
      setSimulationBanner({
        type: 'error',
        message: 'Could not extract valid currency amount from notification.',
      });
      setTimeout(() => setSimulationBanner(null), 3000);
      return;
    }
    const cleanAmount = parseFloat(amountMatch[1].replace(/,/g, ''));

    // 4. Extract Merchant
    let merchant = 'UPI Recipient';
    const payeeMatch =
      fullText.match(/(?:paid|sent|payment of|transferred)\s+(?:₹|rs\.?|inr)?\s*[0-9,.]+\s+(?:to|at)\s+([^,.\n]+)/i) ||
      fullText.match(/(?:paid to|sent to|transferred to)\s+([^,.\n]+)/i) ||
      fullText.match(/towards\s+([^,.\n]+)/i);

    if (payeeMatch && payeeMatch[1]) {
      merchant = payeeMatch[1].replace(/via|using|ref|txn|avl|bal|successful.*/i, '').trim();
    }

    // 5. Extract Reference ID
    const refMatch = fullText.match(/(?:ref|utr|txn|id)[:\s]*([A-Za-z0-9]{8,18})/i);
    const referenceId = refMatch ? refMatch[1] : undefined;

    // 6. Duplicate Detection Check
    const now = Date.now();
    const isDuplicate = expenses.some((exp) => {
      if (referenceId && exp.referenceId === referenceId) return true;
      const diffMinutes = Math.abs(now - new Date(exp.timestamp).getTime()) / (1000 * 60);
      return diffMinutes < 5 && Math.abs(exp.amount - cleanAmount) < 0.01 && exp.merchant.toLowerCase() === merchant.toLowerCase();
    });

    if (isDuplicate) {
      setSimulationBanner({
        type: 'warning',
        message: `🛡️ Duplicate Blocked: Transaction of ₹${cleanAmount} to "${merchant}" was already recorded!`,
      });
      setTimeout(() => setSimulationBanner(null), 4500);
      return;
    }

    // Category Suggestion
    let initialCategoryId = 'cat_other';
    const lowMerch = merchant.toLowerCase();
    if (lowMerch.includes('swiggy') || lowMerch.includes('coffee') || lowMerch.includes('food') || lowMerch.includes('cafe')) {
      initialCategoryId = 'cat_food';
    } else if (lowMerch.includes('supermarket') || lowMerch.includes('market') || lowMerch.includes('grocer') || lowMerch.includes('foods')) {
      initialCategoryId = 'cat_groceries';
    } else if (lowMerch.includes('petrol') || lowMerch.includes('fuel')) {
      initialCategoryId = 'cat_fuel';
    } else if (lowMerch.includes('rahul') || lowMerch.includes('friend') || lowMerch.includes('transfer')) {
      initialCategoryId = 'cat_transfer';
    }

    const newExpenseId = 'exp_' + Date.now();
    const autoRecordedExpense: Expense = {
      id: newExpenseId,
      amount: cleanAmount,
      merchant,
      categoryId: initialCategoryId,
      timestamp: new Date(now).toISOString(),
      paymentSource: source,
      status: 'success',
      referenceId,
      rawNotificationText: fullText,
    };

    // Auto-record immediately (Zero manual entry)
    setExpenses((prev) => [autoRecordedExpense, ...prev]);

    // Also prompt user with the Actionable Notification Banner so they can switch category
    setPendingNotification({
      id: newExpenseId,
      amount: cleanAmount,
      merchant,
      source,
      referenceId,
      rawText: fullText,
      suggestedCategoryId: initialCategoryId,
      timestamp: now,
    });

    setSimulationBanner({
      type: 'success',
      message: `🔔 ₹${cleanAmount} paid to "${merchant}" auto-recorded! Tap a category to change.`,
    });
    setTimeout(() => setSimulationBanner(null), 5000);
  };

  // Record category from Actionable Notification (Zero manual entry)
  const handleAssignCategory = (categoryId: string) => {
    if (!pendingNotification) return;

    setExpenses((prev) =>
      prev.map((exp) =>
        exp.id === pendingNotification.id ? { ...exp, categoryId } : exp
      )
    );
    setPendingNotification(null);

    setSimulationBanner({
      type: 'success',
      message: `✅ Categorized as ${categories.find((c) => c.id === categoryId)?.name || 'Updated'}!`,
    });
    setTimeout(() => setSimulationBanner(null), 3000);
  };

  // Save manual expense
  const handleSaveManual = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: 'exp_' + Date.now(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  // Delete expense
  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const budgetPercentage = Math.min(100, Math.round((metrics.monthSpending / monthlyBudget) * 100));

  if (!isAuthenticated) {
    return (
      <PinScreen
        savedPin={savedPin}
        userName="Thulasiram"
        onAuthenticated={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      {/* Top App Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAuthenticated(false)}
              title="Click App Icon to lock and test PIN & Loading experience"
              className="cursor-pointer group flex items-center gap-1.5 focus:outline-none"
            >
              <AppLogo size={42} showGlow={true} className="group-hover:scale-105 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  UPI Expense Tracker
                </h1>
                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  Live On-Device Vault
                </span>
              </div>
              <p className="text-xs text-slate-500">Zero-Manual Entry • 100% Offline & Private</p>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('app')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'app'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-600" />
              <span>Mobile App Preview</span>
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'video'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-teal-800 bg-teal-50 hover:bg-teal-100'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Phone Simulation Video</span>
              <span className="bg-amber-400 text-amber-950 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                SIMULATOR
              </span>
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'architecture'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Architecture & Plan</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-purple-600" />
              <span>Generated Code</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuthenticated(false)}
              className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
              title="Lock app to test PIN screen and loading logo"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Lock</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Clear all expenses to start fresh with live calculations?')) {
                  setExpenses([]);
                  setSimulationBanner({
                    type: 'info',
                    message: 'All expense data cleared. Clean slate ready for live transaction calculations!',
                  });
                  setTimeout(() => setSimulationBanner(null), 4000);
                }
              }}
              className="border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
              title="Clear all expenses for live data testing"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </header>

      {/* Simulation Alert Banner */}
      {simulationBanner && (
        <div
          className={`max-w-7xl mx-auto px-4 mt-3 animate-in fade-in slide-in-from-top-2 duration-200`}
        >
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border shadow-xs ${
              simulationBanner.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : simulationBanner.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : simulationBanner.type === 'info'
                ? 'bg-blue-50 text-blue-900 border-blue-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {simulationBanner.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            )}
            <span>{simulationBanner.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'video' ? (
          <PhoneSimulatorVideo />
        ) : activeTab === 'architecture' ? (
          <ArchitectureDocs />
        ) : activeTab === 'code' ? (
          <CodeExplorer />
        ) : (
          /* Live App View */
          <div className="space-y-6">
            {/* Mobile App Sub-Navigation Bar */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAppSubTab('expenses')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    appSubTab === 'expenses'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Expenses</span>
                </button>
                <button
                  onClick={() => setAppSubTab('trends')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    appSubTab === 'trends'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Trends & Analytics</span>
                </button>
                <button
                  onClick={() => setAppSubTab('simulator')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    appSubTab === 'simulator'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>UPI Simulator</span>
                </button>
                <button
                  onClick={() => setAppSubTab('settings')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    appSubTab === 'settings'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Security & Settings</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 pr-3 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-700">Live Local Engine</span>
              </div>
            </div>

            {appSubTab === 'trends' ? (
              <TrendsView expenses={expenses} categories={categories} />
            ) : appSubTab === 'settings' ? (
              <SettingsView
                onLockApp={() => setIsAuthenticated(false)}
                onClearAllData={() => {
                  if (window.confirm('Clear all expenses to start fresh?')) {
                    setExpenses([]);
                    setSimulationBanner({
                      type: 'info',
                      message: 'All expense data cleared. Clean slate ready for live transaction calculations!',
                    });
                    setTimeout(() => setSimulationBanner(null), 4000);
                  }
                }}
                savedPin={savedPin}
                onUpdatePin={(newPin) => setSavedPin(newPin)}
                expenseCount={expenses.length}
              />
            ) : appSubTab === 'simulator' ? (
              <div className="max-w-4xl mx-auto space-y-4">
                <NotificationTestbench
                  onSimulate={handleSimulateNotification}
                  onClearTransactions={() => setExpenses([])}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Phone Shell Preview */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Video Walkthrough Quick Launcher */}
                  <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-3.5 rounded-2xl shadow-xs border border-teal-700/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
                        <Play className="w-4 h-4 text-teal-300 fill-teal-300" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          How it works on Android 11
                          <span className="text-[10px] bg-amber-400 text-amber-950 font-extrabold px-1.5 py-0.2 rounded-full">
                            Video Demo
                          </span>
                        </p>
                        <p className="text-[11px] text-teal-200">
                          Watch the step-by-step video simulation of sending ₹1 in PhonePe & auto-logging.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('video')}
                      className="bg-white hover:bg-teal-50 text-teal-900 text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 shadow-xs flex items-center gap-1 transition-all"
                    >
                      <span>Watch</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Actionable Notification Prompt Banner */}
                  <ActionableNotificationBar
                    notification={pendingNotification}
                    categories={categories}
                    onSelectCategory={handleAssignCategory}
                    onDismiss={() => setPendingNotification(null)}
                  />

              {/* Status & Listener Info Card */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Notification Listener Service Active
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Listening to GPay, PhonePe, Paytm, BHIM, Bank UPI.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  Android 8.0 – 14+ (API 26+)
                </span>
              </div>

              {/* Spending Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Today
                  </span>
                  <div className="text-xl font-bold text-slate-900">
                    ₹{metrics.todaySpending.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    This Week
                  </span>
                  <div className="text-xl font-bold text-slate-900">
                    ₹{metrics.weekSpending.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    This Month
                  </span>
                  <div className="text-xl font-bold text-teal-700">
                    ₹{metrics.monthSpending.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Transactions
                  </span>
                  <div className="text-xl font-bold text-slate-900">
                    {metrics.transactionCount}
                  </div>
                </div>
              </div>

              {/* Monthly Budget Tracker */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Monthly Budget Tracking</span>
                  <span className="text-slate-500 font-medium">
                    ₹{metrics.monthSpending.toLocaleString('en-IN')} of ₹
                    {monthlyBudget.toLocaleString('en-IN')} ({budgetPercentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      budgetPercentage > 85 ? 'bg-rose-500' : 'bg-teal-600'
                    }`}
                    style={{ width: `${budgetPercentage}%` }}
                  />
                </div>
              </div>

              {/* Transactions List with Search & Category Filters */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">Expenses & Transactions</h3>
                    <span className="text-xs text-slate-400 font-medium">
                      Showing {filteredExpenses.length} items
                    </span>
                  </div>

                  {/* Search and Category Filter Bar */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search merchant, notes, ref ID..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* List Items */}
                <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                  {filteredExpenses.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No expenses match your search. Use the testbench to simulate a payment!
                    </div>
                  ) : (
                    filteredExpenses.map((exp) => {
                      const cat = categories.find((c) => c.id === exp.categoryId);
                      const timeStr = new Date(exp.timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      });

                      return (
                        <div
                          key={exp.id}
                          onClick={() => setSelectedExpense(exp)}
                          className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-xs"
                              style={{ backgroundColor: cat?.color ?? '#0f766e' }}
                            >
                              {cat?.name.substring(0, 2).toUpperCase() ?? 'EX'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                                  {exp.merchant}
                                </h4>
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {exp.paymentSource}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <span>{cat?.name ?? 'General'}</span>
                                <span>•</span>
                                <span>{timeStr}</span>
                                {exp.referenceId && (
                                  <>
                                    <span>•</span>
                                    <span className="font-mono text-[10px]">
                                      Ref: {exp.referenceId}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-bold text-slate-900">
                              ₹{exp.amount.toLocaleString('en-IN')}
                            </div>
                            <span className="text-[10px] text-emerald-600 font-medium">
                              Recorded
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Notification Testbench & Category Analytics */}
            <div className="lg:col-span-5 space-y-4">
              {/* Android Notification Testbench */}
              <NotificationTestbench
                onSimulate={handleSimulateNotification}
                onClearTransactions={() => setExpenses([])}
              />

              {/* Category Spending Breakdown */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800">Category Spending</h3>
                  <span className="text-[11px] text-slate-400">This Month</span>
                </div>

                <div className="space-y-2.5">
                  {categories.slice(0, 6).map((cat) => {
                    const spent = metrics.categoryMap[cat.id] || 0;
                    const pct = metrics.monthSpending > 0 ? Math.round((spent / metrics.monthSpending) * 100) : 0;

                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </span>
                          <span className="font-bold text-slate-900">
                            ₹{spent.toLocaleString('en-IN')}{' '}
                            <span className="text-slate-400 font-normal">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )}
      </main>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        expense={selectedExpense}
        category={categories.find((c) => c.id === selectedExpense?.categoryId)}
        onClose={() => setSelectedExpense(null)}
        onDelete={handleDeleteExpense}
      />

      {/* Manual Expense Modal */}
      <ManualExpenseModal
        isOpen={isManualModalOpen}
        categories={categories}
        onClose={() => setIsManualModalOpen(false)}
        onSave={handleSaveManual}
      />
    </div>
  );
}
