import React from 'react';
import { X, Calendar, Tag, CreditCard, Hash, FileText, Trash2 } from 'lucide-react';
import { Expense, Category } from '../types';

interface TransactionDetailModalProps {
  expense: Expense | null;
  category?: Category;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  expense,
  category,
  onClose,
  onDelete,
}) => {
  if (!expense) return null;

  const formattedDate = new Date(expense.timestamp).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              {expense.paymentSource.toUpperCase()}
            </span>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-2">
              ₹{expense.amount.toLocaleString('en-IN')}
            </h3>
            <p className="text-sm font-semibold text-slate-600 mt-0.5">
              {expense.merchant}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details list */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" /> Category
            </span>
            <span className="font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">
              {category?.name ?? 'Uncategorized'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" /> Date & Time
            </span>
            <span className="font-medium text-slate-800">{formattedDate}</span>
          </div>

          <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
            <span className="text-slate-500 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-400" /> Payment App
            </span>
            <span className="font-medium text-slate-800">
              {expense.paymentSource === 'gpay'
                ? 'Google Pay (UPI)'
                : expense.paymentSource === 'phonepe'
                ? 'PhonePe'
                : expense.paymentSource === 'paytm'
                ? 'Paytm'
                : expense.paymentSource === 'bhim'
                ? 'BHIM / Bank UPI'
                : 'Manual Entry'}
            </span>
          </div>

          {expense.referenceId && (
            <div className="flex items-center justify-between text-sm py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" /> Reference / UTR
              </span>
              <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                {expense.referenceId}
              </span>
            </div>
          )}

          {expense.rawNotificationText && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Intercepted Notification
              </span>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 break-words leading-relaxed">
                {expense.rawNotificationText}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onDelete(expense.id);
              onClose();
            }}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete Expense
          </button>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
