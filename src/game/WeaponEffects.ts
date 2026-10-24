/**
 * PASEO GAME ZX - 3D Weapon FX, Tracers, Muzzle Flashes & Loot Visuals
 * Zero-404 Asset Directive: Procedural geometry & materials
 * Developer: ZUCCHERO XANN
 */

import * as THREE from 'three';
import { LootItem } from '../shared/types.ts';

interface ActiveTracer {
  line: THREE.Line;
  birth: number;
  lifetime: number;
}

interface ActiveSpark {
  points: THREE.Points;
  velocities: THREE.Vector3[];
  birth: number;
  lifetime: number;
}

export class WeaponEffects {
  public scene: THREE.Scene;
  private activeTracers: ActiveTracer[] = [];
  private activeSparks: ActiveSpark[] = [];
  private lootMeshMap: Map<string, THREE.Group> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // Spawn visual projectile tracer ray
  public createBulletTracer(from: THREE.Vector3, to: THREE.Vector3, colorHex: string = '#38bdf8') {
    const points = [from.clone(), to.clone()];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(colorHex),
      transparent: true,
      opacity: 0.9,
      linewidth: 2,
    });
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);

    this.activeTracers.push({
      line,
      birth: performance.now(),
      lifetime: 90, // ms
    });
  }

  // Spawn muzzle flash at weapon tip
  public createMuzzleFlash(position: THREE.Vector3, colorHex: string = '#f59e0b') {
    const geo = new THREE.SphereGeometry(0.18, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colorHex),
      transparent: true,
      opacity: 0.95,
    });
    const flash = new THREE.Mesh(geo, mat);
    flash.position.copy(position);
    this.scene.add(flash);

    setTimeout(() => {
      this.scene.remove(flash);
      geo.dispose();
      mat.dispose();
    }, 60);
  }

  // Impact sparks on hit
  public createImpactSparks(position: THREE.Vector3, count: number = 8, colorHex: string = '#facc15') {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions.push(position.x, position.y, position.z);
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          Math.random() * 4 + 1,
          (Math.random() - 0.5) * 5
        )
      );
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(colorHex),
      size: 0.12,
      transparent: true,
      opacity: 0.9,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);

    this.activeSparks.push({
      points,
      velocities,
      birth: performance.now(),
      lifetime: 300,
    });
  }

  // Sync 3D Loot Items on ground
  public syncLootItems(lootList: LootItem[]) {
    const currentIds = new Set(lootList.map((l) => l.id));

    // Remove old or picked-up loot
    for (const [id, group] of this.lootMeshMap.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(group);
        this.lootMeshMap.delete(id);
      }
    }

    // Add or update loot items
    lootList.forEach((loot) => {
      if (loot.pickedUp) {
        if (this.lootMeshMap.has(loot.id)) {
          const g = this.lootMeshMap.get(loot.id)!;
          this.scene.remove(g);
          this.lootMeshMap.delete(loot.id);
        }
        return;
      }

      let group = this.lootMeshMap.get(loot.id);
      if (!group) {
        group = this.buildLootVisual(loot);
        group.position.set(loot.x, 0.4, loot.z);
        this.scene.add(group);
        this.lootMeshMap.set(loot.id, group);
      } else {
        // Floating animation & rotation
        group.rotation.y += 0.025;
        group.position.y = 0.4 + Math.sin(performance.now() * 0.004 + loot.x) * 0.12;
      }
    });
  }

  // Build composite procedural 3D model for loot crate / drop
  private buildLootVisual(loot: LootItem): THREE.Group {
    const group = new THREE.Group();
    const color = new THREE.Color(loot.color || '#38bdf8');

    // Holographic Base Ring
    const ringGeo = new THREE.RingGeometry(0.5, 0.65, 16);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.38;
    group.add(ring);

    // Glowing Diamond Core
    const coreGeo = new THREE.OctahedronGeometry(0.35, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Light beam column
    const beamGeo = new THREE.CylinderGeometry(0.08, 0.2, 3.5, 8, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 1.4;
    group.add(beam);

    return group;
  }

  // Per-frame tick for fading tracers and moving sparks
  public update(delta: number) {
    const now = performance.now();

    // 1. Tracers
    for (let i = this.activeTracers.length - 1; i >= 0; i--) {
      const tr = this.activeTracers[i];
      const age = now - tr.birth;
      if (age >= tr.lifetime) {
        this.scene.remove(tr.line);
        tr.line.geometry.dispose();
        (tr.line.material as THREE.Material).dispose();
        this.activeTracers.splice(i, 1);
      } else {
        const mat = tr.line.material as THREE.LineBasicMaterial;
        mat.opacity = 1 - age / tr.lifetime;
      }
    }

    // 2. Sparks
    for (let i = this.activeSparks.length - 1; i >= 0; i--) {
      const sp = this.activeSparks[i];
      const age = now - sp.birth;
      if (age >= sp.lifetime) {
        this.scene.remove(sp.points);
        sp.points.geometry.dispose();
        (sp.points.material as THREE.Material).dispose();
        this.activeSparks.splice(i, 1);
      } else {
        const posAttr = sp.points.geometry.getAttribute('position') as THREE.BufferAttribute;
        const positions = posAttr.array as Float32Array;

        for (let j = 0; j < sp.velocities.length; j++) {
          const v = sp.velocities[j];
          positions[j * 3 + 0] += v.x * delta;
          positions[j * 3 + 1] += v.y * delta;
          positions[j * 3 + 2] += v.z * delta;
          v.y -= 9.8 * delta; // Gravity
        }
        posAttr.needsUpdate = true;
        (sp.points.material as THREE.PointsMaterial).opacity = 1 - age / sp.lifetime;
      }
    }
  }

  public cleanup() {
    this.activeTracers.forEach((t) => {
      this.scene.remove(t.line);
      t.line.geometry.dispose();
      (t.line.material as THREE.Material).dispose();
    });
    this.activeTracers = [];

    this.activeSparks.forEach((s) => {
      this.scene.remove(s.points);
      s.points.geometry.dispose();
      (s.points.material as THREE.Material).dispose();
    });
    this.activeSparks = [];

    this.lootMeshMap.forEach((g) => this.scene.remove(g));
    this.lootMeshMap.clear();
  }
}
