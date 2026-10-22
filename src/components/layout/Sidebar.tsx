import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { LayoutDashboard, CreditCard, Skull, BarChart3, Settings, LogOut, Skull as LogoIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { to: '/graveyard', icon: Skull, label: 'Graveyard' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-bg-elevated border-r border-border p-4">
      <div className="flex items-center gap-3 px-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue to-accent-violet flex items-center justify-center shadow-lg shadow-accent-blue/20">
          <LogoIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-text-primary text-lg leading-tight">Sub Graveyard</h1>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Track • Cancel • Save</p>
        </div>
      </div>

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

      <div className="border-t border-border pt-4 mt-4">
        <div className="flex items-center gap-3 px-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-violet flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-text-muted truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button onClick={logout}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-xl text-sm text-text-muted hover:text-danger hover:bg-danger/10 transition-all">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const location = useLocation();
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
    </nav>
  );
}