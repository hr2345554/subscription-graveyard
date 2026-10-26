import { useState } from 'react';
import { Mail, Plus, Trash2, Users } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { Subscription } from '../types';
import { formatCurrency } from '../utils/calculations';

interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  sub: Subscription;
  onSave: (id: string, sharedWith: { email: string; amountOwed: number; hasPaid: boolean }[]) => void;
}

export function SplitModal({ isOpen, onClose, sub, onSave }: SplitModalProps) {
  const [emails, setEmails] = useState<string[]>(['']);
  
  const totalPrice = Number(sub.price) || 0;
  const validEmailsCount = emails.filter(e => e.includes('@')).length;
  const splitAmount = totalPrice / (validEmailsCount + 1);
  const totalPeople = validEmailsCount + 1;

  const handleAddEmail = () => setEmails([...emails, '']);
  
  const handleRemoveEmail = (index: number) => {
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails.length > 0 ? newEmails : ['']);
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSave = () => {
    const validEmails = emails.filter(e => e.includes('@'));
    const sharedWith = validEmails.map(email => ({
      email,
      amountOwed: splitAmount,
      hasPaid: false
    }));
    onSave(sub.id, sharedWith);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Split Subscription" size="md">
      <div className="space-y-5 pt-1">
        
        {/* 🌟 COMPACT HEADER BANNER 🌟 */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-950/30 p-3.5 shadow-sm">
          <div className="flex items-center gap-3 relative z-10">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-900 shadow-sm border border-emerald-500/20">
              <span className="text-xl">🤝</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                Share {sub.name}
              </h3>
              <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                Split the <span className="font-bold text-emerald-900 dark:text-white">{formatCurrency(totalPrice, sub.currency)}</span> bill.
              </p>
            </div>
          </div>
        </div>

        {/* 🌟 EMAIL INPUT SECTION 🌟 */}
        <div className="space-y-2.5">
          <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Users size={13} className="text-emerald-500" /> Friends' Emails
          </label>
          
          <div className="space-y-2.5">
            {emails.map((email, index) => (
              <div key={index} className="flex items-center gap-2 group">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="email"
                    placeholder="friend@example.com"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    className="w-full rounded-lg border border-border/80 bg-bg-surface/80 py-2.5 pl-10 pr-4 text-sm font-medium text-text-primary transition-all outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-text-muted"
                  />
                </div>
                
                {emails.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(index)}
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-start pt-1">
            <button
              type="button"
              onClick={handleAddEmail}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 transition-all hover:bg-emerald-500/10"
            >
              <Plus size={14} /> Add friend
            </button>
          </div>
        </div>

        {/* 🌟 COMPACT PRICE BOX (No Extra Words) 🌟 */}
        <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 px-4 py-3 shadow-sm flex items-center justify-between">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-amber-700/70 dark:text-amber-500/80 uppercase tracking-wider mb-0.5">
              Per person
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                {formatCurrency(splitAmount, sub.currency)}
              </span>
            </div>
          </div>
          
          {/* Clean Badge */}
          <div className="relative z-10 flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-md border border-amber-500/20">
            <Users size={13} /> {totalPeople} {totalPeople === 1 ? 'person' : 'people'}
          </div>
        </div>

        {/* 🌟 FOOTER ACTIONS 🌟 */}
        <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose}
            className="h-10 px-4 text-sm font-bold text-text-secondary hover:text-text-primary hover:bg-bg-hover"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={validEmailsCount === 0}
            className="h-10 px-6 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            Save Split
          </Button>
        </div>
      </div>
    </Modal>
  );
}