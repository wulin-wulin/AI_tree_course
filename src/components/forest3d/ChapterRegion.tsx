import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import type { Region, Divider } from '../../data/forestLayout';

export type ToWorld = (x: number, z: number) => [number, number];

// 区域地块：用矩形四角在 XZ 平面建面，y 微抬避免 z-fighting。
export function ChapterRegionPatch({ region, toWorld }: { region: Region; toWorld: ToWorld }) {
  const geometry = useMemo(() => {
    const r = region.rect;
    const [x0, z0] = toWorld(r.x, r.z);
    const [x1, z1] = toWorld(r.x + r.w, r.z + r.d);
    const shape = new THREE.Shape();
    shape.moveTo(x0, z0);
    shape.lineTo(x1, z0);
    shape.lineTo(x1, z1);
    shape.lineTo(x0, z1);
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(Math.PI / 2); // XY shape → XZ 平面
    return geo;
  }, [region, toWorld]);

  // Fix 2: dispose GPU geometry on unmount to prevent WebGL buffer leaks
  useEffect(() => () => { geometry.dispose(); }, [geometry]);

  return (
    <mesh geometry={geometry} position={[0, 0.01, 0]} receiveShadow>
      <meshStandardMaterial color={region.soft} roughness={1} />
    </mesh>
  );
}

// 单条分界线：直线细带。直线保证相邻分界线在 T 形交叉点精确相接、不断开。
export function RegionDividerCurve({
  divider,
  toWorld,
}: {
  divider: Divider;
  toWorld: ToWorld;
  seed?: number;
}) {
  const geometry = useMemo(() => {
    const [ax, az] = divider.a;
    const [bx, bz] = divider.b;
    const [wax, waz] = toWorld(ax, az);
    const [wbx, wbz] = toWorld(bx, bz);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(wax, 0.03, waz),
      new THREE.Vector3(wbx, 0.03, wbz),
    ]);
    return new THREE.TubeGeometry(curve, 1, 0.07, 8, false);
  }, [divider, toWorld]);

  // Fix 2: dispose GPU geometry on unmount to prevent WebGL buffer leaks
  useEffect(() => () => { geometry.dispose(); }, [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#ffffff" roughness={0.6} transparent opacity={0.9} />
    </mesh>
  );
}

// 地图外边界：一条连续闭合的圆角矩形白线，包住整张地图。
export function MapBorderCurve({
  toWorld,
  radius = 0.07,
}: {
  toWorld: ToWorld;
  radius?: number;
}) {
  const geometry = useMemo(() => {
    const r = radius;
    const edgeN = 8;
    const cornerN = 8;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const seq: [number, number][] = [];
    const arc = (cx: number, cz: number, a0: number, a1: number) => {
      for (let i = 0; i <= cornerN; i++) {
        const a = lerp(a0, a1, i / cornerN);
        seq.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]);
      }
    };
    // 顺时针走一圈（归一化坐标，x 右 / z 下）
    for (let i = 0; i < edgeN; i++) seq.push([lerp(r, 1 - r, i / edgeN), 0]);
    arc(1 - r, r, -Math.PI / 2, 0); // 右上角
    for (let i = 0; i < edgeN; i++) seq.push([1, lerp(r, 1 - r, i / edgeN)]);
    arc(1 - r, 1 - r, 0, Math.PI / 2); // 右下角
    for (let i = 0; i < edgeN; i++) seq.push([lerp(1 - r, r, i / edgeN), 1]);
    arc(r, 1 - r, Math.PI / 2, Math.PI); // 左下角
    for (let i = 0; i < edgeN; i++) seq.push([0, lerp(1 - r, r, i / edgeN)]);
    arc(r, r, Math.PI, Math.PI * 1.5); // 左上角

    const raw = seq.map(([x, z]) => {
      const [wx, wz] = toWorld(x, z);
      return new THREE.Vector3(wx, 0.04, wz);
    });
    // 去掉相邻重复点，避免闭合曲线在角点产生伪影
    const pts: THREE.Vector3[] = [];
    for (const p of raw) {
      if (!pts.length || pts[pts.length - 1].distanceTo(p) > 1e-4) pts.push(p);
    }
    const curve = new THREE.CatmullRomCurve3(pts, true); // closed = true → 连续闭合
    return new THREE.TubeGeometry(curve, 320, 0.07, 8, true);
  }, [toWorld, radius]);

  useEffect(() => () => { geometry.dispose(); }, [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#ffffff" roughness={0.6} transparent opacity={0.9} />
    </mesh>
  );
}
