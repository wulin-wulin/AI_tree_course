import { useMemo, useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { MapControls, Html } from '@react-three/drei';
import type { MapControls as MapControlsImpl } from 'three-stdlib';
import type { ForestLayout } from '../../data/forestLayout';
import SubsectionTree from './SubsectionTree';
import { ChapterRegionPatch, RegionDividerCurve, MapBorderCurve, type ToWorld } from './ChapterRegion';

const MAP_W = 20;
const MAP_D = 14;

// 俯视角度三档（与相机 +Y 轴的夹角，越大越接近水平）：俯视 / 斜视 / 平视
// 平视需 >69° 才能让地平线进入画面（露出蓝天白云）。
const TILT_ANGLES = [(Math.PI * 24) / 180, (Math.PI * 48) / 180, (Math.PI * 80) / 180];

export type SceneProps = {
  layout: ForestLayout;
  litPointIds: Set<string>;
  onPickPoint: (pointId: string) => void;
  pointMeta: Record<string, { title: string; summary: string; chapterTitle: string }>;
  tiltIndex: number;
};

// 一朵白云：几个白球簇在一起、整体压扁，绘本风。静态（不依赖动画帧）。
function CloudPuff({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const blobs: [number, number, number, number][] = [
    [0, 0, 0, 1.5],
    [-1.4, -0.2, 0.2, 1.05],
    [1.3, -0.1, -0.2, 1.1],
    [0.4, 0.5, 0.4, 0.9],
    [-0.7, 0.35, -0.35, 0.8],
  ];
  return (
    <group position={position} scale={[scale, scale * 0.6, scale]}>
      {blobs.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[r, 14, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.94} />
        </mesh>
      ))}
    </group>
  );
}

// 相机俯仰控制：按 tiltIndex 设定极角，保持当前距离与方位角，平移不受影响。
function CameraRig({
  tiltIndex,
  controlsRef,
}: {
  tiltIndex: number;
  controlsRef: React.RefObject<MapControlsImpl | null>;
}) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const target = controls.target;
    const offset = camera.position.clone().sub(target);
    const dist = offset.length() || 22;
    const azimuth = Math.atan2(offset.x, offset.z); // 保持当前朝向
    const theta = TILT_ANGLES[tiltIndex] ?? TILT_ANGLES[1];
    const horiz = dist * Math.sin(theta);
    camera.position.set(
      target.x + horiz * Math.sin(azimuth),
      target.y + dist * Math.cos(theta),
      target.z + horiz * Math.cos(azimuth),
    );
    camera.lookAt(target);
    controls.update();
    invalidate();
  }, [tiltIndex, camera, controlsRef, invalidate]);
  return null;
}

export default function ForestMapScene({ layout, litPointIds, onPickPoint, pointMeta, tiltIndex }: SceneProps) {
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
      {/* 蓝天（纯色背景不受雾影响）+ 地平线（雾把远处绿地淡化成地平线霾，与天空蓝交接成地平线） */}
      <color attach="background" args={['#8fc4ea']} />
      <fog attach="fog" args={['#dceaf3', 70, 250]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[8, 14, 6]} intensity={0.9} castShadow />

      {/* 白云（落在地平线略上方的天空带里） */}
      <CloudPuff position={[-36, 13, -88]} scale={6} />
      <CloudPuff position={[2, 16, -115]} scale={8} />
      <CloudPuff position={[34, 12, -96]} scale={6.5} />
      <CloudPuff position={[66, 11, -70]} scale={5} />
      <CloudPuff position={[-74, 14, -64]} scale={5.5} />

      {/* 地面（绿地铺到很远，远处被雾淡化形成地平线） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#bfe0a0" roughness={1} />
      </mesh>

      {layout.regions.map((r) => (
        <ChapterRegionPatch key={r.chapterId} region={r} toWorld={toWorld} />
      ))}
      {layout.dividers.map((d, i) => (
        <RegionDividerCurve key={i} divider={d} toWorld={toWorld} />
      ))}
      {/* 外边界：连续闭合的圆角矩形白线 */}
      <MapBorderCurve toWorld={toWorld} />

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

      <CameraRig tiltIndex={tiltIndex} controlsRef={controlsRef} />
      <MapControls
        ref={controlsRef}
        enableRotate={false}
        screenSpacePanning={false}
        minDistance={8}
        maxDistance={30}
        maxPolarAngle={(Math.PI * 84) / 180}
        minPolarAngle={(Math.PI * 18) / 180}
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}
