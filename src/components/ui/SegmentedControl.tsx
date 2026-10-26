import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface Option {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps {
  options: Option[];
  activeId: string;
  onChange: (id: string) => void;
}

export function SegmentedControl({ options, activeId, onChange }: SegmentedControlProps) {
  return (
    <div className="inline-flex p-1.5 bg-bg-surface/50 backdrop-blur-md border border-border/40 rounded-full shadow-sm">
      {options.map((option) => {
        const isActive = activeId === option.id;
        
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`relative px-6 py-2.5 text-sm font-bold rounded-full transition-colors duration-300 flex items-center gap-2 outline-none ${
              isActive ? 'text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {/* 🌟 ANIMATED SLIDING BACKGROUND 🌟 */}
            {isActive && (
              <motion.div
                layoutId="segmented-control-highlight"
                className="absolute inset-0 bg-emerald-600 rounded-full shadow-md shadow-emerald-500/30"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            
            {/* Button Text & Icon */}
            <span className="relative z-10 flex items-center gap-2">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}