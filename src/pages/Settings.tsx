import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/FormElements';
import { showToast } from '../components/ui/Toast';
import { deleteAccount } from '../api/auth';
import {
  User, LogOut, Trash2, Shield, Loader2, Sun, Moon, Sparkles,
  Pencil, Save, Mail
} from 'lucide-react';

export function Settings() {
  const { user, logout, updateProfile } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  const [showDelete, setShowDelete] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const isDark = resolvedTheme === 'dark';
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  // Dynamic Avatar Letter
  const avatarLetter = user?.name?.trim().charAt(0).toUpperCase() || 'U';

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      localStorage.clear();
      showToast('success', 'Account permanently deleted.');
      logout();
    } catch (error: any) {
      showToast('error', error.message || 'Could not delete account.');
      setIsDeleting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      await updateProfile(editName);
      showToast('success', 'Profile updated successfully!');
      setShowEditProfile(false);
    } catch (error) {
      showToast('error', 'Could not update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl pb-10">

      {/* 🌟 PAGE HEADER — Compact & Balanced (matches Dashboard/Analytics) 🌟 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 to-transparent dark:from-white/10 dark:to-transparent border border-white/50 dark:border-white/10 shadow-sm backdrop-blur-sm" />
          <span className="relative z-10 text-2xl drop-shadow-md">⚙️</span>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text-primary">
            Settings<span className="text-violet-500">.</span>
          </h1>
          <p className="text-sm text-text-secondary font-medium">
            Manage your account and preferences
          </p>
        </div>
      </motion.div>

      {/* 🌟 PROFILE CARD 🌟 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="space-y-5 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl rounded-full pointer-events-none" />

          <div className="flex items-center justify-between mb-2 relative z-10">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-violet-500" />
              <h2 className="text-lg font-semibold text-text-primary">Profile</h2>
            </div>

            <Button
              variant="ghost"
              size="sm"
              icon={<Pencil className="w-3.5 h-3.5 mr-1" />}
              onClick={() => {
                setEditName(user?.name || '');
                setShowEditProfile(true);
              }}
              className="text-text-secondary hover:text-text-primary hover:bg-bg-hover"
            >
              Edit
            </Button>
          </div>

          <div className="flex items-center gap-5 p-5 rounded-xl bg-bg-surface/50 border border-border/50 relative z-10">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-violet-500/20 ring-4 ring-bg-surface">
              {avatarLetter}
            </div>

            <div>
              <p className="font-bold text-text-primary text-xl">{user?.name || 'User'}</p>
              <p className="text-sm text-text-secondary flex items-center gap-1.5 mt-1">
                <Mail size={14} /> {user?.email || 'email@example.com'}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 🌟 PREFERENCES CARD 🌟 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-text-primary">Preferences</h2>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-bg-surface/50 border border-border/50 transition-all hover:bg-bg-surface">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'}`}>
                {isDark ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary">Appearance</p>
                <p className="text-xs text-text-secondary mt-0.5">Toggle between light and dark mode</p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className={`relative flex h-8 w-14 items-center rounded-full p-1 transition-colors duration-500 shadow-inner ${
                isDark ? 'bg-violet-600' : 'bg-slate-300'
              }`}
            >
              <motion.div
                layout
                className={`flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md ${
                  isDark ? 'text-violet-600' : 'text-amber-500'
                }`}
                animate={{ x: isDark ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {isDark ? <Moon size={12} strokeWidth={3} /> : <Sun size={12} strokeWidth={3} />}
              </motion.div>
            </button>
          </div>
        </Card>
      </motion.div>

      {/* 🌟 ACCOUNT CARD 🌟 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-danger/20 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-danger" />
            <h2 className="text-lg font-semibold text-text-primary">Account</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-surface/50 border border-border/50 transition-all hover:bg-bg-surface">
              <div>
                <p className="text-sm font-bold text-text-primary">Sign Out</p>
                <p className="text-xs text-text-secondary mt-0.5">End your current session</p>
              </div>
              <Button
                variant="ghost"
                icon={<LogOut className="w-4 h-4" />}
                onClick={() => setShowLogoutModal(true)}
                className="hover:text-text-primary hover:bg-bg-hover"
              >
                Sign Out
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-danger/5 border border-danger/20 transition-all hover:bg-danger/10">
              <div>
                <p className="text-sm font-bold text-danger">Delete Account</p>
                <p className="text-xs text-text-secondary mt-0.5">Permanently delete all your data</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => setShowDelete(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* EDIT PROFILE MODAL */}
      <Modal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile" size="sm">
        <form onSubmit={handleUpdateProfile} className="space-y-5 pt-2">

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-secondary ml-1">Display Name</label>
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter your name"
              required
              className="bg-bg-surface"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">

            <button
              type="button"
              onClick={() => setShowEditProfile(false)}
              disabled={isUpdating}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUpdating || !editName.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-400 hover:bg-emerald-500 text-white transition-colors shadow-sm disabled:opacity-50 disabled:shadow-none dark:bg-emerald-500/90 dark:hover:bg-emerald-500"
            >
              {isUpdating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>

          </div>
        </form>
      </Modal>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} title="Sign Out" size="sm">
        <div className="space-y-4 pt-2">
          <p className="text-sm font-semibold text-text-primary text-center">
            Are you sure you want to sign out?
          </p>
          <p className="text-xs text-text-secondary text-center">
            You will need to log in again to access your subscriptions.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => { setShowLogoutModal(false); logout(); }}>
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Account" size="sm">
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-danger/10 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-danger" />
            </div>
            <p className="text-text-secondary">
              This will permanently delete your account and all data. This action <strong>cannot be undone</strong>.
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowDelete(false)} disabled={isDeleting}>
              Keep My Account
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? (
                <><Loader2 className="w-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                'Delete Everything'
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}