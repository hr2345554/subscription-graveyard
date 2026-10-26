import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api/service';
import type { Subscription } from '../types';
import { Button } from '../components/ui/Button';
import { SubscriptionLogo } from '../components/ui/SubscriptionLogo';
import { Modal } from '../components/ui/Modal';
import { showToast } from '../components/ui/Toast';
import { formatCurrency, formatDate, getCategoryLabel, toMonthlyAmount } from '../utils/calculations';
import { RotateCcw, Search, Clock, MessageSquare } from 'lucide-react';

export function Graveyard() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Subscription | null>(null);

  useEffect(() => {
    api.getSubscriptions().then((data) => {
      setSubs(data);
      setLoading(false);
    });
  }, []);

  const cancelledSubs = subs
    .filter((sub) => sub.status === 'cancelled')
    .filter((sub) => !search || sub.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const dateA = a.cancellationDate ? new Date(a.cancellationDate).getTime() : 0;
      const dateB = b.cancellationDate ? new Date(b.cancellationDate).getTime() : 0;
      return dateB - dateA;
    });

  const handleRestore = async (sub: Subscription) => {
    try {
      await api.restoreSubscription(sub.id);
      const updatedSubs = await api.getSubscriptions();
      setSubs(updatedSubs);
      showToast('success', `${sub.name} restored to active subscriptions`);
      setSelected(null);
    } catch {
      showToast('error', 'Could not restore this subscription.');
    }
  };

  return (
    <div className="space-y-6 text-text-primary">
      
      {/* 🌟 COMPACT & BALANCED HEADER 🌟 */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center mb-2">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 dark:to-transparent border border-white/50 dark:border-white/10 shadow-sm backdrop-blur-sm" />
            <span className="relative z-10 text-2xl drop-shadow-md">🪦</span>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl font-black tracking-tight text-text-primary sm:text-3xl leading-tight">
              Graveyard<span className="text-violet-500">.</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm leading-tight text-text-secondary font-medium">
              Cancelled subscriptions rest here
            </p>
          </div>
        </div>
      </motion.div>

      {/* SEARCH BAR */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="group relative max-w-md group/search">
        <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 opacity-0 blur-md transition-opacity duration-500 group-focus-within/search:opacity-100" />
        <div className="relative flex items-center overflow-hidden rounded-2xl border border-border/50 bg-bg-elevated/60 backdrop-blur-xl transition-all duration-300 focus-within:border-violet-500/50 focus-within:bg-bg-elevated">
          <Search className="ml-4 h-5 w-5 text-text-muted transition-colors group-focus-within/search:text-violet-500" />
          <input type="text" placeholder="Search graveyard..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-transparent py-4 pl-3 pr-4 text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none" />
        </div>
      </motion.div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-text-muted">Loading...</div>
      ) : cancelledSubs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 pb-4">
          <AnimatePresence mode="popLayout">
            {cancelledSubs.map((sub, index) => {
              const monthlySaved = toMonthlyAmount(Number(sub.price) || 0, sub.billingFrequency);
              return (
                <motion.div 
                  key={sub.id} 
                  layout 
                  initial={{ opacity: 0, y: 30, rotate: index % 2 === 0 ? -2 : 2 }} 
                  animate={{ opacity: 1, y: 0, rotate: index % 2 === 0 ? -1 : 1 }} 
                  exit={{ opacity: 0, scale: 0.8 }} 
                  transition={{ delay: index * 0.05 }} 
                  className="cursor-pointer group h-full" 
                  onClick={() => setSelected(sub)}
                >
                  <div className="relative h-full transition-transform duration-300 group-hover:rotate-0 group-hover:-translate-y-2">
                    
                    {/* 🌟 COMPACT POLAROID CARD (Ambient Amber/Gold Vibes) 🌟 */}
                    <div className="relative flex flex-col h-full rounded-sm bg-white dark:bg-[#121212] group-hover:bg-gradient-to-br group-hover:from-amber-100/60 group-hover:to-orange-100/40 dark:group-hover:from-amber-900/20 dark:group-hover:to-orange-900/10 transition-all duration-500 p-2.5 pb-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] group-hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.6)] border border-slate-200 group-hover:border-amber-400/50 dark:border-slate-800 dark:group-hover:border-amber-500/30">
                      
                      {/* Tape Effect (Golden tape) */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-5 bg-slate-200/80 group-hover:bg-amber-200/90 dark:bg-slate-700/80 dark:group-hover:bg-amber-500/30 backdrop-blur-sm rotate-[-2deg] shadow-sm z-20 transition-colors duration-500" />

                      {/* Photo Area (Warm glow background) */}
                      <div className="relative h-28 w-full overflow-hidden bg-slate-100 dark:bg-[#050505] group-hover:bg-gradient-to-tr group-hover:from-amber-200/50 group-hover:to-orange-100/50 dark:group-hover:from-amber-900/30 dark:group-hover:to-orange-900/20 flex items-center justify-center mb-3 transition-colors duration-500">
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent dark:from-white/5 pointer-events-none" />
                        <SubscriptionLogo 
                          name={sub.name} 
                          websiteUrl={sub.websiteUrl} 
                          category={sub.category} 
                          className="h-12 w-12 rounded-xl filter grayscale opacity-50 dark:opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" 
                        />
                        <div className="absolute inset-0 bg-white/10 dark:bg-black/40 group-hover:bg-transparent pointer-events-none transition-colors duration-500" />
                      </div>

                      {/* Memory Text (Warm Amber text) */}
                      <div className="text-center px-1">
                        <h3 className="font-serif text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 mb-0.5 line-clamp-1 transition-colors duration-500">
                          {sub.name}
                        </h3>
                        <p className="text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-amber-600/80 dark:group-hover:text-amber-400/80 mb-3 transition-colors duration-500">
                          {getCategoryLabel(sub.category)}
                        </p>
                        
                        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 group-hover:border-amber-300/50 dark:border-slate-800 dark:group-hover:border-amber-700/50 pt-2.5 transition-colors duration-500">
                          <span>{formatCurrency(sub.price, sub.currency)}</span>
                          {sub.cancellationDate && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-amber-400 dark:bg-slate-600 transition-colors duration-500" />
                              <span>{formatDate(sub.cancellationDate)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Savings */}
                      {monthlySaved > 0 && (
                        <div className="absolute bottom-1.5 left-0 right-0 text-center">
                          <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">
                            Saved {formatCurrency(monthlySaved, sub.currency)}/mo
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="text-6xl mb-4">🌱</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">The graveyard is empty</h3>
          <p className="text-text-muted">No subscriptions have been cancelled yet</p>
        </motion.div>
      )}

      {/* Memorial Modal (Normal) */}
      <AnimatePresence>
        {selected && (
          <Modal isOpen={true} onClose={() => setSelected(null)} title="Memorial" size="md">
            <div className="text-center">
              <div className="text-4xl mb-3">🪦</div>
              <h2 className="text-xl font-bold text-text-primary mb-1">{selected.name}</h2>
              <p className="text-sm text-text-muted mb-4">{getCategoryLabel(selected.category)}</p>
              <div className="glass-card p-4 space-y-3 text-left mb-4">
                <div className="flex justify-between"><span className="text-sm text-text-muted">Price</span><span className="text-sm font-medium">{formatCurrency(selected.price, selected.currency)} / {selected.billingFrequency}</span></div>
                {selected.cancellationDate && (
                  <div className="flex justify-between"><span className="text-sm text-text-muted">Cancelled</span><span className="text-sm font-medium">{formatDate(selected.cancellationDate)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-sm text-text-muted">Saving</span><span className="text-sm font-semibold text-success">{formatCurrency(toMonthlyAmount(Number(selected.price) || 0, selected.billingFrequency), selected.currency)}/mo</span></div>
                {selected.cancellationReason && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-text-muted flex items-center gap-1 mb-1"><MessageSquare className="w-3 h-3" /> Reason</p>
                    <p className="text-sm text-text-secondary italic">"{selected.cancellationReason}"</p>
                  </div>
                )}
              </div>
              <Button variant="success" icon={<RotateCcw className="w-4 h-4" />} onClick={() => handleRestore(selected)} className="w-full">Restore Subscription</Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}