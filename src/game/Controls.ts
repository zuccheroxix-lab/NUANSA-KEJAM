/**
 * PASEO GAME ZX - Unified Input & Third-Person Camera Controller
 * Supports:
 * - PC Keyboard & Mouse (PointerLock, WASD, Space, R, E, 1-4)
 * - Mobile Touch (Dual touch: Virtual joystick + touch drag aim + on-screen action buttons)
 * - Responsive landscape layout with touch-action isolation
 * Developer: ZUCCHERO XANN
 */

import * as THREE from 'three';
import { PlayerState } from '../shared/types.ts';

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  fire: boolean;
  aim: boolean;
  reload: boolean;
  interact: boolean;
  switchSlot: number | null;
}

export class Controls {
  public camera: THREE.PerspectiveCamera;
  public domElement: HTMLElement;

  // Camera orientation angles (Euler angles)
  public yaw: number = 0; // Horizontal rotation
  public pitch: number = 0.15; // Vertical tilt (radians)
  public cameraDistance: number = 3.6;
  public cameraHeight: number = 1.6;
  public cameraShoulderOffset: number = 0.55;

  // Current raw input state
  public input: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
    fire: false,
    aim: false,
    reload: false,
    interact: false,
    switchSlot: null,
  };

  // Virtual Joystick state for Mobile
  public joystickVector: { x: number; y: number } = { x: 0, y: 0 };
  public isJoystickActive: boolean = false;

  // Touch tracking for look control
  private touchLookId: number | null = null;
  private touchLookLastX: number = 0;
  private touchLookLastY: number = 0;

  // Pointer lock state for PC
  public isPointerLocked: boolean = false;
  public mouseSensitivity: number = 0.0022;
  public touchSensitivity: number = 0.0045;

  // Bound event listeners for safe cleanup
  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;
  private onMouseMoveBound: (e: MouseEvent) => void;
  private onMouseDownBound: (e: MouseEvent) => void;
  private onMouseUpBound: (e: MouseEvent) => void;
  private onPointerLockChangeBound: () => void;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.onKeyDownBound = this.onKeyDown.bind(this);
    this.onKeyUpBound = this.onKeyUp.bind(this);
    this.onMouseMoveBound = this.onMouseMove.bind(this);
    this.onMouseDownBound = this.onMouseDown.bind(this);
    this.onMouseUpBound = this.onMouseUp.bind(this);
    this.onPointerLockChangeBound = this.onPointerLockChange.bind(this);

    this.attachEvents();
  }

  public attachEvents() {
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
    window.addEventListener('mousemove', this.onMouseMoveBound);
    window.addEventListener('mousedown', this.onMouseDownBound);
    window.addEventListener('mouseup', this.onMouseUpBound);
    document.addEventListener('pointerlockchange', this.onPointerLockChangeBound);
  }

  public detachEvents() {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    window.removeEventListener('mousemove', this.onMouseMoveBound);
    window.removeEventListener('mousedown', this.onMouseDownBound);
    window.removeEventListener('mouseup', this.onMouseUpBound);
    document.removeEventListener('pointerlockchange', this.onPointerLockChangeBound);
  }

  public requestPointerLock() {
    if (!this.isPointerLocked && this.domElement.requestPointerLock) {
      this.domElement.requestPointerLock().catch(() => {});
    }
  }

  public exitPointerLock() {
    if (this.isPointerLocked && document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  private onPointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.domElement;
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isPointerLocked) return;

    this.yaw -= e.movementX * this.mouseSensitivity;
    this.pitch -= e.movementY * this.mouseSensitivity;

    // Pitch clamping between -75 deg and +75 deg
    const maxPitch = 1.3;
    const minPitch = -1.2;
    this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));
  }

  private onMouseDown(e: MouseEvent) {
    if (!this.isPointerLocked) return;
    if (e.button === 0) {
      this.input.fire = true;
    } else if (e.button === 2) {
      this.input.aim = true;
    }
  }

  private onMouseUp(e: MouseEvent) {
    if (e.button === 0) {
      this.input.fire = false;
    } else if (e.button === 2) {
      this.input.aim = false;
    }
  }

  private onKeyDown(e: KeyboardEvent) {
    // Ignore input if user is typing into an input field or modal
    if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
      return;
    }

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.sprint = true;
        break;
      case 'Space':
        this.input.jump = true;
        e.preventDefault();
        break;
      case 'KeyR':
        this.input.reload = true;
        break;
      case 'KeyE':
        this.input.interact = true;
        break;
      case 'Digit1':
        this.input.switchSlot = 0;
        break;
      case 'Digit2':
        this.input.switchSlot = 1;
        break;
      case 'Digit3':
        this.input.switchSlot = 2;
        break;
      case 'Digit4':
        this.input.switchSlot = 3;
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.input.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.input.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.input.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.input.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.input.sprint = false;
        break;
      case 'Space':
        this.input.jump = false;
        break;
      case 'KeyR':
        this.input.reload = false;
        break;
      case 'KeyE':
        this.input.interact = false;
        break;
    }
  }

  // --- Mobile Touch Look Handling ---
  public handleTouchLookStart(id: number, clientX: number, clientY: number) {
    this.touchLookId = id;
    this.touchLookLastX = clientX;
    this.touchLookLastY = clientY;
  }

  public handleTouchLookMove(id: number, clientX: number, clientY: number) {
    if (this.touchLookId === id) {
      const dx = clientX - this.touchLookLastX;
      const dy = clientY - this.touchLookLastY;

      this.yaw -= dx * this.touchSensitivity;
      this.pitch -= dy * this.touchSensitivity;

      const maxPitch = 1.3;
      const minPitch = -1.2;
      this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));

      this.touchLookLastX = clientX;
      this.touchLookLastY = clientY;
    }
  }

  public handleTouchLookEnd(id: number) {
    if (this.touchLookId === id) {
      this.touchLookId = null;
    }
  }

  // Update third-person camera position following player
  public updateCamera(playerPos: THREE.Vector3, isAiming: boolean = false) {
    const targetDist = isAiming ? 2.0 : this.cameraDistance;
    const targetHeight = isAiming ? 1.4 : this.cameraHeight;
    const shoulderOffset = isAiming ? 0.45 : this.cameraShoulderOffset;

    // Calculate camera position in spherical coordinates relative to character
    const cosPitch = Math.cos(this.pitch);
    const sinPitch = Math.sin(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    // Camera offset behind player
    const camX = playerPos.x + sinYaw * cosPitch * targetDist + cosYaw * shoulderOffset;
    const camY = playerPos.y + targetHeight + sinPitch * targetDist;
    const camZ = playerPos.z + cosYaw * cosPitch * targetDist - sinYaw * shoulderOffset;

    this.camera.position.set(camX, Math.max(0.5, camY), camZ);

    // Aim target point slightly in front of character
    const lookAtTarget = new THREE.Vector3(
      playerPos.x - sinYaw * 10,
      playerPos.y + targetHeight - sinPitch * 10,
      playerPos.z - cosYaw * 10
    );

    this.camera.lookAt(lookAtTarget);
  }

  // Calculate movement direction vector relative to camera yaw
  public getMovementVector(): THREE.Vector3 {
    let moveX = 0;
    let moveZ = 0;

    // Mobile joystick takes priority if active
    if (this.isJoystickActive && (this.joystickVector.x !== 0 || this.joystickVector.y !== 0)) {
      moveX = this.joystickVector.x;
      moveZ = -this.joystickVector.y;
    } else {
      if (this.input.forward) moveZ -= 1;
      if (this.input.backward) moveZ += 1;
      if (this.input.left) moveX -= 1;
      if (this.input.right) moveX += 1;
    }

    const moveVector = new THREE.Vector3(moveX, 0, moveZ);
    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      // Rotate movement vector by camera yaw
      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    }

    return moveVector;
  }

  public getPlayerState(isGrounded: boolean, isMoving: boolean): PlayerState {
    if (!isGrounded) return 'jumping';
    if (this.input.fire) return 'firing';
    if (isMoving) return 'running';
    return 'idle';
  }
}
