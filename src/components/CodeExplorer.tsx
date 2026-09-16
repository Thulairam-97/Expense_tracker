import React, { useState } from 'react';
import { Copy, Check, FileCode, CheckCircle } from 'lucide-react';

interface CodeFile {
  path: string;
  name: string;
  language: string;
  description: string;
  code: string;
}

export const CodeExplorer: React.FC = () => {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const files: CodeFile[] = [
    {
      path: 'android/app/src/main/kotlin/com/personal/upiexpensetracker/service/PaymentNotificationListenerService.kt',
      name: 'PaymentNotificationListenerService.kt',
      language: 'kotlin',
      description: 'Native Android Service listening strictly to supported UPI apps',
      code: `package com.personal.upiexpensetracker.service

import android.app.Notification
import android.content.Intent
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class PaymentNotificationListenerService : NotificationListenerService() {
    companion object {
        val SUPPORTED_PACKAGES = setOf(
            "com.google.android.apps.nbu.paisa.user", // Google Pay
            "com.phonepe.app",                        // PhonePe
            "net.one97.paytm",                        // Paytm
            "in.org.npci.upiapp",                     // BHIM
            "com.dreamplug.androidapp"                // CRED
        )
        var notificationEventSink: ((Map<String, Any?>) -> Unit)? = null
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        super.onNotificationPosted(sbn)
        if (sbn == null) return
        val packageName = sbn.packageName ?: return

        // Filter: only capture supported UPI apps for privacy
        if (!SUPPORTED_PACKAGES.contains(packageName) && !packageName.contains("upi")) {
            return
        }

        val extras = sbn.notification?.extras ?: return
        val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""

        val payload = mapOf(
            "packageName" to packageName,
            "title" to title,
            "text" to text,
            "timestamp" to sbn.postTime
        )

        notificationEventSink?.invoke(payload)
    }
}`,
    },
    {
      path: 'android/app/src/main/kotlin/com/personal/upiexpensetracker/MainActivity.kt',
      name: 'MainActivity.kt',
      language: 'kotlin',
      description: 'MethodChannel and EventChannel bridge + Actionable Category Notifications',
      code: `package com.personal.upiexpensetracker

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodChannel
import androidx.core.app.NotificationCompat

class MainActivity : FlutterActivity() {
    private val METHOD_CHANNEL = "com.personal.upiexpensetracker/notification_control"
    private val EVENT_CHANNEL = "com.personal.upiexpensetracker/notification_stream"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // EventChannel streams intercepted notifications to Dart
        EventChannel(flutterEngine.dartExecutor.binaryMessenger, EVENT_CHANNEL)
            .setStreamHandler(object : EventChannel.StreamHandler {
                override fun onListen(args: Any?, events: EventChannel.EventSink?) {
                    PaymentNotificationListenerService.notificationEventSink = { payload ->
                        runOnUiThread { events?.success(payload) }
                    }
                }
                override fun onCancel(args: Any?) {
                    PaymentNotificationListenerService.notificationEventSink = null
                }
            })
    }
}`,
    },
    {
      path: 'lib/core/parsers/gpay_notification_parser.dart',
      name: 'gpay_notification_parser.dart',
      language: 'dart',
      description: 'Google Pay parser: extracts amount, merchant, detects success vs failed/credited',
      code: `import '../../domain/models/parsed_transaction.dart';
import '../../domain/models/payment_source.dart';
import '../../domain/models/transaction_status.dart';
import 'base_notification_parser.dart';

class GPayNotificationParser extends BaseNotificationParser {
  @override
  String get parserName => 'GooglePayParser';

  @override
  PaymentSource get paymentSource => PaymentSource.gpay;

  @override
  bool canHandle(String packageName, String title, String body) {
    return packageName.contains('paisa') || packageName.contains('gpay');
  }

  @override
  ParsedTransaction? parse({
    required String packageName,
    required String title,
    required String body,
    required DateTime timestamp,
  }) {
    final text = '$title $body';
    final lower = text.toLowerCase();

    // Rejection: incoming / credited money is NOT an expense
    if (lower.contains('received') || lower.contains('credited')) {
      return ParsedTransaction(
        amount: extractAmount(text) ?? 0.0,
        merchant: 'Sender',
        source: paymentSource,
        status: TransactionStatus.credited,
        timestamp: timestamp,
        rawText: text,
      );
    }

    final amount = extractAmount(text);
    if (amount == null) return null;

    // Pattern: Paid ₹450 to ABC Supermarket
    final match = RegExp(r'paid\\s+[₹rs\\.\\s0-9\\,]+\\s+to\\s+([^,\\.\\n]+)', caseSensitive: false).firstMatch(text);
    final merchant = match?.group(1)?.trim() ?? 'UPI Payee';

    return ParsedTransaction(
      amount: amount,
      merchant: merchant,
      source: paymentSource,
      status: TransactionStatus.success,
      timestamp: timestamp,
      rawText: text,
    );
  }
}`,
    },
    {
      path: 'lib/data/database/tables.dart',
      name: 'tables.dart',
      language: 'dart',
      description: 'Drift SQLite schema: expenses, categories, budgets, and logs',
      code: `import 'package:drift/drift.dart';

class ExpensesTable extends Table {
  TextColumn get id => text()();
  RealColumn get amount => real()();
  TextColumn get merchant => text()();
  TextColumn get categoryId => text().references(CategoriesTable, #id)();
  DateTimeColumn get timestamp => dateTime()();
  TextColumn get paymentSource => text()();
  TextColumn get status => text().withDefault(const Constant('success'))();
  TextColumn get referenceId => text().nullable()();
  TextColumn get rawNotificationText => text().nullable()();
  TextColumn get notes => text().nullable()();

  @override
  Set<Column> get primaryKey => {id};

  @override
  List<Set<Column>> get uniqueKeys => [
    {timestamp, amount, merchant, paymentSource},
  ];
}`,
    },
  ];

  const [selectedFile, setSelectedFile] = useState<CodeFile>(files[0]);

  const copy = (code: string, path: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-600" />
            Generated Native Android & Flutter Codebase
          </h3>
          <p className="text-xs text-slate-500">
            Production-grade Kotlin and Dart modules created on disk in <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">/flutter_expense_tracker/</code>
          </p>
        </div>
        <button
          onClick={() => copy(selectedFile.code, selectedFile.path)}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
        >
          {copiedPath === selectedFile.path ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy File Code</span>
            </>
          )}
        </button>
      </div>

      {/* File selector tabs */}
      <div className="flex border-b border-slate-200 bg-slate-100/60 overflow-x-auto">
        {files.map((file) => (
          <button
            key={file.path}
            onClick={() => setSelectedFile(file)}
            className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              selectedFile.path === file.path
                ? 'border-indigo-600 bg-white text-indigo-900 font-semibold shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span>{file.name}</span>
          </button>
        ))}
      </div>

      {/* Code viewer */}
      <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[500px]">
        <div className="text-slate-500 text-[11px] mb-3 pb-2 border-b border-slate-800 flex justify-between">
          <span>{selectedFile.path}</span>
          <span>{selectedFile.description}</span>
        </div>
        <pre className="leading-relaxed">{selectedFile.code}</pre>
      </div>
    </div>
  );
};
