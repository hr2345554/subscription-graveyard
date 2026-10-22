import { motion } from 'motion/react';

export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-bg-primary pointer-events-none">
      {/* Top Left Glow */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-accent-blue/10 blur-[120px]"
      />
      
      {/* Bottom Right Glow */}
      <motion.div
        animate={{
          x: [0, -50, 0],
          y: [0, -40, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-accent-violet/10 blur-[150px]"
      />
      
      {/* Center Pulse */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] rounded-full bg-success/5 blur-[100px]"
      />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20" />
    </div>
  );
}