import type { BillingFrequency } from '../types';

export function toMonthlyAmount(price: number, frequency: BillingFrequency): number {
  switch (frequency) {
    case 'weekly': return price * 52 / 12;
    case 'monthly': return price;
    case 'quarterly': return price / 3;
    case 'yearly': return price / 12;
  }
}

export function toAnnualAmount(price: number, frequency: BillingFrequency): number {
  return toMonthlyAmount(price, frequency) * 12;
}

export function calculateSavings(
  price: number,
  frequency: BillingFrequency,
  cancellationDate: string,
  now: Date = new Date()
): number {
  const cancelled = new Date(cancellationDate);
  if (cancelled > now) return 0;
  const monthsElapsed = (now.getFullYear() - cancelled.getFullYear()) * 12 +
    (now.getMonth() - cancelled.getMonth());
  return Math.round(toMonthlyAmount(price, frequency) * monthsElapsed * 100) / 100;
}

export function getDaysUntilRenewal(renewalDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const renewal = new Date(renewalDate);
  renewal.setHours(0, 0, 0, 0);
  return Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    streaming: 'Streaming', music: 'Music', productivity: 'Productivity',
    gaming: 'Gaming', fitness: 'Fitness', news: 'News',
    cloud: 'Cloud', shopping: 'Shopping', education: 'Education',
    finance: 'Finance', communication: 'Communication', other: 'Other',
  };
  return labels[category] || category;
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    streaming: '#3478FF', music: '#8757FF', productivity: '#22C55E',
    gaming: '#F59E0B', fitness: '#EF4444', news: '#06B6D4',
    cloud: '#8B5CF6', shopping: '#EC4899', education: '#14B8A6',
    finance: '#3478FF', communication: '#6366F1', other: '#6B7280',
  };
  return colors[category] || '#6B7280';
}
