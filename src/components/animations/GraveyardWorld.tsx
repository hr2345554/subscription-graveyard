
import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';

function Moon() {
  return (
    <group position={[-5, 5, -9]}>
      <mesh>
        <sphereGeometry args={[1.25, 40, 40]} />
        <meshStandardMaterial
          color="#d8d9ff"
          emissive="#7d80ff"
          emissiveIntensity={0.8}
          roughness={0.3}
        />
      </mesh>
      <mesh scale={1.24}>
        <sphereGeometry args={[1.25, 32, 32]} />
        <meshBasicMaterial
          color="#7f82ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
      <pointLight color="#8185ff" intensity={30} distance={18} />
    </group>
  );
}

function Grave({ position, rotation = 0, scale = 1 }: {
  position: [number, number, number];
  rotation?: number;
  scale?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[0.75, 0.95, 0.2]} />
        <meshStandardMaterial color="#252638" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.96, 0]} castShadow>
        <boxGeometry args={[0.75, 0.16, 0.2]} />
        <meshStandardMaterial color="#383952" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.49, 0.111]}>
        <boxGeometry args={[0.025, 0.43, 0.012]} />
        <meshBasicMaterial color="#7779d8" />
      </mesh>
      <mesh position={[0, 0.49, 0.12]}>
        <boxGeometry args={[0.27, 0.018, 0.012]} />
        <meshBasicMaterial color="#7779d8" />
      </mesh>
      <mesh position={[0, 0.035, 0]}>
        <boxGeometry args={[1, 0.07, 0.45]} />
        <meshStandardMaterial color="#303146" roughness={1} />
      </mesh>
    </group>
  );
}

const stones: Array<{
  position: [number, number, number];
  rotation: number;
  scale: number;
}> = [
  { position: [-5.7, 0, -1], rotation: 0.12, scale: 1.1 },
  { position: [-3.9, 0, -3], rotation: -0.15, scale: 0.8 },
  { position: [-7.5, 0, -4], rotation: 0.22, scale: 0.9 },
  { position: [-2.7, 0, -6], rotation: 0.1, scale: 0.65 },
  { position: [0.1, 0, -5], rotation: -0.1, scale: 0.7 },
  { position: [-8.5, 0, -8], rotation: 0.1, scale: 1.1 },
  { position: [-4.7, 0, -9], rotation: -0.1, scale: 0.75 },
  { position: [1.3, 0, -9], rotation: 0.15, scale: 0.85 },
  { position: [-10, 0, -3], rotation: -0.2, scale: 0.7 },
];

function FloatingMonolith({
  position,
  color,
  index,
}: {
  position: [number, number, number];
  color: string;
  index: number;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.position.y = position[1] + Math.sin(t * 0.55 + index) * 0.19;
    group.current.rotation.y =
      Math.sin(t * 0.17 + index * 1.7) * 0.12;
    group.current.rotation.z =
      Math.sin(t * 0.3 + index) * 0.025;
  });

  return (
    <group ref={group} position={position}>
      {/* Main floating object */}
      <mesh castShadow>
        <boxGeometry args={[0.86, 1.65, 0.28]} />
        <meshStandardMaterial
          color="#111321"
          metalness={0.65}
          roughness={0.26}
        />
      </mesh>

      {/* Luminous frame */}
      <mesh position={[0, 0, 0.151]}>
        <boxGeometry args={[0.72, 1.49, 0.025]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Dark inset */}
      <mesh position={[0, 0, 0.17]}>
        <boxGeometry args={[0.65, 1.4, 0.025]} />
        <meshStandardMaterial
          color="#111321"
          emissive={color}
          emissiveIntensity={0.1}
          metalness={0.35}
          roughness={0.4}
        />
      </mesh>

      {/* Abstract service emblem */}
      <mesh position={[0, 0.32, 0.2]}>
        <torusGeometry args={[0.18, 0.027, 8, 28]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.32, 0.22]}>
        <icosahedronGeometry args={[0.105, 1]} />
        <meshBasicMaterial color={color} wireframe />
      </mesh>

      {/* Small glowing status lights */}
      {[-0.35, -0.45, -0.55].map((y, i) => (
        <mesh key={i} position={[-0.18 + i * 0.18, y, 0.2]}>
          <boxGeometry args={[0.09, 0.025, 0.02]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}

      <mesh position={[0, -0.91, 0]}>
        <cylinderGeometry args={[0.28, 0.42, 0.07, 6]} />
        <meshStandardMaterial color="#292b43" metalness={0.7} />
      </mesh>

      <pointLight color={color} intensity={1.8} distance={3.5} />
    </group>
  );
}

function WorldScene() {
  const cameraRig = useRef<THREE.Group>(null);

  const dustPositions = useMemo(() => {
    const values = new Float32Array(750 * 3);
    for (let i = 0; i < 750; i++) {
      values[i * 3] = (Math.random() - 0.5) * 24;
      values[i * 3 + 1] = Math.random() * 9;
      values[i * 3 + 2] = -Math.random() * 20;
    }
    return values;
  }, []);

  useFrame((state, delta) => {
    if (!cameraRig.current) return;

    const targetX = state.pointer.x * 0.48;
    const targetY = state.pointer.y * 0.18;

    cameraRig.current.rotation.y = THREE.MathUtils.damp(
      cameraRig.current.rotation.y,
      targetX * 0.16,
      2,
      delta
    );

    cameraRig.current.rotation.x = THREE.MathUtils.damp(
      cameraRig.current.rotation.x,
      -targetY * 0.12,
      2,
      delta
    );
  });

  return (
    <group ref={cameraRig}>
      <color attach="background" args={['#060711']} />
      <fog attach="fog" args={['#080a18', 10, 28]} />

      <ambientLight intensity={0.48} />
      <hemisphereLight args={['#818bff', '#101019', 1.2]} />
      <directionalLight
        position={[-5, 9, 5]}
        intensity={2.2}
        color="#b7baff"
        castShadow
      />
      <pointLight position={[2, 4, -4]} intensity={12} color="#6c4dff" />
      <pointLight position={[-7, 2, -3]} intensity={8} color="#347dff" />

      <Moon />

      <Stars
        radius={70}
        depth={45}
        count={1800}
        factor={3}
        saturation={0.35}
        fade
        speed={0.35}
      />

      <Sparkles
        count={180}
        scale={[20, 9, 18]}
        size={2}
        speed={0.2}
        opacity={0.65}
        color="#aaaaff"
      />

      {/* Mist layers */}
      {[-6, -10, -14].map((z, i) => (
        <mesh key={z} position={[-2, 0.18 + i * 0.12, z]}>
          <planeGeometry args={[25, 1.3]} />
          <meshBasicMaterial
            color={i === 1 ? '#3435a1' : '#242752'}
            transparent
            opacity={0.1}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Ground */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.08, -7]}
        receiveShadow
      >
        <planeGeometry args={[45, 38]} />
        <meshStandardMaterial
          color="#10111d"
          roughness={0.95}
          metalness={0.12}
        />
      </mesh>

      {/* A receding path through the graveyard */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-2.4, -0.045, -7]}
      >
        <planeGeometry args={[2.1, 26]} />
        <meshBasicMaterial color="#242447" transparent opacity={0.45} />
      </mesh>

      {/* Fine glowing path lines */}
      {[-3.4, -1.4].map((x) => (
        <mesh
          key={x}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, -0.02, -7]}
        >
          <planeGeometry args={[0.018, 25]} />
          <meshBasicMaterial color="#6e6dff" transparent opacity={0.65} />
        </mesh>
      ))}

      {stones.map((stone, i) => (
        <Grave key={i} {...stone} />
      ))}

      {/* Floating subscription relics */}
      <Float speed={0.65} rotationIntensity={0.1} floatIntensity={0.16}>
        <FloatingMonolith
          position={[-5.2, 2.55, -3.8]}
          color="#ff365f"
          index={1}
        />
      </Float>
      <Float speed={0.5} rotationIntensity={0.14} floatIntensity={0.2}>
        <FloatingMonolith
          position={[-2.6, 3.25, -6.3]}
          color="#38e6bd"
          index={2}
        />
      </Float>
      <Float speed={0.7} rotationIntensity={0.12} floatIntensity={0.22}>
        <FloatingMonolith
          position={[0.2, 2.1, -4.7]}
          color="#9b75ff"
          index={3}
        />
      </Float>
      <Float speed={0.45} rotationIntensity={0.1} floatIntensity={0.15}>
        <FloatingMonolith
          position={[-7.3, 3.1, -7.7]}
          color="#f5c56b"
          index={4}
        />
      </Float>

      {/* Foreground silhouettes add cinematic depth */}
      <mesh position={[-10, 1.1, 1]} rotation={[0, 0, -0.12]}>
        <boxGeometry args={[1.1, 2.5, 0.55]} />
        <meshStandardMaterial color="#080910" />
      </mesh>
      <mesh position={[0.6, 1.15, -0.1]} rotation={[0, -0.2, 0.08]}>
        <boxGeometry args={[0.8, 2.1, 0.4]} />
        <meshStandardMaterial color="#090a13" />
      </mesh>

      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#aaaaff"
          size={0.035}
          transparent
          opacity={0.7}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export default function GraveyardWorld() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        background: '#060711',
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 3.1, 12], fov: 48 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#060711', 1);
        }}
      >
        <WorldScene />
      </Canvas>

      {/* Keep the login side readable while letting the 3D world show through */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(90deg, rgba(6,7,17,0.05) 0%, rgba(6,7,17,0.04) 42%, rgba(6,7,17,0.42) 63%, rgba(6,7,17,0.88) 100%), linear-gradient(0deg, rgba(6,7,17,0.7), transparent 30%, transparent 72%, rgba(6,7,17,0.28))',
        }}
      />
    </div>
  );
}
