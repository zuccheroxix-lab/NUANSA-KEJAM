/**
 * PASEO GAME ZX - Procedural 3D Operator Model & Kinematics
 * Follows Three.js Skill Directives:
 * - 3–12 Part composite procedural model (THREE.Group)
 * - Varied roughness & metalness, grounded bottom-center pivot
 * - Running, jumping, aiming, and firing recoil animations
 * Developer: ZUCCHERO XANN
 */

import * as THREE from 'three';

export interface CharacterAnimState {
  isMoving: boolean;
  isRunning: boolean;
  isJumping: boolean;
  isFiring: boolean;
  speed: number;
}

export class CharacterModel {
  public root: THREE.Group;
  public headGroup: THREE.Group;
  public torsoGroup: THREE.Group;
  public leftArmGroup: THREE.Group;
  public rightArmGroup: THREE.Group;
  public leftLegGroup: THREE.Group;
  public rightLegGroup: THREE.Group;
  public weaponMesh: THREE.Group;
  public visorMesh: THREE.Mesh;
  public nameplateMesh?: THREE.Sprite;

  private walkCycleTime: number = 0;
  private recoilTimer: number = 0;
  private isLocalPlayer: boolean = false;

  constructor(primaryColorHex: string = '#0ea5e9', isLocal: boolean = false) {
    this.isLocalPlayer = isLocal;
    this.root = new THREE.Group();
    this.root.name = 'CharacterModel';

    const primaryColor = new THREE.Color(primaryColorHex);
    const armorDarkColor = new THREE.Color('#1e293b'); // Dark slate tactical armor
    const jointColor = new THREE.Color('#0f172a'); // Matte rubber/carbon joint
    const visorGlowColor = new THREE.Color('#38bdf8'); // Cyan glowing visor
    const metallicAccent = new THREE.Color('#475569');

    // Materials with PBR properties
    const armorMat = new THREE.MeshStandardMaterial({
      color: armorDarkColor,
      roughness: 0.45,
      metalness: 0.55,
    });

    const highlightMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      roughness: 0.35,
      metalness: 0.7,
    });

    const jointMat = new THREE.MeshStandardMaterial({
      color: jointColor,
      roughness: 0.85,
      metalness: 0.15,
    });

    const visorMat = new THREE.MeshStandardMaterial({
      color: visorGlowColor,
      roughness: 0.1,
      metalness: 0.9,
      emissive: visorGlowColor,
      emissiveIntensity: 0.8,
    });

    const metalMat = new THREE.MeshStandardMaterial({
      color: metallicAccent,
      roughness: 0.3,
      metalness: 0.8,
    });

    // 1. Pelvis & Torso (Pivot at center of hips: y = 0.9)
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.set(0, 0.9, 0);
    this.root.add(this.torsoGroup);

    // Pelvis
    const pelvisGeo = new THREE.BoxGeometry(0.38, 0.22, 0.26);
    const pelvis = new THREE.Mesh(pelvisGeo, jointMat);
    pelvis.position.set(0, 0, 0);
    pelvis.castShadow = true;
    this.torsoGroup.add(pelvis);

    // Chest / Body Armor (Trapezoidal armor look)
    const chestGeo = new THREE.BoxGeometry(0.48, 0.48, 0.32);
    const chest = new THREE.Mesh(chestGeo, armorMat);
    chest.position.set(0, 0.32, 0);
    chest.castShadow = true;
    this.torsoGroup.add(chest);

    // Tactical Chest Plate / Core Reactor (Accent detail)
    const chestPlateGeo = new THREE.BoxGeometry(0.32, 0.28, 0.08);
    const chestPlate = new THREE.Mesh(chestPlateGeo, highlightMat);
    chestPlate.position.set(0, 0.35, 0.14);
    chestPlate.castShadow = true;
    this.torsoGroup.add(chestPlate);

    // Tactical Backpack / Jetpack
    const packGeo = new THREE.BoxGeometry(0.34, 0.4, 0.16);
    const backpack = new THREE.Mesh(packGeo, metalMat);
    backpack.position.set(0, 0.35, -0.2);
    backpack.castShadow = true;
    this.torsoGroup.add(backpack);

    // 2. Head & Helmet (y = 0.65 from torso center)
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.65, 0);
    this.torsoGroup.add(this.headGroup);

    // Helmet
    const helmetGeo = new THREE.BoxGeometry(0.28, 0.3, 0.3);
    const helmet = new THREE.Mesh(helmetGeo, armorMat);
    helmet.castShadow = true;
    this.headGroup.add(helmet);

    // Glowing Visor
    const visorGeo = new THREE.BoxGeometry(0.24, 0.08, 0.06);
    this.visorMesh = new THREE.Mesh(visorGeo, visorMat);
    this.visorMesh.position.set(0, 0.02, 0.14);
    this.headGroup.add(this.visorMesh);

    // Helmet Ear Comms / Antennas
    const earGeo = new THREE.BoxGeometry(0.06, 0.12, 0.08);
    const earL = new THREE.Mesh(earGeo, highlightMat);
    earL.position.set(-0.16, 0.02, 0);
    const earR = new THREE.Mesh(earGeo, highlightMat);
    earR.position.set(0.16, 0.02, 0);
    this.headGroup.add(earL);
    this.headGroup.add(earR);

    // 3. Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.32, 0.5, 0);
    this.torsoGroup.add(this.leftArmGroup);

    const shoulderGeo = new THREE.BoxGeometry(0.14, 0.14, 0.16);
    const shoulderL = new THREE.Mesh(shoulderGeo, highlightMat);
    shoulderL.castShadow = true;
    this.leftArmGroup.add(shoulderL);

    const armGeo = new THREE.BoxGeometry(0.12, 0.45, 0.12);
    const armL = new THREE.Mesh(armGeo, jointMat);
    armL.position.set(0, -0.24, 0);
    armL.castShadow = true;
    this.leftArmGroup.add(armL);

    // 4. Right Arm & Weapon
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.32, 0.5, 0);
    this.torsoGroup.add(this.rightArmGroup);

    const shoulderR = new THREE.Mesh(shoulderGeo, highlightMat);
    shoulderR.castShadow = true;
    this.rightArmGroup.add(shoulderR);

    const armR = new THREE.Mesh(armGeo, jointMat);
    armR.position.set(0, -0.24, 0);
    armR.castShadow = true;
    this.rightArmGroup.add(armR);

    // Tactical Weapon Model held in right hand
    this.weaponMesh = this.buildWeaponMesh();
    this.weaponMesh.position.set(-0.08, -0.36, 0.28);
    this.weaponMesh.rotation.set(0, 0, 0);
    this.rightArmGroup.add(this.weaponMesh);

    // 5. Left Leg (Pivots at hip: y = -0.05 from torso center)
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.13, -0.05, 0);
    this.torsoGroup.add(this.leftLegGroup);

    const legUpperGeo = new THREE.BoxGeometry(0.15, 0.42, 0.16);
    const legUpperL = new THREE.Mesh(legUpperGeo, armorMat);
    legUpperL.position.set(0, -0.2, 0);
    legUpperL.castShadow = true;
    this.leftLegGroup.add(legUpperL);

    const bootGeo = new THREE.BoxGeometry(0.16, 0.38, 0.22);
    const bootL = new THREE.Mesh(bootGeo, metalMat);
    bootL.position.set(0, -0.55, 0.02);
    bootL.castShadow = true;
    this.leftLegGroup.add(bootL);

    // 6. Right Leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.13, -0.05, 0);
    this.torsoGroup.add(this.rightLegGroup);

    const legUpperR = new THREE.Mesh(legUpperGeo, armorMat);
    legUpperR.position.set(0, -0.2, 0);
    legUpperR.castShadow = true;
    this.rightLegGroup.add(legUpperR);

    const bootR = new THREE.Mesh(bootGeo, metalMat);
    bootR.position.set(0, -0.55, 0.02);
    bootR.castShadow = true;
    this.rightLegGroup.add(bootR);

    // Soft Contact Shadow Plane directly beneath character
    const shadowGeo = new THREE.PlaneGeometry(1.2, 1.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.02;
    this.root.add(shadowMesh);
  }

  // Composite 3D weapon model
  private buildWeaponMesh(): THREE.Group {
    const gun = new THREE.Group();

    const metalGunMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
    });
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.1,
      roughness: 0.8,
    });
    const barrelGlowMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.6,
    });

    // Receiver body
    const bodyGeo = new THREE.BoxGeometry(0.08, 0.12, 0.45);
    const body = new THREE.Mesh(bodyGeo, metalGunMat);
    body.castShadow = true;
    gun.add(body);

    // Long barrel
    const barrelGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 8);
    const barrel = new THREE.Mesh(barrelGeo, metalGunMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, 0.38);
    barrel.castShadow = true;
    gun.add(barrel);

    // Energy rail / emitter glow
    const railGeo = new THREE.BoxGeometry(0.04, 0.03, 0.35);
    const rail = new THREE.Mesh(railGeo, barrelGlowMat);
    rail.position.set(0, 0.08, 0.25);
    gun.add(rail);

    // Grip & Magazine
    const gripGeo = new THREE.BoxGeometry(0.06, 0.16, 0.09);
    const grip = new THREE.Mesh(gripGeo, gripMat);
    grip.position.set(0, -0.1, -0.05);
    grip.rotation.x = -0.2;
    gun.add(grip);

    const magGeo = new THREE.BoxGeometry(0.05, 0.14, 0.07);
    const mag = new THREE.Mesh(magGeo, metalGunMat);
    mag.position.set(0, -0.12, 0.1);
    gun.add(mag);

    return gun;
  }

  // Update animation kinematic cycle based on movement speed & actions
  public updateAnimation(delta: number, anim: CharacterAnimState) {
    // Firing recoil decay
    if (this.recoilTimer > 0) {
      this.recoilTimer -= delta * 8;
      if (this.recoilTimer < 0) this.recoilTimer = 0;
    }

    if (anim.isFiring) {
      this.recoilTimer = 1.0;
    }

    const recoilAngle = this.recoilTimer * 0.18;
    this.rightArmGroup.rotation.x = -Math.PI / 3 - recoilAngle;
    this.leftArmGroup.rotation.x = -Math.PI / 3.4;
    this.leftArmGroup.rotation.y = 0.35;

    if (anim.isJumping) {
      // Jumping pose: legs tucked slightly
      this.leftLegGroup.rotation.x = -0.4;
      this.rightLegGroup.rotation.x = 0.2;
      this.torsoGroup.position.y = 0.95;
      return;
    }

    if (anim.isMoving) {
      const frequency = anim.isRunning ? 14 : 9;
      this.walkCycleTime += delta * frequency;

      const legSwing = Math.sin(this.walkCycleTime) * (anim.isRunning ? 0.75 : 0.45);
      this.leftLegGroup.rotation.x = legSwing;
      this.rightLegGroup.rotation.x = -legSwing;

      // Slight torso bobbing
      this.torsoGroup.position.y = 0.9 + Math.abs(Math.sin(this.walkCycleTime * 2)) * 0.04;
    } else {
      // Idle breathing
      this.walkCycleTime += delta * 2;
      const breath = Math.sin(this.walkCycleTime) * 0.015;
      this.torsoGroup.position.y = 0.9 + breath;

      // Smoothly reset limbs
      this.leftLegGroup.rotation.x = THREE.MathUtils.damp(this.leftLegGroup.rotation.x, 0, 10, delta);
      this.rightLegGroup.rotation.x = THREE.MathUtils.damp(this.rightLegGroup.rotation.x, 0, 10, delta);
    }
  }

  // Set weapon color / accent
  public setWeaponAccent(colorHex: string) {
    const col = new THREE.Color(colorHex);
    this.weaponMesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if ((child.material as THREE.MeshStandardMaterial).emissive) {
          (child.material as THREE.MeshStandardMaterial).color = col;
          (child.material as THREE.MeshStandardMaterial).emissive = col;
        }
      }
    });
  }

  // Set health visual status (flash red on damage)
  public flashDamage() {
    this.visorMesh.material = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    setTimeout(() => {
      this.visorMesh.material = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.1,
        metalness: 0.9,
        emissive: 0x38bdf8,
        emissiveIntensity: 0.8,
      });
    }, 150);
  }
}
