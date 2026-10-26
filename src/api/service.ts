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

function convertToUSD(amount: number, currency: string, rates: Record<string, number>) {
  const curr = (currency || 'USD').toUpperCase();
  if (curr === 'USD') return amount;
  const rate = rates[curr];
  if (!rate) return amount; 
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

export const api = {
  // ==========================================
  // SUBSCRIPTIONS (MY SUBS)
  // ==========================================
  async getSubscriptions(): Promise<Subscription[]> {
    const data = await apiRequest<any[]>('/subscriptions', { method: 'GET' });
    return data.map(mapSubscription);
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
  
  // 1. Search Registered Users (Frontend Modal ke liye)
  async searchUsers(query: string): Promise<any[]> {
    return apiRequest<any[]>(`/auth/search?q=${query}`, { method: 'GET' });
  },

  // 2. Send Split Invite (Owner)
  async splitSubscription(id: string, sharedWith: { email: string; amountOwed: number; hasPaid: boolean }[]): Promise<Subscription> {
    const data = await apiRequest<any>(`/subscriptions/${id}/split`, { method: 'PATCH', body: JSON.stringify({ sharedWith }) });
    return mapSubscription(data);
  },

  // 3. Get Shared with Me List (Friend)
  async getSharedSubscriptions(): Promise<any[]> {
    return apiRequest<any[]>('/splits/shared-with-me', { method: 'GET' });
  },

  // 4. Accept Invitation
  async acceptSplit(id: string): Promise<any> {
    return apiRequest<any>(`/splits/${id}/accept`, { method: 'PATCH' });
  },

  // 5. Pay Now (Friend)
  async paySplit(id: string): Promise<any> {
    return apiRequest<any>(`/splits/${id}/pay`, { method: 'PATCH' });
  },

  // 6. Remove / Leave Split (Naya Function)
  async removeSplit(id: string): Promise<any> {
    return apiRequest<any>(`/splits/${id}`, { method: 'DELETE' });
  },

  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  async getDashboardStats() {
    const subs = await this.getSubscriptions();
    const rates = await getExchangeRates();

    const active = subs.filter((s: any) => s.status === 'active');
    const cancelled = subs.filter((s: any) => s.status === 'cancelled');
    
    const totalMonthlySpending = active.reduce((sum, sub: any) => {
        const monthlyAmount = toMonthly(Number(sub.price) || 0, sub.billingFrequency);
        const usdAmount = convertToUSD(monthlyAmount, sub.currency, rates);
        return sum + usdAmount;
    }, 0);

    const categoryMap: Record<string, { amount: number, count: number }> = {};
    active.forEach((sub: any) => {
      const cat = sub.category || 'other';
      const monthlyAmount = toMonthly(Number(sub.price) || 0, sub.billingFrequency);
      const usdAmount = convertToUSD(monthlyAmount, sub.currency, rates);
      
      if (!categoryMap[cat]) categoryMap[cat] = { amount: 0, count: 0 };
      categoryMap[cat].amount += usdAmount;
      categoryMap[cat].count += 1;
    });

    const categoryBreakdown = Object.entries(categoryMap).map(([category, data]) => ({
      category, amount: data.amount, count: data.count
    }));

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
           monthSpending += convertToUSD(monthlyAmount, sub.currency, rates);
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