import { useState, useEffect } from 'react';
import { Search, X, Users, CheckCircle2, Loader2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { api } from '../api/service'; // API import kiya
import type { Subscription } from '../types';
import { formatCurrency } from '../utils/calculations';

interface SplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  sub: Subscription;
  onSave: (id: string, sharedWith: { email: string; amountOwed: number; hasPaid: boolean }[]) => void;
}

export function SplitModal({ isOpen, onClose, sub, onSave }: SplitModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  
  const totalPrice = Number(sub.price) || 0;
  const splitAmount = totalPrice / (selectedUsers.length + 1);
  const totalPeople = selectedUsers.length + 1;

  // 🌟 API se users search karne ka logic
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await api.searchUsers(searchQuery);
        // Jo already select ho chuke hain unko hata dein
        const filtered = users.filter((u: any) => !selectedUsers.find(su => su._id === u._id));
        setSearchResults(filtered);
      } catch (error) {
        console.error("Search failed");
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms wait taake har word par API na hit ho

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedUsers]);

  const handleSelectUser = (user: any) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  const handleSave = () => {
    const sharedWith = selectedUsers.map(user => ({
      email: user.email,
      amountOwed: splitAmount,
      hasPaid: false
    }));
    onSave(sub.id, sharedWith);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Subscription" size="md">
      <div className="space-y-5 pt-1">
        
        {/* Header Banner */}
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

        {/* 🌟 SEARCH USERS 🌟 */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Users size={13} className="text-emerald-500" /> Search App Users
          </label>
          
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search by name or email (e.g. Ali)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-bg-surface/80 py-2.5 pl-10 pr-10 text-sm font-medium text-text-primary transition-all outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-text-muted"
              />
              {isSearching && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 animate-spin" />
              )}
            </div>

            {/* Dropdown Results */}
            {searchQuery.length > 0 && !isSearching && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-bg-elevated border border-border rounded-lg shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map(user => (
                    <button
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-bg-hover transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-xs uppercase">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-text-primary">{user.name}</p>
                        <p className="text-[10px] text-text-secondary">{user.email}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-text-muted">No users found</div>
                )}
              </div>
            )}
          </div>

          {/* Selected Users List */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedUsers.map(user => (
                <div key={user._id} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{user.name}</span>
                  <button onClick={() => handleRemoveUser(user._id)} className="text-emerald-600/50 hover:text-emerald-600">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Price Box */}
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
          
          <div className="relative z-10 flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-500/15 px-2.5 py-1 rounded-md border border-amber-500/20">
            <Users size={13} /> {totalPeople} {totalPeople === 1 ? 'person' : 'people'}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-border/60">
          <Button type="button" variant="ghost" onClick={onClose} className="h-10 px-4 text-sm font-bold">
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={selectedUsers.length === 0}
            className="h-10 px-6 text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-md transition-all disabled:opacity-50"
          >
            Send Invite
          </Button>
        </div>
      </div>
    </Modal>
  );
}