import * as THREE from 'three';
import { createTree, seedFromId } from './treeFactory';
import { clusterColorMap, type ForestIndex } from './forestData';

const CANVAS_W = 4000;
const CANVAS_H = 3000;

type Lod = 'high' | 'medium' | 'low';
type TreeMeta = { id: string; group: THREE.Group; baseScale: number; color: string };

export class ForestScene {
  private container: HTMLElement;
  private index: ForestIndex;
  private scene = new THREE.Scene();
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private trees: TreeMeta[] = [];
  private idByObject = new Map<number, string>();
  private lod: Lod = 'medium';
  private zoom = 0.4;
  private cx = CANVAS_W / 2;
  private cy = CANVAS_H / 2;
  private pickCb: (id: string | null) => void = () => {};
  private hoverCb: (id: string | null) => void = () => {};
  private raf = 0;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private moved = false;

  constructor(container: HTMLElement, index: ForestIndex) {
    this.container = container;
    this.index = index;

    const w = container.clientWidth || 800;
    const hgt = container.clientHeight || 600;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 8000);

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, hgt);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    container.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0x6677aa, 0.6));
    const sun = new THREE.DirectionalLight(0xfff6e0, 2.2);
    sun.position.set(800, -1200, 2000);
    this.scene.add(sun);

    this.buildTrees();
    this.updateProjection();
    this.bindEvents();
    this.loop();
  }

  private buildTrees() {
    const colors = clusterColorMap(this.index);
    for (const p of this.index.points) {
      const color = colors[p.clusterId] || '#6f9f5f';
      const wrap = new THREE.Group();
      wrap.rotation.x = -Math.PI / 2; // +Y 生长 → +Z
      wrap.position.set(p.pos[0], p.pos[1], 0);
      const meta: TreeMeta = { id: p.id, group: wrap, baseScale: p.scale || 1, color };
      wrap.add(createTree({ seed: seedFromId(p.id), scale: meta.baseScale * 120, color, lod: this.lod }));
      this.scene.add(wrap);
      this.trees.push(meta);
      wrap.traverse((o) => { if ((o as THREE.Mesh).isMesh) this.idByObject.set(o.id, p.id); });
    }
  }

  private rebuildLOD(next: Lod) {
    if (next === this.lod) return;
    this.lod = next;
    this.idByObject.clear();
    for (const t of this.trees) {
      t.group.clear();
      t.group.add(createTree({ seed: seedFromId(t.id), scale: t.baseScale * 120, color: t.color, lod: next }));
      t.group.traverse((o) => { if ((o as THREE.Mesh).isMesh) this.idByObject.set(o.id, t.id); });
    }
  }

  private updateProjection() {
    const w = this.container.clientWidth || 800;
    const hgt = this.container.clientHeight || 600;
    const halfW = w / (2 * this.zoom);
    const halfH = hgt / (2 * this.zoom);
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.position.set(this.cx, this.cy, 2000);
    this.camera.lookAt(this.cx, this.cy, 0);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, hgt);
    this.rebuildLOD(this.zoom >= 1.3 ? 'high' : this.zoom >= 0.45 ? 'medium' : 'low');
  }

  private bindEvents() {
    const el = this.renderer.domElement;
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      this.zoom = Math.min(4, Math.max(0.15, this.zoom * factor));
      this.updateProjection();
    }, { passive: false });
    el.addEventListener('pointerdown', (e) => {
      this.dragging = true; this.moved = false; this.lastX = e.clientX; this.lastY = e.clientY;
    });
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.dragging) { this.updateHover(e); return; }
    const dx = e.clientX - this.lastX;
    const dy = e.clientY - this.lastY;
    if (Math.abs(dx) + Math.abs(dy) > 3) this.moved = true;
    this.cx -= dx / this.zoom;
    this.cy += dy / this.zoom;
    this.lastX = e.clientX; this.lastY = e.clientY;
    this.updateProjection();
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.dragging && !this.moved) this.pickCb(this.pickAt(e));
    this.dragging = false;
  };

  private toPointer(e: { clientX: number; clientY: number }) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  private pickAt(e: { clientX: number; clientY: number }): string | null {
    this.toPointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    for (const h of hits) {
      const id = this.idByObject.get(h.object.id);
      if (id) return id;
    }
    return null;
  }

  private updateHover(e: { clientX: number; clientY: number }) {
    const id = this.pickAt(e);
    this.hoverCb(id);
    this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
  }

  onPick(cb: (id: string | null) => void) { this.pickCb = cb; }
  onHover(cb: (id: string | null) => void) { this.hoverCb = cb; }

  highlight(id: string | null) {
    for (const t of this.trees) t.group.scale.setScalar(t.id === id ? 1.35 : 1);
  }

  resize() { this.updateProjection(); }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
