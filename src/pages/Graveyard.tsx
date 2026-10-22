import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api/service';
import type { Subscription } from '../types';
import { Button } from '../components/ui/Button';
import { SubscriptionLogo } from '../components/ui/SubscriptionLogo';
import { Modal } from '../components/ui/Modal';
import { showToast } from '../components/ui/Toast';
import { formatCurrency, formatDate, getCategoryLabel, toMonthlyAmount } from '../utils/calculations';
// DollarSign yahan se hata diya gaya hai
import { Skull, Flower2, RotateCcw, Search, Clock, MessageSquare } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Header (Total Saved box yahan se remove kar diya gaya hai) */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Skull className="w-8 h-8 text-text-muted" /> The Graveyard
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            Cancelled subscriptions rest here
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          type="text"
          placeholder="Search graveyard..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-surface border border-border text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30"
        />
      </motion.div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-text-muted">Loading...</div>
      ) : cancelledSubs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {cancelledSubs.map((sub, index) => {
              const monthlySaved = toMonthlyAmount(Number(sub.price) || 0, sub.billingFrequency);
              return (
                <motion.div
                  key={sub.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                  className="cursor-pointer"
                  onClick={() => setSelected(sub)}
                >
                  <div className="relative group">
                    <div className="tombstone-card p-6 pt-10 text-center hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 + 0.3, type: 'spring' }}
                        className="absolute -top-3 left-1/2 -translate-x-1/2"
                      >
                        <Flower2 className="w-6 h-6 text-accent-violet" />
                      </motion.div>

                      <SubscriptionLogo
                        name={sub.name}
                        websiteUrl={sub.websiteUrl}
                        category={sub.category}
                        className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 opacity-80"
                      />

                      <h3 className="font-semibold text-text-primary mb-1">{sub.name}</h3>
                      <p className="text-xs text-text-muted mb-3">{getCategoryLabel(sub.category)}</p>

                      <div className="border-t border-border pt-3 space-y-1.5">
                        <p className="text-xs text-text-muted">
                          {formatCurrency(sub.price, sub.currency)} / {sub.billingFrequency === 'monthly' ? 'mo' : sub.billingFrequency}
                        </p>
                        {sub.cancellationDate && (
                          <p className="text-xs text-text-muted flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDate(sub.cancellationDate)}
                          </p>
                        )}
                        {monthlySaved > 0 && (
                          <p className="text-sm font-semibold text-success">
                            💰 Saving {formatCurrency(monthlySaved, sub.currency)}/mo
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-6xl mb-4">🌱</div>
          <h3 className="text-xl font-semibold text-text-primary mb-2">The graveyard is empty</h3>
          <p className="text-text-muted">No subscriptions have been cancelled yet</p>
        </motion.div>
      )}

      {/* Memorial Modal */}
      <AnimatePresence>
        {selected && (
          <Modal
            isOpen={true}
            onClose={() => setSelected(null)}
            title="Memorial"
            size="md"
          >
            <div className="text-center">
              <div className="text-4xl mb-3">🪦</div>
              <h2 className="text-xl font-bold text-text-primary mb-1">{selected.name}</h2>
              <p className="text-sm text-text-muted mb-4">{getCategoryLabel(selected.category)}</p>

              <div className="glass-card p-4 space-y-3 text-left mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-text-muted">Price</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(selected.price, selected.currency)} / {selected.billingFrequency}
                  </span>
                </div>
                {selected.cancellationDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-text-muted">Cancelled</span>
                    <span className="text-sm font-medium">{formatDate(selected.cancellationDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-text-muted">Saving</span>
                  <span className="text-sm font-semibold text-success">
                    {formatCurrency(toMonthlyAmount(Number(selected.price) || 0, selected.billingFrequency), selected.currency)}/mo
                  </span>
                </div>
                {selected.cancellationReason && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-text-muted flex items-center gap-1 mb-1">
                      <MessageSquare className="w-3 h-3" /> Reason
                    </p>
                    <p className="text-sm text-text-secondary italic">
                      "{selected.cancellationReason}"
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="success"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={() => handleRestore(selected)}
                className="w-full"
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