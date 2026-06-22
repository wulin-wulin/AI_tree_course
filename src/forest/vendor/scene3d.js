/**
 * 统一 3D 场景 —— 5 级预计算布局切换。
 * 替代运行时过滤，每个缩放级别有独立点位置。
 */

import * as THREE from "three";
import { createTree } from "./tree_factory.js";

const CANVAS_W = 4000, CANVAS_H = 3000;

export class Scene3D {
    constructor(container, layout, data) {
        this.container = container;
        this.layout = layout;
        this.data = data;

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setClearColor(0x0f0f23);
        this.renderer.domElement.style.cssText = "position:absolute;top:0;left:0;";
        container.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 10, 20000);
        this.camera.position.set(CANVAS_W / 2, CANVAS_H / 2 + 1500, 2000);
        this.camera.lookAt(CANVAS_W / 2, CANVAS_H / 2, 0);

        this.scene.add(new THREE.AmbientLight(0x404060, 0.5));
        const sun = new THREE.DirectionalLight(0xfff8e8, 2.0);
        sun.position.set(500, -500, 3000); this.scene.add(sun);
        const fill = new THREE.DirectionalLight(0x8899cc, 0.5);
        fill.position.set(3500, 3500, 1000); this.scene.add(fill);

        // 地图
        this.mapGroup = new THREE.Group(); this.scene.add(this.mapGroup);
        this._buildGround();
        this._buildDomains();

        // Category 索引
        this._catPolygons = [];
        for (const c of this.data.index.categories) {
            const lc = this.layout.categories.find(l => l.id === c.id);
            if (lc && lc.polygon) this._catPolygons.push({ id: c.id, poly: lc.polygon });
        }

        // 域标签（DOM overlay，必须在 _buildTrees 之前创建）
        this._labelLayer = document.createElement("div");
        this._labelLayer.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;";
        container.appendChild(this._labelLayer);
        this._labelEls = [];
        this._buildLabels();

        // 3D 树
        this.highGroup = new THREE.Group(); this.scene.add(this.highGroup);
        this.treeMeta = []; this._buildTrees();

        // Level sprites 层
        this._levelGroup = new THREE.Group(); this.scene.add(this._levelGroup);
        this._currentLevel = -1;

        // 高亮
        this.highlightGroup = new THREE.Group(); this.scene.add(this.highlightGroup);
        this.highlightGroup.visible = false;

        this._needsVisRefresh = true;
        this._setupControls();
    }

    /* ============ 地图 ============ */
    _buildGround() {
        const g = new THREE.Mesh(
            new THREE.PlaneGeometry(CANVAS_W, CANVAS_H),
            new THREE.MeshBasicMaterial({ color: 0x1a1a2e, side: THREE.DoubleSide })
        );
        g.position.set(CANVAS_W / 2, CANVAS_H / 2, -0.5);
        this.mapGroup.add(g);
    }

    _buildDomains() {
        for (const dom of this.layout.domains) {
            const pts = dom.polygon;
            if (pts.length < 3) continue;
            const shape = new THREE.Shape();
            shape.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
            shape.closePath();
            const geo = new THREE.ShapeGeometry(shape);
            const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: dom.color, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
            fill.position.z = 0; this.mapGroup.add(fill);
            const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: dom.color, transparent: true, opacity: 0.35 }));
            edge.position.z = 0.01; this.mapGroup.add(edge);
        }
    }

    _buildLabels() {
        for (const dom of this.layout.domains) {
            const d = this.data.domById[dom.id];
            if (!d) continue;
            const el = document.createElement("div");
            el.textContent = d.name_zh;
            el.style.cssText =
                `position:absolute;color:${dom.color};font-size:18px;font-weight:700;` +
                `font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;` +
                `text-align:center;transform:translate(-50%,-50%);white-space:nowrap;` +
                `text-shadow:0 0 12px rgba(0,0,0,0.6);pointer-events:none;`;
            this._labelLayer.appendChild(el);
            this._labelEls.push({ el, poly: dom.polygon });
        }
    }

    _updateLabelPositions() {
        this.camera.updateMatrixWorld();
        const rect = this.container.getBoundingClientRect();
        const v3 = new THREE.Vector3();
        // 域标签
        for (const lbl of this._labelEls) {
            let sx = 0, sy = 0;
            const n = lbl.poly.length;
            for (const pt of lbl.poly) {
                v3.set(pt[0], pt[1], 0);
                v3.project(this.camera);
                sx += (v3.x * 0.5 + 0.5) * rect.width;
                sy += (-v3.y * 0.5 + 0.5) * rect.height;
            }
            sx /= n; sy /= n;
            lbl.el.style.left = sx + "px";
            lbl.el.style.top = sy + "px";
            const off = sx < -200 || sx > rect.width + 200 || sy < -200 || sy > rect.height + 200;
            lbl.el.style.visibility = off ? "hidden" : "visible";
        }
        // 树标签（可见的才更新）
        for (const m of this.treeMeta) {
            if (!m.label || m.label.style.display === "none") continue;
            v3.set(m.pos[0], m.pos[1], 2);
            v3.project(this.camera);
            const sx = (v3.x * 0.5 + 0.5) * rect.width;
            const sy = (-v3.y * 0.5 + 0.5) * rect.height;
            m.label.style.left = sx + "px";
            m.label.style.top = (sy - 8) + "px";  // 树冠稍上方
        }
    }

    /* ============ 3D 树 ============ */
    _buildTrees() {
        const posMap = {};
        for (const pt of this.layout.points) posMap[pt.id] = pt;
        for (const kp of Object.values(this.data.kpById)) {
            const pt = posMap[kp.id]; if (!pt) continue;
            const imp = pt.scale || 1.0;
            const wx = pt.pos[0], wy = pt.pos[1];
            const cat = this.data.catById[kp.category_id];
            const domId = cat ? cat.domain_id : null;
            const color = domId ? (this.layout.domains.find(d => d.id === domId) || {}).color || "#888" : "#888";
            let seed = 0;
            for (let i = 0; i < kp.id.length; i++) seed = (seed * 31 + kp.id.charCodeAt(i)) & 0x7fffffff;
            const tree = createTree({ seed, scale: imp * 300, domainColor: color, lod: "high" });
            tree.rotation.x = Math.PI / 2;
            tree.position.set(wx, wy, 0);
            tree.userData = { type: "tree", id: kp.id };
            this.highGroup.add(tree);
            const short = kp.name_zh.length > 8 ? kp.name_zh.slice(0, 8) + "…" : kp.name_zh;
            const lbl = document.createElement("div");
            lbl.textContent = short;
            lbl.style.cssText = "position:absolute;color:#bbb;font-size:9px;text-align:center;transform:translate(-50%,-100%);white-space:nowrap;pointer-events:none;text-shadow:0 0 3px rgba(0,0,0,0.5);display:none;";
            this._labelLayer.appendChild(lbl);
            this.treeMeta.push({ id: kp.id, catId: kp.category_id, pos: [wx, wy], mesh: tree, seed, scale: imp, domainColor: color, importance: kp.importance || 0.5, label: lbl });
        }
    }

    /* ============ 相机控制 ============ */
    _setupControls() {
        this._state = { theta: -Math.PI / 2, r: 5000, target: { x: CANVAS_W / 2, y: CANVAS_H / 2 } };
        this._ROT = { thetaMin: -Math.PI / 2 - 0.3, thetaMax: -Math.PI / 2 + 0.3 };
        const el = this.container;

        el.addEventListener("mousedown", e => {
            if (e.target.closest(".facet-panel,input,button")) return;
            this._state.isDragging = true;
            this._state.ds = { x: e.clientX, y: e.clientY };
            this._state._dtx = this._state.target.x;
            this._state._dty = this._state.target.y;
            this._state._dth = this._state.theta;
            this._state._rot = (e.button === 2 || e.ctrlKey || e.metaKey);
        });
        el.addEventListener("contextmenu", e => e.preventDefault());

        window.addEventListener("mousemove", e => {
            if (!this._state.isDragging) return;
            const dx = e.clientX - this._state.ds.x, dy = e.clientY - this._state.ds.y;
            if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
            if (this._state._rot) {
                this._state.theta = Math.max(this._ROT.thetaMin, Math.min(this._ROT.thetaMax, this._state._dth - dx * 0.002));
            } else {
                const s = this._state.r / 1500;
                this._state.target.x = this._state._dtx - dx * s;
                this._state.target.y = this._state._dty + dy * s;
            }
            this._updateCamera();
        });

        window.addEventListener("mouseup", () => this._state.isDragging = false);

        el.addEventListener("wheel", e => {
            e.preventDefault();
            this._state.r *= (e.deltaY > 0 ? 1.04 : 0.96);
            this._state.r = Math.max(250, Math.min(12000, this._state.r));
            this._needsVisRefresh = true;
            this._updateCamera();
        }, { passive: false });

        this._updateCamera();
    }

    _updateCamera() {
        const s = this._state;
        s.phi = 0.7 + 0.5 * Math.min(1, s.r / 4000);
        const cx = s.target.x + s.r * Math.sin(s.phi) * Math.cos(s.theta);
        const cy = s.target.y + s.r * Math.sin(s.phi) * Math.sin(s.theta);
        const cz = s.r * Math.cos(s.phi);
        this.camera.position.set(cx, cy, cz);
        this.camera.lookAt(s.target.x, s.target.y, 0);

        // 树大小 = 视口宽度 × 5%
        const visW = s.r * 0.7;
        const sf = Math.max(0.02, Math.min(1.0, visW * 0.07 / 300));
        for (const m of this.treeMeta) if (m.mesh) m.mesh.scale.set(sf, sf, sf);

        // DOM 标签跟随相机投影
        this._updateLabelPositions();

        // 连续密度可见性（仅缩放时刷新，拖动不变）
        if (this._needsVisRefresh) {
            this._applyVisibility(s.r, sf);
            this._needsVisRefresh = false;
        }
    }

    _applyVisibility(r, sf) {
        const maxV = Math.max(12, Math.min(567, Math.floor(567 * (1 - r / 9000))));

        // 每 category 保底数 = 按该类别树量占比 × maxV
        const catPop = new Map();  // catId → total tree count
        for (const m of this.treeMeta) catPop.set(m.catId, (catPop.get(m.catId) || 0) + 1);
        const catQuota = new Map();
        for (const [cid, pop] of catPop)
            catQuota.set(cid, Math.max(1, Math.round(pop / 567 * maxV * 0.8)));
        const catTop = new Map();  // catId → [most important trees, up to quota]
        for (const m of this.treeMeta) {
            const arr = catTop.get(m.catId) || [];
            arr.push(m);
            arr.sort((a, b) => b.importance - a.importance);
            catTop.set(m.catId, arr.slice(0, catQuota.get(m.catId) || 1));
        }

        // 按 importance 降序取候选
        const sorted = [...this.treeMeta].sort((a, b) => b.importance - a.importance);
        const candidates = new Set();
        for (const arr of catTop.values()) for (const m of arr) candidates.add(m.id);
        for (const m of sorted) {
            if (candidates.size >= maxV) break;
            candidates.add(m.id);
        }

        // 屏幕间距过滤（树宽 ≈ 0.05 × 屏宽，间距 = 树宽 × 1.5）
        const rect = this.container.getBoundingClientRect();
        const minDist = rect.width * 0.03;
        const v3 = new THREE.Vector3();
        const inOrder = sorted.filter(m => candidates.has(m.id));
        const visible = new Set();
        for (const m of inOrder) {
            v3.set(m.pos[0], m.pos[1], 0);
            v3.project(this.camera);
            const sx = (v3.x * 0.5 + 0.5) * rect.width;
            const sy = (-v3.y * 0.5 + 0.5) * rect.height;
            let far = true;
            for (const vid of visible) {
                const v = inOrder.find(x => x.id === vid);
                if (!v) continue;
                v3.set(v.pos[0], v.pos[1], 0);
                v3.project(this.camera);
                const vx = (v3.x * 0.5 + 0.5) * rect.width;
                const vy = (-v3.y * 0.5 + 0.5) * rect.height;
                if (Math.hypot(sx - vx, sy - vy) < minDist) { far = false; break; }
            }
            if (far) visible.add(m.id);
        }

        this.highGroup.visible = true;
        for (const m of this.treeMeta) {
            const show = visible.has(m.id);
            m.mesh.visible = show;
            if (m.label) m.label.style.display = show ? "" : "none";
        }
        // 立即更新标签位置
        this._updateLabelPositions();
    }

    _colorForPt(pt) {
        if (pt.domId) return (this.layout.domains.find(d => d.id === pt.domId) || {}).color || "#888";
        if (pt.catId) return (this.layout.categories.find(c => c.id === pt.catId) || {}).color || "#888";
        const kp = this.data.kpById[pt.id];
        if (kp) {
            const cat = this.data.catById[kp.category_id];
            if (cat) {
                const d = this.layout.domains.find(x => x.id === cat.domain_id);
                if (d) return d.color;
            }
        }
        return "#888";
    }

    _findCatAt(wx, wy) {
        for (const cp of this._catPolygons) {
            let ok = false;
            const p = cp.poly;
            for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
                if ((p[i][1] > wy) !== (p[j][1] > wy) && wx < (p[j][0] - p[i][0]) * (wy - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) ok = !ok;
            }
            if (ok) return cp.id;
        }
        return null;
    }

    /* ============ 公共接口 ============ */
    render() { this.renderer.render(this.scene, this.camera); }
    resize(w, h) {
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this._updateLabelPositions();
    }

    raycast(sx, sy) {
        this.camera.updateMatrixWorld(); // camera 可能在事件间被 _updateCamera 移动过
        this.highGroup.updateMatrixWorld(); // 树 position/scale 在 _switchLevel / _updateCamera 中被改过
        const rect = this.container.getBoundingClientRect();
        const mx = ((sx - rect.left) / rect.width) * 2 - 1;
        const my = -((sy - rect.top) / rect.height) * 2 + 1;
        const rc = new THREE.Raycaster();
        rc.setFromCamera(new THREE.Vector2(mx, my), this.camera);
        // 先检测 3D 树
        const treeHits = rc.intersectObjects([this.highGroup], true);
        if (treeHits.length > 0) {
            let obj = treeHits[0].object;
            while (obj) { if (obj.userData && obj.userData.type === "tree") return obj.userData.id; obj = obj.parent; }
        }
        // 再检测 level sprites（L3/L4，Sprite 不支持射线，用屏幕距离替代）
        const lv = this.layout.levels[this._currentLevel];
        if (lv && this._currentLevel >= 3) {
            const crx = sx - rect.left, cry = sy - rect.top;
            // 动态阈值：与 _switchLevel 中的 sprite 屏幕尺寸匹配
            const screenH = rect.height || 700;
            const pxPerRad = screenH / (35 * Math.PI / 180);
            const screenPx = Math.max(30, 40 * this._state.r / pxPerRad);
            let best = null, bestD = screenPx;
            const v3 = new THREE.Vector3();
            for (const pt of lv.points) {
                v3.set(pt.pos[0], pt.pos[1], 0);
                v3.project(this.camera);
                const pxx = (v3.x * 0.5 + 0.5) * rect.width;
                const pxy = (-v3.y * 0.5 + 0.5) * rect.height;
                const d = Math.hypot(pxx - crx, pxy - cry);
                if (d < bestD) { bestD = d; best = pt; }
            }
            if (best) {
                // L3 点是 category ID，L4 点是 domain ID — 需转为 KP ID
                if (this._currentLevel === 3) {
                    const kps = this.data.kpsByCat[best.id];
                    if (kps && kps.length > 0) return kps[0].id;
                }
                if (this._currentLevel === 4) {
                    const kps = this.data.kpsByDom[best.id];
                    if (kps && kps.length > 0) return kps[0].id;
                }
                return best.id;
            }
        }
        return null;
    }

    flyTo(kpId) {
        const meta = this.treeMeta.find(m => m.id === kpId);
        if (meta) {
            let tx, ty;
            if (this._currentLevel >= 3) {
                const lv = this.layout.levels[this._currentLevel];
                let lpt = null;
                if (lv) {
                    const kp = this.data.kpById[kpId];
                    const catId = kp ? kp.category_id : null;
                    const cat = catId ? this.data.catById[catId] : null;
                    const domId = cat ? cat.domain_id : null;
                    if (this._currentLevel === 3 && catId) {
                        lpt = lv.points.find(p => p.catId === catId);
                    } else if (this._currentLevel === 4 && domId) {
                        lpt = lv.points.find(p => p.domId === domId);
                    }
                }
                tx = lpt ? lpt.pos[0] : meta.mesh.position.x;
                ty = lpt ? lpt.pos[1] : meta.mesh.position.y;
            } else {
                tx = meta.mesh.position.x;
                ty = meta.mesh.position.y;
            }
            this._state.target.x = tx;
            this._state.target.y = ty;
            this._state.r = 800;
            this._needsVisRefresh = true;
            this._updateCamera();
            return;
        }
        const cr = this.layout.categories.find(c => c.id === kpId);
        if (cr && cr.label_pos) { this._state.target.x = cr.label_pos[0]; this._state.target.y = cr.label_pos[1]; this._state.r = 2500; this._needsVisRefresh = true; this._updateCamera(); }
    }

    highlightTree(kpId) {
        this._clearGroup(this.highlightGroup);
        const m = this.treeMeta.find(t => t.id === kpId);
        if (!m) return;
        let hx, hy;
        if (this._currentLevel >= 3) {
            const lv = this.layout.levels[this._currentLevel];
            let lpt = null;
            if (lv) {
                const kp = this.data.kpById[kpId];
                const catId = kp ? kp.category_id : null;
                const cat = catId ? this.data.catById[catId] : null;
                const domId = cat ? cat.domain_id : null;
                if (this._currentLevel === 3 && catId) {
                    lpt = lv.points.find(p => p.catId === catId);
                } else if (this._currentLevel === 4 && domId) {
                    lpt = lv.points.find(p => p.domId === domId);
                }
            }
            hx = lpt ? lpt.pos[0] : m.mesh.position.x;
            hy = lpt ? lpt.pos[1] : m.mesh.position.y;
        } else {
            hx = m.mesh.position.x;
            hy = m.mesh.position.y;
        }
        const sf = Math.max(0.02, Math.min(1.0, this._state.r * 0.7 * 0.05 / 300));
        const hl = createTree({ seed: m.seed, scale: m.scale * 300 * sf * 1.15, domainColor: m.domainColor, lod: "high" });
        hl.rotation.x = Math.PI / 2; hl.position.set(hx, hy, 0);
        hl.traverse(c => { if (c.isMesh && c.material.emissive) { c.material.emissive.set(m.domainColor); c.material.emissiveIntensity = 0.4; } });
        this.highlightGroup.add(hl); this.highlightGroup.visible = true;
    }

    unhighlightAll() { this._clearGroup(this.highlightGroup); this.highlightGroup.visible = false; }
    resetView() { this._state.theta = -Math.PI / 2; this._state.r = 5000; this._needsVisRefresh = true; this._updateCamera(); }

    _clearGroup(g) { while (g.children.length > 0) g.remove(g.children[0]); }
}
