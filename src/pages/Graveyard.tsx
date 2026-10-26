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
                    
                    {/* 🌟 COMPACT POLAROID CARD (NO HOVER COLORS) 🌟 */}
                    <div className="relative flex flex-col h-full rounded-sm bg-white dark:bg-[#121212] p-2.5 pb-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-slate-800 transition-all duration-300">
                      
                      {/* Tape Effect */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-5 bg-slate-200/80 dark:bg-slate-700/80 backdrop-blur-sm rotate-[-2deg] shadow-sm z-20" />

                      {/* Photo Area */}
                      <div className="relative h-28 w-full overflow-hidden bg-slate-100 dark:bg-[#050505] flex items-center justify-center mb-3">
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent dark:from-white/5 pointer-events-none" />
                        <SubscriptionLogo 
                          name={sub.name} 
                          websiteUrl={sub.websiteUrl} 
                          category={sub.category} 
                          className="h-12 w-12 rounded-xl filter grayscale opacity-50 dark:opacity-30" 
                        />
                        <div className="absolute inset-0 bg-white/10 dark:bg-black/40 pointer-events-none" />
                      </div>

                      {/* Memory Text */}
                      <div className="text-center px-1">
                        <h3 className="font-serif text-base font-bold text-slate-800 dark:text-slate-100 mb-0.5 line-clamp-1">
                          {sub.name}
                        </h3>
                        <p className="text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">
                          {getCategoryLabel(sub.category)}
                        </p>
                        
                        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                          <span>{formatCurrency(sub.price, sub.currency)}</span>
                          {sub.cancellationDate && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
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

      {/* 🌟 MEMORIAL MODAL (Vintage Amber/Orange Theme + First Letter) 🌟 */}
      <AnimatePresence>
        {selected && (
          <Modal isOpen={true} onClose={() => setSelected(null)} title="Memorial" size="md">
            <div className="text-center">
              
              {/* Vintage Header with First Letter */}
              <div className="mb-6 flex flex-col items-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/60 dark:to-orange-900/40 border-2 border-amber-500/40 shadow-inner mb-4">
                  <span className="text-4xl font-serif font-black text-amber-800 dark:text-amber-300 drop-shadow-sm">
                    {selected.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-2xl font-serif font-black text-amber-900 dark:text-amber-300">{selected.name}</h2>
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700/60 dark:text-amber-500/60 mt-1">{getCategoryLabel(selected.category)}</p>
              </div>

              {/* Vintage Info Box */}
              <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 p-5 space-y-3 text-left mb-6 shadow-sm">
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
                
                <div className="flex justify-between items-center pb-2 border-b border-amber-500/20">
                  <span className="text-sm font-medium text-amber-700/70 dark:text-amber-400/70">Price</span>
                  <span className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    {formatCurrency(selected.price, selected.currency)} / {selected.billingFrequency}
                  </span>
                </div>
                
                {selected.cancellationDate && (
                  <div className="flex justify-between items-center pb-2 border-b border-amber-500/20">
                    <span className="text-sm font-medium text-amber-700/70 dark:text-amber-400/70">Cancelled On</span>
                    <span className="text-sm font-bold text-amber-900 dark:text-amber-200">{formatDate(selected.cancellationDate)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-amber-700/70 dark:text-amber-400/70">Saving</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(toMonthlyAmount(Number(selected.price) || 0, selected.billingFrequency), selected.currency)}/mo
                  </span>
                </div>

                {selected.cancellationReason && (
                  <div className="pt-3 border-t border-amber-500/20">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700/60 dark:text-amber-500/60 flex items-center gap-1.5 mb-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Reason
                    </p>
                    <p className="text-sm text-amber-900/80 dark:text-amber-200/80 italic bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                      "{selected.cancellationReason}"
                    </p>
                  </div>
                )}
              </div>

              {/* Vintage Restore Button */}
              <Button 
                variant="glow" 
                icon={<RotateCcw className="w-4 h-4" />} 
                onClick={() => handleRestore(selected)} 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-amber-500/20 py-3 text-base font-bold"
              >
                Restore Subscription
              </Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}