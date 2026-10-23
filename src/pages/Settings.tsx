import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { showToast } from '../components/ui/Toast';
import { deleteAccount } from '../api/auth';
import { User, LogOut, Trash2, Shield, Loader2 } from 'lucide-react';

export function Settings() {
  const { user, logout } = useAuth();
  const [showDelete, setShowDelete] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // <-- Naya State
  const [isDeleting, setIsDeleting] = useState(false);

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

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your account and preferences</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-5 h-5 text-accent-blue" />
            <h2 className="text-lg font-semibold text-text-primary">Profile</h2>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-bg-surface">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-blue to-accent-violet flex items-center justify-center text-white text-xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="font-medium text-text-primary">{user?.name || 'User'}</p>
              <p className="text-sm text-text-muted">{user?.email || 'email@example.com'}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-danger/20 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-danger" />
            <h2 className="text-lg font-semibold text-text-primary">Account</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-bg-surface">
              <div>
                <p className="text-sm font-medium text-text-primary">Sign Out</p>
                <p className="text-xs text-text-muted">End your current session</p>
              </div>
              {/* Yahan onClick change kiya hai */}
              <Button 
                variant="ghost" 
                icon={<LogOut className="w-4 h-4" />} 
                onClick={() => setShowLogoutModal(true)}
              >
                Sign Out
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-danger/5 border border-danger/20">
              <div>
                <p className="text-sm font-medium text-danger">Delete Account</p>
                <p className="text-xs text-text-muted">Permanently delete all your data</p>
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

      {/* =========================================
          LOGOUT CONFIRMATION MODAL
          ========================================= */}
      <Modal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        title="Sign Out"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm font-semibold text-text-primary text-center">
            Are you sure you want to sign out?
          </p>
          <p className="text-xs text-text-secondary text-center">
            You will need to log in again to access your subscriptions.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="ghost" 
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={() => {
                setShowLogoutModal(false);
                logout();
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
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
            <Button 
              variant="danger" 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
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