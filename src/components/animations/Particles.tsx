
import { motion, useReducedMotion } from 'motion/react';

const rings = [
  { size: 'min(96vw, 960px)', opacity: 0.14, duration: 48 },
  { size: 'min(78vw, 780px)', opacity: 0.19, duration: 40 },
  { size: 'min(60vw, 600px)', opacity: 0.25, duration: 32 },
  { size: 'min(42vw, 420px)', opacity: 0.32, duration: 26 },
];

const services = [
  {
    name: 'Netflix',
    label: 'N',
    x: '12%',
    y: '22%',
    color: '#ff3038',
    delay: 0,
    size: 58,
  },
  {
    name: 'Claude',
    label: '✳',
    x: '78%',
    y: '17%',
    color: '#e6a078',
    delay: 1.1,
    size: 54,
  },
  {
    name: 'Gemini',
    label: '✦',
    x: '84%',
    y: '62%',
    color: '#83a7ff',
    delay: 0.6,
    size: 58,
  },
  {
    name: 'ChatGPT',
    label: '◎',
    x: '10%',
    y: '67%',
    color: '#79d9bd',
    delay: 1.8,
    size: 58,
  },
  {
    name: 'Spotify',
    label: '≋',
    x: '28%',
    y: '80%',
    color: '#48df91',
    delay: 0.8,
    size: 48,
  },
  {
    name: 'YouTube',
    label: '▶',
    x: '72%',
    y: '82%',
    color: '#ff6565',
    delay: 1.5,
    size: 48,
  },
  {
    name: 'Figma',
    label: '◉',
    x: '91%',
    y: '36%',
    color: '#c39bff',
    delay: 2.2,
    size: 42,
  },
  {
    name: 'Prime Video',
    label: 'a',
    x: '5%',
    y: '43%',
    color: '#71caff',
    delay: 1.3,
    size: 42,
  },
];

export function Particles() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="ambient-bg"
      aria-hidden="true"
      style={{
        background:
          'radial-gradient(ellipse at 50% 45%, rgba(65, 42, 135, 0.24), transparent 52%), #090b10',
      }}
    >
      {/* Central atmospheric glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 'min(85vw, 850px)',
          aspectRatio: '1',
          left: '50%',
          top: '46%',
          x: '-50%',
          y: '-50%',
          background:
            'radial-gradient(circle, rgba(61,105,255,0.17), rgba(135,87,255,0.08) 42%, transparent 70%)',
          filter: 'blur(25px)',
        }}
        animate={
          reduceMotion
            ? { opacity: 0.7 }
            : { scale: [1, 1.08, 1], opacity: [0.5, 0.85, 0.5] }
        }
        transition={{
          duration: 13,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Slow concentric gradient rings */}
      {rings.map((ring, index) => (
        <motion.div
          key={ring.size}
          className="absolute rounded-full"
          style={{
            width: ring.size,
            aspectRatio: '1',
            left: '50%',
            top: '46%',
            x: '-50%',
            y: '-50%',
            border: `1px solid rgba(119, 139, 255, ${ring.opacity})`,
            boxShadow: `inset 0 0 32px rgba(91, 78, 220, ${ring.opacity * 0.3}), 0 0 28px rgba(93, 76, 220, ${ring.opacity * 0.25})`,
            background:
              'radial-gradient(circle, transparent 68%, rgba(91,72,190,0.035) 78%, transparent 82%)',
            willChange: 'transform',
          }}
          animate={
            reduceMotion
              ? { rotate: 0 }
              : {
                  rotate: index % 2 === 0 ? 360 : -360,
                  scale: [1, index % 2 === 0 ? 1.025 : 0.98, 1],
                }
          }
          transition={{
            rotate: {
              duration: ring.duration,
              repeat: Infinity,
              ease: 'linear',
            },
            scale: {
              duration: ring.duration * 0.7,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        />
      ))}

      {/* Floating subscription service tiles */}
      {!reduceMotion &&
        services.map((service, index) => (
          <motion.div
            key={service.name}
            className="absolute flex flex-col items-center gap-2"
            style={{
              left: service.x,
              top: service.y,
              zIndex: 1,
              transform: 'translate(-50%, -50%)',
              willChange: 'transform',
            }}
            animate={{
              y: [0, -12 - (index % 3) * 5, 0],
              rotate: [0, index % 2 === 0 ? 3 : -3, 0],
            }}
            transition={{
              duration: 5 + (index % 4) * 1.5,
              delay: service.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{
                width: service.size,
                height: service.size,
                color: service.color,
                background:
                  'linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.025))',
                border: `1px solid ${service.color}55`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.22), 0 0 22px ${service.color}18, inset 0 1px 0 rgba(255,255,255,0.12)`,
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                fontSize: service.name === 'Netflix' ? 34 : 29,
                fontWeight: 800,
              }}
            >
              {service.label}
            </div>

            <span
              style={{
                color: 'rgba(224,230,255,0.66)',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textShadow: '0 1px 12px rgba(0,0,0,0.8)',
              }}
            >
              {service.name}
            </span>
          </motion.div>
        ))}

      {/* Tiny ambient particles */}
      {!reduceMotion &&
        Array.from({ length: 16 }, (_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${7 + ((i * 37) % 86)}%`,
              top: `${6 + ((i * 53) % 88)}%`,
              width: i % 4 === 0 ? 3 : 2,
              height: i % 4 === 0 ? 3 : 2,
              background: i % 2 === 0 ? '#83a5ff' : '#bd9aff',
              boxShadow: '0 0 10px rgba(116,126,255,0.65)',
            }}
            animate={{
              y: [0, -16 - (i % 4) * 5, 0],
              opacity: [0.15, 0.7, 0.15],
            }}
            transition={{
              duration: 7 + (i % 5) * 2,
              delay: (i % 4) * 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
    </div>
  );
}
