import { apiRequest } from './client';
import type { Subscription } from '../types';

// ==========================================
// CURRENCY CONVERSION LOGIC
// ==========================================
let exchangeRates: Record<string, number> = {};
let lastFetchTime = 0;

async function getExchangeRates() {
  if (Date.now() - lastFetchTime < 3600000 && Object.keys(exchangeRates).length > 0) {
    return exchangeRates;
  }
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (data.result === 'success') {
      exchangeRates = data.rates;
      lastFetchTime = Date.now();
    }
  } catch (error) {
    console.error("Failed to fetch exchange rates", error);
  }
  return exchangeRates;
}

// 🌟 FIX 1: Agar rate na mile toh 'null' return karo, amount ko 'as is' add mat karo
function convertToUSD(amount: number, currency: string, rates: Record<string, number>): number | null {
  const curr = (currency || 'USD').toUpperCase();
  if (curr === 'USD') return amount;
  const rate = rates[curr];
  if (!rate || !Number.isFinite(rate)) return null; // ❌ Rate nahi mila toh skip karo
  return amount / rate; 
}

const toMonthly = (price: number, freq: string) => {
  if (freq === 'yearly') return price / 12;
  if (freq === 'weekly') return (price * 52) / 12;
  if (freq === 'quarterly') return price / 3;
  return price;
};

const mapSubscription = (sub: any): Subscription => {
  return { ...sub, id: sub._id || sub.id };
};

// ==========================================
// TYPES
// ==========================================
export type SubscriptionStatus = 'active' | 'cancelled' | 'paused' | 'all';

export interface GetSubscriptionsParams {
  search?: string;
  status?: SubscriptionStatus | string;
  page?: number;
  limit?: number;
}

export interface SubscriptionsResponse {
  data: Subscription[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export const api = {
  // ==========================================
  // SUBSCRIPTIONS (SEARCH + STATUS + PAGINATION)
  // ==========================================
  async getSubscriptions(params?: GetSubscriptionsParams): Promise<SubscriptionsResponse> {
    const search = params?.search || '';
    const status = params?.status || 'active';
    const page   = params?.page   || 1;
    const limit  = params?.limit  || 10;

    const queryString =
      `?search=${encodeURIComponent(search)}` +
      `&status=${encodeURIComponent(status)}` +
      `&page=${page}` +
      `&limit=${limit}`;

    const res = await apiRequest<any>(`/subscriptions${queryString}`, { method: 'GET' });

    return {
      data: res.data.map(mapSubscription),
      totalPages: res.totalPages,
      currentPage: res.currentPage,
      totalItems: res.totalItems,
    };
  },

  async createSubscription(subData: any): Promise<Subscription> {
    const data = await apiRequest<any>('/subscriptions', { method: 'POST', body: JSON.stringify(subData) });
    return mapSubscription(data);
  },

  async updateSubscription(id: string, updates: any): Promise<Subscription> {
    const data = await apiRequest<any>(`/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    return mapSubscription(data);
  },

  async deleteSubscription(id: string): Promise<void> {
    await apiRequest(`/subscriptions/${id}`, { method: 'DELETE' });
  },
  
  async cancelSubscription(id: string, date: string, reason?: string): Promise<Subscription> {
    const data = await apiRequest<any>(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled', cancellationDate: date, cancellationReason: reason || '' }),
    });
    return mapSubscription(data);
  },

  async restoreSubscription(id: string): Promise<Subscription> {
    const data = await apiRequest<any>(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'active', cancellationDate: null, cancellationReason: '' }),
    });
    return mapSubscription(data);
  },
  
  async rateSubscription(id: string, isWorthIt: boolean): Promise<Subscription> {
    const data = await apiRequest<any>(`/subscriptions/${id}/rate`, { method: 'PATCH', body: JSON.stringify({ isWorthIt }) });
    return mapSubscription(data);
  },

  // ==========================================
  // SPLIT / SHARED SUBSCRIPTIONS
  // ==========================================
  
  async searchUsers(query: string): Promise<any[]> {
    return apiRequest<any[]>(`/auth/search?q=${query}`, { method: 'GET' });
  },

  async splitSubscription(id: string, sharedWith: { email: string; amountOwed: number; hasPaid: boolean }[]): Promise<Subscription> {
    const data = await apiRequest<any>(`/subscriptions/${id}/split`, { method: 'PATCH', body: JSON.stringify({ sharedWith }) });
    return mapSubscription(data);
  },

  async getSharedSubscriptions(): Promise<any[]> {
    return apiRequest<any[]>('/splits/shared-with-me', { method: 'GET' });
  },

  async acceptSplit(id: string): Promise<any> {
    return apiRequest<any>(`/splits/${id}/accept`, { method: 'PATCH' });
  },

  async paySplit(id: string): Promise<any> {
    return apiRequest<any>(`/splits/${id}/pay`, { method: 'PATCH' });
  },

  async removeSplit(id: string): Promise<any> {
    return apiRequest<any>(`/splits/${id}`, { method: 'DELETE' });
  },

  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  async getDashboardStats() {
    const res = await this.getSubscriptions({ status: 'all', limit: 10000 });
    const subs = res.data;
    
    const rates = await getExchangeRates();

    const active = subs.filter((s: any) => s.status === 'active');
    const cancelled = subs.filter((s: any) => s.status === 'cancelled');
    
    // 🌟 FIX 2: Total Spend Calculate karte waqt null skip karo
    const totalMonthlySpending = active.reduce((sum, sub: any) => {
      const monthlyAmount = toMonthly(Number(sub.price) || 0, sub.billingFrequency);
      const usdAmount = convertToUSD(monthlyAmount, sub.currency, rates);
      if (usdAmount === null) return sum; 
      return sum + usdAmount;
    }, 0);

    // 🌟 FIX 3: Category Breakdown mein null skip karo
    const categoryMap: Record<string, { amount: number, count: number }> = {};
    active.forEach((sub: any) => {
      const cat = sub.category || 'other';
      const monthlyAmount = toMonthly(Number(sub.price) || 0, sub.billingFrequency);
      const usdAmount = convertToUSD(monthlyAmount, sub.currency, rates);
      
      if (usdAmount === null) return; // ❌ Skip if no exchange rate

      if (!categoryMap[cat]) categoryMap[cat] = { amount: 0, count: 0 };
      categoryMap[cat].amount += usdAmount;
      categoryMap[cat].count += 1;
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([category, data]) => ({
      category, amount: data.amount, count: data.count
    }));

    // 🌟 FIX 4: Monthly Trend mein null skip karo
    const monthlyTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
      let monthSpending = 0;
      
      active.forEach((sub: any) => {
        const startDate = new Date(sub.startDate || sub.createdAt || now);
        if (startDate <= d || (startDate.getMonth() === d.getMonth() && startDate.getFullYear() === d.getFullYear())) {
           const monthlyAmount = toMonthly(Number(sub.price) || 0, sub.billingFrequency);
           const usdAmount = convertToUSD(monthlyAmount, sub.currency, rates);
           if (usdAmount !== null) { // ❌ Skip if no exchange rate
             monthSpending += usdAmount;
           }
        }
      });
      monthlyTrend.push({ month: monthLabel, amount: monthSpending });
    }

    const upcomingRenewals = active
      .filter((s: any) => {
        if (!s.renewalDate) return false;
        const renewal = new Date(s.renewalDate);
        const diffTime = renewal.getTime() - new Date().setHours(0,0,0,0);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
      })
      .sort((a: any, b: any) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime())
      .slice(0, 5);

    return {
      activeCount: active.length,
      cancelledCount: cancelled.length,
      totalMonthlySpending,
      totalAnnualSpending: totalMonthlySpending * 12,
      totalSaved: 0,
      upcomingRenewals,
      recentActivity: [],
      categoryBreakdown,
      monthlyTrend
    };
  }
};