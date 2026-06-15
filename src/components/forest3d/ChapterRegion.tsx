import { useMemo } from 'react';
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

  return (
    <mesh geometry={geometry} position={[0, 0.01, 0]} receiveShadow>
      <meshStandardMaterial color={region.soft} roughness={1} />
    </mesh>
  );
}

// 单条分界线：把直线切分点沿法向加正弦抖动 → 曲线，再建一条略抬起的细带。
export function RegionDividerCurve({
  divider,
  toWorld,
  seed,
}: {
  divider: Divider;
  toWorld: ToWorld;
  seed: number;
}) {
  const points = useMemo(() => {
    const [ax, az] = divider.a;
    const [bx, bz] = divider.b;
    const segs = 24;
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len; // 法向
    const nz = dx / len;
    const amp = 0.018; // 归一化抖动幅度（< INSET，树不会越界）
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const wob = Math.sin(t * Math.PI * 3 + seed) * amp * Math.sin(t * Math.PI); // 端点收敛
      const lx = ax + dx * t + nx * wob;
      const lz = az + dz * t + nz * wob;
      const [wx, wz] = toWorld(lx, lz);
      pts.push(new THREE.Vector3(wx, 0.03, wz));
    }
    return pts;
  }, [divider, toWorld, seed]);

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.TubeGeometry(curve, 40, 0.06, 6, false);
  }, [points]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#ffffff" roughness={0.6} transparent opacity={0.85} />
    </mesh>
  );
}
