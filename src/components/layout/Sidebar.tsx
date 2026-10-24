import React, { useState } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom'; // 🌟 Link import check karein
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  CreditCard, 
  Flower2, 
  BarChart3, 
  Settings, 
  LogOut, 
  Skull as LogoIcon, 
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { to: '/graveyard', icon: Flower2, label: 'Graveyard' }, 
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-bg-elevated border-r border-border p-4">
        
        {/* =========================================
            🌟 CLICKABLE BRAND HEADER 🌟
            ========================================= */}
        <Link 
          to="/dashboard" 
          aria-label="Go to Dashboard"
          className="flex items-center gap-3 px-2 mb-8 mt-2 group cursor-pointer rounded-xl hover:bg-bg-surface transition-colors p-2 -m-2"
        >
          
          {/* DARK LOGO BOX (With Skull) */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0a0813] border border-[#8b5cf6]/40 shadow-[0_8px_20px_rgba(0,0,0,0.6),0_0_15px_rgba(139,92,246,0.15)] group-hover:scale-105 transition-transform duration-300">
            <LogoIcon className="h-6 w-6 text-white stroke-[2.5] drop-shadow-md" />
          </div>
          
          {/* Brand Text */}
          <div className="flex flex-col">
            <h1 className="text-[14px] font-black leading-tight tracking-tight text-text-primary uppercase group-hover:text-violet-600 transition-colors">
              SUB <span className="text-[#E50914]">GRAVEYARD</span>
            </h1>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.15em] text-text-muted group-hover:text-violet-500 transition-colors">
              Track • Cancel • Save
            </p>
          </div>
        </Link>
        {/* ========================================= */}

        <nav className="flex-1 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink key={item.to} to={item.to} className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group">
                {isActive && (
                  <motion.div layoutId="sidebar-active"
                    className="absolute inset-0 bg-accent-blue/10 border border-accent-blue/20 rounded-xl"
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }} />
                )}
                <item.icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-accent-blue' : 'text-text-muted group-hover:text-text-secondary'}`} />
                <span className={`relative z-10 ${isActive ? 'text-accent-blue' : 'text-text-secondary group-hover:text-text-primary'}`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* =========================================
            THEME TOGGLE
            ========================================= */}
        <div className="mt-4 mb-2 px-1">
          <div 
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-between p-2.5 rounded-xl bg-bg-surface border border-border/60 hover:border-violet-500/40 transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg transition-colors ${resolvedTheme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-500'}`}>
                {resolvedTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>

            <div className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${resolvedTheme === 'dark' ? 'bg-violet-600' : 'bg-gray-300'}`}>
              <div className={`absolute top-[3px] left-[3px] bg-white w-3.5 h-3.5 rounded-full shadow-md transition-transform duration-300 ${resolvedTheme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>

        {/* =========================================
            USER PROFILE & LOGOUT
            ========================================= */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-violet flex items-center justify-center text-white text-xs font-bold shadow-md">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-text-muted truncate">{user?.email || ''}</p>
            </div>
          </div>
          
          <button onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-sm text-text-muted hover:text-danger hover:bg-danger/10 transition-all">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
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
    </>
  );
}

export function MobileNav() {
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-elevated border-t border-border px-2 py-2 flex items-center justify-around">
      {navItems.map(item => {
        const isActive = location.pathname === item.to;
        return (
          <NavLink key={item.to} to={item.to}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'text-accent-blue' : 'text-text-muted'}`}>
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        );
      })}
      
      <button 
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-text-muted hover:text-accent-blue transition-all"
      >
        {resolvedTheme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        <span className="text-[10px] font-medium">Theme</span>
      </button>
    </nav>
  );
}