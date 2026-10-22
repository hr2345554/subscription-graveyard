import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../api/service';
import type {
  Subscription,
  SubscriptionCategory,
  BillingFrequency,
} from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input, Select, Textarea } from '../components/ui/FormElements';
import { showToast } from '../components/ui/Toast';
import {
  subscriptionSchema,
  cancelSchema,
  SubscriptionFormData,
  CancelFormData,
} from '../utils/validation';
import {
  formatCurrency,
  formatDate,
  getDaysUntilRenewal,
  getCategoryLabel,
} from '../utils/calculations';
// Skull icon yahan se hata diya gaya hai
import { Plus, Search, Trash2, RefreshCw } from 'lucide-react';
import { SubscriptionLogo } from '../components/ui/SubscriptionLogo';

const categories: { value: SubscriptionCategory; label: string }[] = [
  { value: 'streaming', label: 'Streaming' },
  { value: 'music', label: 'Music' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'news', label: 'News' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance' },
  { value: 'communication', label: 'Communication' },
  { value: 'other', label: 'Other' },
];

const frequencies: { value: BillingFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export function Subscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  // Default filter 'active' set hai taake cancel hote hi item gayab ho jaye
  const [filterStatus, setFilterStatus] = useState('active'); 
  
  const [showAdd, setShowAdd] = useState(false);
  const [showCancel, setShowCancel] = useState<Subscription | null>(null);
  const [showDelete, setShowDelete] = useState<Subscription | null>(null);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await api.getSubscriptions();
      setSubs(data);
    } catch {
      setError('Could not load subscriptions. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  const filtered = subs.filter((sub) => {
    if (filterStatus !== 'all' && sub.status !== filterStatus) {
      return false;
    }

    return sub.name.toLowerCase().includes(search.trim().toLowerCase());
  });

  const handleAdd = async (data: SubscriptionFormData) => {
    try {
      await api.createSubscription(data);
      await loadSubscriptions();
      showToast('success', 'Subscription added successfully');
      setShowAdd(false);
    } catch {
      showToast('error', 'Could not add subscription. Please try again.');
    }
  };

  const handleCancel = async (data: CancelFormData) => {
    if (!showCancel) return;

    try {
      await api.cancelSubscription(
        showCancel.id,
        data.cancellationDate,
        data.cancellationReason,
      );

      await loadSubscriptions();
      showToast('success', `${showCancel.name} moved to Graveyard`);
      setShowCancel(null);
    } catch {
      showToast('error', 'Could not cancel this subscription. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;

    try {
      await api.deleteSubscription(showDelete.id);
      await loadSubscriptions();
      showToast('success', 'Subscription permanently deleted');
      setShowDelete(null);
    } catch {
      showToast('error', 'Could not delete this subscription. Please try again.');
    }
  };

  return (
    <div className="min-w-0 space-y-6 text-text-primary transition-colors duration-300">
      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">
            Subscriptions
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage all your subscriptions in one place
          </p>
        </div>

        <Button
          variant="glow"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setShowAdd(true)}
        >
          Add Subscription
        </Button>
      </motion.div>

      {/* Search and filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card flex flex-col gap-3 p-4 transition-colors duration-300 sm:flex-row"
      >
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            aria-label="Search subscriptions"
            placeholder="Search subscriptions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-border bg-bg-surface py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/40"
          />
        </div>

        <select
          aria-label="Filter by subscription status"
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          className="w-full rounded-xl border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/40 sm:w-auto"
        >
          <option value="active">Active</option>
          <option value="cancelled">Cancelled (History)</option>
          <option value="all">All Status</option>
        </select>
      </motion.div>

      {/* Loading state */}
      {loading && (
        <div
          className="space-y-3"
          aria-label="Loading subscriptions"
          aria-busy="true"
        >
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="glass-card flex items-center gap-4 p-4"
            >
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-bg-hover" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-32 max-w-full animate-pulse rounded bg-bg-hover" />
                <div className="h-3 w-24 max-w-full animate-pulse rounded bg-bg-hover" />
              </div>
              <div className="hidden space-y-2 sm:block">
                <div className="h-4 w-20 animate-pulse rounded bg-bg-hover" />
                <div className="h-3 w-16 animate-pulse rounded bg-bg-hover" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* API error */}
      {!loading && error && (
        <div
          role="alert"
          className="glass-card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 className="font-semibold text-text-primary">
              Unable to load subscriptions
            </h2>
            <p className="mt-1 text-sm text-text-secondary">{error}</p>
          </div>

          <Button
            variant="ghost"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => void loadSubscriptions()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Subscription list */}
      {!loading && !error && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className="text-sm text-text-secondary">
              {filtered.length} {filtered.length === 1 ? 'subscription' : 'subscriptions'} found
            </p>

            {(search || filterStatus !== 'active') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilterStatus('active');
                }}
                className="text-xs font-medium text-accent-blue transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
              >
                Clear filters
              </button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {filtered.map((sub, index) => (
              <motion.div
                key={sub.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{
                  delay: Math.min(index * 0.03, 0.18),
                  duration: 0.22,
                }}
              >
                <Card
                  hover
                  className="flex flex-col gap-4 p-4 transition-colors duration-300 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <SubscriptionLogo
                      name={sub.name}
                      websiteUrl={sub.websiteUrl}
                      category={sub.category}
                      className="h-12 w-12 shrink-0 rounded-xl"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold text-text-primary">
                          {sub.name}
                        </h3>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                            sub.status === 'active'
                              ? 'bg-success/10 text-success'
                              : 'bg-danger/10 text-danger'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-xs text-text-secondary">
                          {getCategoryLabel(sub.category)}
                        </span>
                        <span className="text-xs text-text-muted" aria-hidden="true">
                          •
                        </span>
                        <span className="text-xs capitalize text-text-secondary">
                          {sub.billingFrequency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border pt-3 sm:border-0 sm:pt-0">
                    <div className="sm:text-right">
                      <p className="font-semibold text-text-primary">
                        {formatCurrency(sub.price, sub.currency)}
                      </p>

                      <p className="mt-1 text-xs text-text-secondary">
                        {sub.status === 'active'
                          ? `${getDaysUntilRenewal(sub.renewalDate)} days to renew`
                          : sub.cancellationDate
                            ? `Cancelled ${formatDate(sub.cancellationDate)}`
                            : 'Cancelled'}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {sub.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCancel(sub)}
                          className="text-danger hover:bg-danger/10 hover:text-danger px-3"
                        >
                          Cancel
                        </Button>
                      )}

                      <Button
                        variant="icon"
                        size="sm"
                        onClick={() => setShowDelete(sub)}
                        title="Delete Permanently"
                      >
                        <Trash2
                          aria-hidden="true"
                          className="h-4 w-4 text-danger"
                        />
                        <span className="sr-only">Delete {sub.name}</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="glass-card px-4 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-bg-surface">
                <Search className="h-5 w-5 text-text-muted" />
              </div>
              <h2 className="font-semibold text-text-primary">
                No active subscriptions
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                Add a new subscription or check your cancelled list.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilterStatus('all');
                }}
                className="mt-4 text-sm font-medium text-accent-blue hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
              >
                View All Subscriptions
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add modal */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Subscription"
        size="lg"
      >
        <AddForm
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
        />
      </Modal>

      {/* Cancel modal */}
      {showCancel && (
        <Modal
          isOpen={true}
          onClose={() => setShowCancel(null)}
          title="Cancel Subscription"
          size="md"
        >
          <CancelForm
            sub={showCancel}
            onSubmit={handleCancel}
            onCancel={() => setShowCancel(null)}
          />
        </Modal>
      )}

      {/* Delete confirmation */}
      {showDelete && (
        <Modal
          isOpen={true}
          onClose={() => setShowDelete(null)}
          title="Delete Subscription"
          size="sm"
        >
          <p className="mb-5 text-sm leading-6 text-text-secondary">
            Delete{' '}
            <strong className="text-text-primary">{showDelete.name}</strong>?
            This action cannot be undone.
          </p>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowDelete(null)}
            >
              Keep Subscription
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Permanently
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AddForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: SubscriptionFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      currency: 'USD',
      billingFrequency: 'monthly',
      category: 'streaming',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Name"
        placeholder="Netflix"
        {...register('name')}
        error={errors.name?.message}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Price"
          type="number"
          step="0.01"
          {...register('price', { valueAsNumber: true })}
          error={errors.price?.message}
        />
        <Input
          label="Currency"
          {...register('currency')}
          error={errors.currency?.message}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Billing"
          options={frequencies}
          {...register('billingFrequency')}
          error={errors.billingFrequency?.message}
        />
        <Select
          label="Category"
          options={categories}
          {...register('category')}
          error={errors.category?.message}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Start Date"
          type="date"
          {...register('startDate')}
          error={errors.startDate?.message}
        />
        <Input
          label="Renewal Date"
          type="date"
          {...register('renewalDate')}
          error={errors.renewalDate?.message}
        />
      </div>

      <Input
        label="Website URL"
        type="url"
        placeholder="https://..."
        {...register('websiteUrl')}
        error={errors.websiteUrl?.message}
      />

      <Textarea
        label="Notes"
        {...register('notes')}
        error={errors.notes?.message}
      />

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="glow"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Subscription'}
        </Button>
      </div>
    </form>
  );
}

function CancelForm({
  sub,
  onSubmit,
  onCancel,
}: {
  sub: Subscription;
  onSubmit: (data: CancelFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CancelFormData>({
    resolver: zodResolver(cancelSchema),
    defaultValues: {
      cancellationDate: new Date().toISOString().split('T')[0],
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-xl border border-border bg-bg-surface p-4">
        <p className="text-sm text-text-secondary">
          You are cancelling
        </p>
        <p className="mt-1 font-semibold text-text-primary">{sub.name}</p>
        <p className="mt-1 text-xs text-text-muted">
          This will move the subscription to your Graveyard.
        </p>
      </div>

      <Input
        label="Cancellation Date"
        type="date"
        {...register('cancellationDate')}
        error={errors.cancellationDate?.message}
      />

      <Textarea
        label="Reason (optional)"
        {...register('cancellationReason')}
        error={errors.cancellationReason?.message}
      />

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Keep It
        </Button>
        <Button
          variant="danger"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Cancelling...' : 'Cancel Subscription'}
        </Button>
      </div>
    </form>
  );
}