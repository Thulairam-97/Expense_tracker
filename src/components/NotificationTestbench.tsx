import React, { useState } from 'react';
import { Send, AlertTriangle, ShieldCheck, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import { PaymentSource } from '../types';

interface NotificationTestbenchProps {
  onSimulate: (payload: {
    packageName: string;
    source: PaymentSource;
    title: string;
    body: string;
  }) => void;
  onClearTransactions: () => void;
}

export const NotificationTestbench: React.FC<NotificationTestbenchProps> = ({
  onSimulate,
  onClearTransactions,
}) => {
  const [customTitle, setCustomTitle] = useState('Google Pay');
  const [customBody, setCustomBody] = useState('Paid ₹520 to Whole Foods Market. Ref: 412093847561');
  const [customPkg, setCustomPkg] = useState('com.google.android.apps.nbu.paisa.user');
  const [customSource, setCustomSource] = useState<PaymentSource>('gpay');

  const presets = [
    {
      label: 'GPay: ABC Supermarket (₹450)',
      source: 'gpay' as PaymentSource,
      pkg: 'com.google.android.apps.nbu.paisa.user',
      title: 'Google Pay',
      body: 'Paid ₹450 to ABC Supermarket. Ref: 312345678901',
      type: 'success',
    },
    {
      label: 'PhonePe: Blue Tokai (₹820)',
      source: 'phonepe' as PaymentSource,
      pkg: 'com.phonepe.app',
      title: 'PhonePe',
      body: 'Payment of ₹820 to Blue Tokai Coffee was successful. Txn ID: T240914123456',
      type: 'success',
    },
    {
      label: 'Paytm: Chai Point (₹120)',
      source: 'paytm' as PaymentSource,
      pkg: 'net.one97.paytm',
      title: 'Paytm',
      body: 'Paid ₹120 at Chai Point. Order ID: PT10023490',
      type: 'success',
    },
    {
      label: 'Bank UPI: Swiggy Dinner (₹650)',
      source: 'bank' as PaymentSource,
      pkg: 'in.org.npci.upiapp',
      title: 'UPI Transaction Alert',
      body: 'Rs. 650.00 debited from a/c **4120 towards Swiggy. UPI Ref: 425619283741',
      type: 'success',
    },
    {
      label: 'Filter: Received ₹1,500 (Ignored)',
      source: 'gpay' as PaymentSource,
      pkg: 'com.google.android.apps.nbu.paisa.user',
      title: 'Google Pay',
      body: 'You received ₹1,500 from Rahul Verma via UPI',
      type: 'filtered',
    },
    {
      label: 'Filter: Payment Failed (Ignored)',
      source: 'phonepe' as PaymentSource,
      pkg: 'com.phonepe.app',
      title: 'PhonePe',
      body: 'Payment of ₹950 to Star Electronics failed. Your bank declined the transaction.',
      type: 'failed',
    },
  ];

  const handleCustomSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBody) return;
    onSimulate({
      packageName: customPkg,
      source: customSource,
      title: customTitle,
      body: customBody,
    });
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Android NotificationListener Testbench
          </h3>
          <p className="text-xs text-slate-500">
            Simulate native Android broadcast events from UPI and banking applications.
          </p>
        </div>
        <button
          onClick={onClearTransactions}
          className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          title="Reset database to fresh state"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Data</span>
        </button>
      </div>

      {/* Fast Preset Buttons */}
      <div>
        <label className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider block mb-2">
          One-Click Real UPI Scenarios
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() =>
                onSimulate({
                  packageName: preset.pkg,
                  source: preset.source,
                  title: preset.title,
                  body: preset.body,
                })
              }
              className={`text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between group ${
                preset.type === 'filtered'
                  ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-900'
                  : preset.type === 'failed'
                  ? 'border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-900'
                  : 'border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800'
              }`}
            >
              <div className="font-medium truncate pr-2">{preset.label}</div>
              <Send className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:text-emerald-600 transition-opacity flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Custom Notification Input */}
      <form onSubmit={handleCustomSend} className="space-y-2.5 pt-2 border-t border-slate-100">
        <label className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider block">
          Custom Notification Payloads
        </label>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={customSource}
            onChange={(e) => setCustomSource(e.target.value as PaymentSource)}
            className="text-xs p-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
          >
            <option value="gpay">Google Pay (Tez)</option>
            <option value="phonepe">PhonePe</option>
            <option value="paytm">Paytm</option>
            <option value="bhim">BHIM / Bank UPI</option>
            <option value="cred">CRED</option>
          </select>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Notification Title"
            className="text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customBody}
            onChange={(e) => setCustomBody(e.target.value)}
            placeholder='e.g. "Paid ₹450 to ABC Supermarket"'
            className="text-xs p-2 rounded-lg border border-slate-200 flex-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
          />
          <button
            type="submit"
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};
