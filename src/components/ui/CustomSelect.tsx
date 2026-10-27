import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';

interface CustomSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function CustomSelect({ options, value, onChange, label, className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  // 1. Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 2. Auto-scroll to the focused item when using Arrow keys
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [focusedIndex, isOpen]);

  // 3. Keyboard Navigation Logic
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement | HTMLUListElement>) => {
    if (e.key === 'Tab') return; // Allow tabbing out

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(Math.max(0, options.indexOf(value)));
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault(); // 🔥 Stops the page from scrolling
        setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault(); // 🔥 Stops the page from scrolling
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex]);
          setIsOpen(false);
          buttonRef.current?.focus();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
    }
  };

  return (
    <div className={`relative flex flex-col gap-2 ${className}`} ref={dropdownRef}>
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">
          {label}
        </span>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        ref={buttonRef}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`flex min-h-11 w-full items-center justify-between rounded-xl border px-3 text-sm transition-all duration-300 ${
          isOpen 
            ? 'border-violet-500 bg-bg-surface ring-2 ring-violet-500/20' 
            : 'border-border bg-bg-surface hover:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20'
        }`}
      >
        <span className="text-text-primary font-medium truncate">{value}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-text-muted" />
        </motion.div>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            role="listbox"
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 z-[100] mt-2 w-full min-w-[200px] overflow-hidden rounded-xl border border-border/60 bg-bg-elevated/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
              {options.map((option, index) => {
                const isSelected = value === option;
                const isFocused = focusedIndex === index;
                
                return (
                  <li
                    key={option}
                    role="option"
                    aria-selected={isSelected}
                    // 🔥 Ref lagaya taake scrollIntoView kaam kar sake
                    ref={(el) => { optionRefs.current[index] = el; }}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                      buttonRef.current?.focus();
                    }}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isFocused ? 'bg-bg-hover' : 'bg-transparent'
                    } ${
                      isSelected
                        ? 'text-violet-600 dark:text-violet-400 font-bold'
                        : 'text-text-primary font-medium'
                    }`}
                  >
                    <span className="capitalize truncate">{option}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </li>
                );
              })}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}