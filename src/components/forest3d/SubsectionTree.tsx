import { useState } from 'react';
import type { ThreeEvent } from '@react-three/fiber';

export type SubsectionTreeProps = {
  position: [number, number, number];
  scale: number;
  accent: string;
  dark: string;
  lit: boolean; // 已读 → 饱满；未读 → 偏小、低饱和
  onClick: () => void;
  onHover: (hovering: boolean) => void;
};

export default function SubsectionTree({
  position,
  scale,
  accent,
  dark,
  lit,
  onClick,
  onHover,
}: SubsectionTreeProps) {
  const [hovered, setHovered] = useState(false);
  const grown = lit ? 1 : 0.72; // 未读偏幼苗
  const s = scale * grown * (hovered ? 1.12 : 1);
  const crownColor = lit ? accent : dark;
  const crownOpacity = lit ? 1 : 0.78;

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    onHover(true);
    document.body.style.cursor = 'pointer';
  };
  const handleOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    onHover(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={position}>
      {/* 投影盘 */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5 * s, 24]} />
        <meshBasicMaterial color="#1f3d27" transparent opacity={0.18} />
      </mesh>
      {/* 交互组：树干 + 树冠 */}
      <group
        scale={[s, s, s]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <mesh position={[0, 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.1, 0.9, 8]} />
          <meshStandardMaterial color="#8a6239" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.15, 0]}>
          <icosahedronGeometry args={[0.55, 1]} />
          <meshStandardMaterial color={crownColor} roughness={0.75} transparent opacity={crownOpacity} flatShading />
        </mesh>
        <mesh position={[-0.32, 0.95, 0.1]}>
          <icosahedronGeometry args={[0.34, 1]} />
          <meshStandardMaterial color={crownColor} roughness={0.75} transparent opacity={crownOpacity} flatShading />
        </mesh>
        <mesh position={[0.32, 0.98, -0.05]}>
          <icosahedronGeometry args={[0.34, 1]} />
          <meshStandardMaterial color={crownColor} roughness={0.75} transparent opacity={crownOpacity} flatShading />
        </mesh>
      </group>
    </group>
  );
}
