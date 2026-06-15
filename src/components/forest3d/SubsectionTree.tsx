import { useState, useEffect } from 'react';
import type { ThreeEvent } from '@react-three/fiber';

export type SubsectionTreeProps = {
  position: [number, number, number];
  scale: number;
  accent: string;
  lit: boolean; // 已读 → 饱满长成；未读 → 较小的幼苗（仍用鲜艳本章色，保持明亮通透）
  onClick: () => void;
  onHover: (hovering: boolean) => void;
};

export default function SubsectionTree({
  position,
  scale,
  accent,
  lit,
  onClick,
  onHover,
}: SubsectionTreeProps) {
  const [hovered, setHovered] = useState(false);

  // Fix 1: reset cursor on unmount to prevent cursor leak when navigating away while hovered
  useEffect(() => () => { document.body.style.cursor = 'auto'; }, []);
  // R015 迭代1：未读树不再用深色 dark + 半透明（那是首次进入整片发暗的主因）。
  // 改为统一用鲜艳本章 accent，仅靠「未读=较小幼苗」区分进度，使全未读时整片森林也明亮通透。
  const grown = lit ? 1 : 0.72; // 未读偏幼苗（仅尺寸区分）
  const s = scale * grown * (hovered ? 1.12 : 1);
  const crownColor = accent;
  const crownOpacity = lit ? 1 : 0.96;

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
      {/* 投影盘（R015 迭代2：减淡，避免树底大片暗块，保留极淡接地感即可） */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5 * s, 24]} />
        <meshBasicMaterial color="#5f8a55" transparent opacity={0.07} />
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
        <mesh position={[0, 1.15, 0]} castShadow>
          <icosahedronGeometry args={[0.55, 1]} />
          <meshStandardMaterial color={crownColor} roughness={0.75} transparent opacity={crownOpacity} flatShading />
        </mesh>
        <mesh position={[-0.32, 0.95, 0.1]} castShadow>
          <icosahedronGeometry args={[0.34, 1]} />
          <meshStandardMaterial color={crownColor} roughness={0.75} transparent opacity={crownOpacity} flatShading />
        </mesh>
        <mesh position={[0.32, 0.98, -0.05]} castShadow>
          <icosahedronGeometry args={[0.34, 1]} />
          <meshStandardMaterial color={crownColor} roughness={0.75} transparent opacity={crownOpacity} flatShading />
        </mesh>
      </group>
    </group>
  );
}
