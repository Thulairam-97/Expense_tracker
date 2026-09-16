import React, { useState } from 'react';
import { Layers, FolderTree, Cpu, Database, Milestone, FileCode, CheckCircle2, Copy, Check, Smartphone, ShieldAlert, Terminal } from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Dedicated Section: Redmi Note 8 Pro (Android 11 / MIUI) Local Setup */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 border border-slate-700 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Redmi Note 8 Pro & Android 11 (MIUI) Local Setup
              </h3>
              <span className="text-[10px] font-bold uppercase bg-teal-500/20 text-teal-300 border border-teal-400/30 px-2 py-0.5 rounded-full">
                API Level 30
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Step-by-step guide to run and test on your phone with MIUI battery & autostart handling.
            </p>
          </div>
        </div>

        {/* 4 Essential Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Step 1 */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-teal-300 font-bold">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-[10px]">1</span>
              <span>Export Code to Your PC / Mac</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              In Google AI Studio, click the menu in the top right and choose <strong>Download ZIP</strong> or <strong>Export to GitHub</strong>. Extract the project and open the <code className="bg-slate-900 px-1 py-0.5 rounded text-teal-300 font-mono">flutter_expense_tracker/</code> folder.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-teal-300 font-bold">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-[10px]">2</span>
              <span>Enable Developer Options on Redmi Note 8 Pro</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Open <strong>Settings → About phone</strong>. Tap <strong>MIUI version</strong> 7 times continuously until you see <em>"You are now a developer!"</em>
            </p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Then go to <strong>Settings → Additional settings → Developer options</strong> and turn <strong>ON</strong>:
              <br />• <strong>USB debugging</strong>
              <br />• <strong>Install via USB</strong>
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-[10px]">3</span>
              <span>Crucial MIUI Background Permissions</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              MIUI aggressively sleeps background services unless configured:
              <br />• <strong>Autostart:</strong> Long-press app icon → <em>App info</em> → Toggle <strong>Autostart: ON</strong>.
              <br />• <strong>Battery Saver:</strong> In <em>App info</em> → Battery saver → Choose <strong>No restrictions</strong>.
              <br />• <strong>Notification Access:</strong> In app, tap <em>Enable in Settings</em> → Accept the 10-second MIUI warning modal.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-teal-300 font-bold">
              <span className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-[10px]">4</span>
              <span>Run or Build APK via Terminal</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-[11px] text-teal-300 space-y-1">
              <div># Check phone connection</div>
              <div className="text-white">flutter devices</div>
              <div className="text-slate-500 pt-1"># Run directly on your phone</div>
              <div className="text-white">flutter run</div>
              <div className="text-slate-500 pt-1"># Or build APK file to install manually</div>
              <div className="text-white">flutter build apk --debug</div>
            </div>
          </div>
        </div>
      </section>

      {/* 1. Proposed Architecture */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">1. Proposed High-Level Architecture</h3>
            <p className="text-xs text-slate-500">Android Native Kotlin Bridge + Flutter Clean Architecture</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              Native Android Layer
            </span>
            <h4 className="text-sm font-semibold text-slate-900 mt-2">NotificationListenerService</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Native Kotlin service registered with <code className="text-[11px] bg-white px-1 py-0.5 rounded border border-slate-300">BIND_NOTIFICATION_LISTENER_SERVICE</code>. Listens only to supported payment packages (GPay, PhonePe, Paytm, BHIM, Bank apps) to protect user privacy.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-100 px-2 py-0.5 rounded">
              Platform Channels
            </span>
            <h4 className="text-sm font-semibold text-slate-900 mt-2">MethodChannel & EventChannel</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Streams intercepted notifications in real-time to Dart. Also provides permission check methods and requests the system to display Android 13+ actionable notification category buttons.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
              Flutter Application Layer
            </span>
            <h4 className="text-sm font-semibold text-slate-900 mt-2">Domain + Drift SQLite</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Extensible parser factory (<code className="text-[11px] bg-white px-1 py-0.5 rounded border border-slate-300">BaseNotificationParser</code>), duplicate detection engine, local Drift SQLite offline database, and Material 3 UI.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Folder Structure */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">2. Production Folder Structure</h3>
            <p className="text-xs text-slate-500">Modular Clean Architecture with clean separation of concerns</p>
          </div>
        </div>

        <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`flutter_expense_tracker/
├── android/
│   └── app/src/main/
│       ├── AndroidManifest.xml                  # BIND_NOTIFICATION_LISTENER_SERVICE & POST_NOTIFICATIONS
│       └── kotlin/com/personal/upiexpensetracker/
│           ├── MainActivity.kt                  # MethodChannel & EventChannel setup
│           └── service/
│               ├── PaymentNotificationListenerService.kt # Captures UPI status bar notifications
│               └── NotificationActionReceiver.kt          # Handles quick category clicks from notification
├── lib/
│   ├── core/
│   │   ├── parsers/                             # Extensible Notification Parsers
│   │   │   ├── base_notification_parser.dart
│   │   │   ├── gpay_notification_parser.dart
│   │   │   ├── phonepe_notification_parser.dart
│   │   │   ├── paytm_notification_parser.dart
│   │   │   ├── generic_upi_notification_parser.dart
│   │   │   └── notification_parser_factory.dart
│   │   └── services/
│   │       ├── duplicate_detector.dart          # Amount + Merchant + Time Window duplicate prevention
│   │       ├── notification_stream_service.dart # Flutter EventChannel receiver
│   │       └── platform_channel_service.dart    # Permission & Notification action bridge
│   ├── data/
│   │   └── database/
│   │       ├── tables.dart                      # Drift SQLite schema definitions
│   │       └── app_database.dart                # Database queries and transactions
│   ├── domain/
│   │   └── models/
│   │       ├── expense.dart                     # Core Expense Entity
│   │       ├── category.dart                    # Category with default 14 categories
│   │       ├── payment_source.dart              # GPay, PhonePe, Paytm, BHIM, Bank
│   │       ├── transaction_status.dart          # Success, Pending, Failed, Reversed, Refunded, Credited
│   │       ├── parsed_transaction.dart          # Parsed notification candidate
│   │       └── budget.dart                      # Monthly & Category budget limits
│   └── presentation/
│       ├── theme/app_theme.dart                 # Material 3 Light and Dark schemes
│       ├── screens/                             # Dashboard, Transactions, Budget, Settings
│       └── widgets/                             # Quick Actionable category notification banner
├── test/
│   ├── notification_parser_test.dart            # Unit tests for GPay, PhonePe, Paytm formats
│   └── duplicate_detector_test.dart             # Unit tests for duplicate prevention
└── pubspec.yaml                                 # Dependencies`}
        </pre>
      </section>

      {/* 3. Platform Communication */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">3. Android Notification Integration Flow</h3>
            <p className="text-xs text-slate-500">Zero-manual entry pipeline with Android Actionable Notifications</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3 font-mono">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-[10px]">1</span>
            <span>User makes payment via GPay / PhonePe / Paytm / BHIM</span>
          </div>
          <div className="ml-7 text-slate-500 text-[11px] font-sans">
            Android system posts payment confirmation notification in status bar.
          </div>

          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-[10px]">2</span>
            <span>PaymentNotificationListenerService.onNotificationPosted() triggers</span>
          </div>
          <div className="ml-7 text-slate-500 text-[11px] font-sans">
            Checks <code className="bg-white px-1 border border-slate-300 rounded">SUPPORTED_PACKAGES</code> filter. Non-payment apps are ignored immediately. Extracts title, body, timestamp, and notification ID.
          </div>

          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-[10px]">3</span>
            <span>EventChannel streams payload to Flutter Dart</span>
          </div>
          <div className="ml-7 text-slate-500 text-[11px] font-sans">
            Dispatches to <code className="bg-white px-1 border border-slate-300 rounded">NotificationParserFactory</code>. Identifies transaction status: if failed, pending, or credited (incoming money), it is rejected.
          </div>

          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-[10px]">4</span>
            <span>DuplicateDetector verifies fingerprint</span>
          </div>
          <div className="ml-7 text-slate-500 text-[11px] font-sans">
            Checks exact reference/UTR ID and fuzzy (Amount + Payee + 3-minute window) match against recent entries.
          </div>

          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <span className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 text-[10px]">5</span>
            <span className="text-emerald-900 font-bold">Actionable Category Notification is posted</span>
          </div>
          <div className="ml-7 text-slate-500 text-[11px] font-sans">
            Our app displays an interactive Android notification: <code className="bg-emerald-100 text-emerald-900 px-1 border border-emerald-300 rounded">₹450 paid to ABC Supermarket: [🍔 Food] [🛒 Grocery] [⛽ Fuel]</code>. Tapping directly records the expense without opening the app!
          </div>
        </div>
      </section>

      {/* 4. Development Milestones */}
      <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <Milestone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">4. Development Milestones Plan</h3>
            <p className="text-xs text-slate-500">Incremental implementation roadmap requested</p>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { id: 1, title: 'Project Setup & Domain Entities', status: 'completed', desc: 'pubspec.yaml, models (Expense, Category, Budget, PaymentSource), Material 3 Theme tokens' },
            { id: 2, title: 'Database Schema & Drift Tables', status: 'completed', desc: 'Relational tables for expenses, categories, budgets, and notification logs with unique constraints' },
            { id: 3, title: 'Notification Parsing Architecture', status: 'completed', desc: 'BaseNotificationParser, GPay, PhonePe, Paytm, and Generic UPI parsers + Parser Factory' },
            { id: 4, title: 'Duplicate Detection Engine', status: 'completed', desc: 'Reference ID matching + 3-minute fuzzy timestamp/amount/merchant window algorithm' },
            { id: 5, title: 'Android Native Kotlin Subsystem', status: 'completed', desc: 'PaymentNotificationListenerService, NotificationActionReceiver, and MethodChannel/EventChannel bridge' },
            { id: 6, title: 'Actionable Notification & Category Quick-Select', status: 'completed', desc: 'One-tap category assignment directly from Android status bar notification' },
            { id: 7, title: 'Dashboard & Analytics UI', status: 'completed', desc: 'Today, week, month spending, category distribution charts, monthly budget tracker' },
            { id: 8, title: 'Transaction History & Filtering', status: 'completed', desc: 'Search, category filter, date filter, detailed modal, edit, delete, and manual entry' },
            { id: 9, title: 'Settings, Permissions & Data Export', status: 'in-progress', desc: 'Android notification listener permission guidance, category customization, JSON export' },
            { id: 10, title: 'Comprehensive Test Suite & Polish', status: 'in-progress', desc: 'Unit tests for realistic GPay/PhonePe/Paytm payloads, edge cases, and duplicate rejection' },
          ].map((m) => (
            <div key={m.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="mt-0.5">
                {m.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Milestone {m.id}: {m.title}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                    m.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {m.status === 'completed' ? 'Implemented' : 'Planned Next'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
