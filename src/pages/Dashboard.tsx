import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  CheckCircle2,
  Clock3,
  CreditCard,
  Wallet,
  PieChart as PieIcon,
  Sparkles,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../api/service';
import type { Subscription as AppSubscription } from '../types';
import { SubscriptionLogo } from '../components/ui/SubscriptionLogo';

// ==========================================
// TEXT SCRAMBLE EFFECT COMPONENT
// ==========================================
const TextScramble = ({ text, className }: { text: string; className?: string }) => {
  const [displayText, setDisplayText] = useState('');
  const chars = '!<>-_\\/[]{}—=+*^?#________';

  useEffect(() => {
    let frame = 0;
    let animationFrameId: number;
    const queue = text.split('').map((char) => ({
      from: chars[Math.floor(Math.random() * chars.length)],
      to: char,
      start: Math.floor(Math.random() * 40),
      end: Math.floor(Math.random() * 40) + 40,
    }));

    const update = () => {
      let output = '';
      let complete = 0;
      for (let i = 0; i < queue.length; i++) {
        const { from, to, start, end } = queue[i];
        if (frame >= end) {
          complete++;
          output += to;
        } else if (frame >= start) {
          if (!queue[i].from || Math.random() < 0.28) {
            queue[i].from = chars[Math.floor(Math.random() * chars.length)];
          }
          output += queue[i].from;
        } else {
          output += ' ';
        }
      }
      setDisplayText(output);
      if (complete !== queue.length) {
        frame++;
        animationFrameId = requestAnimationFrame(update);
      }
    };
    update();
    return () => cancelAnimationFrame(animationFrameId);
  }, [text]);

  return <span className={className}>{displayText}</span>;
};
// ==========================================

interface DashboardSubscription extends AppSubscription {
  billingCycle?: string;
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

// 🌟 VIBE COMPARISONS (Random Selection)
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
  { bar: 'from-violet-600 to-fuchsia-400', shadow: 'shadow-violet-500/50', text: 'text-violet-500', soft: 'bg-violet-500/10', dot: 'bg-violet-500' },
  { bar: 'from-blue-600 to-cyan-400', shadow: 'shadow-blue-500/50', text: 'text-blue-500', soft: 'bg-blue-500/10', dot: 'bg-blue-500' },
  { bar: 'from-emerald-600 to-teal-400', shadow: 'shadow-emerald-500/50', text: 'text-emerald-500', soft: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
  { bar: 'from-amber-600 to-yellow-400', shadow: 'shadow-amber-500/50', text: 'text-amber-500', soft: 'bg-amber-500/10', dot: 'bg-amber-500' },
  { bar: 'from-rose-600 to-pink-400', shadow: 'shadow-rose-500/50', text: 'text-rose-500', soft: 'bg-rose-500/10', dot: 'bg-rose-500' },
];

const lineColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

const chartTooltipStyle = {
  backgroundColor: 'rgba(20, 20, 30, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: '#fff',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(10px)',
};

export default function Dashboard() {
  const [subscriptions, setSubscriptions] = useState<DashboardSubscription[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [selectedCurrency, setSelectedCurrency] = useState('All currencies');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [exchangeRateError, setExchangeRateError] = useState(false);
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
        const result = await api.getSubscriptions();
        if (mounted) {
          setSubscriptions(result as DashboardSubscription[]);
          setError('');
          setLastSuccessfulSync(new Date());
        }
      } catch (err) {
        console.error('Failed to load subscriptions:', err);
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
        if (!cancelled) {
          setExchangeRates(result.rates);
          setExchangeRateError(false);
        }
      } catch (error) {
        if (!cancelled) setExchangeRateError(true);
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

  // 🌟 Dynamic Vibe text (Memoized so it doesn't change on every state render)
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

  const maxCategorySpend = Math.max(...Object.values(categoryTotals), 1);

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
        const accumulated = dailyRate * day;
        
        dataPoint[sub.name] = Number(accumulated.toFixed(2));
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

  return (
    <main className="min-h-screen bg-bg-primary p-4 text-text-primary sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-7">
        
        {/* PAGE HEADER */}
        <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${error ? 'bg-rose-500' : loading ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'}`} />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-secondary">
                Subscription overview
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl lg:text-5xl">
              <TextScramble text="Your money," />
              <TextScramble text="in perspective." className="ml-2 text-violet-500" />
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">
              See what you spend, renews, where money goes.
            </p>
          </div>
        </header>

        {/* FILTER TOOLBAR */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-bg-elevated p-4 sm:flex-row sm:items-end">
          <div className="flex flex-wrap gap-3">
            <label className="flex min-w-[170px] flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">Category</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="min-h-11 rounded-xl border border-border bg-bg-surface px-3 text-sm text-text-primary outline-none transition-colors focus:border-violet-500"
              >
                <option value="All categories">All categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[150px] flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">Currency</span>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="min-h-11 rounded-xl border border-border bg-bg-surface px-3 text-sm text-text-primary outline-none transition-colors focus:border-violet-500"
              >
                <option value="All currencies">All currencies</option>
                {availableCurrencies.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {error && (
          <div role="alert" className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            <Activity size={18} /> {error}
          </div>
        )}

        {/* TOP ROW: MAIN CARD & CATEGORIES CARD */}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          
          <article className="relative isolate min-h-[310px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#17132f] via-[#282052] to-[#45258c] p-6 text-white shadow-xl shadow-violet-950/10 sm:p-8 lg:col-span-7 lg:p-10">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-6 -top-10 h-52 w-52 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-24 right-16 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-1/2 w-1/2 bg-gradient-to-tl from-cyan-400/10 to-transparent" />

            <div className="relative z-10 flex h-full min-h-[250px] flex-col justify-between gap-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="rounded-lg border border-white/15 bg-white/10 p-2"><Wallet size={18} /></span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-100/80">
                      Monthly Commitment
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white/65">
                    Your recurring monthly subscription cost.
                  </p>
                </div>
                <div
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    error ? 'border-rose-300/20 bg-rose-300/10 text-rose-200' : loading ? 'border-amber-300/20 bg-amber-300/10 text-amber-200' : 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${error ? 'bg-rose-400' : loading ? 'animate-pulse bg-amber-300' : 'bg-emerald-300'}`} />
                  {error ? 'Connection issue' : loading ? 'Syncing...' : lastSuccessfulSync ? `Synced ${lastSuccessfulSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Connected'}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="break-words text-4xl font-black leading-tight tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                    {loading ? '...' : formatMoney(displaySpend, displayCurrency)}
                  </span>
                  <span className="text-sm font-medium text-white/50">/ month</span>
                </div>

                {/* 🌟 ANIMATED COMPARISON BOX WITH AUTO-SHINE 🌟 */}
                {!loading && displaySpend > 0 && vibeText && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="group relative mt-6 flex w-fit items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 shadow-lg backdrop-blur-md cursor-default"
                  >
                    {/* Auto Shine Light - Har 2 second baad chalega */}
                    <motion.div 
                      initial={{ x: '-100%' }}
                      animate={{ x: '200%' }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1.2, 
                        repeatDelay: 0.8, // 1.2s + 0.8s = 2s total
                        ease: "easeInOut" 
                      }}
                      className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 pointer-events-none"
                    />
                    
                    {/* Glowing Sparkle Icon */}
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                      <div className="absolute inset-0 rounded-full bg-violet-500/40 blur-md animate-pulse" />
                      <Sparkles className="relative z-10 h-4 w-4 text-violet-300" />
                    </div>

                    {/* Text Content */}
                    <p className="relative z-10 text-sm font-medium text-white/80">
                      That's like buying{" "}
                      <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent font-bold text-base tracking-wide">
                        {vibeText}
                      </span>
                    </p>
                  </motion.div>
                )}

                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="min-w-[125px] rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Active services</p>
                    <p className="mt-1 text-2xl font-black">{loading ? '...' : filteredSubscriptions.length}</p>
                  </div>
                  <div className="min-w-[125px] rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">Average per service</p>
                    <p className="mt-1 text-xl font-black">
                      {loading ? '...' : formatMoney(filteredSubscriptions.length > 0 ? displaySpend / filteredSubscriptions.length : 0, displayCurrency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-[28px] border border-border bg-bg-elevated p-6 sm:p-8 lg:col-span-5 flex flex-col relative overflow-hidden">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-500">
                  <PieIcon size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight">Spend by Category</h2>
                  <p className="text-[11px] font-medium text-text-secondary mt-0.5">Where your money goes</p>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-6">
              {categoriesData.map(([category, amount], index) => {
                const numericAmount = Number(amount) || 0;
                const percent = numericAmount > 0 ? (numericAmount / maxCategorySpend) * 100 : 0;
                const color = categoryColors[index % categoryColors.length];

                return (
                  <div key={category} className="group relative">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`h-3 w-3 rounded-[4px] shadow-sm ${color.dot}`} />
                        <span className="text-sm font-bold capitalize text-text-primary">{category}</span>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className={`text-sm font-black ${color.text}`}>{formatMoney(numericAmount, displayCurrency)}</span>
                        <span className="text-[10px] font-bold text-text-muted bg-bg-surface px-2 py-0.5 rounded-md border border-border/50">
                          {percent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-bg-surface rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${color.bar} shadow-[0_0_10px] ${color.shadow} transition-all duration-1000 ease-out`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {categoriesData.length === 1 && categoriesData[0][0] === 'No Data' && (
                <div className="text-center text-sm text-text-muted py-8">Add a subscription to see categories.</div>
              )}
            </div>
          </article>

        </section>

        {/* FULL WIDTH: DYNAMIC CHART */}
        <section className="rounded-[28px] border border-border bg-bg-elevated p-6 sm:p-8 relative overflow-hidden">
          <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 bg-violet-500/5 blur-3xl rounded-bl-full" />
          
          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-lg bg-violet-500/10 p-1.5 text-violet-500"><Activity size={16} /></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Per-Day Spending Flow
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                Cumulative Spend per Subscription
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                See how much value each service generates day by day this month.
              </p>
            </div>
            
            <div className="flex items-center gap-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 px-5 py-3 shadow-sm w-fit">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Month-to-Date Spend
                </span>
                <span className="text-xl font-black text-violet-500">
                  {loading || baseMonthlySpend === 0 ? '...' : formatMoney(currentDayBurn, displayCurrency)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative h-[350px] w-full mt-4">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-text-muted">Loading chart...</div>
            ) : baseMonthlySpend === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-text-muted">No spending data yet.</div>
            ) : (
              
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={multiLineChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                    interval="preserveStartEnd"
                    tickMargin={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 600 }} 
                    tickFormatter={(val) => `$${val}`} 
                    axisLine={false} 
                    tickLine={false} 
                    width={60} 
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const activeEntries = payload.filter((e: any) => Number(e.value) > 0);
                        const total = activeEntries.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);

                        return (
                          <div className="rounded-xl border border-white/10 bg-[rgba(20,20,30,0.95)] p-4 shadow-xl backdrop-blur-md min-w-[240px]">
                            <p className="mb-3 text-xs font-bold text-violet-300">
                              {multiLineChartData[Number(label) - 1]?.fullDate}
                            </p>
                            <div className="space-y-3">
                              {payload.sort((a: any,b: any) => Number(b.value) - Number(a.value)).map((entry: any) => {
                                const dailyCost = entry.payload._meta?.[entry.name]?.daily || 0;
                                const accumulated = Number(entry.value);

                                return (
                                  <div key={entry.name} className="flex flex-col gap-1 text-xs">
                                    <div className="flex items-center justify-between gap-4">
                                      <span className="flex items-center gap-2 text-white/90 font-medium">
                                         <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                                         {entry.name}
                                      </span>
                                      <span className="font-bold text-white text-sm">{formatMoney(accumulated, displayCurrency)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-white/50 pl-4">
                                      <span>Est. Cost:</span>
                                      <span>{formatMoney(dailyCost, displayCurrency)}/day</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-4 border-t border-white/10 pt-2 flex justify-between text-xs font-bold text-white/60">
                              <span>Total Value</span>
                              <span className="text-white">{formatMoney(total, displayCurrency)}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  {topSubsForChart.map((sub, idx) => (
                    <Line
                      key={sub.id}
                      type="monotone" 
                      dataKey={sub.name}
                      stroke={lineColors[idx % lineColors.length]}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: 'white', stroke: lineColors[idx % lineColors.length], strokeWidth: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>

            )}
          </div>
        </section>

        {/* BOTTOM: RENEWAL SCHEDULE */}
        <section className="rounded-[28px] border border-border bg-bg-elevated overflow-hidden shadow-sm">
          <div className="flex flex-col justify-between gap-5 border-b border-border p-6 sm:flex-row sm:items-center sm:p-8 bg-gradient-to-r from-bg-elevated via-bg-elevated to-amber-500/5">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-3 shadow-lg shadow-amber-500/20 text-white">
                <Clock3 size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary">
                  Renewal Timeline
                </h2>
                <p className="mt-1 text-sm font-medium text-text-secondary">
                  Track your upcoming subscriptions for the next 30 days.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 self-start rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 sm:self-auto shadow-sm">
              <span className="text-3xl font-black text-amber-500">{dueSoonList.length}</span>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Action Required</span>
                <span className="text-xs font-medium text-text-secondary">in next 30 days</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-text-secondary">Loading your subscriptions...</div>
          ) : dueSoonList.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <div className="mb-4 rounded-2xl bg-emerald-500/10 p-4 text-emerald-500"><CheckCircle2 size={30} /></div>
              <h3 className="text-base font-extrabold">You're all caught up</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">No upcoming renewals in the next 30 days. Any new renewal dates will appear here automatically.</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 flex flex-col md:flex-row md:flex-wrap gap-5">
              {dueSoonList.map((sub) => {
                const days = getDaysUntil(sub.renewalDate);
                const date = new Date(sub.renewalDate);
                const progressPercent = Math.max(5, Math.min(100, ((30 - days) / 30) * 100));
                const isUrgent = days <= 3;
                const isSoon = days <= 7;

                return (
                  <article
                    key={sub.id}
                    className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex-1 min-w-[300px] lg:min-w-[320px] ${
                      isUrgent ? 'border-rose-500/30 hover:shadow-rose-500/10' : isSoon ? 'border-amber-500/30 hover:shadow-amber-500/10' : 'border-border/60 hover:border-violet-500/40 hover:shadow-violet-500/10'
                    }`}
                  >
                    <div className={`pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl transition-transform duration-500 group-hover:scale-125 ${
                      isUrgent ? 'bg-rose-500/10' : isSoon ? 'bg-amber-500/10' : 'bg-violet-500/10'
                    }`} />

                    <div className="relative flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <SubscriptionLogo name={sub.name} websiteUrl={sub.websiteUrl} category={sub.category} className="h-14 w-14 rounded-2xl shadow-lg ring-2 ring-white/5" />
                          <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-bg-surface ${isUrgent ? 'bg-rose-500' : isSoon ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-text-primary line-clamp-1">{sub.name}</h3>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mt-0.5">{sub.category || 'Other'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-text-primary">{formatMoney(Number(sub.price) || 0, sub.currency || 'USD')}</span>
                        <p className="text-[10px] font-bold text-text-muted mt-1 flex items-center justify-end gap-1"><CreditCard size={12} /> Auto-pay</p>
                      </div>
                    </div>

                    <div className="relative flex items-center justify-between mb-3 mt-auto pt-4 border-t border-border/50">
                       <div className="flex flex-col">
                          <span className={`text-[11px] font-black uppercase tracking-widest ${isUrgent ? 'text-rose-500' : isSoon ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {days === 0 ? 'Renews Today' : days === 1 ? 'Renews Tomorrow' : `In ${days} Days`}
                          </span>
                          <span className="text-[11px] font-medium text-text-secondary mt-0.5">
                            {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                       </div>
                    </div>

                    <div className="relative mt-2">
                      <div className="relative h-2.5 w-full bg-bg-hover rounded-full overflow-hidden border border-border/40 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
                        <div
                          className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${
                            isUrgent ? 'bg-gradient-to-r from-rose-600 to-rose-400' 
                            : isSoon ? 'bg-gradient-to-r from-amber-500 to-orange-400' 
                            : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 h-[1px] rounded-t-full" />
                        </div>
                        
                        <div 
                          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-[1.5px] border-white shadow-md transition-all duration-1000 ease-out z-10 ${
                            isUrgent ? 'bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.6)]' 
                            : isSoon ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' 
                            : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                          }`}
                          style={{ left: `calc(${progressPercent}% - 6px)` }}
                        />
                      </div>
                    </div>

                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-5">
          <p className="text-[10px] font-medium text-text-secondary">Subscription Graveyard · Financial overview</p>
          <p className="flex items-center gap-1.5 text-[10px] font-medium text-text-secondary">
            <span className={`h-1.5 w-1.5 rounded-full ${error ? 'bg-rose-500' : loading ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'}`} />
            {error ? 'Subscription data unavailable' : loading ? 'Connecting to subscription data' : lastSuccessfulSync ? `Last synced ${lastSuccessfulSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Waiting for subscription data'}
          </p>
        </footer>
      </div>
    </main>
  );
}