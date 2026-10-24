/**
 * PASEO GAME ZX - 3D Three.js Battle Royale Engine
 * Follows Three.js Skill Directives:
 * - Studio PBR lighting with RoomEnvironment & PCFSoftShadowMap
 * - Zero GC in animation loop (pre-allocated reusable vectors)
 * - Safe software WebGL fallback
 * - Character interpolation and authoritative reconciliation
 * Developer: ZUCCHERO XANN
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Arena } from './Arena.ts';
import { CharacterModel } from './CharacterModel.ts';
import { Controls } from './Controls.ts';
import { WeaponEffects } from './WeaponEffects.ts';
import { SoundFX } from './SoundFX.ts';
import { NetworkClient } from './NetworkClient.ts';
import { Player, ServerGameStatePacket, SafeZone, LootItem, WeaponItem } from '../shared/types.ts';

// Reusable math vectors to avoid GC in animation loop
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _screenCenter = new THREE.Vector2(0, 0);
const _raycaster = new THREE.Raycaster();

export interface GameWorldCallbacks {
  onHealthUpdate?: (health: number, shield: number) => void;
  onWeaponUpdate?: (weapon: WeaponItem, inventory: WeaponItem[]) => void;
  onLootPrompt?: (loot: LootItem | null) => void;
  onDamageFlash?: () => void;
  onHitConfirmed?: (isHeadshot: boolean) => void;
  onMatchStatsUpdate?: (aliveCount: number, kills: number, damage: number) => void;
  onSafeZoneUpdate?: (zone: SafeZone, isOutside: boolean) => void;
}

export class GameWorld {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public arena: Arena;
  public controls: Controls;
  public effects: WeaponEffects;
  public network: NetworkClient;
  public callbacks: GameWorldCallbacks;

  // Local player state
  public localPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocityY: number = 0;
  public isGrounded: boolean = true;
  public localPlayerModel: CharacterModel;
  public localPlayerState: Player | null = null;
  public nearbyLoot: LootItem | null = null;

  // Remote and bot player models in 3D scene
  public remoteModels: Map<string, CharacterModel> = new Map();
  public targetPositions: Map<string, { x: number; y: number; z: number; rotY: number }> = new Map();

  private isRunning: boolean = false;
  private animFrameId: number = 0;
  private lastTime: number = 0;
  private isSoftwareGl: boolean = false;
  private graphicsQuality: 'low' | 'medium' | 'high' = 'high';

  // Shoot rate limiting client-side
  private lastClientShotTime: number = 0;

  constructor(
    container: HTMLElement,
    network: NetworkClient,
    callbacks: GameWorldCallbacks = {},
    quality: 'low' | 'medium' | 'high' = 'high'
  ) {
    this.container = container;
    this.network = network;
    this.callbacks = callbacks;
    this.graphicsQuality = quality;

    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Initialize Three.js WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl && quality !== 'low',
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1.5));
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && quality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Setup Scene, Camera & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#090d16');
    this.scene.fog = new THREE.FogExp2('#090d16', 0.007);

    this.camera = new THREE.PerspectiveCamera(
      65,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.1,
      600
    );

    // 4. Studio Environment & Lighting
    this.setupLighting();

    // 5. Arena & Structures
    this.arena = new Arena(this.scene);

    // 6. Controls
    this.controls = new Controls(this.camera, this.renderer.domElement);

    // 7. Weapon FX & Loot Visualizer
    this.effects = new WeaponEffects(this.scene);

    // 8. Local Character Model
    this.localPlayerModel = new CharacterModel('#06b6d4', true);
    this.scene.add(this.localPlayerModel.root);

    // Resize listener
    window.addEventListener('resize', this.onResize);

    // Start render loop
    this.isRunning = true;
    this.lastTime = performance.now();
    this.tick();
  }

  private setupLighting() {
    // RoomEnvironment reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Hemisphere Light (Cool sky / warm ground contrast)
    const hemiLight = new THREE.HemisphereLight('#38bdf8', '#1e293b', 0.7);
    this.scene.add(hemiLight);

    // Directional Key Sun Light
    const dirLight = new THREE.DirectionalLight('#ffffff', 1.4);
    dirLight.position.set(60, 90, 45);
    dirLight.castShadow = !this.isSoftwareGl && this.graphicsQuality === 'high';
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 250;
    dirLight.shadow.camera.left = -90;
    dirLight.shadow.camera.right = 90;
    dirLight.shadow.camera.top = 90;
    dirLight.shadow.camera.bottom = -90;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.normalBias = 0.02;
    this.scene.add(dirLight);

    // Ambient fill
    const ambientLight = new THREE.AmbientLight('#1e293b', 0.6);
    this.scene.add(ambientLight);
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  public setQuality(quality: 'low' | 'medium' | 'high') {
    this.graphicsQuality = quality;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && quality === 'high';
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1.2));
  }

  // Handle incoming authoritative game state packet from server
  public handleServerState(packet: ServerGameStatePacket) {
    const myId = this.network.playerId;
    const serverPlayer = myId ? packet.players[myId] : null;

    if (serverPlayer) {
      this.localPlayerState = serverPlayer;

      // Update HUD callbacks
      this.callbacks.onHealthUpdate?.(serverPlayer.health, serverPlayer.shield);

      const activeWep =
        serverPlayer.inventory.find((w) => w.id === serverPlayer.currentWeaponId) || serverPlayer.inventory[0];
      if (activeWep) {
        this.callbacks.onWeaponUpdate?.(activeWep, serverPlayer.inventory);
        this.localPlayerModel.setWeaponAccent(activeWep.color);
      }

      this.callbacks.onMatchStatsUpdate?.(
        packet.matchState.aliveCount,
        serverPlayer.kills,
        serverPlayer.damageDealt
      );
    }

    // Process recent damage events
    if (packet.recentDamageEvents && packet.recentDamageEvents.length > 0) {
      packet.recentDamageEvents.forEach((ev) => {
        if (ev.attackerId === myId) {
          // Local player scored a hit!
          SoundFX.playHitConfirm(ev.isHeadshot);
          this.callbacks.onHitConfirmed?.(ev.isHeadshot);
        }
        if (ev.victimId === myId) {
          // Local player took damage!
          SoundFX.playEliminated();
          this.callbacks.onDamageFlash?.();
          this.localPlayerModel.flashDamage();
        } else {
          // Remote player hit visual flash
          const remote = this.remoteModels.get(ev.victimId);
          if (remote) remote.flashDamage();
        }
      });
    }

    // Safe Zone updates & warnings
    this.arena.updateSafeZone(packet.safeZone, 0.05);

    const distToCenter = Math.sqrt(
      Math.pow(this.localPosition.x - packet.safeZone.currentX, 2) +
      Math.pow(this.localPosition.z - packet.safeZone.currentZ, 2)
    );
    const isOutside = distToCenter > packet.safeZone.currentRadius;
    this.callbacks.onSafeZoneUpdate?.(packet.safeZone, isOutside);

    // Sync 3D Loot Items on ground
    this.effects.syncLootItems(packet.loot);

    // Check closest loot for interactive pickup prompt
    let nearestLoot: LootItem | null = null;
    let nearestDist = 4.0;
    for (const loot of packet.loot) {
      if (loot.pickedUp) continue;
      const d = Math.sqrt(
        Math.pow(this.localPosition.x - loot.x, 2) + Math.pow(this.localPosition.z - loot.z, 2)
      );
      if (d < nearestDist) {
        nearestDist = d;
        nearestLoot = loot;
      }
    }
    this.nearbyLoot = nearestLoot;
    this.callbacks.onLootPrompt?.(nearestLoot);

    // Update remote players and bots in 3D world
    const existingRemoteIds = new Set(this.remoteModels.keys());

    for (const [id, player] of Object.entries(packet.players)) {
      if (id === myId) continue;

      if (!player.isAlive) {
        // Player eliminated: remove from scene
        if (this.remoteModels.has(id)) {
          const model = this.remoteModels.get(id)!;
          this.scene.remove(model.root);
          this.remoteModels.delete(id);
          this.targetPositions.delete(id);
        }
        continue;
      }

      existingRemoteIds.delete(id);

      let remote = this.remoteModels.get(id);
      if (!remote) {
        remote = new CharacterModel(player.color || (player.isBot ? '#f43f5e' : '#38bdf8'), false);
        remote.root.position.set(player.x, player.y, player.z);
        this.scene.add(remote.root);
        this.remoteModels.set(id, remote);
      }

      // Store target position for smooth interpolation
      this.targetPositions.set(id, {
        x: player.x,
        y: player.y,
        z: player.z,
        rotY: player.rotationY,
      });

      // Update remote animation state
      remote.updateAnimation(0.05, {
        isMoving: player.state === 'running',
        isRunning: player.state === 'running',
        isJumping: player.state === 'jumping',
        isFiring: player.state === 'firing',
        speed: 5.0,
      });
    }

    // Cleanup disconnected players
    for (const staleId of existingRemoteIds) {
      const model = this.remoteModels.get(staleId);
      if (model) {
        this.scene.remove(model.root);
        this.remoteModels.delete(staleId);
        this.targetPositions.delete(staleId);
      }
    }
  }

  // Animation frame loop
  private tick = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // 1. Process Local Movement & Physics
    this.updateLocalPhysics(delta);

    // 2. Process Shooting & Actions
    this.processPlayerActions(now);

    // 3. Smoothly Interpolate Remote Players
    this.interpolateRemotePlayers(delta);

    // 4. Update Particle & Tracer FX
    this.effects.update(delta);

    // 5. Update Camera following character
    this.controls.updateCamera(this.localPosition, this.controls.input.aim);

    // 6. Send input packet to server (rate limited to ~30Hz)
    this.sendNetworkInput();

    // 7. Render Three.js Scene
    this.renderer.render(this.scene, this.camera);

    this.animFrameId = requestAnimationFrame(this.tick);
  };

  // Local movement physics: velocity, gravity, jumping, collision
  private updateLocalPhysics(delta: number) {
    if (this.localPlayerState && !this.localPlayerState.isAlive) {
      return; // Eliminated
    }

    const moveVector = this.controls.getMovementVector();
    const isMoving = moveVector.lengthSq() > 0.01;
    const speed = this.controls.input.sprint ? 9.0 : 6.0;

    // Apply horizontal velocity
    this.localPosition.x += moveVector.x * speed * delta;
    this.localPosition.z += moveVector.z * speed * delta;

    // Jump handling
    if (this.controls.input.jump && this.isGrounded) {
      this.velocityY = 6.8;
      this.isGrounded = false;
      this.controls.input.jump = false;
      SoundFX.playJump();
    }

    // Gravity
    if (!this.isGrounded) {
      this.velocityY -= 18.0 * delta;
      this.localPosition.y += this.velocityY * delta;

      if (this.localPosition.y <= 0) {
        this.localPosition.y = 0;
        this.velocityY = 0;
        this.isGrounded = true;
      }
    }

    // Resolve collision against bunkers, crates, barriers
    this.arena.checkAndResolveCollision(this.localPosition, 0.45);

    // Position local character mesh
    this.localPlayerModel.root.position.copy(this.localPosition);
    // Face movement direction or camera yaw
    this.localPlayerModel.root.rotation.y = this.controls.yaw;

    // Update local kinematics
    this.localPlayerModel.updateAnimation(delta, {
      isMoving,
      isRunning: this.controls.input.sprint && isMoving,
      isJumping: !this.isGrounded,
      isFiring: this.controls.input.fire,
      speed,
    });
  }

  // Handle shooting and interactive actions
  private processPlayerActions(now: number) {
    // 1. Weapon Slot Switch
    if (this.controls.input.switchSlot !== null) {
      this.network.sendSwitchWeapon(this.controls.input.switchSlot);
      this.controls.input.switchSlot = null;
    }

    // 2. Reload
    if (this.controls.input.reload) {
      this.controls.input.reload = false;
      this.network.sendReload();
      SoundFX.playReload();
    }

    // 3. Loot Pickup
    if (this.controls.input.interact) {
      this.controls.input.interact = false;
      if (this.nearbyLoot) {
        this.network.sendLootPickup(this.nearbyLoot.id);
        SoundFX.playPickup();
      }
    }

    // 4. Weapon Firing
    if (this.controls.input.fire && this.localPlayerState && this.localPlayerState.isAlive) {
      const activeWep =
        this.localPlayerState.inventory.find((w) => w.id === this.localPlayerState?.currentWeaponId) ||
        this.localPlayerState.inventory[0];

      if (activeWep && activeWep.ammo > 0 && !this.localPlayerState.isReloading) {
        if (now - this.lastClientShotTime >= activeWep.fireRate) {
          this.lastClientShotTime = now;
          this.executeShot(activeWep);
        }
      }
    }
  }

  // Fire weapon: Raycast crosshair to detect target hit, spawn tracer and muzzle flash
  private executeShot(weapon: WeaponItem) {
    SoundFX.playGunshot(weapon.type);

    // Muzzle position from right hand / gun tip
    _vec3A.set(0.2, 1.2, 0.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.controls.yaw).add(this.localPosition);
    this.effects.createMuzzleFlash(_vec3A, weapon.color);

    // Raycast from camera center into world
    _raycaster.setFromCamera(_screenCenter, this.camera);

    // Gather candidate meshes for hit detection
    const targetMeshes: THREE.Object3D[] = [];
    const meshToPlayerId = new Map<THREE.Object3D, string>();

    for (const [id, remote] of this.remoteModels.entries()) {
      remote.root.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          targetMeshes.push(child);
          meshToPlayerId.set(child, id);
        }
      });
    }

    const intersects = _raycaster.intersectObjects(targetMeshes, false);
    let hitPlayerId: string | undefined;
    let isHeadshot = false;
    let hitPoint: THREE.Vector3;

    if (intersects.length > 0) {
      const hit = intersects[0];
      hitPoint = hit.point;
      hitPlayerId = meshToPlayerId.get(hit.object);

      // Check if hit object was head / helmet
      if (hit.object.parent === this.remoteModels.get(hitPlayerId || '')?.headGroup) {
        isHeadshot = true;
      }

      this.effects.createImpactSparks(hitPoint, 10, isHeadshot ? '#ef4444' : '#f59e0b');
    } else {
      // Ray into distance
      hitPoint = _raycaster.ray.origin.clone().add(_raycaster.ray.direction.clone().multiplyScalar(weapon.range));
    }

    this.effects.createBulletTracer(_vec3A, hitPoint, weapon.color);

    // Send authoritative shoot request to server
    this.network.sendShoot({
      seq: Date.now(),
      weaponId: weapon.id,
      origin: { x: _vec3A.x, y: _vec3A.y, z: _vec3A.z },
      direction: {
        x: _raycaster.ray.direction.x,
        y: _raycaster.ray.direction.y,
        z: _raycaster.ray.direction.z,
      },
      targetPlayerId: hitPlayerId,
      isHeadshot,
      distance: hitPlayerId ? _vec3A.distanceTo(hitPoint) : undefined,
    });
  }

  // Smoothly interpolate remote player positions
  private interpolateRemotePlayers(delta: number) {
    for (const [id, target] of this.targetPositions.entries()) {
      const model = this.remoteModels.get(id);
      if (!model) continue;

      model.root.position.x = THREE.MathUtils.damp(model.root.position.x, target.x, 15, delta);
      model.root.position.y = THREE.MathUtils.damp(model.root.position.y, target.y, 15, delta);
      model.root.position.z = THREE.MathUtils.damp(model.root.position.z, target.z, 15, delta);

      // Interpolate rotation
      model.root.rotation.y = THREE.MathUtils.damp(model.root.rotation.y, target.rotY, 12, delta);
    }
  }

  // Send player input packet to server
  private sendNetworkInput() {
    if (!this.network.isConnected) return;

    this.network.sendInput({
      seq: Date.now(),
      x: this.localPosition.x,
      y: this.localPosition.y,
      z: this.localPosition.z,
      rotationY: this.controls.yaw,
      pitch: this.controls.pitch,
      state: this.controls.getPlayerState(this.isGrounded, this.controls.getMovementVector().lengthSq() > 0.01),
    });
  }

  // Cleanup resources when unmounting
  public dispose() {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    this.controls.detachEvents();
    this.effects.cleanup();

    this.remoteModels.forEach((m) => this.scene.remove(m.root));
    this.remoteModels.clear();

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
