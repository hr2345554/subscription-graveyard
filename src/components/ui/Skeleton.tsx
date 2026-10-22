import React from 'react';
import { motion } from 'motion/react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-bg-surface rounded-xl ${className}`} />;
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
      {children}
    </motion.div>
  );
}
