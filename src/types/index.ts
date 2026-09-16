export type PaymentSource = 
  | 'gpay'
  | 'phonepe'
  | 'paytm'
  | 'bhim'
  | 'cred'
  | 'amazonPay'
  | 'bank'
  | 'manual'
  | 'other';

export type TransactionStatus =
  | 'success'
  | 'pending'
  | 'failed'
  | 'reversed'
  | 'refunded'
  | 'credited';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  merchant: string;
  categoryId: string;
  timestamp: string; // ISO string
  paymentSource: PaymentSource;
  status: TransactionStatus;
  referenceId?: string;
  rawNotificationText?: string;
  notes?: string;
}

export interface Budget {
  id: string;
  monthlyLimit: number;
  month: number;
  year: number;
  categoryLimits: Record<string, number>;
}

export interface NotificationSimulation {
  id: string;
  packageName: string;
  sourceName: string;
  title: string;
  body: string;
  timestamp: number;
}
