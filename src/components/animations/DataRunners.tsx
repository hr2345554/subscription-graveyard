import { motion, useTransform, MotionValue } from 'motion/react';

// 🌟 Pure Neon Shapes with Zig-Zag logic
const runners = [
  // 👈 LEFT SIDE RUNNERS (Card se door)
  { id: 1, side: 'left', baseY: 20, speed: 4, delay: 0, color: 'bg-rose-500', glow: 'shadow-rose-500/80', trail: 'via-rose-500', shape: 'circle' },
  { id: 2, side: 'left', baseY: 60, speed: 6, delay: 2, color: 'bg-cyan-400', glow: 'shadow-cyan-400/80', trail: 'via-cyan-400', shape: 'diamond' },
  { id: 3, side: 'left', baseY: 85, speed: 5, delay: 1, color: 'bg-violet-500', glow: 'shadow-violet-500/80', trail: 'via-violet-500', shape: 'triangle' },

  // 👉 RIGHT SIDE RUNNERS (Card se door)
  { id: 4, side: 'right', baseY: 15, speed: 7, delay: 3, color: 'bg-emerald-400', glow: 'shadow-emerald-400/80', trail: 'via-emerald-400', shape: 'circle' },
  { id: 5, side: 'right', baseY: 55, speed: 5, delay: 1.5, color: 'bg-amber-500', glow: 'shadow-amber-500/80', trail: 'via-amber-500', shape: 'diamond' },
  { id: 6, side: 'right', baseY: 80, speed: 8, delay: 0.5, color: 'bg-fuchsia-500', glow: 'shadow-fuchsia-500/80', trail: 'via-fuchsia-500', shape: 'triangle' },
];

interface Props {
  smoothX: MotionValue<number>;
  smoothY: MotionValue<number>;
}

export function DataRunners({ smoothX, smoothY }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {runners.map((runner) => {
        // Mouse parallax for the runners
        const xOffset = useTransform(smoothX, [-1, 1], [-20, 20]);
        const yOffset = useTransform(smoothY, [-1, 1], [-10, 10]);

        // Left side mein -20% se 35% tak (Card se pehle ruk jayega)
        // Right side mein 65% se 120% tak (Card ke baad se shuru hoga)
        const startX = runner.side === 'left' ? '-20%' : '65%';
        const endX = runner.side === 'left' ? '35%' : '120%';

        return (
          <motion.div
            key={runner.id}
            style={{ 
              top: `${runner.baseY}%`, // Base position
              x: xOffset, 
              y: yOffset 
            }}
            animate={{ 
              left: [startX, endX],
              // 🌟 ZIG ZAG EFFECT (Upar Neeche)
              marginTop: [0, -40, 40, -20, 20, 0] 
            }}
            transition={{
              left: { duration: runner.speed, repeat: Infinity, ease: "linear", delay: runner.delay },
              marginTop: { duration: runner.speed * 0.8, repeat: Infinity, ease: "easeInOut", delay: runner.delay }
            }}
            className="absolute flex items-center"
          >
            <div className="relative flex items-center">
              
              {/* Neon Trail (Speed Effect) */}
              <div className={`absolute right-0 w-32 h-[2px] bg-gradient-to-l from-transparent ${runner.trail} to-transparent opacity-80 blur-[1px]`} />
              <div className={`absolute right-0 w-16 h-[4px] bg-gradient-to-l from-transparent ${runner.trail} to-transparent opacity-100`} />

              {/* Glowing Head */}
              <div className={`relative z-10 w-2 h-2 rounded-full bg-white ${runner.glow} shadow-[0_0_15px]`} />

              {/* 🌟 Abstract Neon Shape (Logos replaced) 🌟 */}
              <div className="absolute left-4 -top-4 flex items-center justify-center">
                <div className={`relative flex items-center justify-center ${runner.color} ${runner.glow} shadow-lg`}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: runner.shape === 'circle' ? '50%' : runner.shape === 'diamond' ? '2px' : '0',
                    transform: runner.shape === 'diamond' ? 'rotate(45deg)' : runner.shape === 'triangle' ? 'rotate(0deg)' : 'none',
                    clipPath: runner.shape === 'triangle' ? 'polygon(50% 0%, 100% 100%, 0% 100%)' : 'none',
                  }}
                >
                  {/* Inner Glow */}
                  <div className="absolute inset-0 bg-white/40 blur-sm rounded-full" />
                </div>
                {/* Connector Line from Head to Shape */}
                <div className={`absolute top-[18px] left-[7px] w-[1px] h-3 ${runner.color} opacity-60`} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}