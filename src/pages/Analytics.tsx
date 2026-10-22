
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
          setStats(data);
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
        <Skeleton className="h-8 w-48" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-text-primary">
          Analytics
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Detailed spending insights and trends
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending */}
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

        {/* Spending Trend */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Spending Trend
          </h3>

          <div className="h-80">
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
        </Card>

        {/* Category Breakdown */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Category Breakdown
          </h3>

          <div className="h-80">
            {stats.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.categoryBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={60}
                    paddingAngle={3}
                    label={({ category, percent }) =>
                      `${getCategoryLabel(category)} ${(
                        percent * 100
                      ).toFixed(0)}%`
                    }
                  >
                    {stats.categoryBreakdown.map((entry, i) => (
                      <Cell
                        key={`${entry.category}-${i}`}
                        fill={getCategoryColor(entry.category)}
                        stroke="var(--bg-elevated)"
                        strokeWidth={2}
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

        {/* Summary */}
        <Card>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Summary
          </h3>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-bg-surface border border-border">
              <p className="text-text-muted text-sm">
                Active Subscriptions
              </p>
              <p className="text-3xl font-bold text-text-primary mt-1">
                {stats.activeCount}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border">
              <p className="text-text-muted text-sm">
                Cancelled Subscriptions
              </p>
              <p className="text-3xl font-bold text-text-primary mt-1">
                {stats.cancelledCount}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border">
              <p className="text-text-muted text-sm">
                Monthly Spending
              </p>
              <p className="text-3xl font-bold text-accent-blue mt-1">
                {formatCurrency(stats.totalMonthlySpending)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border">
              <p className="text-text-muted text-sm">
                Annual Cost
              </p>
              <p className="text-3xl font-bold text-accent-violet mt-1">
                {formatCurrency(stats.totalAnnualSpending)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-bg-surface border border-border">
              <p className="text-text-muted text-sm">
                Total Saved
              </p>
              <p className="text-3xl font-bold text-success mt-1">
                {formatCurrency(stats.totalSaved)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
