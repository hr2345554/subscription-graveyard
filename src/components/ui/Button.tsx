import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'glow' | 'shimmer' | 'glass' | 'gradient-border' | 'press-depth' | 'pill' | 'ghost' | 'icon' | 'success' | 'danger' | 'loading' | 'fab';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const sizes = { 
  sm: 'px-3 py-1.5 text-xs', 
  md: 'px-5 py-2.5 text-sm', 
  lg: 'px-7 py-3.5 text-base' 
};

const variants = {
  glow: 'bg-gradient-to-r from-accent-blue to-accent-violet text-white shadow-lg shadow-accent-blue/25 hover:shadow-accent-blue/40 hover:brightness-110',
  shimmer: 'bg-bg-surface border border-border text-text-primary relative overflow-hidden hover:border-accent-blue/50',
  glass: 'bg-bg-elevated/80 backdrop-blur-md border border-border text-text-primary hover:bg-bg-hover hover:border-accent-blue/30',
  'gradient-border': 'bg-bg-surface text-text-primary border border-transparent relative',
  'press-depth': 'bg-bg-surface border border-border text-text-primary shadow-md active:shadow-inner active:translate-y-px',
  pill: 'bg-bg-elevated border border-border text-text-secondary rounded-full hover:bg-bg-hover hover:text-text-primary',
  ghost: 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
  icon: 'p-2 rounded-lg text-text-muted hover:bg-bg-hover hover:text-text-primary',
  success: 'bg-success text-white shadow-lg shadow-success/20 hover:brightness-110',
  danger: 'bg-danger text-white shadow-lg shadow-danger/20 hover:brightness-110',
  loading: 'bg-bg-surface border border-border text-text-muted cursor-not-allowed',
  fab: 'w-14 h-14 rounded-full bg-gradient-to-r from-accent-blue to-accent-violet text-white shadow-xl shadow-accent-blue/30 flex items-center justify-center',
};

export function Button({ variant = 'glow', size = 'md', isLoading = false, icon, children, className = '', disabled, ...props }: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const sizeClass = variant === 'fab' || variant === 'icon' ? '' : sizes[size];

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-accent-blue/30 disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeClass} ${variants[variant]} ${className}`}
      disabled={isDisabled}
      {...(props as any)}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children && <span>{children}</span>}
    </motion.button>
  );
}