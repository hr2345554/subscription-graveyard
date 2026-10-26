import { motion } from 'motion/react';

export function GlitchText({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`relative inline-block ${className}`}>
      <motion.span
        animate={{ x: [0, -2, 2, -1, 1, 0], y: [0, 1, -1, 2, -2, 0] }}
        transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
        className="relative z-10 inline-block"
      >
        {text}
      </motion.span>
      
      <motion.span
        animate={{ x: [0, 3, -2, 0], opacity: [0.8, 0.5, 0.8, 0] }}
        transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
        className="absolute top-0 left-0 z-0 text-cyan-400/50 blur-[1px]"
      >
        {text}
      </motion.span>

      <motion.span
        animate={{ x: [0, -3, 2, 0], opacity: [0.8, 0.5, 0.8, 0] }}
        transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
        className="absolute top-0 left-0 z-0 text-fuchsia-500/50 blur-[1px]"
      >
        {text}
      </motion.span>
    </div>
  );
}