// ==========================================
// USER TYPES
// ==========================================
export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  token?: string;
}

// ==========================================
// SUBSCRIPTION TYPES
// ==========================================
export type SubscriptionCategory = 
  | 'streaming' | 'music' | 'productivity' | 'gaming' | 'fitness' 
  | 'news' | 'cloud' | 'shopping' | 'education' | 'finance' 
  | 'communication' | 'other';

export type BillingFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Subscription {
  id: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  price: number;
  currency: string;
  status: string; // 'active' | 'cancelled'
  category: SubscriptionCategory;
  billingFrequency: BillingFrequency;
  startDate: string;
  renewalDate: string;
  websiteUrl?: string;
  notes?: string;
  cancellationDate?: string;
  cancellationReason?: string;
  
  // 🌟 NAYI FIELDS
  isWorthIt?: boolean | null;
  lastRatedDate?: string;
  sharedWith?: { email: string; amountOwed: number; hasPaid: boolean }[];
  isShared?: boolean;
}

// ==========================================
// DASHBOARD & ANALYTICS TYPES
// ==========================================
export interface DashboardStats {
  activeCount: number;
  cancelledCount: number;
  totalMonthlySpending: number;
  totalAnnualSpending: number;
  totalSaved: number;
  upcomingRenewals: Subscription[];
  recentActivity: any[];
  categoryBreakdown: { category: string; amount: number; count: number }[];
  monthlyTrend: { month: string; amount: number }[];
}