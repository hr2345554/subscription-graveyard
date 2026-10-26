import { motion } from 'motion/react';

export function BackgroundAnimation() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-bg-primary transition-colors duration-500">
      
      {/* Violet Blob */}
      <motion.div
        animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[10%] -left-[10%] h-[60vw] w-[60vw] rounded-full blur-[120px]"
        style={{ backgroundColor: 'rgba(139, 92, 246, 0.3)' }}
      />
      
      {/* Blue Blob */}
      <motion.div
        animate={{ x: [0, -60, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[20%] right-[0%] h-[50vw] w-[50vw] rounded-full blur-[120px]"
        style={{ backgroundColor: 'rgba(59, 130, 246, 0.25)' }}
      />
      
      {/* Pink/Fuchsia Blob */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 35, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute -bottom-[20%] left-[20%] h-[45vw] w-[45vw] rounded-full blur-[120px]"
        style={{ backgroundColor: 'rgba(217, 70, 239, 0.2)' }}
      />
    </div>
  );
}