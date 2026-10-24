/**
 * PASEO GAME ZX - 3D Tactical Battle Royale Arena
 * Follows Three.js Skill Directives:
 * - Natural outdoor perimeter extending beyond play zone with horizon fog
 * - Composite 3–12 part tactical military structures (Bunkers, Watchtowers, Crates, Barriers)
 * - Safe Zone cylindrical energy shield with dynamic shader pulse
 * - Procedural ground textures (zero external 404 assets)
 * - Fast spatial collision bounds
 * Developer: ZUCCHERO XANN
 */

import * as THREE from 'three';
import { SafeZone } from '../shared/types.ts';

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  height: number;
}

export class Arena {
  public scene: THREE.Scene;
  public collisionBoxes: CollisionBox[] = [];
  public safeZoneMesh: THREE.Mesh;
  public safeZoneMaterial: THREE.MeshBasicMaterial;
  public terrainMesh: THREE.Mesh;

  // Arena bounds: 300 x 300 playable area
  public readonly ARENA_SIZE = 360;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // 1. Procedural Terrain with procedural canvas texture
    this.terrainMesh = this.buildTerrain();
    this.scene.add(this.terrainMesh);

    // 2. Tactical Military Compound Buildings & Structures
    this.buildTacticalCompound();

    // 3. Natural Perimeter Outcrops & Laser Defense Posts
    this.buildPerimeterBarriers();

    // 4. Shrinking Safe Zone Cylinder Mesh
    const zoneGeo = new THREE.CylinderGeometry(150, 150, 45, 64, 1, true);
    this.safeZoneMaterial = new THREE.MeshBasicMaterial({
      color: 0x06b6d4, // Cyan tactical energy wall
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
      wireframe: false,
    });
    this.safeZoneMesh = new THREE.Mesh(zoneGeo, this.safeZoneMaterial);
    this.safeZoneMesh.position.set(0, 22.5, 0);
    this.scene.add(this.safeZoneMesh);

    // Add safe zone border ring on ground
    const ringGeo = new THREE.RingGeometry(149.2, 150.8, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const zoneRing = new THREE.Mesh(ringGeo, ringMat);
    zoneRing.rotation.x = -Math.PI / 2;
    zoneRing.position.y = 0.08;
    this.safeZoneMesh.add(zoneRing);
  }

  // Create procedural ground with canvas texture
  private buildTerrain(): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base tactical terrain dirt / asphalt
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, 512, 512);

    // Grid lines for tactical measurement
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    const step = 32;
    for (let x = 0; x <= 512; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // High tech landing zone circles & markings
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(256, 256, 120, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PASEO SECTOR ZX-01', 256, 264);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    texture.colorSpace = THREE.SRGBColorSpace;

    // Slight undulating terrain elevation
    const geo = new THREE.PlaneGeometry(this.ARENA_SIZE * 1.5, this.ARENA_SIZE * 1.5, 48, 48);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      // Gentle perimeter hills
      const dist = Math.sqrt(vx * vx + vy * vy);
      if (dist > this.ARENA_SIZE * 0.42) {
        const hill = Math.sin(vx * 0.05) * Math.cos(vy * 0.05) * 6 + (dist - this.ARENA_SIZE * 0.42) * 0.15;
        pos.setZ(i, Math.max(0, hill));
      }
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.85,
      metalness: 0.2,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    return mesh;
  }

  // Build military bunkers, supply towers, and obstacle cover
  private buildTacticalCompound() {
    // 1. Central Command Bunker (x: 0, z: 0)
    this.createBunker(0, 0, 24, 18, 5.5, '#334155');

    // 2. North Armory Station (x: 0, z: -65)
    this.createBunker(0, -65, 20, 14, 4.8, '#1e293b');

    // 3. South Generator Complex (x: 0, z: 65)
    this.createBunker(0, 65, 22, 16, 5.0, '#1e293b');

    // 4. East Watchtower & Depot (x: 75, z: 10)
    this.createWatchtower(75, 10);
    this.createCrateCluster(65, 12, 5);

    // 5. West Communications Outpost (x: -75, z: -15)
    this.createWatchtower(-75, -15);
    this.createCrateCluster(-65, -12, 5);

    // 6. Scattered Tactical Concrete Barriers (for gunfight cover)
    const barrierPositions = [
      { x: -25, z: 20, rot: 0.4 },
      { x: 25, z: -20, rot: -0.3 },
      { x: -35, z: -40, rot: 1.2 },
      { x: 35, z: 40, rot: -0.8 },
      { x: -50, z: 50, rot: 0.1 },
      { x: 50, z: -50, rot: -0.5 },
      { x: 15, z: 35, rot: 1.57 },
      { x: -15, z: -35, rot: 0 },
    ];
    barrierPositions.forEach((bp) => this.createConcreteBarrier(bp.x, bp.z, bp.rot));

    // 7. Tactical Supply Crates across the map
    const crateLocations = [
      { x: 18, z: 12 },
      { x: -18, z: -14 },
      { x: 42, z: 28 },
      { x: -45, z: -30 },
      { x: -20, z: 60 },
      { x: 22, z: -62 },
      { x: 60, z: -45 },
      { x: -62, z: 45 },
    ];
    crateLocations.forEach((c) => this.createCrateCluster(c.x, c.z, 3));
  }

  // Composite 3–12 part Military Bunker
  private createBunker(cx: number, cz: number, w: number, d: number, h: number, colorHex: string) {
    const bunker = new THREE.Group();
    bunker.position.set(cx, 0, cz);

    const wallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.65,
      metalness: 0.45,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9, // Cyan tactical trim
      roughness: 0.3,
      metalness: 0.8,
    });
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.2,
      metalness: 0.9,
    });

    // Main reinforced block
    const mainGeo = new THREE.BoxGeometry(w, h, d);
    const mainMesh = new THREE.Mesh(mainGeo, wallMat);
    mainMesh.position.set(0, h / 2, 0);
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    bunker.add(mainMesh);

    // Roof parapet / armor cap
    const roofGeo = new THREE.BoxGeometry(w + 1.2, 0.6, d + 1.2);
    const roof = new THREE.Mesh(roofGeo, trimMat);
    roof.position.set(0, h + 0.3, 0);
    roof.castShadow = true;
    bunker.add(roof);

    // High-tech blast doors (front & back)
    const doorGeo = new THREE.BoxGeometry(3.5, 3.2, 0.4);
    const doorF = new THREE.Mesh(doorGeo, doorMat);
    doorF.position.set(0, 1.6, d / 2 + 0.2);
    bunker.add(doorF);

    const doorB = new THREE.Mesh(doorGeo, doorMat);
    doorB.position.set(0, 1.6, -d / 2 - 0.2);
    bunker.add(doorB);

    this.scene.add(bunker);

    // Register collision box
    this.collisionBoxes.push({
      minX: cx - w / 2 - 0.5,
      maxX: cx + w / 2 + 0.5,
      minZ: cz - d / 2 - 0.5,
      maxZ: cz + d / 2 + 0.5,
      height: h,
    });
  }

  // Composite 3–12 part Watchtower
  private createWatchtower(cx: number, cz: number) {
    const tower = new THREE.Group();
    tower.position.set(cx, 0, cz);

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.85,
    });
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.7,
    });

    // 4 Steel leg pillars
    const legGeo = new THREE.CylinderGeometry(0.2, 0.25, 9, 8);
    const legOffsets = [
      [-2, -2],
      [2, -2],
      [-2, 2],
      [2, 2],
    ];
    legOffsets.forEach(([ox, oz]) => {
      const leg = new THREE.Mesh(legGeo, steelMat);
      leg.position.set(ox, 4.5, oz);
      leg.castShadow = true;
      tower.add(leg);
    });

    // Observation Deck Platform
    const platGeo = new THREE.BoxGeometry(6, 0.5, 6);
    const plat = new THREE.Mesh(platGeo, platformMat);
    plat.position.set(0, 9, 0);
    plat.castShadow = true;
    tower.add(plat);

    // Guard Railing
    const railGeo = new THREE.BoxGeometry(5.8, 1.1, 0.15);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8 });
    const r1 = new THREE.Mesh(railGeo, railMat);
    r1.position.set(0, 9.8, 2.9);
    tower.add(r1);

    const r2 = new THREE.Mesh(railGeo, railMat);
    r2.position.set(0, 9.8, -2.9);
    tower.add(r2);

    // Tower Roof
    const roofGeo = new THREE.ConeGeometry(4.5, 1.8, 4);
    const roof = new THREE.Mesh(roofGeo, steelMat);
    roof.position.set(0, 12, 0);
    roof.rotation.y = Math.PI / 4;
    tower.add(roof);

    this.scene.add(tower);

    // Collision box for base footprint
    this.collisionBoxes.push({
      minX: cx - 2.5,
      maxX: cx + 2.5,
      minZ: cz - 2.5,
      maxZ: cz + 2.5,
      height: 9,
    });
  }

  // Tactical Concrete Road Barrier for fire cover
  private createConcreteBarrier(x: number, z: number, rotation: number) {
    const barrier = new THREE.Group();
    barrier.position.set(x, 0, z);
    barrier.rotation.y = rotation;

    const bMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.8,
      metalness: 0.1,
    });
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber hazard stripe
      roughness: 0.4,
      metalness: 0.3,
    });

    const bGeo = new THREE.BoxGeometry(4.2, 1.3, 0.8);
    const bMesh = new THREE.Mesh(bGeo, bMat);
    bMesh.position.set(0, 0.65, 0);
    bMesh.castShadow = true;
    barrier.add(bMesh);

    // Amber reflective stripe
    const sGeo = new THREE.BoxGeometry(4.0, 0.25, 0.84);
    const sMesh = new THREE.Mesh(sGeo, stripeMat);
    sMesh.position.set(0, 0.9, 0);
    barrier.add(sMesh);

    this.scene.add(barrier);

    this.collisionBoxes.push({
      minX: x - 2.2,
      maxX: x + 2.2,
      minZ: z - 2.2,
      maxZ: z + 2.2,
      height: 1.4,
    });
  }

  // Military Supply Crates
  private createCrateCluster(cx: number, cz: number, count: number = 3) {
    const crateMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1, // Deep tactical blue
      roughness: 0.4,
      metalness: 0.65,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.2,
      metalness: 0.9,
    });

    for (let i = 0; i < count; i++) {
      const crate = new THREE.Group();
      const ox = (i % 2) * 1.8 - 0.9;
      const oz = Math.floor(i / 2) * 1.8 - 0.9;
      crate.position.set(cx + ox, 0, cz + oz);

      const bodyGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
      const body = new THREE.Mesh(bodyGeo, crateMat);
      body.position.set(0, 0.7, 0);
      body.castShadow = true;
      crate.add(body);

      // Reinforcing steel frame
      const frameGeo = new THREE.BoxGeometry(1.46, 0.2, 1.46);
      const frame = new THREE.Mesh(frameGeo, rimMat);
      frame.position.set(0, 0.7, 0);
      crate.add(frame);

      this.scene.add(crate);

      this.collisionBoxes.push({
        minX: cx + ox - 0.8,
        maxX: cx + ox + 0.8,
        minZ: cz + oz - 0.8,
        maxZ: cz + oz + 0.8,
        height: 1.5,
      });
    }
  }

  // Natural Perimeter Rocks & Perimeter Posts
  private buildPerimeterBarriers() {
    const count = 28;
    const radius = this.ARENA_SIZE * 0.46;
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.15,
    });

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const px = Math.cos(angle) * radius;
      const pz = Math.sin(angle) * radius;

      // Large Perimeter Boulder
      const rockGeo = new THREE.DodecahedronGeometry(5.5 + Math.sin(i * 3) * 2, 1);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(px, 3.5, pz);
      rock.rotation.set(i * 0.4, i * 0.8, i * 0.2);
      rock.scale.set(1.4, 1.0, 1.2);
      rock.castShadow = true;
      this.scene.add(rock);

      this.collisionBoxes.push({
        minX: px - 4.5,
        maxX: px + 4.5,
        minZ: pz - 4.5,
        maxZ: pz + 4.5,
        height: 6,
      });
    }
  }

  // Update Safe Zone animation and scale based on server packet
  public updateSafeZone(zone: SafeZone, delta: number) {
    const targetScale = Math.max(0.01, zone.currentRadius / 150);
    this.safeZoneMesh.scale.set(targetScale, 1, targetScale);
    this.safeZoneMesh.position.x = zone.currentX;
    this.safeZoneMesh.position.z = zone.currentZ;

    // Pulse effect
    const pulse = Math.sin(Date.now() * 0.003) * 0.08 + 0.28;
    this.safeZoneMaterial.opacity = pulse;

    // If active shrinking, tint more toward amber/red
    if (zone.isShrinking) {
      this.safeZoneMaterial.color.setHex(0xf43f5e); // Warning crimson
    } else {
      this.safeZoneMaterial.color.setHex(0x06b6d4); // Cyan safe
    }
  }

  // Collision resolution against buildings and obstacles
  public checkAndResolveCollision(pos: THREE.Vector3, radius: number = 0.5): boolean {
    let collided = false;
    for (const box of this.collisionBoxes) {
      if (
        pos.x + radius > box.minX &&
        pos.x - radius < box.maxX &&
        pos.z + radius > box.minZ &&
        pos.z - radius < box.maxZ &&
        pos.y < box.height
      ) {
        collided = true;
        // Simple push-out along the minimum penetration axis
        const overlapX1 = pos.x + radius - box.minX;
        const overlapX2 = box.maxX - (pos.x - radius);
        const overlapZ1 = pos.z + radius - box.minZ;
        const overlapZ2 = box.maxZ - (pos.z - radius);

        const minOverlap = Math.min(overlapX1, overlapX2, overlapZ1, overlapZ2);
        if (minOverlap === overlapX1) pos.x = box.minX - radius;
        else if (minOverlap === overlapX2) pos.x = box.maxX + radius;
        else if (minOverlap === overlapZ1) pos.z = box.minZ - radius;
        else pos.z = box.maxZ + radius;
      }
    }

    // World edge clamp
    const maxBound = this.ARENA_SIZE * 0.48;
    if (pos.x > maxBound) {
      pos.x = maxBound;
      collided = true;
    }
    if (pos.x < -maxBound) {
      pos.x = -maxBound;
      collided = true;
    }
    if (pos.z > maxBound) {
      pos.z = maxBound;
      collided = true;
    }
    if (pos.z < -maxBound) {
      pos.z = -maxBound;
      collided = true;
    }

    return collided;
  }
}
