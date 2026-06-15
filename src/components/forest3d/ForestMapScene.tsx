import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { MapControls, Html } from '@react-three/drei';
import type { MapControls as MapControlsImpl } from 'three-stdlib';
import type { ForestLayout } from '../../data/forestLayout';
import SubsectionTree from './SubsectionTree';
import { ChapterRegionPatch, RegionDividerCurve, MapBorderCurve, type ToWorld } from './ChapterRegion';

const MAP_W = 20;
const MAP_D = 14;

// 最佳视角（一键复位目标）：正面朝向（azimuth 0）+ ~48° 俯视 + 居中 + 默认距离（≈22，完整框住整张地图）。
const HOME_POS = new THREE.Vector3(0, 16, 15);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);
// 平移范围：收紧到比地图半幅（±10/±7）更保守，确保地图主体始终留在视野内，避免拖远迷失。
const PAN_X = 5.5;
const PAN_Z = 3.5;

export type SceneProps = {
  layout: ForestLayout;
  litPointIds: Set<string>;
  onPickPoint: (pointId: string) => void;
  pointMeta: Record<string, { title: string; summary: string; chapterTitle: string }>;
  resetNonce: number;
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
          {/* R015: 云用不受光材质，始终明亮纯白（绘本风），避免背光面发灰；仍随雾融入地平线。 */}
          <meshBasicMaterial color="#ffffff" transparent opacity={0.96} />
        </mesh>
      ))}
    </group>
  );
}

// 一键「回到最佳视角」：resetNonce 每次自增即平滑把相机 + target 复位到 HOME（正面 + ~48° 俯视 + 居中 + 默认距离）。
// prefers-reduced-motion 时瞬时归位。初始挂载不触发（初始相机本就是最佳视角）。
function ViewController({
  resetNonce,
  controlsRef,
}: {
  resetNonce: number;
  controlsRef: React.RefObject<MapControlsImpl | null>;
}) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const firstRun = useRef(true);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      camera.position.copy(HOME_POS);
      controls.target.copy(HOME_TARGET);
      camera.lookAt(controls.target);
      controls.update();
      invalidate();
      return;
    }

    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    const start = performance.now();
    const dur = 480;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const k = ease(t);
      camera.position.lerpVectors(startPos, HOME_POS, k);
      controls.target.lerpVectors(startTarget, HOME_TARGET, k);
      camera.lookAt(controls.target);
      controls.update();
      invalidate();
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [resetNonce, camera, controlsRef, invalidate]);
  return null;
}

export default function ForestMapScene({ layout, litPointIds, onPickPoint, pointMeta, resetNonce }: SceneProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const controlsRef = useRef<MapControlsImpl>(null);

  // 平移夹紧（迭代3 需求3.2）：把 target 收紧到比半幅更保守的 ±PAN_X / ±PAN_Z，保证地图主体始终在视野内。
  // 用 MapControls 的 onChange（由控件 change 事件直接驱动，触发时 controlsRef 必已就绪）而非 useEffect+addEventListener，
  // 后者在挂载时 controlsRef.current 尚为 null、会 early-return 导致 listener 从未注册（原 ±10/±7 夹紧即因此长期失效）。
  // 关键：MapControls 平移时相机与 target 同步平移，故夹回 target 时必须把相机按同样的修正量一起平移，
  // 保持相机↔target 偏移不变——否则只夹 target 会让相机持续漂移、视线脱节，地图照样被拖出画面。
  const clampPan = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const t = controls.target;
    const cx = Math.max(-PAN_X, Math.min(PAN_X, t.x));
    const cz = Math.max(-PAN_Z, Math.min(PAN_Z, t.z));
    const dx = cx - t.x;
    const dz = cz - t.z;
    if (dx !== 0 || dz !== 0) {
      t.x = cx;
      t.z = cz;
      controls.object.position.x += dx;
      controls.object.position.z += dz;
    }
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
      // R015: flat = THREE.NoToneMapping。关闭 r3f 默认的 ACESFilmicToneMapping，
      // 让作者写入的十六进制颜色按原色还原（明亮通透绘本风），并消除跨机器因隐式
      // 色调映射叠加显示器/GPU 差异导致的「一台发暗发灰」不一致。色彩空间仍走 r3f 默认 sRGB。
      flat
      camera={{ position: [0, 16, 15], fov: 42 }}
      style={{ position: 'absolute', inset: 0 }}
      onPointerMissed={() => setHoverId(null)}
    >
      {/* 蓝天（纯色背景不受雾影响）+ 地平线（雾把远处绿地淡化成地平线霾，与天空蓝交接成地平线） */}
      <color attach="background" args={['#9fd3f2']} />
      <fog attach="fog" args={['#e3f0f7', 84, 264]} />
      {/* R015 迭代2「明快平照插画」打光：决定性提亮——大幅抬高半球光/环境光等补光把整体
          key 推上去、暗部不发沉；方向光收弱、只留一丝明暗面维持立体，避免地面大片硬阴影暗块。
          关闭色调映射(NoToneMapping)下补光为主、直射为辅，整体明亮均匀通透但不打成纯平。 */}
      <hemisphereLight args={['#f7fdff', '#eaf9d0', 0.95]} />
      <ambientLight intensity={0.62} />
      <directionalLight position={[8, 16, 6]} intensity={0.28} castShadow />

      {/* 白云（落在地平线略上方的天空带里） */}
      <CloudPuff position={[-36, 13, -88]} scale={6} />
      <CloudPuff position={[2, 16, -115]} scale={8} />
      <CloudPuff position={[34, 12, -96]} scale={6.5} />
      <CloudPuff position={[66, 11, -70]} scale={5} />
      <CloudPuff position={[-74, 14, -64]} scale={5.5} />

      {/* 地面（绿地铺到很远，远处被雾淡化形成地平线） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        {/* R015 迭代2：地面换更清新明快的草绿，摆脱灰橄榄感（儿童绘本/扫雷草地方向）。 */}
        <meshStandardMaterial color="#aee06a" roughness={1} />
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

      <ViewController resetNonce={resetNonce} controlsRef={controlsRef} />
      <MapControls
        ref={controlsRef}
        onChange={clampPan}
        // R015: 放开有限度旋转，给出视差让用户能转着看出是真 3D。
        // 极角夹在 18°~84°：既不会转到地面以下、也不会翻到头顶上方；
        // 方位角不设限（可绕一圈），平移仍由上面的 change 监听夹在地图范围内，
        // 三档俯仰按钮（CameraRig）保留可用。
        enableRotate
        rotateSpeed={0.7}
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
