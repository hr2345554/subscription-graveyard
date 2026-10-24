import { useState, useEffect, useCallback, useRef, type ReactNode, type MouseEvent } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
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
import { Input, Textarea } from '../components/ui/FormElements';
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
import { Plus, Search, RefreshCw, ChevronDown, X, Calendar, Tag, CreditCard, Repeat, Trash2, Ban } from 'lucide-react';
import { SubscriptionLogo } from '../components/ui/SubscriptionLogo';

// ==========================================
// 3D TILT CARD COMPONENT
// ==========================================
const TiltCard = ({ children, onClick }: { children: ReactNode, onClick?: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["4deg", "-4deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-4deg", "4deg"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="w-full h-full cursor-pointer"
    >
      {children}
    </motion.div>
  );
};

// App Suggestions & Currencies
const popularApps = [
  'Netflix', 'Spotify', 'YouTube Premium', 'Amazon Prime', 
  'Disney+', 'Apple Music', 'ChatGPT Plus', 'Canva Pro', 
  'Microsoft 365', 'Adobe Creative Cloud', 'HBO Max', 'Zee5',
  'Figma', 'Notion', 'Github Copilot', 'Xbox Game Pass'
];

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'PKR', label: 'PKR (₨)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'EUR', label: 'EUR (€)' }
];

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

// Animation Variants for Modal Content
const modalContentVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const modalItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export function Subscriptions() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  const [filterStatus, setFilterStatus] = useState('active'); 
  
  const [showAdd, setShowAdd] = useState(false);
  const [showCancel, setShowCancel] = useState<Subscription | null>(null);
  const [showDelete, setShowDelete] = useState<Subscription | null>(null);
  
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

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
      
      {/* PAGE HEADER & TOOLBAR */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-text-primary mb-1">
              Subscriptions<span className="text-violet-500">.</span>
            </h1>
            <p className="text-sm text-text-secondary">
              Manage your digital ecosystem in one place
            </p>
          </div>

          <Button
            variant="glow"
            icon={<Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />}
            onClick={() => setShowAdd(true)}
            className="group relative overflow-hidden rounded-2xl px-6 py-6 text-sm font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all duration-300"
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            Add Subscription
          </Button>
        </div>

        <div className="group relative flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 group/search">
            <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 opacity-0 blur-md transition-opacity duration-500 group-focus-within/search:opacity-100" />
            <div className="relative flex items-center overflow-hidden rounded-2xl border border-border/50 bg-bg-elevated/60 backdrop-blur-xl transition-all duration-300 focus-within:border-violet-500/50 focus-within:bg-bg-elevated">
              <Search className="ml-4 h-5 w-5 text-text-muted transition-colors group-focus-within/search:text-violet-500" />
              <input
                type="search"
                placeholder="Search your subscriptions..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-transparent py-4 pl-3 pr-4 text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none"
              />
            </div>
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="h-full w-full appearance-none rounded-2xl border border-border/50 bg-bg-elevated/60 backdrop-blur-xl py-4 pl-11 pr-10 text-sm font-bold text-text-primary transition-all duration-300 hover:bg-bg-elevated focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer sm:w-[180px]"
            >
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="all">All Status</option>
            </select>
            <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-violet-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
            </div>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
        
        {(!loading && !error) && (
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-text-secondary">
              Showing <span className="text-text-primary">{filtered.length}</span> {filtered.length === 1 ? 'result' : 'results'}
            </p>
            {(search || filterStatus !== 'active') && (
              <button
                type="button"
                onClick={() => { setSearch(''); setFilterStatus('active'); }}
                className="text-xs font-bold text-violet-500 transition-colors hover:text-fuchsia-500 flex items-center gap-1"
              >
                Clear filters <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Subscription list */}
      {loading && (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3].map((item) => (
            <div key={item} className="glass-card flex items-center gap-4 p-4">
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-bg-hover" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-32 max-w-full animate-pulse rounded bg-bg-hover" />
                <div className="h-3 w-24 max-w-full animate-pulse rounded bg-bg-hover" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="glass-card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-text-primary">Unable to load subscriptions</h2>
            <p className="mt-1 text-sm text-text-secondary">{error}</p>
          </div>
          <Button variant="ghost" icon={<RefreshCw className="h-4 w-4" />} onClick={() => void loadSubscriptions()}>
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3" style={{ perspective: 1000 }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((sub, index) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: Math.min(index * 0.03, 0.18), duration: 0.22 }}
              >
                <TiltCard onClick={() => setSelectedSub(sub)}>
                  <Card
                    hover
                    className="flex flex-col gap-4 p-4 transition-colors duration-300 sm:flex-row sm:items-center shadow-sm hover:shadow-md"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div style={{ transform: "translateZ(40px)" }} className="shrink-0">
                        <SubscriptionLogo
                          name={sub.name}
                          websiteUrl={sub.websiteUrl}
                          category={sub.category}
                          className="h-12 w-12 rounded-xl shadow-lg"
                        />
                      </div>

                      <div className="min-w-0 flex-1" style={{ transform: "translateZ(20px)" }}>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-semibold text-text-primary text-lg">
                            {sub.name}
                          </h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                            sub.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          }`}>
                            {sub.status}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-xs text-text-secondary">{getCategoryLabel(sub.category)}</span>
                          <span className="text-xs text-text-muted" aria-hidden="true">•</span>
                          <span className="text-xs capitalize text-text-secondary">{sub.billingFrequency}</span>
                        </div>
                      </div>
                    </div>

                    <div 
                      className="flex items-center justify-between gap-3 border-t border-border pt-3 sm:border-0 sm:pt-0"
                      style={{ transform: "translateZ(30px)" }}
                    >
                      <div className="sm:text-right">
                        <p className="font-bold text-text-primary text-lg">
                          {formatCurrency(sub.price, sub.currency)}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary font-medium">
                          {sub.status === 'active'
                            ? `${getDaysUntilRenewal(sub.renewalDate)} days to renew`
                            : sub.cancellationDate ? `Cancelled ${formatDate(sub.cancellationDate)}` : 'Cancelled'}
                        </p>
                      </div>
                    </div>
                  </Card>
                </TiltCard>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="glass-card px-4 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-bg-surface">
                <Search className="h-5 w-5 text-text-muted" />
              </div>
              <h2 className="font-semibold text-text-primary">No active subscriptions</h2>
              <p className="mt-1 text-sm text-text-secondary">Add a new subscription or check your cancelled list.</p>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          PREMIUM DETAIL MODAL (Card Grid Edition)
          ========================================== */}
      <AnimatePresence>
        {selectedSub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md"
            onClick={() => setSelectedSub(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full max-w-md overflow-hidden rounded-[2rem] bg-bg-surface border border-border/50 shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Area */}
              <div className="relative pt-10 pb-6 px-6 flex flex-col items-center justify-center border-b border-border/50">
                <button 
                  onClick={() => setSelectedSub(null)} 
                  className="absolute top-4 right-4 p-2 rounded-full bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <motion.div variants={modalItemVariants} className="relative">
                  <SubscriptionLogo
                    name={selectedSub.name}
                    websiteUrl={selectedSub.websiteUrl}
                    category={selectedSub.category}
                    className="relative h-20 w-20 rounded-[1.5rem] shadow-xl ring-4 ring-bg-surface"
                  />
                </motion.div>
                
                <motion.h2 variants={modalItemVariants} className="text-2xl font-bold text-text-primary text-center mt-4 tracking-tight">
                  {selectedSub.name}
                </motion.h2>
                
                <motion.div variants={modalItemVariants} className="flex items-center gap-2 mt-2">
                   <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      selectedSub.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                    }`}>
                      {selectedSub.status}
                    </span>
                </motion.div>
              </div>

              {/* Body Content (Unified Card Grid) */}
              <motion.div 
                variants={modalContentVariants}
                initial="hidden"
                animate="visible"
                className="p-6"
              >
                <div className="rounded-2xl border border-border/60 bg-bg-elevated overflow-hidden shadow-sm">
                  
                  {/* 2x2 DATA GRID */}
                  <motion.div variants={modalItemVariants} className="grid grid-cols-2 divide-x divide-y divide-border/60">
                    
                    {/* Cell 1: Billing Amount */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-text-muted mb-2">
                        <CreditCard className="w-4 h-4" />
                        <p className="text-[10px] font-bold uppercase tracking-wider">Amount</p>
                      </div>
                      <p className="text-lg font-black text-violet-500 truncate" title={formatCurrency(selectedSub.price, selectedSub.currency)}>
                        {formatCurrency(selectedSub.price, selectedSub.currency)}
                      </p>
                    </div>

                    {/* Cell 2: Renewal Date */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-text-muted mb-2">
                        <Calendar className="w-4 h-4" />
                        <p className="text-[10px] font-bold uppercase tracking-wider">Renewal</p>
                      </div>
                      <p className="text-sm font-semibold text-text-primary">{formatDate(selectedSub.renewalDate)}</p>
                    </div>

                    {/* Cell 3: Category */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-text-muted mb-2">
                        <Tag className="w-4 h-4" />
                        <p className="text-[10px] font-bold uppercase tracking-wider">Category</p>
                      </div>
                      <p className="text-sm font-semibold text-text-primary capitalize">{getCategoryLabel(selectedSub.category)}</p>
                    </div>

                    {/* Cell 4: Billing Cycle */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-text-muted mb-2">
                        <Repeat className="w-4 h-4" />
                        <p className="text-[10px] font-bold uppercase tracking-wider">Cycle</p>
                      </div>
                      <p className="text-sm font-semibold text-text-primary capitalize">{selectedSub.billingFrequency}</p>
                    </div>

                  </motion.div>

                  {/* Notes (If any) */}
                  {selectedSub.notes && (
                     <motion.div variants={modalItemVariants} className="p-5 border-t border-border/60 bg-bg-surface/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1.5">Notes</p>
                        <p className="text-sm text-text-secondary leading-relaxed">{selectedSub.notes}</p>
                     </motion.div>
                  )}

                  {/* ACTION BUTTONS (Soft Grey Cancel & Soft Rose Delete) */}
                  <motion.div variants={modalItemVariants} className="p-5 border-t border-border/60 bg-bg-surface/50 flex flex-col gap-3">
                     
                     {/* Cancel Button: Soft Grey */}
                     {selectedSub.status === 'active' && (
                       <button 
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors duration-200" 
                          onClick={() => { setShowCancel(selectedSub); setSelectedSub(null); }}
                       >
                         <Ban className="w-4 h-4 opacity-80" />
                         Cancel Subscription
                       </button>
                     )}

                     {/* Delete Button: SOFT ROSE (Pinkish-Red) */}
                     <button 
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-rose-400 hover:bg-rose-500 shadow-sm shadow-rose-400/20 transition-all duration-200" 
                        onClick={() => { setShowDelete(selectedSub); setSelectedSub(null); }}
                     >
                       <Trash2 className="w-4 h-4 opacity-90" />
                       Delete Permanently
                     </button>

                  </motion.div>

                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Subscription" size="lg">
        <AddForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>

      {/* Cancel modal */}
      {showCancel && (
        <Modal isOpen={true} onClose={() => setShowCancel(null)} title="Cancel Subscription" size="md">
          <CancelForm sub={showCancel} onSubmit={handleCancel} onCancel={() => setShowCancel(null)} />
        </Modal>
      )}

      {/* Delete confirmation */}
      {showDelete && (
        <Modal isOpen={true} onClose={() => setShowDelete(null)} title="Delete Subscription" size="sm">
          <p className="mb-5 text-sm leading-6 text-text-secondary">
            Delete <strong className="text-text-primary">{showDelete.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowDelete(null)}>Keep Subscription</Button>
            
            {/* SOFT ROSE DELETE BUTTON FOR MODAL */}
            <button 
              onClick={handleDelete}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-white bg-rose-400 hover:bg-rose-500 shadow-sm shadow-rose-400/20 transition-colors"
            >
              Delete Permanently
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ==========================================
// STYLISH ADD FORM
// ==========================================
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

  const inputClass = "w-full rounded-xl border border-border bg-bg-surface px-4 py-3 text-sm text-text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue/50 placeholder:text-text-muted";
  const labelClass = "block text-sm font-semibold text-text-primary mb-1.5";
  const errorClass = "mt-1 text-xs text-danger";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className={labelClass}>App Name</label>
        <input
          type="text"
          placeholder="Search or type app name (e.g. Netflix)"
          list="app-suggestions"
          {...register('name')}
          className={inputClass}
        />
        <datalist id="app-suggestions">
          {popularApps.map((app) => (
            <option key={app} value={app} />
          ))}
        </datalist>
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Price</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('price', { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.price && <p className={errorClass}>{errors.price.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Currency</label>
          <div className="relative">
            <select {...register('currency')} className={`${inputClass} appearance-none cursor-pointer`}>
              {currencies.map((curr) => (
                <option key={curr.value} value={curr.value}>{curr.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          {errors.currency && <p className={errorClass}>{errors.currency.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Billing Cycle</label>
          <div className="relative">
            <select {...register('billingFrequency')} className={`${inputClass} appearance-none cursor-pointer`}>
              {frequencies.map((freq) => (
                <option key={freq.value} value={freq.value}>{freq.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          {errors.billingFrequency && <p className={errorClass}>{errors.billingFrequency.message}</p>}
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <div className="relative">
            <select {...register('category')} className={`${inputClass} appearance-none cursor-pointer`}>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          {errors.category && <p className={errorClass}>{errors.category.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Start Date</label>
          <input type="date" {...register('startDate')} className={`${inputClass} text-text-secondary`} />
          {errors.startDate && <p className={errorClass}>{errors.startDate.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Renewal Date</label>
          <input type="date" {...register('renewalDate')} className={`${inputClass} text-text-secondary`} />
          {errors.renewalDate && <p className={errorClass}>{errors.renewalDate.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Website URL (Optional)</label>
        <input type="url" placeholder="https://..." {...register('websiteUrl')} className={inputClass} />
        {errors.websiteUrl && <p className={errorClass}>{errors.websiteUrl.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Notes (Optional)</label>
        <textarea rows={3} placeholder="Any additional details..." {...register('notes')} className={`${inputClass} resize-none`} />
        {errors.notes && <p className={errorClass}>{errors.notes.message}</p>}
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5 mt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="glow" type="submit" disabled={isSubmitting} className="min-w-[140px]">
          {isSubmitting ? 'Saving...' : 'Save Subscription'}
        </Button>
      </div>
    </form>
  );
}

// ==========================================
// CANCEL FORM
// ==========================================
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
        <p className="text-sm text-text-secondary">You are cancelling</p>
        <p className="mt-1 font-semibold text-text-primary">{sub.name}</p>
        <p className="mt-1 text-xs text-text-muted">This will move the subscription to your Graveyard.</p>
      </div>

      <Input label="Cancellation Date" type="date" {...register('cancellationDate')} error={errors.cancellationDate?.message} />
      <Textarea label="Reason (optional)" {...register('cancellationReason')} error={errors.cancellationReason?.message} />

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-4">
        {/* Solid Grey button for Cancel - 'Keep It' removed */}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Cancelling...' : 'Cancel Subscription'}
        </button>
      </div>
    </form>
  );
}