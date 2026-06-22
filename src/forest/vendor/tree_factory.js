/**
 * 3D 树工厂 —— 简约几何抽象风格（五棱台树干 + 多面体树冠）。
 *
 * 约定:
 *   createTree({ seed, scale, domainColor, lod }) → THREE.Object3D
 *
 *   seed:        知识点 id 派生的数值种子（树形稳定可复现）
 *   scale:       ~12–40，由 importance × 20 计算
 *   domainColor: 所属板块的 HEX 颜色（用于树冠着色）
 *   lod:         "high" | "medium" | "low"（视缩放级别自动设置）
 */

import * as THREE from "three";

/* ── 基于 seed 的伪随机 ── */
function seededRandom(seed) {
    let s = seed;
    return function () {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

/* ── 颜色变体：略微调亮/调暗 ── */
function varyColor(hex, rand, amount = 0.12) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const d = (rand() - 0.5) * 2 * amount;
    const clamp = (v) => Math.min(255, Math.max(0, Math.round(v * (1 + d))));
    const hr = clamp(r).toString(16).padStart(2, "0");
    const hg = clamp(g).toString(16).padStart(2, "0");
    const hb = clamp(b).toString(16).padStart(2, "0");
    return `#${hr}${hg}${hb}`;
}

/**
 * 主入口
 */
export function createTree({ seed, scale, domainColor, lod }) {
    // scale 范围 ~12–40（来自 trees3d: importance * 20）
    // 地图 4000px ≈ 30000m，即 1 世界单位 ≈ 0.133px（zoom=1时）
    // 树高 ≈ scale 世界单位 ≈ 1.6–5.3px（zoom=1），放大时可看清楚
    const rand = seededRandom(seed);
    const h = scale;                      // 树总高（世界坐标）
    const canopyColor = varyColor(domainColor, rand, 0.1);
    const group = new THREE.Group();

    /* ── LOW LOD: 单锥 ── */
    if (lod === "low") {
        const coneH = h * 0.7;
        const coneR = h * 0.25;
        const coneGeo = new THREE.ConeGeometry(coneR, coneH, 4);
        const coneMat = new THREE.MeshStandardMaterial({ color: canopyColor, roughness: 0.5, flatShading: true });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.y = coneH / 2;
        cone.rotation.y = rand() * Math.PI;
        group.add(cone);

        const trunkH = h * 0.3;
        const trunkR = h * 0.06;
        const trunkGeo = new THREE.CylinderGeometry(trunkR * 0.6, trunkR, trunkH, 3);
        const trunk = new THREE.Mesh(trunkGeo, new THREE.MeshStandardMaterial({ color: "#5D4037", roughness: 0.7 }));
        trunk.position.y = trunkH / 2;
        group.add(trunk);

        group.rotation.y = rand() * Math.PI * 2;
        return group;
    }

    /* ── 树干：五棱台，细长 ── */
    const trunkH = h * 0.55;
    const trunkBottom = h * 0.05;
    const trunkTop = trunkBottom * 0.4;
    const trunkGeo = new THREE.CylinderGeometry(trunkTop, trunkBottom, trunkH, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: "#5D4037", roughness: 0.65 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkH / 2;
    group.add(trunk);

    /* ── 树冠 ── */
    const canopyBase = trunkH;

    // 下层：二十面体（大冠）
    const icoR = h * 0.34;
    const icoGeo = new THREE.IcosahedronGeometry(icoR, 0);
    const lowerColor = varyColor(canopyColor, rand, 0.08);
    const lower = new THREE.Mesh(
        icoGeo,
        new THREE.MeshStandardMaterial({ color: lowerColor, roughness: 0.5, flatShading: true })
    );
    lower.position.set(0, canopyBase + icoR * 0.7, 0);
    lower.rotation.set(rand() * 0.2, rand() * Math.PI * 2, rand() * 0.15);
    group.add(lower);

    if (lod === "high") {
        // 上层：十二面体（仅 high LOD）
        const dodR = h * 0.26;
        const dodGeo = new THREE.DodecahedronGeometry(dodR, 0);
        const upperColor = varyColor(canopyColor, rand, 0.12);
        const upper = new THREE.Mesh(
            dodGeo,
            new THREE.MeshStandardMaterial({ color: upperColor, roughness: 0.5, flatShading: true })
        );
        upper.position.set(0, canopyBase + icoR * 1.25, 0);
        upper.rotation.set(0.15 + rand() * 0.15, 0.3 + rand() * 0.4, 0.1 + rand() * 0.1);
        group.add(upper);
    }

    group.rotation.y = rand() * Math.PI * 2;
    return group;
}
