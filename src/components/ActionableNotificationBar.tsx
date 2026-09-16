import React from 'react';
import { Bell, Check, X, ArrowRight } from 'lucide-react';
import { Category, PaymentSource } from '../types';

interface ActionableNotificationBarProps {
  notification: {
    id: string;
    amount: number;
    merchant: string;
    source: PaymentSource;
    referenceId?: string;
    rawText: string;
    suggestedCategoryId?: string;
  } | null;
  categories: Category[];
  onSelectCategory: (categoryId: string) => void;
  onDismiss: () => void;
}

export const ActionableNotificationBar: React.FC<ActionableNotificationBarProps> = ({
  notification,
  categories,
  onSelectCategory,
  onDismiss,
}) => {
  if (!notification) return null;

  // Quick top 4 categories
  const quickCategories = categories.slice(0, 4);

  return (
    <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-4 shadow-xl border border-emerald-700/50 mb-4 animate-in fade-in slide-in-from-top duration-300">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {notification.source.toUpperCase()} Payment Detected
              </span>
              {notification.referenceId && (
                <span className="text-[10px] text-emerald-200/70 font-mono">
                  Ref: {notification.referenceId}
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-white mt-0.5">
              ₹{notification.amount.toLocaleString('en-IN')} paid to {notification.merchant}
            </h4>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-emerald-300/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-emerald-100/80 mb-2.5 font-medium">
        Select category to record instantly with zero manual entry:
      </p>

      {/* Actionable buttons */}
      <div className="flex flex-wrap gap-1.5">
        {quickCategories.map((cat) => {
          const isSuggested = notification.suggestedCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                isSuggested
                  ? 'bg-emerald-400 text-emerald-950 font-bold hover:bg-emerald-300 ring-2 ring-white/50'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              <span>{cat.name}</span>
              {isSuggested && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          );
        })}

        {/* More categories dropdown / button */}
        <button
          onClick={() => onSelectCategory('cat_other')}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 flex items-center gap-1 transition-all"
        >
          <span>Other</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
