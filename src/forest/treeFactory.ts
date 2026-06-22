import * as THREE from 'three';

export function seedFromId(id: string): number {
  let s = 0;
  for (let i = 0; i < id.length; i += 1) s = (s * 31 + id.charCodeAt(i)) & 0x7fffffff;
  return s || 1;
}

function seededRandom(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function varyColor(hex: string, rand: () => number, amount = 0.1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const d = (rand() - 0.5) * 2 * amount;
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v * (1 + d))));
  const h = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function createTree(opts: { seed: number; scale: number; color: string; lod: 'high' | 'medium' | 'low' }): THREE.Group {
  const { seed, scale: h, color, lod } = opts;
  const rand = seededRandom(seed);
  const canopyColor = varyColor(color, rand, 0.1);
  const group = new THREE.Group();

  if (lod === 'low') {
    const coneH = h * 0.7;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(h * 0.25, coneH, 4),
      new THREE.MeshStandardMaterial({ color: canopyColor, roughness: 0.5, flatShading: true }),
    );
    cone.position.y = coneH / 2;
    cone.rotation.y = rand() * Math.PI;
    group.add(cone);
    const trunkH = h * 0.3;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(h * 0.036, h * 0.06, trunkH, 3),
      new THREE.MeshStandardMaterial({ color: '#5D4037', roughness: 0.7 }),
    );
    trunk.position.y = trunkH / 2;
    group.add(trunk);
    group.rotation.y = rand() * Math.PI * 2;
    return group;
  }

  const trunkH = h * 0.55;
  const trunkBottom = h * 0.05;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(trunkBottom * 0.4, trunkBottom, trunkH, 5),
    new THREE.MeshStandardMaterial({ color: '#5D4037', roughness: 0.65 }),
  );
  trunk.position.y = trunkH / 2;
  group.add(trunk);

  const icoR = h * 0.34;
  const lower = new THREE.Mesh(
    new THREE.IcosahedronGeometry(icoR, 0),
    new THREE.MeshStandardMaterial({ color: varyColor(canopyColor, rand, 0.08), roughness: 0.5, flatShading: true }),
  );
  lower.position.set(0, trunkH + icoR * 0.7, 0);
  lower.rotation.set(rand() * 0.2, rand() * Math.PI * 2, rand() * 0.15);
  group.add(lower);

  if (lod === 'high') {
    const dodR = h * 0.26;
    const upper = new THREE.Mesh(
      new THREE.DodecahedronGeometry(dodR, 0),
      new THREE.MeshStandardMaterial({ color: varyColor(canopyColor, rand, 0.12), roughness: 0.5, flatShading: true }),
    );
    upper.position.set(0, trunkH + icoR * 1.25, 0);
    upper.rotation.set(0.15 + rand() * 0.15, 0.3 + rand() * 0.4, 0.1 + rand() * 0.1);
    group.add(upper);
  }

  group.rotation.y = rand() * Math.PI * 2;
  return group;
}
