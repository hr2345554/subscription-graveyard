import { useState } from 'react';
import { motion } from 'motion/react';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import type { Subscription } from '../types';
import { formatCurrency } from '../utils/calculations';

interface WorthItPromptProps {
  sub: Subscription;
  onRate: (id: string, isWorthIt: boolean) => void;
  onCancelFlow: (sub: Subscription) => void;
}

export function WorthItPrompt({ sub, onRate, onCancelFlow }: WorthItPromptProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showCancelSuggestion, setShowCancelSuggestion] = useState(false);

  if (!isVisible) return null;

  const handleRate = (isWorthIt: boolean) => {
    onRate(sub.id, isWorthIt);
    if (!isWorthIt) {
      setShowCancelSuggestion(true);
    } else {
      setIsVisible(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-bg-elevated to-violet-500/5 p-5 shadow-lg backdrop-blur-xl"
    >
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute top-3 right-3 text-text-muted hover:text-text-primary"
      >
        <X size={16} />
      </button>

      {!showCancelSuggestion ? (
        <>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-violet-500/20 text-violet-500">
              <ThumbsUp size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Worth It Check-in</h3>
              <p className="text-xs text-text-secondary">
                You paid {formatCurrency(Number(sub.price), sub.currency)} for {sub.name}. Did you use it enough?
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleRate(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 text-green-500 font-semibold text-sm hover:bg-green-500/20 transition-all"
            >
              <ThumbsUp size={16} /> Yes, loved it
            </button>
            <button
              onClick={() => handleRate(false)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 text-rose-500 font-semibold text-sm hover:bg-rose-500/20 transition-all"
            >
              <ThumbsDown size={16} /> Not really
            </button>
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-2">
          <p className="text-sm text-text-primary font-medium mb-3">
            Let's save some money! Cancel {sub.name} and move it to the Graveyard?
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => onCancelFlow(sub)}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white font-semibold text-sm shadow-md hover:bg-violet-700 transition-all"
            >
              Yes, Cancel it
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="px-4 py-2 rounded-xl bg-bg-surface text-text-muted font-semibold text-sm hover:text-text-primary transition-all"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}