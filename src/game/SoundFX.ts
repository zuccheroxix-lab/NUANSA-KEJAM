/**
 * PASEO GAME ZX - Procedural Web Audio API Sound Synthesizer
 * Zero-404 Asset Directive: All game SFX are 100% procedurally synthesized in code.
 * Developer: ZUCCHERO XANN
 */

class SoundFXManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  private createNoiseBuffer(duration: number = 0.5): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Gunshot by weapon type
  public playGunshot(type: 'rifle' | 'shotgun' | 'sniper' | 'smg' = 'rifle') {
    if (this.isMuted || this.volume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume, t);
    masterGain.connect(this.ctx.destination);

    if (type === 'rifle') {
      // Punchy tactical assault rifle
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      oscGain.gain.setValueAtTime(0.6, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.15);

      const noiseBuf = this.createNoiseBuffer(0.12);
      if (noiseBuf) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.frequency.linearRampToValueAtTime(200, t + 0.12);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start(t);
        noise.stop(t + 0.13);
      }
    } else if (type === 'shotgun') {
      // Heavy boom
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.35);
      oscGain.gain.setValueAtTime(0.9, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.4);

      const noiseBuf = this.createNoiseBuffer(0.3);
      if (noiseBuf) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        noise.connect(noiseGain);
        noiseGain.connect(masterGain);
        noise.start(t);
        noise.stop(t + 0.3);
      }
    } else if (type === 'sniper') {
      // Railgun energy discharge
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.45);
      oscGain.gain.setValueAtTime(0.8, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.55);

      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(85, t);
      subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
      subGain.gain.setValueAtTime(0.9, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(t);
      subOsc.stop(t + 0.45);
    } else {
      // Rapid SMG snap
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(360, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);
      oscGain.gain.setValueAtTime(0.4, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  // Hit sound (Tactical crosshair hit confirm)
  public playHitConfirm(isHeadshot: boolean = false) {
    if (this.isMuted || this.volume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isHeadshot ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isHeadshot ? 1200 : 800, t);
    osc.frequency.setValueAtTime(isHeadshot ? 1600 : 1000, t + 0.04);
    gain.gain.setValueAtTime(0.4 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Reload sound (clicks and latch)
  public playReload() {
    if (this.isMuted || this.volume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Click 1 (mag drop)
    const o1 = this.ctx.createOscillator();
    const g1 = this.ctx.createGain();
    o1.type = 'triangle';
    o1.frequency.setValueAtTime(320, t);
    o1.frequency.exponentialRampToValueAtTime(80, t + 0.08);
    g1.gain.setValueAtTime(0.3 * this.volume, t);
    g1.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o1.connect(g1);
    g1.connect(this.ctx.destination);
    o1.start(t);
    o1.stop(t + 0.09);

    // Click 2 (mag in)
    const o2 = this.ctx.createOscillator();
    const g2 = this.ctx.createGain();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(500, t + 0.45);
    o2.frequency.exponentialRampToValueAtTime(220, t + 0.52);
    g2.gain.setValueAtTime(0.35 * this.volume, t + 0.45);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.53);
    o2.connect(g2);
    g2.connect(this.ctx.destination);
    o2.start(t + 0.45);
    o2.stop(t + 0.54);

    // Click 3 (bolt rack)
    const o3 = this.ctx.createOscillator();
    const g3 = this.ctx.createGain();
    o3.type = 'square';
    o3.frequency.setValueAtTime(700, t + 0.8);
    o3.frequency.exponentialRampToValueAtTime(140, t + 0.9);
    g3.gain.setValueAtTime(0.4 * this.volume, t + 0.8);
    g3.gain.exponentialRampToValueAtTime(0.001, t + 0.92);
    o3.connect(g3);
    g3.connect(this.ctx.destination);
    o3.start(t + 0.8);
    o3.stop(t + 0.93);
  }

  // Loot pickup chime
  public playPickup() {
    if (this.isMuted || this.volume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, t); // C5
    osc.frequency.setValueAtTime(659.25, t + 0.06); // E5
    osc.frequency.setValueAtTime(783.99, t + 0.12); // G5
    gain.gain.setValueAtTime(0.3 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Jump sound
  public playJump() {
    if (this.isMuted || this.volume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.15);
    gain.gain.setValueAtTime(0.25 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Storm / Safe Zone warning siren
  public playStormWarning() {
    if (this.isMuted || this.volume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(220, t + 0.4);
    osc.frequency.linearRampToValueAtTime(440, t + 0.8);
    gain.gain.setValueAtTime(0.25 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.9);
  }

  // Victory celebration fanfare
  public playVictory() {
    if (this.isMuted || this.volume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A major triumphant chord
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);
      gain.gain.setValueAtTime(0.28 * this.volume, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(t + idx * 0.12);
      osc.stop(t + 1.7);
    });
  }

  // Elimination death sound
  public playEliminated() {
    if (this.isMuted || this.volume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    gain.gain.setValueAtTime(0.5 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.65);
  }
}

export const SoundFX = new SoundFXManager();
