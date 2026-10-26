import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Skull as LogoIcon, 
} from 'lucide-react';

// 🌟 Custom Tombstone SVG Icon (Exactly like Lucide)
const TombstoneIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 21V10a7 7 0 0 1 14 0v11" />
    <path d="M3 21h18" />
    <path d="M9 13h6" />
    <path d="M10 17h4" />
  </svg>
);

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { to: '/graveyard', icon: TombstoneIcon, label: 'Graveyard' }, 
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-bg-elevated border-r border-border p-4">
      
      {/* =========================================
          🌟 CLICKABLE BRAND HEADER (Skull Logo) 🌟
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
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group">
              {isActive && (
                <motion.div layoutId="sidebar-active"
                  className="absolute inset-0 bg-accent-blue/10 border border-accent-blue/20 rounded-xl"
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }} />
              )}
              
              <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-accent-blue' : 'text-text-muted group-hover:text-text-secondary'}`} />
              
              <span className={`relative z-10 ${isActive ? 'text-accent-blue' : 'text-text-secondary group-hover:text-text-primary'}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-elevated border-t border-border px-2 py-2 flex items-center justify-around">
      {navItems.map(item => {
        const isActive = location.pathname === item.to;
        const Icon = item.icon;
        return (
          <NavLink key={item.to} to={item.to}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${isActive ? 'text-accent-blue' : 'text-text-muted'}`}>
            
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}