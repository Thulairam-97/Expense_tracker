import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  Fingerprint,
  Trash2,
  Bell,
  Smartphone,
  CheckCircle2,
  Lock,
  Download,
  AlertTriangle,
} from 'lucide-react';

interface SettingsViewProps {
  onLockApp: () => void;
  onClearAllData: () => void;
  savedPin: string;
  onUpdatePin: (newPin: string) => void;
  expenseCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onLockApp,
  onClearAllData,
  savedPin,
  onUpdatePin,
  expenseCount,
}) => {
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPin !== savedPin && savedPin !== '') {
      setPinMessage({ text: 'Current PIN is incorrect', isError: true });
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinMessage({ text: 'New PIN must be exactly 4 digits', isError: true });
      return;
    }
    onUpdatePin(newPin);
    setPinMessage({ text: 'PIN successfully updated!', isError: false });
    setTimeout(() => {
      setIsChangingPin(false);
      setOldPin('');
      setNewPin('');
      setPinMessage(null);
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Profile Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-800 text-white font-bold text-lg flex items-center justify-center shadow-xs">
            T
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Personal Expense Account</h3>
            <p className="text-xs text-teal-700 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              <span>Offline-First • Local Storage Encrypted</span>
            </p>
          </div>
        </div>

        <button
          onClick={onLockApp}
          className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
        >
          <Lock className="w-3.5 h-3.5 text-slate-600" />
          <span>Lock App</span>
        </button>
      </div>

      {/* Security & Access Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Shield className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Security & Authentication
          </h3>
        </div>

        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-semibold text-slate-800">4-Digit Security PIN</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Current PIN: <span className="font-mono font-bold">••••</span> (Default: 1234)
            </p>
          </div>
          <button
            onClick={() => setIsChangingPin(!isChangingPin)}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 border border-teal-200 bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            {isChangingPin ? 'Cancel' : 'Change PIN'}
          </button>
        </div>

        {isChangingPin && (
          <form onSubmit={handlePinSubmit} className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3">
            <p className="text-xs font-bold text-slate-700">Update Security PIN</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 font-medium block mb-1">
                  Current PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-center font-mono focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 font-medium block mb-1">
                  New 4-Digit PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="••••"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-center font-mono focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>

            {pinMessage && (
              <p
                className={`text-xs font-semibold ${
                  pinMessage.isError ? 'text-rose-600' : 'text-teal-700'
                }`}
              >
                {pinMessage.text}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Save New PIN
            </button>
          </form>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Fingerprint className="w-4 h-4 text-teal-700" />
              <span>Biometric Unlock</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Allow one-tap fingerprint / FaceID sensor authentication
            </p>
          </div>
          <button
            onClick={() => setBiometricEnabled(!biometricEnabled)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              biometricEnabled ? 'bg-teal-700' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                biometricEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* UPI Interceptor Status */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Bell className="w-4 h-4 text-teal-700" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            UPI Notification Interceptor
          </h3>
        </div>

        <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">NotificationListenerService Active</p>
            <p className="text-emerald-700 mt-0.5">
              Intercepts debited amounts from Google Pay, PhonePe, Paytm, BHIM, and bank SMS with zero-touch automation and top-drawer action chips.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone: Clear Data */}
      <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
          <Trash2 className="w-4 h-4 text-rose-600" />
          <h3 className="text-sm font-bold text-rose-900 uppercase tracking-wider">
            Reset & Clear Data
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Clear All Tracked Expenses</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Currently holding {expenseCount} transactions. Resetting gives a fresh zero-balance ledger.
            </p>
          </div>
          <button
            onClick={onClearAllData}
            className="border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
