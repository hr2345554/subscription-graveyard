import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// 🌟 TanStack Query Import
import { useQuery } from '@tanstack/react-query';

import { api } from '../api/service';
import type { DashboardStats } from '../types';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import {
  formatCurrency,
  getCategoryLabel,
  getCategoryColor,
} from '../utils/calculations';

const MotionDiv = motion.div as any;

const chartTooltipStyle = {
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
  fontSize: '12px', // Mobile friendly font
};

const axisTickStyle = {
  fontSize: 10, // Chhota font mobile ke liye
  fill: 'var(--text-secondary)',
};

export function Analytics() {
  const { data: rawStats, isLoading: loading, isError: error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => api.getDashboardStats(),
  });

  const stats = rawStats as unknown as DashboardStats | null;

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-start gap-3.5">
          <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Skeleton className="h-[350px] sm:h-[450px] lg:col-span-2" />
          <Skeleton className="h-64 sm:h-80" />
          <Skeleton className="h-64 sm:h-80" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="glass-card p-6 space-y-2">
        <h2 className="text-lg font-semibold text-text-primary">
          Unable to load analytics
        </h2>
        <p className="text-sm text-text-secondary">
          Your spending statistics could not be loaded. Please refresh the
          page and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 🌟 COMPACT & BALANCED HEADER 🌟 */}
      <MotionDiv
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3.5"
      >
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 dark:to-transparent border border-white/50 dark:border-white/10 shadow-sm backdrop-blur-sm" />
          <span className="relative z-10 text-2xl drop-shadow-md">📊</span>
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl leading-tight">
            Analytics<span className="text-violet-500">.</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm leading-tight text-text-secondary font-medium">
            Detailed spending insights and trends
          </p>
        </div>
      </MotionDiv>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* MERGED: SPENDING TREND + SUMMARY (Full Width) */}
        <Card className="lg:col-span-2 flex flex-col justify-between overflow-hidden p-4 sm:p-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-text-primary">
                Spending Trend
              </h3>
              <span className="text-[10px] sm:text-xs w-fit font-medium text-text-muted px-2 py-1 bg-bg-surface rounded-md border border-border/50">
                Last 6 Months
              </span>
            </div>

            {/* 🌟 Height adjust ki mobile ke liye */}
            <div className="h-60 sm:h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={axisTickStyle}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    tick={axisTickStyle}
                    tickFormatter={(value) => `$${value}`}
                    axisLine={false}
                    tickLine={false}
                    width={45} // Fixed width taake space na khaye
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    name="Spending"
                    stroke="#8757FF"
                    strokeWidth={3}
                    dot={{ fill: '#8757FF', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Merged Summary Section */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border/60">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3 flex items-center gap-2">
              Overview Metrics
              <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[9px]">Base: USD</span>
            </h4>
            
            {/* 🌟 RESPONSIVE GRID: Mobile par 2, Tab par 3, Desktop par 5 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3">
              
              <div className="flex flex-col gap-1 p-2.5 sm:p-3 bg-bg-surface/50 rounded-xl border border-border/40">
                <span className="text-[10px] sm:text-xs font-medium text-text-secondary">Active Subs</span>
                <span className="text-base sm:text-xl font-black text-text-primary">{stats.activeCount}</span>
              </div>

              <div className="flex flex-col gap-1 p-2.5 sm:p-3 bg-bg-surface/50 rounded-xl border border-border/40">
                <span className="text-[10px] sm:text-xs font-medium text-text-secondary">Cancelled</span>
                <span className="text-base sm:text-xl font-black text-text-primary">{stats.cancelledCount}</span>
              </div>

              <div className="flex flex-col gap-1 p-2.5 sm:p-3 bg-bg-surface/50 rounded-xl border border-border/40">
                <span className="text-[10px] sm:text-xs font-medium text-text-secondary">Monthly</span>
                <span className="text-base sm:text-xl font-black text-accent-blue">{formatCurrency(stats.totalMonthlySpending, 'USD')}</span>
              </div>

              <div className="flex flex-col gap-1 p-2.5 sm:p-3 bg-bg-surface/50 rounded-xl border border-border/40">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] sm:text-xs font-medium text-text-secondary">Annual</span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-violet-500 bg-violet-500/10 px-1 py-0.5 rounded uppercase">Est.</span>
                </div>
                <span className="text-base sm:text-xl font-black text-accent-violet">{formatCurrency(stats.totalAnnualSpending, 'USD')}</span>
              </div>

              <div className="flex flex-col gap-1 p-2.5 sm:p-3 bg-bg-surface/50 rounded-xl border border-border/40 col-span-2 sm:col-span-1">
                <span className="text-[10px] sm:text-xs font-medium text-text-secondary">Total Saved</span>
                <span className="text-base sm:text-xl font-black text-success">{formatCurrency(stats.totalSaved, 'USD')}</span>
              </div>

            </div>
          </div>
        </Card>

        {/* MONTHLY SPENDING (Bar Chart) */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-4">
            Monthly Spending
          </h3>

          <div className="h-60 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyTrend} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={axisTickStyle}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                  tickMargin={10}
                />
                <YAxis
                  tick={axisTickStyle}
                  tickFormatter={(value) => `$${value}`}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                  cursor={{ fill: 'var(--bg-hover)', opacity: 0.45 }}
                />
                <Bar
                  dataKey="amount"
                  name="Spending"
                  fill="#3478FF"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50} // Mobile par bars moti na hon
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* CATEGORY BREAKDOWN (Pie Chart) */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-4">
            Category Breakdown
          </h3>

          <div className="h-64 sm:h-80 w-full">
            {stats.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={stats.categoryBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius="75%" // Mobile par auto adjust hoga
                    innerRadius="45%"
                    paddingAngle={2} 
                    labelLine={false}
                    label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {stats.categoryBreakdown.map((entry, i) => (
                      <Cell
                        key={`${entry.category}-${i}`}
                        fill={getCategoryColor(entry.category)}
                        stroke="none" 
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    formatter={(value: number, name: string) => [formatCurrency(value, 'USD'), getCategoryLabel(name)]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-text-muted text-sm text-center">No category data available.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Analytics;