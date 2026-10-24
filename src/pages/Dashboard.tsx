import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  Layers3,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { api } from '../api/service';
import type { Subscription as AppSubscription } from '../types';
// 👇 1. YEH IMPORT ADD KIYA HAI 👇
import { getRealWorldComparison } from '../utils/funTranslations';

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
  const symbols: Record<string, string> = {
    USD: '$',
    PKR: 'Rs ',
    GBP: '£',
    EUR: '€',
    INR: '₹',
  };

  return symbols[currency] || `${currency} `;
};

const formatMoney = (amount: number, currency: string): string =>
  `${currencySymbol(currency)}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const getDaysUntil = (date: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renewal = new Date(date);
  renewal.setHours(0, 0, 0, 0);

  return Math.ceil(
    (renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
};

const categoryColors = [
  {
    bar: 'bg-violet-500',
    text: 'text-violet-500',
    soft: 'bg-violet-500/10',
    dot: 'bg-violet-500',
  },
  {
    bar: 'bg-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
    soft: 'bg-cyan-500/10',
    dot: 'bg-cyan-500',
  },
  {
    bar: 'bg-rose-500',
    text: 'text-rose-500',
    soft: 'bg-rose-500/10',
    dot: 'bg-rose-500',
  },
  {
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    soft: 'bg-amber-500/10',
    dot: 'bg-amber-500',
  },
  {
    bar: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    soft: 'bg-emerald-500/10',
    dot: 'bg-emerald-500',
  },
  {
    bar: 'bg-blue-500',
    text: 'text-blue-500',
    soft: 'bg-blue-500/10',
    dot: 'bg-blue-500',
  },
  {
    bar: 'bg-pink-500',
    text: 'text-pink-500',
    soft: 'bg-pink-500/10',
    dot: 'bg-pink-500',
  },
];

export default function Dashboard() {
  const [view, setView] = useState<'Monthly' | 'Annual'>('Monthly');
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

        if (mounted) {
          setError('Unable to load subscriptions. Please refresh the page.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
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

        if (!response.ok) {
          throw new Error('Exchange rate request failed');
        }

        const result = await response.json();

        if (result.result !== 'success' || !result.rates) {
          throw new Error('Exchange rates unavailable');
        }

        if (!cancelled) {
          setExchangeRates(result.rates);
          setExchangeRateError(false);
        }
      } catch (error) {
        if (!cancelled) {
          setExchangeRateError(true);
        }

        console.error('Could not load USD exchange rates:', error);
      }
    }

    void loadExchangeRates();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeSubscriptions = useMemo(
    () =>
      subscriptions.filter(
        (sub) =>
          !['cancelled', 'canceled', 'inactive', 'expired'].includes(
            String(sub.status).toLowerCase(),
          ),
      ),
    [subscriptions],
  );

  const availableCategories = Array.from(
    new Set(activeSubscriptions.map((sub) => sub.category).filter(Boolean)),
  );

  const availableCurrencies = Array.from(
    new Set(activeSubscriptions.map((sub) => sub.currency).filter(Boolean)),
  );

  const filteredSubscriptions = useMemo(
    () =>
      activeSubscriptions.filter((sub) => {
        const matchesCategory =
          selectedCategory === 'All categories' ||
          sub.category === selectedCategory;

        const matchesCurrency =
          selectedCurrency === 'All currencies' ||
          sub.currency === selectedCurrency;

        return matchesCategory && matchesCurrency;
      }),
    [activeSubscriptions, selectedCategory, selectedCurrency],
  );

  const multiplier = view === 'Annual' ? 12 : 1;
  
  const totalSpend = filteredSubscriptions.reduce((total, sub) => {
    const monthlyAmount = getMonthlyAmount(sub);
    const usdAmount = convertToUSD(monthlyAmount, sub.currency);

    if (usdAmount === null) return total;

    return total + usdAmount * multiplier;
  }, 0);

  const dueSoonList = useMemo(
    () =>
      filteredSubscriptions
        .filter((sub) => {
          if (!sub.renewalDate) return false;

          const days = getDaysUntil(sub.renewalDate);
          return days >= 0 && days <= 30;
        })
        .sort(
          (a, b) =>
            new Date(a.renewalDate).getTime() -
            new Date(b.renewalDate).getTime(),
        ),
    [filteredSubscriptions],
  );

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    filteredSubscriptions.forEach((sub) => {
      const category = sub.category || 'Other';
      const usdAmount = convertToUSD(getMonthlyAmount(sub), sub.currency);

      if (usdAmount === null) return;

      totals[category] = (totals[category] || 0) + usdAmount * multiplier;
    });

    return totals;
  }, [filteredSubscriptions, multiplier, convertToUSD]);

  const categoriesData: [string, number][] =
    Object.keys(categoryTotals).length > 0
      ? Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
      : [['No Data', 0]];

  const maxCategorySpend = Math.max(...Object.values(categoryTotals), 1);

  const currenciesInView = Array.from(
    new Set(filteredSubscriptions.map((sub) => sub.currency).filter(Boolean)),
  );

  const displayCurrency = 'USD';

  const trendData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(currentYear, currentMonth - 5 + index, 1);

      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        amount: totalSpend,
      };
    });
  }, [totalSpend]);

  const maxTrendSpend = Math.max(...trendData.map((item) => item.amount), 1);

  return (
    <main className="min-h-screen bg-bg-primary p-4 text-text-primary sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-7">
        {/* PAGE HEADER */}
        <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  error
                    ? 'bg-rose-500'
                    : loading
                      ? 'animate-pulse bg-amber-500'
                      : 'bg-emerald-500'
                }`}
              />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-secondary">
                Subscription overview
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl lg:text-5xl">
              Your money,
              <span className="ml-2 text-violet-500">in perspective.</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">
              Every subscription in one place. See what you spend, what renews,
              and where your money goes.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-border bg-bg-elevated px-4 py-3">
            <CalendarClock size={17} className="text-violet-500" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                Billing view
              </p>
              <p className="text-sm font-bold">{view} overview</p>
            </div>
          </div>
        </header>

        {/* FILTER TOOLBAR */}
        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-bg-elevated p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <label className="flex min-w-[170px] flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">
                Category
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="min-h-11 rounded-xl border border-border bg-bg-surface px-3 text-sm text-text-primary outline-none transition-colors focus:border-violet-500"
              >
                <option value="All categories">All categories</option>
                {availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-[150px] flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">
                Currency
              </span>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="min-h-11 rounded-xl border border-border bg-bg-surface px-3 text-sm text-text-primary outline-none transition-colors focus:border-violet-500"
              >
                <option value="All currencies">All currencies</option>
                {availableCurrencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex items-center gap-1 self-start rounded-xl border border-border bg-bg-surface p-1 sm:self-auto">
            {(['Monthly', 'Annual'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                aria-pressed={view === option}
                className={`min-h-10 rounded-lg px-5 text-xs font-bold transition-all duration-200 ${
                  view === option
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'text-text-secondary hover:bg-bg-elevated hover:text-text-primary'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger"
          >
            <Activity size={18} />
            {error}
          </div>
        )}

        {exchangeRateError && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            Exchange rates could not load. Some subscriptions may be excluded from USD totals.
          </div>
        )}

        {!exchangeRates && !exchangeRateError && currenciesInView.some(
          (currency) => currency.toUpperCase() !== 'USD',
        ) && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            Loading live exchange rates for USD conversion...
          </div>
        )}

        {/* BENTO GRID */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* MAIN SPENDING CARD */}
          <article className="relative isolate min-h-[310px] overflow-hidden rounded-[28px] bg-gradient-to-br from-[#17132f] via-[#282052] to-[#45258c] p-6 text-white shadow-xl shadow-violet-950/10 sm:p-8 lg:col-span-7 lg:p-10">
            <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-6 -top-10 h-52 w-52 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-24 right-16 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-1/2 w-1/2 bg-gradient-to-tl from-cyan-400/10 to-transparent" />

            <div className="relative z-10 flex h-full min-h-[250px] flex-col justify-between gap-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <span className="rounded-lg border border-white/15 bg-white/10 p-2">
                      <Wallet size={18} />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-100/80">
                      {view} commitment
                    </span>
                  </div>

                  <p className="text-sm font-medium text-white/65">
                    {view === 'Annual'
                      ? 'Your projected yearly subscription cost'
                      : 'Your recurring monthly subscription cost'}
                  </p>
                </div>

                {/* REAL API SYNC STATUS */}
                <div
                  role="status"
                  title={
                    lastSuccessfulSync
                      ? `Last successful subscription response: ${lastSuccessfulSync.toLocaleString()}`
                      : 'Waiting for the first successful subscription response'
                  }
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    error
                      ? 'border-rose-300/20 bg-rose-300/10 text-rose-200'
                      : loading
                        ? 'border-amber-300/20 bg-amber-300/10 text-amber-200'
                        : 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      error
                        ? 'bg-rose-400'
                        : loading
                          ? 'animate-pulse bg-amber-300'
                          : 'bg-emerald-300'
                    }`}
                  />

                  {error
                    ? 'Connection issue'
                    : loading
                      ? 'Syncing...'
                      : lastSuccessfulSync
                        ? `Synced ${lastSuccessfulSync.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : 'Connected'}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="break-words text-4xl font-black leading-tight tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                    {loading ? '...' : formatMoney(totalSpend, displayCurrency)}
                  </span>
                  <span className="text-sm font-medium text-white/50">
                    {view === 'Annual' ? '/ year' : '/ month'}
                  </span>
                </div>

                {/* 👇 2. YEH NAYA FEATURE ADD KIYA HAI 👇 */}
                {!loading && totalSpend > 0 && (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm border border-white/10 w-fit">
                    <span>💡</span>
                    <span>
                      That's like buying <strong className="text-white">{getRealWorldComparison(totalSpend)}</strong>!
                    </span>
                  </div>
                )}
                {/* 👆 NAYA FEATURE KHATAM 👆 */}

                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="min-w-[125px] rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                      Active services
                    </p>
                    <p className="mt-1 text-2xl font-black">
                      {loading ? '...' : filteredSubscriptions.length}
                    </p>
                  </div>

                  <div className="min-w-[125px] rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                      Average per service
                    </p>
                    <p className="mt-1 text-xl font-black">
                      {loading ? '...' : formatMoney(
                        filteredSubscriptions.length > 0
                          ? totalSpend / filteredSubscriptions.length
                          : 0,
                        displayCurrency,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* ACTIVE SUBSCRIPTIONS */}
          <article className="group relative flex min-h-[230px] flex-col justify-between overflow-hidden rounded-[28px] border border-border bg-bg-elevated p-6 transition-colors duration-300 hover:border-violet-500/40 sm:p-7 lg:col-span-5">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-500/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />

            <div className="relative flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-text-secondary">
                  Your ecosystem
                </span>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                  Active subscriptions
                </h2>
              </div>
              <span className="rounded-2xl bg-violet-500/10 p-3 text-violet-500">
                <Layers3 size={22} />
              </span>
            </div>

            <div className="relative mt-7">
              <div className="flex items-end gap-3">
                <span className="text-6xl font-black leading-none tracking-[-0.06em]">
                  {loading ? '...' : filteredSubscriptions.length}
                </span>
                <span className="mb-1 text-sm text-text-secondary">
                  {filteredSubscriptions.length === 1 ? 'service' : 'services'}
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <span className="text-xs text-text-secondary">
                  Matching current filters
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-violet-500">
                  <CheckCircle2 size={14} />
                  {loading ? 'Loading' : 'Tracked'}
                </span>
              </div>
            </div>
          </article>
        </section>

        {/* ANALYTICS */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* SPENDING TREND */}
          <article className="overflow-hidden rounded-[28px] border border-border bg-bg-elevated p-5 sm:p-7 xl:col-span-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-lg bg-violet-500/10 p-2 text-violet-500">
                    <TrendingUp size={17} />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                    Analytics / 01
                  </span>
                </div>
                <h2 className="text-xl font-black tracking-tight sm:text-2xl">
                  Spending overview
                </h2>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  Current subscription commitment across a six-month timeline.
                </p>
              </div>

              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-text-secondary">
                  Current level
                </p>
                <p className="mt-1 text-sm font-black text-violet-500">
                  {loading ? '...' : formatMoney(totalSpend, displayCurrency)}
                </p>
              </div>
            </div>

            <div className="relative mt-8 pl-1">
              <div className="pointer-events-none absolute inset-0 bottom-8 flex flex-col justify-between">
                {[0, 1, 2, 3].map((line) => (
                  <div
                    key={line}
                    className="border-t border-dashed border-border"
                  />
                ))}
              </div>

              <div className="relative grid h-[230px] grid-cols-6 gap-2 sm:gap-4">
                {trendData.map((item, index) => {
                  const height =
                    item.amount > 0
                      ? Math.max(8, (item.amount / maxTrendSpend) * 100)
                      : 0;

                  const isCurrentMonth = index === trendData.length - 1;

                  return (
                    <div
                      key={`${item.month}-${index}`}
                      className="flex min-w-0 flex-col items-center justify-end"
                    >
                      <div className="mb-2 min-h-[24px] text-center">
                        {isCurrentMonth && item.amount > 0 && (
                          <span className="rounded-md bg-violet-500/10 px-1.5 py-1 text-[9px] font-extrabold text-violet-500">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="flex h-[165px] w-full items-end justify-center">
                        <div
                          title={`${item.month}: ${formatMoney(item.amount, displayCurrency)}`}
                          className={`relative w-full max-w-[48px] overflow-hidden rounded-t-xl transition-all duration-500 ${
                            isCurrentMonth
                              ? 'bg-gradient-to-t from-violet-700 via-violet-500 to-fuchsia-400 shadow-lg shadow-violet-500/20'
                              : 'bg-gradient-to-t from-violet-500/25 to-violet-400/50'
                          }`}
                          style={{ height: `${height}%` }}
                        >
                          {isCurrentMonth && item.amount > 0 && (
                            <div className="absolute inset-x-0 top-0 h-1 bg-white/70" />
                          )}
                        </div>
                      </div>

                      <span
                        className={`mt-3 text-[10px] font-bold sm:text-xs ${
                          isCurrentMonth
                            ? 'text-violet-500'
                            : 'text-text-secondary'
                        }`}
                      >
                        {item.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-bg-surface p-3.5">
              <span className="mt-0.5 text-text-secondary">
                <Activity size={15} />
              </span>
              <p className="text-[11px] leading-5 text-text-secondary">
                Historical transaction records are not available from the current
                data service. The bars show the current spending level for reference;
                they do not represent actual historical spending.
              </p>
            </div>
          </article>

          {/* SPEND BY CATEGORY */}
          <article className="rounded-[28px] border border-border bg-bg-elevated p-5 sm:p-7 xl:col-span-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-lg bg-rose-500/10 p-2 text-rose-500">
                    <Layers3 size={17} />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                    Analytics / 02
                  </span>
                </div>
                <h2 className="text-xl font-black tracking-tight sm:text-2xl">
                  Spend by category
                </h2>
                <p className="mt-1 text-xs text-text-secondary">
                  {view === 'Annual' ? 'Annualized' : 'Monthly'} cost by category
                </p>
              </div>

              <span className="rounded-xl bg-bg-surface px-3 py-2 text-[10px] font-bold text-text-secondary">
                {Object.keys(categoryTotals).length} categories
              </span>
            </div>

            <div className="mt-7 space-y-5">
              {categoriesData.map(([category, amount], index) => {
                const numericAmount = Number(amount) || 0;
                const percent =
                  numericAmount > 0
                    ? (numericAmount / maxCategorySpend) * 100
                    : 0;
                const color = categoryColors[index % categoryColors.length];

                return (
                  <div key={category} className="group">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-[3px] ${color.dot}`}
                        />
                        <span className="truncate text-sm font-semibold">
                          {category}
                        </span>
                      </div>

                      <span className="shrink-0 text-xs font-extrabold tabular-nums">
                        {formatMoney(numericAmount, displayCurrency)}
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-bg-surface">
                      <div
                        className={`h-full rounded-full ${color.bar} transition-all duration-700 ease-out`}
                        style={{ width: `${percent}%` }}
                        title={`${category}: ${formatMoney(numericAmount, displayCurrency)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Total commitment
                </p>
                <p className="mt-1 text-lg font-black">
                  {loading ? '...' : formatMoney(totalSpend, displayCurrency)}
                </p>
              </div>

              <span className="rounded-xl bg-rose-500/10 p-3 text-rose-500">
                <Wallet size={19} />
              </span>
            </div>
          </article>
        </section>

        {/* RENEWAL SCHEDULE */}
        <section className="overflow-hidden rounded-[28px] border border-border bg-bg-elevated">
          <div className="flex flex-col justify-between gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:p-7">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                  <Clock3 size={17} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">
                  Your schedule
                </span>
              </div>

              <h2 className="text-xl font-black tracking-tight sm:text-2xl">
                Coming up next
              </h2>
              <p className="mt-1 text-xs text-text-secondary">
                Subscriptions with renewal dates in the next 30 days.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 sm:self-auto">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {loading ? '...' : dueSoonList.length}
              </span>
              <span className="text-[10px] font-bold uppercase leading-4 tracking-wider text-text-secondary">
                Upcoming
                <br />
                renewals
              </span>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-text-secondary">
              Loading your subscriptions...
            </div>
          ) : dueSoonList.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <div className="mb-4 rounded-2xl bg-emerald-500/10 p-4 text-emerald-500">
                <CheckCircle2 size={30} />
              </div>
              <h3 className="text-base font-extrabold">You're all caught up</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">
                No upcoming renewals in the next 30 days. Any new renewal dates
                will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-4 sm:p-5 lg:grid-cols-2">
              {dueSoonList.map((sub, index) => {
                const days = getDaysUntil(sub.renewalDate);
                const date = new Date(sub.renewalDate);
                const color = categoryColors[index % categoryColors.length];

                return (
                  <article
                    key={sub.id}
                    className="group relative flex min-w-0 items-center gap-4 overflow-hidden rounded-2xl border border-border bg-bg-surface p-4 transition-all duration-300 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5 sm:p-5"
                  >
                    <div
                      className={`flex h-[68px] w-[62px] shrink-0 flex-col items-center justify-center rounded-xl ${color.soft}`}
                    >
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider ${color.text}`}
                      >
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span
                        className={`text-2xl font-black leading-tight ${color.text}`}
                      >
                        {date.getDate()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="max-w-full truncate text-sm font-extrabold">
                          {sub.name}
                        </h3>
                        {days <= 3 && (
                          <span className="rounded-md bg-rose-500/10 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-rose-500">
                            {days === 0
                              ? 'Today'
                              : days === 1
                                ? 'Tomorrow'
                                : 'Soon'}
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 truncate text-[11px] text-text-secondary">
                        {sub.category || 'Other'}
                        {' · '}
                        {date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>

                      <p className="mt-2 text-xs font-bold text-text-secondary">
                        {days === 0
                          ? 'Renews today'
                          : days === 1
                            ? 'Renews tomorrow'
                            : `Renews in ${days} days`}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="text-sm font-black sm:text-base">
                        {formatMoney(
                          Number(sub.price) || 0,
                          sub.currency || 'USD',
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-text-secondary">
                        <CreditCard size={12} />
                        Renewal
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {dueSoonList.length > 0 && !loading && (
            <div className="flex items-center gap-2 border-t border-border px-5 py-4 text-[11px] leading-5 text-text-secondary sm:px-7">
              <Sparkles size={14} className="shrink-0 text-violet-500" />
              Showing renewals within the next 30 days, ordered by renewal date.
            </div>
          )}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border py-5">
          <p className="text-[10px] font-medium text-text-secondary">
            Subscription Graveyard · Financial overview
          </p>
          <p className="flex items-center gap-1.5 text-[10px] font-medium text-text-secondary">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                error
                  ? 'bg-rose-500'
                  : loading
                    ? 'animate-pulse bg-amber-500'
                    : 'bg-emerald-500'
              }`}
            />
            {error
              ? 'Subscription data unavailable'
              : loading
                ? 'Connecting to subscription data'
                : lastSuccessfulSync
                  ? `Last synced ${lastSuccessfulSync.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'Waiting for subscription data'}
          </p>
        </footer>
      </div>
    </main>
  );
}