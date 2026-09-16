import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', name: 'Food', icon: 'Utensils', color: '#EA580C', isDefault: true },
  { id: 'cat_groceries', name: 'Groceries', icon: 'ShoppingCart', color: '#16A34A', isDefault: true },
  { id: 'cat_fuel', name: 'Fuel', icon: 'Fuel', color: '#D97706', isDefault: true },
  { id: 'cat_recharge', name: 'Recharge', icon: 'Smartphone', color: '#0891B2', isDefault: true },
  { id: 'cat_bills', name: 'Bills', icon: 'Receipt', color: '#9333EA', isDefault: true },
  { id: 'cat_shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#DB2777', isDefault: true },
  { id: 'cat_transport', name: 'Transport', icon: 'Bus', color: '#2563EB', isDefault: true },
  { id: 'cat_entertainment', name: 'Entertainment', icon: 'Film', color: '#7C3AED', isDefault: true },
  { id: 'cat_medical', name: 'Medical', icon: 'HeartPulse', color: '#DC2626', isDefault: true },
  { id: 'cat_education', name: 'Education', icon: 'GraduationCap', color: '#4F46E5', isDefault: true },
  { id: 'cat_emi', name: 'EMI/Loan', icon: 'Landmark', color: '#475569', isDefault: true },
  { id: 'cat_travel', name: 'Travel', icon: 'Plane', color: '#0D9488', isDefault: true },
  { id: 'cat_subscriptions', name: 'Subscriptions', icon: 'Tv', color: '#B45309', isDefault: true },
  { id: 'cat_other', name: 'Other', icon: 'CircleEllipsis', color: '#64748B', isDefault: true },
];
