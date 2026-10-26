import { motion } from 'motion/react';

interface Props {
  warp?: boolean;
}

export function AmbientBackground({ warp = false }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#fafafa] dark:bg-[#02000a] pointer-events-none -z-10 [perspective:1000px]">
      
      {/* 🌟 Ambient Glowing Orbs 🌟 */}
      <div className="absolute inset-0 dark:hidden">
        <div className="absolute top-[10%] left-[10%] w-[50vw] h-[50vw] bg-blue-400/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-fuchsia-400/20 rounded-full blur-[120px]" />
      </div>
      <div className="absolute inset-0 hidden dark:block">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-cyan-600/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-fuchsia-600/20 rounded-full blur-[150px]" />
      </div>

      {/* 🌟 THE CYBERPUNK 3D GRID (Moving & Glowing) 🌟 */}
      <motion.div
        animate={warp ? { scale: 20, opacity: 0, z: 1000 } : { scale: 1, opacity: 1, z: 0 }}
        transition={{ duration: 1.5, ease: "easeIn" }}
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Light Mode Grid */}
        <div className="absolute inset-0 dark:hidden [transform:rotateX(60deg)_translateY(-20%)_scale(2.5)] [transform-origin:top_center]">
           {/* Moving Grid Lines */}
           <motion.div 
             animate={{ backgroundPosition: ['0px 0px', '0px 40px'] }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             className="absolute inset-[-50%] opacity-20"
             style={{
               backgroundImage: `linear-gradient(to right, #3b82f6 1px, transparent 1px), linear-gradient(to bottom, #3b82f6 1px, transparent 1px)`,
               backgroundSize: '40px 40px',
               maskImage: 'linear-gradient(to bottom, transparent, black 40%, black 80%, transparent)',
               WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 40%, black 80%, transparent)',
             }}
           />
           {/* Glowing Dots at Intersections */}
           <motion.div 
             animate={{ backgroundPosition: ['0px 0px', '0px 40px'] }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
             className="absolute inset-[-50%] opacity-50"
             style={{
               backgroundImage: `radial-gradient(circle, #3b82f6 2px, transparent 2px)`,
               backgroundSize: '40px 40px',
               maskImage: 'linear-gradient(to bottom, transparent, black 40%, black 80%, transparent)',
               WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 40%, black 80%, transparent)',
             }}
           />
        </div>

        {/* Dark Mode Grid (Neon City) */}
        <div className="absolute inset-0 hidden dark:block [transform:rotateX(65deg)_translateY(-20%)_scale(2.5)] [transform-origin:top_center]">
           {/* Moving Grid Lines */}
           <motion.div 
             animate={{ backgroundPosition: ['0px 0px', '0px 50px'] }}
             transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
             className="absolute inset-[-50%] opacity-30"
             style={{
               backgroundImage: `linear-gradient(to right, rgba(6,182,212,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(6,182,212,0.6) 1px, transparent 1px)`,
               backgroundSize: '50px 50px',
               maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
               WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
             }}
           />
           {/* Glowing Dots at Intersections (Neon Pink) */}
           <motion.div 
             animate={{ backgroundPosition: ['0px 0px', '0px 50px'] }}
             transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
             className="absolute inset-[-50%] opacity-70 drop-shadow-[0_0_8px_rgba(244,63,94,1)]"
             style={{
               backgroundImage: `radial-gradient(circle, #f43f5e 1.5px, transparent 1.5px)`,
               backgroundSize: '50px 50px',
               maskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
               WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)',
             }}
           />
        </div>
      </motion.div>

      {/* 🌟 CRT SCANLINES (Retro Effect) 🌟 */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06]" 
           style={{
             backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)`
           }}
      />
      
      {/* 🌟 MOVING LASER LINES 🌟 */}
      <motion.div
        animate={{ y: ['-10vh', '110vh'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30 dark:opacity-60 shadow-[0_0_20px_rgba(34,211,238,1)]"
      />
      <motion.div
        animate={{ y: ['110vh', '-10vh'] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-20 dark:opacity-50 shadow-[0_0_15px_rgba(217,70,239,1)]"
      />

    </div>
  );
}