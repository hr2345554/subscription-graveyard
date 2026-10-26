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
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
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
import { Plus, Search, RefreshCw, ChevronDown, X, Trash2, Ban, Users, Pencil, CheckCircle2, ArrowRight, Check } from 'lucide-react';
import { SubscriptionLogo } from '../components/ui/SubscriptionLogo';
import { SplitModal } from '../components/SplitModal'; 

// ==========================================
// 3D TILT CARD COMPONENT (Subtle Version)
// ==========================================
const TiltCard = ({ children, onClick, isSelectable }: { children: ReactNode, onClick?: () => void, isSelectable?: boolean }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["1deg", "-1deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-1deg", "1deg"]);

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
      className={`w-full h-full ${isSelectable ? 'cursor-pointer' : 'cursor-default'}`}
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

export function Subscriptions() {
  // Tab State
  const [activeTab, setActiveTab] = useState<'my-subs' | 'shared'>(
    (localStorage.getItem('subs_tab') as 'my-subs' | 'shared') || 'my-subs'
  );

  const handleTabChange = (tab: 'my-subs' | 'shared') => {
    setActiveTab(tab);
    localStorage.setItem('subs_tab', tab);
  };

  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  const [filterStatus, setFilterStatus] = useState('active'); 
  
  const [sharedSubs, setSharedSubs] = useState<any[]>([]);
  const [loadingShared, setLoadingShared] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<Subscription | null>(null);
  const [showCancel, setShowCancel] = useState<Subscription | null>(null);
  const [showSplit, setShowSplit] = useState<Subscription | null>(null); 

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);

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

  const loadSharedSubs = useCallback(async () => {
    setLoadingShared(true);
    try {
      const data = await api.getSharedSubscriptions();
      setSharedSubs(data);
    } catch {
      showToast('error', 'Could not load shared subscriptions.');
    } finally {
      setLoadingShared(false);
    }
  }, []);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(() => {
    if (activeTab === 'shared') {
      void loadSharedSubs();
    }
  }, [activeTab, loadSharedSubs]);

  useEffect(() => {
    setSelectedSubs([]);
  }, [search, filterStatus, activeTab]);

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

  const handleEdit = async (data: SubscriptionFormData) => {
    if (!showEdit) return;
    try {
      await api.updateSubscription(showEdit.id, data);
      await loadSubscriptions();
      showToast('success', 'Subscription updated successfully');
      setShowEdit(null);
    } catch {
      showToast('error', 'Could not update subscription. Please try again.');
    }
  };

  const handleCancel = async (data: CancelFormData) => {
    if (!showCancel) return;

    try {
      await api.cancelSubscription(
        showCancel.id,
        data.cancellationDate,
        data.cancellationReason || '',
      );

      await loadSubscriptions();
      showToast('success', `${showCancel.name} moved to Graveyard`);
      setShowCancel(null);
    } catch {
      showToast('error', 'Could not cancel this subscription. Please try again.');
    }
  };

  const handleSplit = async (id: string, sharedWith: { email: string; amountOwed: number; hasPaid: boolean }[]) => {
    try {
      await api.splitSubscription(id, sharedWith);
      await loadSubscriptions();
      showToast('success', 'Subscription shared successfully');
      setShowSplit(null);
    } catch {
      showToast('error', 'Could not share this subscription. Please try again.');
    }
  };

  const handleAccept = async (splitId: string) => {
    try {
      await api.acceptSplit(splitId);
      showToast('success', 'Invitation accepted!');
      void loadSharedSubs();
    } catch {
      showToast('error', 'Could not accept invitation.');
    }
  };

  const handleRemoveSplit = async (splitId: string) => {
    if (!window.confirm('Are you sure you want to remove this shared subscription?')) return;
    try {
      await api.removeSplit(splitId);
      showToast('success', 'Removed successfully');
      void loadSharedSubs();
    } catch {
      showToast('error', 'Could not remove subscription.');
    }
  };

  const toggleSelectSub = (id: string) => {
    setSelectedSubs((prev) =>
      prev.includes(id) ? prev.filter((subId) => subId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSubs.length === filtered.length) {
      setSelectedSubs([]);
    } else {
      setSelectedSubs(filtered.map((s) => s.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubs.length === 0) return;
    try {
      await Promise.all(selectedSubs.map((id) => api.deleteSubscription(id)));
      await loadSubscriptions();
      showToast('success', `${selectedSubs.length} subscription(s) deleted permanently`);
      setIsDeleteMode(false);
      setSelectedSubs([]);
    } catch {
      showToast('error', 'Could not delete subscriptions. Please try again.');
    }
  };

  const exitDeleteMode = () => {
    setIsDeleteMode(false);
    setSelectedSubs([]);
  };

  return (
    <div className="min-w-0 space-y-6 text-text-primary transition-colors duration-300">
      
      {/* PAGE HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 dark:to-transparent border border-white/50 dark:border-white/10 shadow-sm backdrop-blur-sm" />
              <span className="relative z-10 text-2xl drop-shadow-md">💳</span>
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl leading-tight">
                Subscriptions<span className="text-emerald-500">.</span>
              </h1>
              <p className="mt-1 text-xs sm:text-sm leading-tight text-text-secondary font-medium">
                Manage your digital ecosystem in one place
              </p>
            </div>
          </div>

          {/* Add Button */}
          {activeTab === 'my-subs' && (
            <Button
              variant="glow"
              icon={<Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />}
              onClick={() => setShowAdd(true)}
              className="group relative overflow-hidden rounded-xl px-5 py-2.5 h-11 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              Add Subscription
            </Button>
          )}
        </div>

        {/* 🌟 SLEEK SEGMENTED CONTROL TABS (BOTH GREEN) 🌟 */}
        <div className="inline-flex p-1.5 bg-bg-surface/50 backdrop-blur-md border border-border/40 rounded-full shadow-sm">
          <button
            onClick={() => handleTabChange('my-subs')}
            className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'my-subs' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30' 
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/50'
            }`}
          >
            My Subscriptions
          </button>
          
          <button
            onClick={() => handleTabChange('shared')}
            className={`px-6 py-2.5 text-sm font-bold rounded-full transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'shared' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30' 
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover/50'
            }`}
          >
            <Users size={16} /> Shared with Me
          </button>
        </div>
      </motion.div>

      {/* TAB 1: MY SUBSCRIPTIONS */}
      {activeTab === 'my-subs' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          <div className="group relative flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1 group/search">
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 opacity-0 blur-md transition-opacity duration-500 group-focus-within/search:opacity-100" />
              <div className="relative flex items-center overflow-hidden rounded-2xl border border-border/50 bg-bg-elevated/60 backdrop-blur-xl transition-all duration-300 focus-within:border-emerald-500/50 focus-within:bg-bg-elevated">
                <Search className="ml-4 h-5 w-5 text-text-muted transition-colors group-focus-within/search:text-emerald-500" />
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
                className="h-full w-full appearance-none rounded-2xl border border-border/50 bg-bg-elevated/60 backdrop-blur-xl py-4 pl-11 pr-10 text-sm font-bold text-text-primary transition-all duration-300 hover:bg-bg-elevated focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer sm:w-[180px]"
              >
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="all">All Status</option>
              </select>
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              </div>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </div>
          
          {(!loading && !error) && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1 pb-5 mb-2 border-b-2 border-border/80 transition-all">
              {isDeleteMode ? (
                <>
                  <p className="text-sm font-bold text-rose-500 flex items-center gap-2">
                    <Trash2 size={16} /> {selectedSubs.length} selected
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <button onClick={toggleSelectAll} className="h-9 px-4 rounded-xl border border-border/60 bg-bg-surface text-xs font-bold text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all">
                      {selectedSubs.length === filtered.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button onClick={exitDeleteMode} className="h-9 px-4 rounded-xl border border-border/60 bg-bg-surface text-xs font-bold text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all">
                      Cancel
                    </button>
                    <Button variant="glow" onClick={handleBulkDelete} disabled={selectedSubs.length === 0} className="h-9 px-4 text-xs bg-rose-500 hover:bg-rose-600 border-none shadow-rose-500/20 hover:shadow-rose-500/40 disabled:opacity-50">
                      Delete Selected ({selectedSubs.length})
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-text-secondary">
                    Showing <span className="text-text-primary">{filtered.length}</span> {filtered.length === 1 ? 'result' : 'results'}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {(search || filterStatus !== 'active') && (
                      <button type="button" onClick={() => { setSearch(''); setFilterStatus('active'); }} className="text-xs font-bold text-emerald-500 transition-colors hover:text-emerald-400 flex items-center gap-1">
                        Clear filters <X className="w-3 h-3" />
                      </button>
                    )}
                    {filtered.length > 0 && (
                      <button onClick={() => setIsDeleteMode(true)} className="group relative flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-500 transition-all duration-300 hover:bg-rose-500 hover:text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] border border-rose-500/20 hover:border-rose-500">
                        <Trash2 size={14} className="transition-transform group-hover:scale-110 group-hover:-rotate-12" />
                        Delete Subscriptions
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {loading && (
            <div className="flex flex-col gap-4">{[1, 2, 3].map((item) => (<div key={item} className="h-24 rounded-[24px] bg-bg-hover animate-pulse" />))}</div>
          )}
          {!loading && error && (
            <div role="alert" className="glass-card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="font-semibold text-text-primary">Unable to load subscriptions</h2><p className="mt-1 text-sm text-text-secondary">{error}</p></div>
              <Button variant="ghost" icon={<RefreshCw className="h-4 w-4" />} onClick={() => void loadSubscriptions()}>Retry</Button>
            </div>
          )}

          {!loading && !error && (
            <div className="flex flex-col gap-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((sub, index) => {
                  const isSelected = selectedSubs.includes(sub.id);
                  return (
                    <motion.div key={sub.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: Math.min(index * 0.05, 0.2), duration: 0.3 }} className="w-full">
                      <TiltCard onClick={() => isDeleteMode && toggleSelectSub(sub.id)} isSelectable={isDeleteMode}>
                        <div className={`group relative flex flex-col xl:flex-row w-full bg-bg-surface border shadow-sm transition-all duration-300 rounded-[24px] overflow-hidden ${isSelected ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-rose-500/10' : 'border-border/60 hover:shadow-xl hover:border-emerald-500/30'}`}>
                          
                          {isDeleteMode && (
                            <div className="absolute top-1/2 -translate-y-1/2 left-5 z-20">
                              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-rose-500 border-rose-500 text-white' : 'border-border bg-bg-surface/80 backdrop-blur-sm'}`}>
                                {isSelected && <CheckCircle2 size={14} />}
                              </div>
                            </div>
                          )}

                          <div className={`flex-1 p-5 flex items-center gap-4 relative transition-opacity min-w-0 ${isDeleteMode ? 'pl-14' : 'pl-5'}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="shrink-0"><SubscriptionLogo name={sub.name} websiteUrl={sub.websiteUrl} category={sub.category} className="h-12 w-12 rounded-xl" /></div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg leading-tight line-clamp-1 text-text-primary">{sub.name}</h3>
                              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mt-0.5">{getCategoryLabel(sub.category)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {(sub as any).isShared && (sub as any).sharedWith?.length > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md"><Users size={12} /> Shared</span>
                              )}
                            </div>
                          </div>

                          <div className="xl:w-[160px] p-5 flex flex-row xl:flex-col items-center justify-between xl:justify-center xl:border-l-2 border-t-2 xl:border-t-0 border-slate-300 dark:border-slate-600">
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider xl:mb-1.5">Price</p>
                            <div className="text-right xl:text-center"><p className="text-xl font-black text-text-primary tracking-tight">{formatCurrency(sub.price, sub.currency)}</p></div>
                          </div>

                          <div className="xl:w-[160px] p-5 flex flex-row xl:flex-col items-center justify-between xl:justify-center xl:border-l-2 border-t-2 xl:border-t-0 border-slate-300 dark:border-slate-600">
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider xl:mb-1.5">Renewal</p>
                            <div className="text-right xl:text-center">
                              <p className="text-sm font-bold text-text-primary">{sub.status === 'active' ? formatDate(sub.renewalDate) : 'Cancelled'}</p>
                              {sub.status === 'active' && (<p className="text-[10px] font-semibold text-emerald-500 mt-0.5">in {getDaysUntilRenewal(sub.renewalDate)} days</p>)}
                            </div>
                          </div>

                          <div className={`xl:w-[240px] p-4 flex items-center justify-center gap-2 xl:border-l-2 border-t-2 xl:border-t-0 border-slate-300 dark:border-slate-600 transition-opacity ${isDeleteMode ? 'opacity-40 pointer-events-none' : ''}`}>
                            <button onClick={(e) => { e.stopPropagation(); setShowEdit(sub); }} className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl text-teal-700 bg-teal-500/10 hover:bg-teal-500/20 dark:text-teal-400 transition-all">
                              <Pencil size={16} /><span className="text-[10px] font-bold">Edit</span>
                            </button>
                            <div className="w-[2px] h-8 bg-slate-300 dark:bg-slate-600 hidden xl:block" />
                            <button onClick={(e) => { e.stopPropagation(); setShowSplit(sub); }} disabled={sub.status !== 'active'} className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 dark:text-emerald-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                              <Users size={16} /><span className="text-[10px] font-bold">Split</span>
                            </button>
                            <div className="w-[2px] h-8 bg-slate-300 dark:bg-slate-600 hidden xl:block" />
                            <button onClick={(e) => { e.stopPropagation(); setShowCancel(sub); }} disabled={sub.status !== 'active'} className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl text-slate-500 bg-slate-500/10 hover:bg-slate-500/20 dark:text-slate-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                              <Ban size={16} /><span className="text-[10px] font-bold">Cancel</span>
                            </button>
                          </div>
                        </div>
                      </TiltCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="glass-card px-4 py-12 text-center rounded-[24px]">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-bg-surface"><Search className="h-5 w-5 text-text-muted" /></div>
              <h2 className="font-semibold text-text-primary">No active subscriptions</h2>
              <p className="mt-1 text-sm text-text-secondary">Add a new subscription or check your cancelled list.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* TAB 2: SHARED WITH ME */}
      {activeTab === 'shared' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-widest text-text-secondary">
              Subscriptions Shared With You
            </h2>
          </div>

          {loadingShared ? (
            <div className="text-center py-20 text-text-muted">Loading shared subscriptions...</div>
          ) : sharedSubs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-[24px]">
              <div className="h-16 w-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <Users size={32} />
              </div>
              <h2 className="text-xl font-bold text-text-primary">No Shared Subscriptions</h2>
              <p className="text-sm text-text-secondary mt-2 max-w-sm">
                When a friend shares a subscription with you, it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sharedSubs.map((split) => {
                const sub = split.subscription;
                const owner = split.owner;
                
                return (
                  <div key={split._id} className="relative overflow-hidden rounded-[24px] border border-border/60 bg-bg-surface p-5 shadow-sm hover:border-emerald-500/40 hover:shadow-lg transition-all duration-300">
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
                    
                    <div className="flex items-start justify-between mb-5 relative z-10">
                      <div className="flex items-center gap-3">
                        <SubscriptionLogo name={sub.name} websiteUrl={sub.websiteUrl} category={sub.category} className="h-12 w-12 rounded-xl shadow-sm" />
                        <div>
                          <h3 className="font-bold text-text-primary text-lg">{sub.name}</h3>
                          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mt-0.5">{getCategoryLabel(sub.category)}</p>
                        </div>
                      </div>
                      
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${
                        split.status === 'accepted'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' 
                          : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400'
                      }`}>
                        {split.status === 'accepted' ? 'Accepted' : 'New Invite'}
                      </span>
                    </div>

                    <div className="bg-bg-hover/50 rounded-xl p-3 mb-5 border border-border/40 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Shared by</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">@{owner?.name || 'User'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Renews</p>
                        <p className="text-xs font-bold text-text-primary">{formatDate(sub.renewalDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">You Owe</p>
                        <p className="text-2xl font-black text-text-primary">
                          {formatCurrency(split.amountOwed, sub.currency)}
                          <span className="text-xs text-text-muted font-medium ml-1">/mo</span>
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {split.status === 'pending' ? (
                          <button onClick={() => handleAccept(split._id)} className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg transition-colors shadow-md shadow-emerald-500/20 flex items-center gap-1.5">
                            Accept <Check size={14} />
                          </button>
                        ) : (
                          <button disabled className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-default">
                            <CheckCircle2 size={14} /> Settled
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleRemoveSplit(split._id)} 
                          title="Leave / Remove"
                          className="p-2 text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* MODALS */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Subscription" size="lg">
        <AddForm onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
      </Modal>

      {showEdit && (
        <Modal isOpen={true} onClose={() => setShowEdit(null)} title="Edit Subscription" size="lg">
          <AddForm onSubmit={handleEdit} onCancel={() => setShowEdit(null)} initialData={showEdit} />
        </Modal>
      )}

      {showCancel && (
        <Modal isOpen={true} onClose={() => setShowCancel(null)} title="Cancel Subscription" size="sm">
          <CancelForm sub={showCancel} onSubmit={handleCancel} onCancel={() => setShowCancel(null)} />
        </Modal>
      )}

      {showSplit && (
        <SplitModal isOpen={true} onClose={() => setShowSplit(null)} sub={showSplit} onSave={handleSplit} />
      )}
    </div>
  );
}

// ==========================================
// STYLISH ADD/EDIT FORM
// ==========================================
function AddForm({
  onSubmit,
  onCancel,
  initialData,
}: {
  onSubmit: (data: SubscriptionFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Subscription | null;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      price: initialData.price,
      currency: initialData.currency,
      billingFrequency: initialData.billingFrequency,
      category: initialData.category,
      startDate: initialData.startDate,
      renewalDate: initialData.renewalDate,
      websiteUrl: initialData.websiteUrl,
      notes: initialData.notes,
    } : {
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
        <input type="text" placeholder="Search or type app name (e.g. Netflix)" list="app-suggestions" {...register('name')} className={inputClass} />
        <datalist id="app-suggestions">{popularApps.map((app) => (<option key={app} value={app} />))}</datalist>
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Price</label>
          <input type="number" step="0.01" placeholder="0.00" {...register('price', { valueAsNumber: true })} className={inputClass} />
          {errors.price && <p className={errorClass}>{errors.price.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Currency</label>
          <div className="relative">
            <select {...register('currency')} className={`${inputClass} appearance-none cursor-pointer`}>
              {currencies.map((curr) => (<option key={curr.value} value={curr.value}>{curr.label}</option>))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted"><ChevronDown className="h-4 w-4" /></div>
          </div>
          {errors.currency && <p className={errorClass}>{errors.currency.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Billing Cycle</label>
          <div className="relative">
            <select {...register('billingFrequency')} className={`${inputClass} appearance-none cursor-pointer`}>
              {frequencies.map((freq) => (<option key={freq.value} value={freq.value}>{freq.label}</option>))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted"><ChevronDown className="h-4 w-4" /></div>
          </div>
          {errors.billingFrequency && <p className={errorClass}>{errors.billingFrequency.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <div className="relative">
            <select {...register('category')} className={`${inputClass} appearance-none cursor-pointer`}>
              {categories.map((cat) => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-muted"><ChevronDown className="h-4 w-4" /></div>
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
// 🌟 SIMPLE CANCEL CONFIRMATION FORM 🌟
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        cancellationDate: new Date().toISOString().split('T')[0],
        cancellationReason: '',
      });
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pt-4 pb-2">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20">
          <Ban className="h-8 w-8 text-rose-500" />
        </div>
        <h3 className="text-xl font-black text-text-primary mb-2">Are you sure?</h3>
        <p className="text-sm text-text-secondary leading-relaxed">Are you sure you want to bury this?🪦</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto min-w-[120px]">
          Keep it
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={isSubmitting} className="w-full sm:w-auto min-w-[120px] bg-rose-500 hover:bg-rose-600 text-white">
          {isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
        </Button>
      </div>
    </div>
  );
}