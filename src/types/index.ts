export type BillingFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'paused';
export type SubscriptionCategory =
  | 'streaming' | 'music' | 'productivity' | 'gaming' | 'fitness'
  | 'news' | 'cloud' | 'shopping' | 'education' | 'finance' | 'communication' | 'other';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  currency: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingFrequency: BillingFrequency;
  category: SubscriptionCategory;
  status: SubscriptionStatus;
  websiteUrl?: string;
  notes?: string;
  startDate: string;
  renewalDate: string;
  cancellationDate?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  activeCount: number;
  cancelledCount: number;
  totalMonthlySpending: number;
  totalAnnualSpending: number;
  totalSaved: number;
  upcomingRenewals: Subscription[];
  recentActivity: ActivityLog[];
  categoryBreakdown: { category: SubscriptionCategory; amount: number; count: number }[];
  monthlyTrend: { month: string; amount: number }[];
}

export interface ActivityLog {
  id: string;
  subscriptionId: string;
  subscriptionName: string;
  action: 'created' | 'cancelled' | 'restored' | 'updated' | 'deleted';
  details?: string;
  createdAt: string;
}
