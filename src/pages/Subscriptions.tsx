import { useState, useEffect, useRef, type ReactNode, type MouseEvent } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// 🌟 TanStack Query Imports
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

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
import { Plus, Search, RefreshCw, ChevronDown, ChevronLeft, ChevronRight, X, Trash2, Ban, Users, Pencil, CheckCircle2, ArrowRight, Check, CreditCard, AlertTriangle } from 'lucide-react';
import { SubscriptionLogo } from '../components/ui/SubscriptionLogo';
import { SplitModal } from '../components/SplitModal';

// ==========================================
// 3D TILT CARD COMPONENT
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

const popularApps = [
  { name: 'Netflix', url: 'https://netflix.com' },
  { name: 'Spotify', url: 'https://spotify.com' },
  { name: 'YouTube Premium', url: 'https://youtube.com/premium' },
  { name: 'Amazon Prime', url: 'https://amazon.com/prime' },
  { name: 'Disney+', url: 'https://disneyplus.com' },
  { name: 'Apple Music', url: 'https://music.apple.com' },
  { name: 'ChatGPT Plus', url: 'https://chat.openai.com' },
  { name: 'Canva Pro', url: 'https://canva.com' },
  { name: 'Microsoft 365', url: 'https://microsoft365.com' },
  { name: 'Adobe Creative Cloud', url: 'https://adobe.com/creativecloud' },
  { name: 'HBO Max', url: 'https://max.com' },
  { name: 'Zee5', url: 'https://zee5.com' },
  { name: 'Figma', url: 'https://figma.com' },
  { name: 'Notion', url: 'https://notion.so' },
  { name: 'Github Copilot', url: 'https://github.com/features/copilot' },
  { name: 'Xbox Game Pass', url: 'https://xbox.com/game-pass' },
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
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'my-subs' | 'shared'>('my-subs');
  
  // Search & Pagination States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('active'); 
  const [currentPage, setCurrentPage] = useState(1);

  // Modals States
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<Subscription | null>(null);
  const [showCancel, setShowCancel] = useState<Subscription | null>(null);
  const [showSplit, setShowSplit] = useState<Subscription | null>(null); 

  // Delete States
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'bulk' | 'split'>('bulk');
  const [targetSplitId, setTargetSplitId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 🌟 1. Debounce Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // 🌟 2. FETCH SUBSCRIPTIONS (useQuery)
  const { data: subsData, isLoading: loading, isError: error, refetch } = useQuery({
    queryKey: ['subscriptions', debouncedSearch, filterStatus, currentPage],
    queryFn: () => api.getSubscriptions({ search: debouncedSearch, status: filterStatus, page: currentPage, limit: 5 }),
    placeholderData: keepPreviousData, // Smooth pagination
  });

  const subs = subsData?.data || [];
  const totalPages = subsData?.totalPages || 1;
  const totalItems = subsData?.totalItems || 0;

  // 🌟 3. FETCH SHARED SUBSCRIPTIONS (useQuery)
  const { data: sharedSubs = [], isLoading: loadingShared } = useQuery({
    queryKey: ['sharedSubscriptions'],
    queryFn: () => api.getSharedSubscriptions(),
    enabled: activeTab === 'shared', // Sirf tab fetch ho jab tab open ho
  });

  useEffect(() => {
    setSelectedSubs([]);
  }, [search, filterStatus, activeTab, currentPage]);

  // 🌟 4. MUTATIONS
  const addMutation = useMutation({
    mutationFn: (data: SubscriptionFormData) => api.createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      showToast('success', 'Subscription added successfully');
      setShowAdd(false);
    },
    onError: () => showToast('error', 'Could not add subscription.')
  });

  const editMutation = useMutation({
    mutationFn: (data: SubscriptionFormData) => showEdit ? api.updateSubscription(showEdit.id, data) : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      showToast('success', 'Subscription updated successfully');
      setShowEdit(null);
    },
    onError: () => showToast('error', 'Could not update subscription.')
  });

  const cancelMutation = useMutation({
    mutationFn: (data: CancelFormData) => showCancel ? api.cancelSubscription(showCancel.id, data.cancellationDate, data.cancellationReason || '') : Promise.reject(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      showToast('success', `${showCancel?.name} moved to Graveyard`);
      setShowCancel(null);
    },
    onError: () => showToast('error', 'Could not cancel subscription.')
  });

  const splitMutation = useMutation({
    mutationFn: (payload: { id: string, sharedWith: any[] }) => api.splitSubscription(payload.id, payload.sharedWith),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      showToast('success', 'Subscription shared successfully');
      setShowSplit(null);
    },
    onError: () => showToast('error', 'Could not share subscription.')
  });

  const acceptSplitMutation = useMutation({
    mutationFn: (id: string) => api.acceptSplit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedSubscriptions'] });
      showToast('success', 'Invitation accepted!');
    },
    onError: () => showToast('error', 'Could not accept invitation.')
  });

  // 🌟 FIXED HANDLERS (Ab yeh Promise<void> return karenge)
  const handleAdd = async (data: SubscriptionFormData): Promise<void> => {
    await addMutation.mutateAsync(data);
  };

  const handleEdit = async (data: SubscriptionFormData): Promise<void> => {
    await editMutation.mutateAsync(data);
  };

  const handleCancel = async (data: CancelFormData): Promise<void> => {
    await cancelMutation.mutateAsync(data);
  };

  const handleSplit = (id: string, sharedWith: any[]) => splitMutation.mutate({ id, sharedWith });
  const handleAccept = (id: string) => acceptSplitMutation.mutate(id);

  const toggleSelectSub = (id: string) => setSelectedSubs(prev => prev.includes(id) ? prev.filter(subId => subId !== id) : [...prev, id]);
  const toggleSelectAll = () => selectedSubs.length === subs.length ? setSelectedSubs([]) : setSelectedSubs(subs.map((s: any) => s.id));

  const triggerBulkDelete = () => { if (selectedSubs.length > 0) { setDeleteType('bulk'); setDeleteModalOpen(true); } };
  const triggerRemoveSplit = (splitId: string) => { setTargetSplitId(splitId); setDeleteType('split'); setDeleteModalOpen(true); };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteType === 'bulk') {
        await Promise.all(selectedSubs.map(id => api.deleteSubscription(id)));
        queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        showToast('success', `${selectedSubs.length} subscription(s) deleted permanently`);
        setIsDeleteMode(false);
        setSelectedSubs([]);
      } else if (deleteType === 'split' && targetSplitId) {
        await api.removeSplit(targetSplitId);
        queryClient.invalidateQueries({ queryKey: ['sharedSubscriptions'] });
        showToast('success', 'Removed successfully');
      }
      setDeleteModalOpen(false);
    } catch {
      showToast('error', 'Could not complete deletion.');
    } finally {
      setIsDeleting(false);
      setTargetSplitId(null);
    }
  };

  const exitDeleteMode = () => { setIsDeleteMode(false); setSelectedSubs([]); };

  return (
    <div className="min-w-0 space-y-6 text-text-primary transition-colors duration-300">
      
      {/* PAGE HEADER */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
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

        {/* TABS */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setActiveTab('my-subs')}
            className={`px-6 py-3 text-sm font-bold rounded-lg border-2 transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'my-subs'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/30'
                : 'bg-bg-surface text-text-secondary border-border/50 hover:bg-bg-hover hover:text-text-primary hover:border-border'
            }`}
          >
            <CreditCard size={18} /> My Subscriptions
          </button>
          
          <button
            onClick={() => setActiveTab('shared')}
            className={`px-6 py-3 text-sm font-bold rounded-lg border-2 transition-all duration-300 flex items-center gap-2 ${
              activeTab === 'shared'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/30'
                : 'bg-bg-surface text-text-secondary border-border/50 hover:bg-bg-hover hover:text-text-primary hover:border-border'
            }`}
          >
            <Users size={18} /> Shared with Me
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
                onChange={(event) => { setFilterStatus(event.target.value); setCurrentPage(1); }}
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
                <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-rose-500/5 p-3 rounded-2xl border border-rose-500/20">
                  <p className="text-sm font-bold text-rose-500 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    {selectedSubs.length} item(s) selected
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <button onClick={toggleSelectAll} className="h-9 px-4 rounded-xl border border-border/60 bg-bg-surface text-xs font-bold text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all">
                      {selectedSubs.length === subs.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <button onClick={exitDeleteMode} className="h-9 px-4 rounded-xl border border-transparent text-xs font-bold text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-all">
                      Cancel
                    </button>
                    <Button variant="danger" onClick={triggerBulkDelete} disabled={selectedSubs.length === 0} className="h-9 px-5 text-xs bg-rose-500 hover:bg-rose-600 text-white border-none shadow-md shadow-rose-500/20 disabled:opacity-50">
                      Delete Selected
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-text-secondary">
                    Showing <span className="text-text-primary">{subs.length}</span> out of {totalItems} results
                  </p>
                  <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    {(search || filterStatus !== 'active') && (
                      <button type="button" onClick={() => { setSearch(''); setFilterStatus('active'); setCurrentPage(1); }} className="text-xs font-bold text-emerald-500 transition-colors hover:text-emerald-400 flex items-center gap-1">
                        Clear filters <X className="w-3 h-3" />
                      </button>
                    )}
                    {subs.length > 0 && (
                      <button onClick={() => setIsDeleteMode(true)} className="group relative flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-500 transition-all duration-300 hover:bg-rose-500 hover:text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] border border-rose-500/20 hover:border-rose-500">
                        <Trash2 size={14} className="transition-transform group-hover:scale-110 group-hover:-rotate-12" />
                        Select to Delete
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
              <div><h2 className="font-semibold text-text-primary">Unable to load subscriptions</h2><p className="mt-1 text-sm text-text-secondary">Check your connection and try again.</p></div>
              <Button variant="ghost" icon={<RefreshCw className="h-4 w-4" />} onClick={() => refetch()}>Retry</Button>
            </div>
          )}

          {!loading && !error && (
            <div className="flex flex-col gap-5">
              <AnimatePresence mode="popLayout">
                {subs.map((sub: any, index: number) => {
                  const isSelected = selectedSubs.includes(sub.id);
                  return (
                    <motion.div key={sub.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: Math.min(index * 0.05, 0.2), duration: 0.3 }} className="w-full">
                      <TiltCard onClick={() => isDeleteMode && toggleSelectSub(sub.id)} isSelectable={isDeleteMode}>
                        <div className={`group relative flex flex-col xl:flex-row w-full bg-bg-surface border shadow-sm transition-all duration-300 rounded-[24px] overflow-hidden ${isSelected ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.15)] bg-rose-500/5' : 'border-border/60 hover:shadow-xl hover:border-emerald-500/30'}`}>
                          
                          {isDeleteMode && (
                            <div className="absolute top-1/2 -translate-y-1/2 left-5 z-20">
                              <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-rose-500 border-rose-500 text-white scale-110 shadow-lg shadow-rose-500/30' : 'border-slate-300 dark:border-slate-600 bg-bg-surface/80 backdrop-blur-sm hover:border-rose-400'}`}>
                                {isSelected && <Check size={16} strokeWidth={3} />}
                              </div>
                            </div>
                          )}

                          <div className={`flex-1 p-5 flex items-center gap-4 relative transition-opacity min-w-0 ${isDeleteMode ? 'pl-16' : 'pl-5'}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="shrink-0"><SubscriptionLogo name={sub.name} websiteUrl={sub.websiteUrl} category={sub.category} className="h-12 w-12 rounded-xl" /></div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg leading-tight line-clamp-1 text-text-primary">{sub.name}</h3>
                              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mt-0.5">{getCategoryLabel(sub.category)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {sub.isShared && sub.sharedWith?.length > 0 && (
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
                              <p className="text-sm font-bold text-text-primary">
                                {sub.status === 'active' ? (sub.renewalDate ? formatDate(sub.renewalDate) : 'N/A') : 'Cancelled'}
                              </p>
                              {sub.status === 'active' && sub.renewalDate && (
                                <p className="text-[10px] font-semibold text-emerald-500 mt-0.5">in {getDaysUntilRenewal(sub.renewalDate)} days</p>
                              )}
                            </div>
                          </div>

                          {!isDeleteMode && (
                            <div className={`xl:w-[240px] p-4 flex items-center justify-center gap-2 xl:border-l-2 border-t-2 xl:border-t-0 border-slate-300 dark:border-slate-600 transition-opacity`}>
                              <button onClick={(e) => { e.stopPropagation(); setShowEdit(sub); }} className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 dark:text-blue-400 transition-all">
                                <Pencil size={16} /><span className="text-[10px] font-bold">Edit</span>
                              </button>
                              <div className="w-[2px] h-8 bg-slate-300 dark:bg-slate-600 hidden xl:block" />
                              <button onClick={(e) => { e.stopPropagation(); setShowSplit(sub); }} disabled={sub.status !== 'active'} className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl text-violet-600 bg-violet-500/10 hover:bg-violet-500/20 dark:text-violet-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                <Users size={16} /><span className="text-[10px] font-bold">Split</span>
                              </button>
                              <div className="w-[2px] h-8 bg-slate-300 dark:bg-slate-600 hidden xl:block" />
                              <button onClick={(e) => { e.stopPropagation(); setShowCancel(sub); }} disabled={sub.status !== 'active'} className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 dark:text-amber-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                                <Ban size={16} /><span className="text-[10px] font-bold">Cancel</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </TiltCard>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {!loading && !error && subs.length === 0 && (
            <div className="glass-card px-4 py-12 text-center rounded-[24px]">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-bg-surface"><Search className="h-5 w-5 text-text-muted" /></div>
              <h2 className="font-semibold text-text-primary">No subscriptions found</h2>
              <p className="mt-1 text-sm text-text-secondary">Add a new subscription or try changing your filters.</p>
            </div>
          )}

          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 pt-5 mt-6">
              <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border bg-bg-surface text-sm font-bold text-text-primary disabled:opacity-50 hover:bg-bg-hover transition-all">
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-sm font-bold text-text-secondary">
                Page {currentPage} of {totalPages}
              </span>
              <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border bg-bg-surface text-sm font-bold text-text-primary disabled:opacity-50 hover:bg-bg-hover transition-all">
                Next <ChevronRight size={16} />
              </button>
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
              {sharedSubs.map((split: any) => {
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
                        <p className="text-xs font-bold text-text-primary">{sub.renewalDate ? formatDate(sub.renewalDate) : 'N/A'}</p>
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
                        
                        <button onClick={() => triggerRemoveSplit(split._id)} title="Leave / Remove" className="p-2 text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-lg transition-colors">
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

      {/* 🌟 PREMIUM DELETE CONFIRMATION MODAL 🌟 */}
      <Modal isOpen={deleteModalOpen} onClose={() => !isDeleting && setDeleteModalOpen(false)} title="" size="sm">
        <div className="pt-2 pb-4 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500/20 to-rose-500/5 border border-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.15)] relative"
          >
            <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping opacity-20" />
            <AlertTriangle className="h-9 w-9 text-rose-500" strokeWidth={2} />
          </motion.div>

          <h3 className="text-2xl font-black text-text-primary mb-3 tracking-tight">
            {deleteType === 'bulk' ? `Delete ${selectedSubs.length} item(s)?` : 'Remove this subscription?'}
          </h3>
          
          <p className="text-sm text-text-secondary leading-relaxed px-2 mb-8">
            {deleteType === 'bulk' 
              ? "This action is permanent and cannot be undone. All selected subscriptions will be completely removed from your account."
              : "You will lose access to this shared subscription. The owner will be notified that you left."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="ghost" 
              onClick={() => setDeleteModalOpen(false)} 
              disabled={isDeleting} 
              className="w-full sm:w-auto min-w-[130px] h-12 rounded-xl font-bold bg-bg-hover hover:bg-border/50 text-text-secondary"
            >
              Cancel
            </Button>
            <Button 
              onClick={executeDelete} 
              disabled={isDeleting} 
              className="w-full sm:w-auto min-w-[130px] h-12 rounded-xl font-bold bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/30"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Deleting...
                </span>
              ) : (
                'Yes, Delete'
              )}
            </Button>
          </div>
        </div>
      </Modal>
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
    watch,
    setValue,
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

  const watchedName = watch('name');
  const watchedStartDate = watch('startDate');
  const watchedCycle = watch('billingFrequency');

  useEffect(() => {
    if (watchedName) {
      const selectedApp = popularApps.find(
        (app) => app.name.toLowerCase() === watchedName.toLowerCase()
      );
      if (selectedApp) {
        setValue('websiteUrl', selectedApp.url);
      }
    }
  }, [watchedName, setValue]);

  useEffect(() => {
    if (watchedStartDate && watchedCycle) {
      const [year, month, day] = watchedStartDate.split('-').map(Number);
      if (!year || !month || !day) return;

      const start = new Date(year, month - 1, day);
      if (isNaN(start.getTime())) return;

      let newDate = new Date(start);

      if (watchedCycle === 'weekly') {
        newDate.setDate(newDate.getDate() + 7);
      } else if (watchedCycle === 'monthly') {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (watchedCycle === 'quarterly') {
        newDate.setMonth(newDate.getMonth() + 3);
      } else if (watchedCycle === 'yearly') {
        newDate.setFullYear(newDate.getFullYear() + 1);
      }

      if (newDate.getDate() !== day && watchedCycle !== 'weekly') {
        newDate.setDate(0);
      }

      const y = newDate.getFullYear();
      const m = String(newDate.getMonth() + 1).padStart(2, '0');
      const d = String(newDate.getDate()).padStart(2, '0');
      
      setValue('renewalDate', `${y}-${m}-${d}`);
    }
  }, [watchedStartDate, watchedCycle, setValue]);

  const inputClass = "w-full rounded-xl border border-border bg-bg-surface px-4 py-3 text-sm text-text-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue/50 placeholder:text-text-muted";
  const labelClass = "block text-sm font-semibold text-text-primary mb-1.5";
  const errorClass = "mt-1 text-xs text-danger";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className={labelClass}>App Name</label>
        <input type="text" placeholder="Search or type app name (e.g. Netflix)" list="app-suggestions" {...register('name')} className={inputClass} />
        <datalist id="app-suggestions">{popularApps.map((app) => (<option key={app.name} value={app.name} />))}</datalist>
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
          <label className={labelClass}>Renewal Date (Auto-Calculated)</label>
          <input type="date" {...register('renewalDate')} className={`${inputClass} bg-emerald-500/5 border-emerald-500/30 text-text-secondary`} />
          {errors.renewalDate && <p className={errorClass}>{errors.renewalDate.message}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Website URL (Optional)</label>
        <input type="url" placeholder="https://..." {...register('websiteUrl')} className={`${inputClass} bg-emerald-500/5 border-emerald-500/30`} />
        {errors.websiteUrl && <p className={errorClass}>{errors.websiteUrl.message}</p>}
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-border pt-5 mt-2">
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="glow" type="submit" disabled={isSubmitting} className="min-w-[140px] bg-emerald-600 hover:bg-emerald-500 text-white">
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
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20">
          <Ban className="h-8 w-8 text-amber-500" />
        </div>
        <h3 className="text-xl font-black text-text-primary mb-2">Are you sure?</h3>
        <p className="text-sm text-text-secondary leading-relaxed">Are you sure you want to bury this?🪦</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto min-w-[120px]">
          Keep it
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={isSubmitting} className="w-full sm:w-auto min-w-[120px] bg-amber-500 hover:bg-amber-600 text-white">
          {isSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
        </Button>
      </div>
    </div>
  );
}