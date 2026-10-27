import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity, CheckCircle2, CreditCard,
  ThumbsUp, ThumbsDown, X 
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { api } from '../api/service';
import type { Subscription as AppSubscription } from '../types';
import { SubscriptionLogo } from '../components/ui/SubscriptionLogo';
import { CustomSelect } from '../components/ui/CustomSelect';

interface DashboardSubscription extends AppSubscription {
  billingCycle?: string;
  isWorthIt?: boolean | null;
}

const getCycle = (sub: DashboardSubscription): string =>
  String(sub.billingFrequency || sub.billingCycle || 'monthly').toLowerCase();

const getMonthlyAmount = (sub: DashboardSubscription): number => {
  const price = Number(sub.price) || 0;
  const cycle = getCycle(sub);
  
  if (cycle.includes('year') || cycle.includes('annual')) return price / 12;
  if (cycle.includes('quarter')) return price / 3;
  if (cycle.includes('week')) return (price * 52) / 12;
  if (cycle.includes('day')) return (price * 365) / 12;
  return price; 
};

const currencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = { USD: '$', PKR: 'Rs ', GBP: '£', EUR: '€', INR: '₹' };
  return symbols[currency] || `${currency} `;
};

const formatMoney = (amount: number, currency: string): string =>
  `${currencySymbol(currency)}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const getDaysUntil = (date: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(date);
  renewal.setHours(0, 0, 0, 0);
  return Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const VIBES = [
  { text: "months of Netflix", divisor: 15.49, emoji: "🍿" },
  { text: "cups of fancy coffee", divisor: 5.00, emoji: "☕" },
  { text: "Big meals", divisor: 8.00, emoji: "🍔" },
  { text: "slices of pizza", divisor: 3.50, emoji: "🍕" },
  { text: "indie Steam games", divisor: 10.00, emoji: "🎮" },
  { text: "Uber rides", divisor: 12.00, emoji: "🚗" },
  { text: "months of Spotify", divisor: 10.99, emoji: "🎵" },
  { text: "movie tickets", divisor: 14.00, emoji: "🎟️" },
];

const categoryColors = [
  { text: 'text-violet-500', dot: 'bg-violet-500', bar: 'from-violet-500 to-fuchsia-500', shadow: 'shadow-violet-500/50' },
  { text: 'text-blue-500', dot: 'bg-blue-500', bar: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/50' },
  { text: 'text-emerald-500', dot: 'bg-emerald-500', bar: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/50' },
  { text: 'text-amber-500', dot: 'bg-amber-500', bar: 'from-amber-500 to-yellow-500', shadow: 'shadow-amber-500/50' },
  { text: 'text-rose-500', dot: 'bg-rose-500', bar: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/50' },
];

const lineColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<DashboardSubscription[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [selectedCurrency, setSelectedCurrency] = useState('All currencies');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastSuccessfulSync, setLastSuccessfulSync] = useState<Date | null>(null);

  const convertToUSD = useCallback(
    (amount: number, currency: string): number | null => {
      const code = currency.toUpperCase();
      if (code === 'USD') return amount;
      const rate = exchangeRates?.[code];
      if (!rate || !Number.isFinite(rate)) return null;
      return amount / rate;
    },
    [exchangeRates],
  );

  useEffect(() => {
    let mounted = true;
    const loadSubscriptionsData = async () => {
      try {
        const result = await api.getSubscriptions({ status: 'all', limit: 1000 });
        if (mounted) {
          setSubscriptions(result.data as DashboardSubscription[]);
          setError('');
          setLastSuccessfulSync(new Date());
        }
      } catch (err) {
        if (mounted) setError('Unable to load subscriptions. Please refresh the page.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadSubscriptionsData();
    window.addEventListener('storage', loadSubscriptionsData);
    return () => {
      mounted = false;
      window.removeEventListener('storage', loadSubscriptionsData);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadExchangeRates() {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!response.ok) throw new Error('Exchange rate request failed');
        const result = await response.json();
        if (result.result !== 'success' || !result.rates) throw new Error('Exchange rates unavailable');
        if (!cancelled) setExchangeRates(result.rates);
      } catch (error) {
        console.error('Could not load USD exchange rates:', error);
      }
    }
    void loadExchangeRates();
    return () => { cancelled = true; };
  }, []);

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((sub) => !['cancelled', 'canceled', 'inactive', 'expired'].includes(String(sub.status).toLowerCase())),
    [subscriptions],
  );

  const availableCategories = Array.from(new Set(activeSubscriptions.map((sub) => sub.category).filter(Boolean)));
  const availableCurrencies = Array.from(new Set(activeSubscriptions.map((sub) => sub.currency).filter(Boolean)));

  const filteredSubscriptions = useMemo(
    () =>
      activeSubscriptions.filter((sub) => {
        const matchesCategory = selectedCategory === 'All categories' || sub.category === selectedCategory;
        const matchesCurrency = selectedCurrency === 'All currencies' || sub.currency === selectedCurrency;
        return matchesCategory && matchesCurrency;
      }),
    [activeSubscriptions, selectedCategory, selectedCurrency],
  );

  const baseMonthlySpend = filteredSubscriptions.reduce((total, sub) => {
    const monthlyAmount = getMonthlyAmount(sub);
    const usdAmount = convertToUSD(monthlyAmount, sub.currency);
    if (usdAmount === null) return total;
    return total + usdAmount;
  }, 0);

  const displaySpend = baseMonthlySpend;

  const vibeText = useMemo(() => {
    if (displaySpend <= 0) return "";
    const vibe = VIBES[Math.floor(Math.random() * VIBES.length)];
    const quantity = displaySpend / vibe.divisor;
    const displayQuantity = quantity < 1 ? "less than 1" : quantity.toFixed(1);
    return `${displayQuantity} ${vibe.text} ${vibe.emoji}`;
  }, [displaySpend]);

  const dueSoonList = useMemo(
    () =>
      filteredSubscriptions
        .filter((sub) => {
          if (!sub.renewalDate) return false;
          const days = getDaysUntil(sub.renewalDate);
          return days >= 0 && days <= 30;
        })
        .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()),
    [filteredSubscriptions],
  );

  const displayCurrency = 'USD';

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredSubscriptions.forEach((sub) => {
      const category = sub.category || 'Other';
      const usdAmount = convertToUSD(getMonthlyAmount(sub), sub.currency);
      if (usdAmount === null) return;
      totals[category] = (totals[category] || 0) + usdAmount;
    });
    return totals;
  }, [filteredSubscriptions, convertToUSD]);

  const categoriesData: [string, number][] =
    Object.keys(categoryTotals).length > 0
      ? Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
      : [['No Data', 0]];

  const totalCategorySpend = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;

  const multiLineChartData = useMemo(() => {
    if (filteredSubscriptions.length === 0) return [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const topSubs = [...filteredSubscriptions]
      .sort((a, b) => {
        const aUSD = convertToUSD(getMonthlyAmount(a), a.currency) || 0;
        const bUSD = convertToUSD(getMonthlyAmount(b), b.currency) || 0;
        return bUSD - aUSD;
      })
      .slice(0, 5);

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dataPoint: any = {
        day: `${day}`,
        fullDate: new Date(currentYear, currentMonth, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        _meta: {} 
      };
      topSubs.forEach((sub) => {
        const usdMonthly = convertToUSD(getMonthlyAmount(sub), sub.currency) || 0;
        const dailyRate = usdMonthly / daysInMonth;
        dataPoint[sub.name] = Number((dailyRate * day).toFixed(2));
        dataPoint._meta[sub.name] = { daily: dailyRate };
      });
      return dataPoint;
    });
  }, [filteredSubscriptions, convertToUSD]);

  const currentDayBurn = useMemo(() => {
    if (multiLineChartData.length === 0) return 0;
    const todayData = multiLineChartData[new Date().getDate() - 1];
    return Object.keys(todayData).reduce((sum, key) => {
      if (key !== 'day' && key !== 'fullDate' && key !== '_meta') {
        return sum + Number(todayData[key] || 0);
      }
      return sum;
    }, 0);
  }, [multiLineChartData]);

  const topSubsForChart = useMemo(() => {
    return [...filteredSubscriptions]
      .sort((a, b) => {
        const aUSD = convertToUSD(getMonthlyAmount(a), a.currency) || 0;
        const bUSD = convertToUSD(getMonthlyAmount(b), b.currency) || 0;
        return bUSD - aUSD;
      })
      .slice(0, 5);
  }, [filteredSubscriptions, convertToUSD]);

  const subToRate = filteredSubscriptions.find(s => s.isWorthIt === null || s.isWorthIt === undefined);

  const handleRate = async (id: string, isWorthIt: boolean) => {
    try {
      await api.rateSubscription(id, isWorthIt);
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, isWorthIt } : s));
    } catch (error) {
      console.error('Failed to rate subscription:', error);
    }
  };

  const handleCancelFlow = () => navigate('/subscriptions');

  return (
    <main className="min-h-screen bg-transparent px-3 pt-2 pb-8 text-text-primary sm:px-6 sm:pt-4 lg:px-8 lg:pt-6 transition-colors duration-300">
      <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-7">
        
        <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 dark:to-transparent border border-white/50 dark:border-white/10 shadow-sm backdrop-blur-sm" />
              <span className="relative z-10 text-2xl drop-shadow-md">🏠</span>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl leading-tight">
                Dashboard<span className="text-violet-500">.</span>
              </h1>
              <p className="mt-1 text-xs sm:text-sm leading-tight text-text-secondary font-medium">
                Your financial overview
              </p>
            </div>
          </div>
        </header>

        {/* 🌟 RESPONSIVE FILTERS */}
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-bg-elevated p-3 sm:p-4 sm:flex-row sm:items-end w-full">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <CustomSelect
              label="Category"
              options={['All categories', ...availableCategories]}
              value={selectedCategory}
              onChange={setSelectedCategory}
              className="w-full sm:min-w-[170px]"
            />
            <CustomSelect
              label="Currency"
              options={['All currencies', ...availableCurrencies]}
              value={selectedCurrency}
              onChange={setSelectedCurrency}
              className="w-full sm:min-w-[150px]"
            />
          </div>
        </section>

        {error && (
          <div role="alert" className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-3 sm:p-4 text-sm text-danger">
            <Activity size={18} className="shrink-0" /> {error}
          </div>
        )}

        <section className="grid grid-cols-1 items-start gap-4 sm:gap-5 lg:grid-cols-12">
          
          {/* HERO CARD */}
          <article className="relative isolate min-h-[280px] sm:min-h-[310px] overflow-hidden rounded-[24px] sm:rounded-[28px] bg-gradient-to-br from-[#17132f] via-[#282052] to-[#45258c] p-5 text-white shadow-xl shadow-violet-950/10 sm:p-8 lg:col-span-7 lg:p-10">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-6 -top-10 h-52 w-52 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-24 right-16 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-1/2 w-1/2 bg-gradient-to-tl from-cyan-400/10 to-transparent" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-6 sm:gap-10">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                <div>
                  <div className="mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg sm:rounded-xl border border-white/15 bg-white/10 text-base sm:text-lg shadow-sm">
                      💳
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-violet-100/80">
                      Monthly Commitment
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-white/65">
                    Your recurring monthly subscription cost.
                  </p>
                </div>
                <div
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                    error ? 'border-rose-300/20 bg-rose-300/10 text-rose-200' : loading ? 'border-amber-300/20 bg-amber-300/10 text-amber-200' : 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${error ? 'bg-rose-400' : loading ? 'animate-pulse bg-amber-300' : 'bg-emerald-300'}`} />
                  {error ? 'Connection issue' : loading ? 'Syncing...' : lastSuccessfulSync ? `Synced ${lastSuccessfulSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Connected'}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="break-words text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-[-0.055em]">
                    {loading ? '...' : formatMoney(displaySpend, displayCurrency)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-white/50">/ month</span>
                </div>

                {!loading && displaySpend > 0 && vibeText && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative mt-4 sm:mt-6 flex w-fit items-center gap-2 sm:gap-3 overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 sm:px-5 sm:py-3 shadow-lg backdrop-blur-md cursor-default"
                  >
                    <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                      <span className="relative z-10 text-xs sm:text-sm">💸</span>
                    </div>
                    <p className="relative z-10 text-[10px] sm:text-sm font-medium text-white/80">
                      That's like buying{" "}
                      <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent font-bold text-xs sm:text-base tracking-wide">
                        {vibeText}
                      </span>
                    </p>
                  </motion.div>
                )}

                <div className="mt-5 sm:mt-7 flex flex-wrap gap-2 sm:gap-3">
                  <div className="min-w-[100px] sm:min-w-[125px] rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-2 sm:px-4 sm:py-3 backdrop-blur-sm">
                    <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-white/50">Active</p>
                    <p className="mt-0.5 text-lg sm:text-2xl font-black">{loading ? '...' : filteredSubscriptions.length}</p>
                  </div>
                  <div className="min-w-[100px] sm:min-w-[125px] rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-2 sm:px-4 sm:py-3 backdrop-blur-sm">
                    <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-white/50">Avg / service</p>
                    <p className="mt-0.5 text-sm sm:text-xl font-black">
                      {loading ? '...' : formatMoney(filteredSubscriptions.length > 0 ? displaySpend / filteredSubscriptions.length : 0, displayCurrency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* CATEGORY BREAKDOWN */}
          <article className="rounded-[24px] sm:rounded-[28px] border border-border bg-bg-elevated p-4 sm:p-8 lg:col-span-5 flex flex-col relative overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-lg sm:text-xl shadow-inner">
                  📊
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-text-primary">Spend by Category</h2>
                  <p className="text-[10px] sm:text-[11px] font-medium text-text-secondary mt-0.5">Where your money goes</p>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {!loading && subToRate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 sm:mb-6 overflow-hidden shrink-0"
                >
                  <div className="relative rounded-xl sm:rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 p-3 sm:p-4 shadow-sm">
                    <button onClick={handleCancelFlow} className="absolute top-2 right-2 sm:top-3 sm:right-3 text-text-muted hover:text-text-primary">
                      <X size={14} />
                    </button>
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-base sm:text-xl shadow-inner">🤔</div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-text-primary">Worth It Check-in</h3>
                        <p className="text-[9px] sm:text-[10px] text-text-secondary leading-tight mt-0.5">
                          You paid {formatMoney(Number(subToRate.price) || 0, subToRate.currency || 'USD')} for {subToRate.name}.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3 sm:mt-4">
                      <button onClick={() => handleRate(subToRate.id, true)} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl bg-emerald-500/10 px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold text-emerald-600 transition-all hover:bg-emerald-500/20 dark:text-emerald-400">
                        <ThumbsUp size={12} className="sm:w-[14px] sm:h-[14px]" /> Loved it
                      </button>
                      <button onClick={() => handleRate(subToRate.id, false)} className="flex-1 flex items-center justify-center gap-1.5 rounded-lg sm:rounded-xl bg-rose-500/10 px-2 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-bold text-rose-600 transition-all hover:bg-rose-500/20 dark:text-rose-400">
                        <ThumbsDown size={12} className="sm:w-[14px] sm:h-[14px]" /> Not really
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col justify-start space-y-4 sm:space-y-6 max-h-[300px] sm:max-h-[350px] overflow-y-auto pr-1 sm:pr-2 pb-1">
              {categoriesData.map(([category, amount], index) => {
                const numericAmount = Number(amount) || 0;
                const percentOfTotal = numericAmount > 0 ? (numericAmount / totalCategorySpend) * 100 : 0;
                const color = categoryColors[index % categoryColors.length];

                return (
                  <div key={category} className="group relative">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-[4px] shadow-sm ${color.dot}`} />
                        <span className="text-xs sm:text-sm font-bold capitalize text-text-primary">{category}</span>
                      </div>
                      <div className="text-right flex items-center gap-2 sm:gap-3">
                        <span className={`text-xs sm:text-sm font-black ${color.text}`}>{formatMoney(numericAmount, displayCurrency)}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-text-muted bg-bg-surface px-1.5 py-0.5 rounded-md border border-border/50">
                          {percentOfTotal.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="relative w-full h-1.5 mt-1.5 sm:mt-2 bg-bg-surface rounded-full overflow-hidden">
                      <div className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${color.bar} opacity-20`} style={{ width: `${percentOfTotal}%` }} />
                      <motion.div className={`absolute top-0 bottom-0 w-1/3 rounded-full bg-gradient-to-r ${color.bar} shadow-[0_0_10px] ${color.shadow}`} initial={{ left: '-33%' }} animate={{ left: '100%' }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </section>

        {/* CUMULATIVE SPEND CHART */}
        <section className="rounded-[24px] sm:rounded-[28px] border border-border bg-bg-elevated p-4 sm:p-8 relative overflow-hidden">
          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                <span className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-violet-500/10 text-xl sm:text-2xl shadow-sm border border-violet-500/10">
                  📈
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-text-secondary">Per-Day Spending Flow</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-text-primary mt-1">
                Cumulative Spend
              </h2>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-violet-500/20 bg-violet-500/5 px-3 py-2 sm:px-5 sm:py-3 shadow-sm w-fit">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-text-secondary">Month-to-Date</span>
                <span className="text-base sm:text-xl font-black text-violet-500">{loading || baseMonthlySpend === 0 ? '...' : formatMoney(currentDayBurn, displayCurrency)}</span>
              </div>
            </div>
          </div>

          <div className="relative h-[250px] sm:h-[350px] w-full mt-2 sm:mt-4">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-text-muted">Loading chart...</div>
            ) : baseMonthlySpend === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-text-muted">No spending data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={multiLineChartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" tickMargin={10} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={(val) => `$${val}`} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const activeEntries = payload.filter((e: any) => Number(e.value) > 0);
                        const total = activeEntries.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
                        return (
                          <div className="rounded-xl border border-white/10 bg-[rgba(20,20,30,0.95)] p-3 sm:p-4 shadow-xl backdrop-blur-md min-w-[200px] sm:min-w-[240px]">
                            <p className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-bold text-violet-300">{multiLineChartData[Number(label) - 1]?.fullDate}</p>
                            <div className="space-y-2 sm:space-y-3">
                              {payload.sort((a: any,b: any) => Number(b.value) - Number(a.value)).map((entry: any) => {
                                const dailyCost = entry.payload._meta?.[entry.name]?.daily || 0;
                                const accumulated = Number(entry.value);
                                return (
                                  <div key={entry.name} className="flex flex-col gap-1 text-[10px] sm:text-xs">
                                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                                      <span className="flex items-center gap-1.5 sm:gap-2 text-white/90 font-medium truncate max-w-[100px] sm:max-w-none">
                                         <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                                         {entry.name}
                                      </span>
                                      <span className="font-bold text-white text-xs sm:text-sm">{formatMoney(accumulated, displayCurrency)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-2 sm:mt-4 border-t border-white/10 pt-2 flex justify-between text-[10px] sm:text-xs font-bold text-white/60">
                              <span>Total</span>
                              <span className="text-white">{formatMoney(total, displayCurrency)}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {topSubsForChart.map((sub, idx) => (
                    <Line key={sub.id} type="monotone" dataKey={sub.name} stroke={lineColors[idx % lineColors.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* RENEWAL TIMELINE */}
        <section className="rounded-[24px] sm:rounded-[28px] border border-border bg-bg-elevated overflow-hidden shadow-sm">
          <div className="flex flex-col justify-between gap-3 sm:gap-5 border-b border-border p-4 sm:p-8 bg-gradient-to-r from-bg-elevated via-bg-elevated to-amber-500/5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-xl sm:text-2xl shadow-lg shadow-amber-500/20">
                ⏰
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-text-primary">
                  Renewal Timeline
                </h2>
                <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium text-text-secondary">
                  Upcoming subscriptions for next 30 days.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-start rounded-xl sm:rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 sm:px-5 sm:py-3 sm:self-auto shadow-sm">
              <span className="text-2xl sm:text-3xl font-black text-amber-500">{dueSoonList.length}</span>
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Action Required</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-text-secondary">Loading...</div>
          ) : dueSoonList.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 sm:py-12 text-center">
              <div className="mb-3 sm:mb-4 rounded-2xl bg-emerald-500/10 p-3 sm:p-4 text-emerald-500"><CheckCircle2 size={24} className="sm:w-[30px] sm:h-[30px]" /></div>
              <h3 className="text-sm sm:text-base font-extrabold text-text-primary">You're all caught up</h3>
              <p className="mt-1 sm:mt-2 max-w-sm text-xs sm:text-sm leading-6 text-text-secondary">No renewals in the next 30 days.</p>
            </div>
          ) : (
            <div className="p-3 sm:p-6 flex flex-col md:flex-row md:flex-wrap gap-3 sm:gap-5">
              {dueSoonList.map((sub) => {
                const days = getDaysUntil(sub.renewalDate);
                const date = new Date(sub.renewalDate);
                const progressPercent = Math.max(5, Math.min(100, ((30 - days) / 30) * 100));
                const isUrgent = days <= 3;
                const isSoon = days <= 7;

                return (
                  <article key={sub.id} className={`group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border bg-bg-surface p-3 sm:p-5 transition-all duration-300 flex-1 min-w-[100%] md:min-w-[300px] ${isUrgent ? 'border-rose-500/30' : isSoon ? 'border-amber-500/30' : 'border-border/60'}`}>
                    <div className="relative flex items-start justify-between mb-3 sm:mb-6">
                      <div className="flex items-center gap-2.5 sm:gap-4">
                        <div className="relative">
                          <SubscriptionLogo name={sub.name} websiteUrl={sub.websiteUrl} category={sub.category} className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl shadow-lg ring-2 ring-white/5" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-black text-text-primary line-clamp-1">{sub.name}</h3>
                          <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider text-text-secondary mt-0.5">{sub.category || 'Other'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm sm:text-lg font-black text-text-primary">{formatMoney(Number(sub.price) || 0, sub.currency || 'USD')}</span>
                      </div>
                    </div>
                    <div className="relative flex items-center justify-between mb-2 sm:mb-3 mt-auto pt-3 sm:pt-4 border-t border-border/50">
                       <div className="flex flex-col">
                          <span className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest ${isUrgent ? 'text-rose-500' : isSoon ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} Days`}
                          </span>
                          <span className="text-[9px] sm:text-[11px] font-medium text-text-secondary mt-0.5">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                       </div>
                    </div>
                    <div className="relative mt-1 sm:mt-2">
                      <div className="relative h-1.5 sm:h-2.5 w-full bg-bg-hover rounded-full overflow-hidden">
                        <div className={`absolute top-0 left-0 h-full rounded-full ${isUrgent ? 'bg-rose-500' : isSoon ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${progressPercent}%` }} />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}