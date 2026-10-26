import { useEffect, useState } from 'react';
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
};

const axisTickStyle = {
  fontSize: 12,
  fill: 'var(--text-secondary)',
};

export function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    api
      .getDashboardStats()
      .then((data) => {
        if (active) {
          setStats(data as unknown as DashboardStats); 
          setError(false);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* 🌟 UPDATED SKELETON FOR HEADER 🌟 */}
        <div className="flex items-start gap-3.5">
          <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[450px] lg:col-span-2" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
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
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* MERGED: SPENDING TREND + SUMMARY (Full Width) */}
        <Card className="lg:col-span-2 flex flex-col justify-between overflow-hidden p-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Spending Trend
              </h3>
              <span className="text-xs font-medium text-text-muted px-2 py-1 bg-bg-surface rounded-md border border-border/50">
                Last 6 Months
              </span>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={axisTickStyle}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                  />
                  <YAxis
                    tick={axisTickStyle}
                    tickFormatter={(value) => `$${value}`}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={{ stroke: 'var(--border)' }}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    name="Spending"
                    stroke="#8757FF"
                    strokeWidth={3}
                    dot={{
                      fill: '#8757FF',
                      stroke: 'var(--bg-elevated)',
                      strokeWidth: 2,
                      r: 5,
                    }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Merged Summary Section */}
          <div className="mt-8 pt-6 border-t border-border/60">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3">
              Overview Metrics
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              
              <div className="flex flex-col gap-1 p-3 bg-bg-surface/50 rounded-xl border border-border/40">
                <span className="text-xs font-medium text-text-secondary">Active Subs</span>
                <span className="text-xl font-black text-text-primary">{stats.activeCount}</span>
              </div>

              <div className="flex flex-col gap-1 p-3 bg-bg-surface/50 rounded-xl border border-border/40">
                <span className="text-xs font-medium text-text-secondary">Cancelled</span>
                <span className="text-xl font-black text-text-primary">{stats.cancelledCount}</span>
              </div>

              <div className="flex flex-col gap-1 p-3 bg-bg-surface/50 rounded-xl border border-border/40">
                <span className="text-xs font-medium text-text-secondary">Monthly</span>
                <span className="text-xl font-black text-accent-blue">{formatCurrency(stats.totalMonthlySpending)}</span>
              </div>

              {/* ANNUAL with EST badge */}
              <div className="flex flex-col gap-1 p-3 bg-bg-surface/50 rounded-xl border border-border/40">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-text-secondary">Annual</span>
                  <span 
                    className="text-[9px] font-bold text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded uppercase"
                    title="Estimated projection based on current monthly spending"
                  >
                    Est.
                  </span>
                </div>
                <span className="text-xl font-black text-accent-violet">{formatCurrency(stats.totalAnnualSpending)}</span>
              </div>

              <div className="flex flex-col gap-1 p-3 bg-bg-surface/50 rounded-xl border border-border/40">
                <span className="text-xs font-medium text-text-secondary">Total Saved</span>
                <span className="text-xl font-black text-success">{formatCurrency(stats.totalSaved)}</span>
              </div>

            </div>
          </div>
        </Card>

        {/* MONTHLY SPENDING (Bar Chart) */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Monthly Spending
          </h3>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyTrend}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                />
                <XAxis
                  dataKey="month"
                  tick={axisTickStyle}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  tick={axisTickStyle}
                  tickFormatter={(value) => `$${value}`}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                  cursor={{ fill: 'var(--bg-hover)', opacity: 0.45 }}
                />
                <Bar
                  dataKey="amount"
                  name="Spending"
                  fill="#3478FF"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* CATEGORY BREAKDOWN (Pie Chart) */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Category Breakdown
          </h3>

          <div className="h-80 w-full overflow-visible">
            {stats.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <Pie
                    data={stats.categoryBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={95} 
                    innerRadius={60}
                    paddingAngle={0} 
                    labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
                    label={({ category, percent }) =>
                      `${getCategoryLabel(category)} ${(percent * 100).toFixed(0)}%`
                    }
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
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-text-muted text-sm text-center py-8">
                  No category data available yet.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Analytics;