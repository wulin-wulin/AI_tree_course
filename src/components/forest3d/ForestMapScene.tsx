import { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { MapControls, Html } from '@react-three/drei';
import type { MapControls as MapControlsImpl } from 'three-stdlib';
import type { ForestLayout } from '../../data/forestLayout';
import SubsectionTree from './SubsectionTree';
import { ChapterRegionPatch, RegionDividerCurve, type ToWorld } from './ChapterRegion';

const MAP_W = 20;
const MAP_D = 14;

export type SceneProps = {
  layout: ForestLayout;
  litPointIds: Set<string>;
  onPickPoint: (pointId: string) => void;
  pointMeta: Record<string, { title: string; summary: string; chapterTitle: string }>;
};

export default function ForestMapScene({ layout, litPointIds, onPickPoint, pointMeta }: SceneProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const controlsRef = useRef<MapControlsImpl>(null);

  // Fix 3: clamp pan so the map stays within MAP_W × MAP_D bounds
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const halfW = MAP_W / 2;
    const halfD = MAP_D / 2;
    const clamp = () => {
      controls.target.x = Math.max(-halfW, Math.min(halfW, controls.target.x));
      controls.target.z = Math.max(-halfD, Math.min(halfD, controls.target.z));
    };
    controls.addEventListener('change', clamp);
    return () => controls.removeEventListener('change', clamp);
  }, []);

  const toWorld: ToWorld = useMemo(
    () => (x: number, z: number) => [(x - 0.5) * MAP_W, (z - 0.5) * MAP_D],
    [],
  );

  const hoverTree = hoverId ? layout.trees.find((t) => t.pointId === hoverId) : null;

  return (
    <Canvas
      frameloop="demand"
      shadows
      camera={{ position: [0, 16, 15], fov: 42 }}
      style={{ position: 'absolute', inset: 0 }}
      onPointerMissed={() => setHoverId(null)}
    >
      <color attach="background" args={['#cfe7ef']} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[8, 14, 6]} intensity={0.9} castShadow />

      {/* 地面（比地图略大） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[MAP_W + 6, MAP_D + 6]} />
        <meshStandardMaterial color="#bfe0a0" roughness={1} />
      </mesh>

      {layout.regions.map((r) => (
        <ChapterRegionPatch key={r.chapterId} region={r} toWorld={toWorld} />
      ))}
      {layout.dividers.map((d, i) => (
        <RegionDividerCurve key={i} divider={d} toWorld={toWorld} seed={i * 1.7} />
      ))}

      {/* 区域标签 */}
      {layout.regions.map((r, i) => {
        const [wx, wz] = toWorld(r.centroid.x, r.centroid.z);
        return (
          <Html key={r.chapterId} position={[wx, 0.5, wz]} center distanceFactor={22} occlude={false}>
            <div className="forest3d-region-label" style={{ color: r.dark }}>
              {i + 1}. {r.title}
            </div>
          </Html>
        );
      })}

      {/* 树 */}
      {layout.trees.map((t) => {
        const [wx, wz] = toWorld(t.x, t.z);
        return (
          <SubsectionTree
            key={t.pointId}
            position={[wx, 0, wz]}
            scale={t.scale}
            accent={t.accent}
            dark={t.dark}
            lit={litPointIds.has(t.pointId)}
            onClick={() => onPickPoint(t.pointId)}
            onHover={(h) => {
              if (h) setHoverId(t.pointId);
              else setHoverId((cur) => (cur === t.pointId ? null : cur));
            }}
          />
        );
      })}

      {/* 悬停预览卡（单张） */}
      {hoverTree && pointMeta[hoverTree.pointId] && (
        <Html
          position={[toWorld(hoverTree.x, hoverTree.z)[0], 2.2, toWorld(hoverTree.x, hoverTree.z)[1]]}
          center
          distanceFactor={18}
          style={{ pointerEvents: 'none' }}
        >
          <div className="forest3d-preview-card">
            <div className="forest3d-preview-title">{pointMeta[hoverTree.pointId].chapterTitle} · {pointMeta[hoverTree.pointId].title}</div>
            <div className="forest3d-preview-summary">{pointMeta[hoverTree.pointId].summary}</div>
            <div className="forest3d-preview-cta">点击进入阅读 →</div>
          </div>
        </Html>
      )}

      <MapControls
        ref={controlsRef}
        enableRotate={false}
        screenSpacePanning={false}
        minDistance={8}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.4}
        minPolarAngle={Math.PI / 5}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
