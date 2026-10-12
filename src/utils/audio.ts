/**
 * Web Audio API procedural sound engine for CyberBark Laser Tag
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  public bgmActive: boolean = false;
  private bgmInterval: number | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Laser shot fired from dog's mouth
  playLaserBark(laserType: string = 'normal') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // 1. Initial mechanical bark snap / click
    const oscBark = this.ctx.createOscillator();
    const gainBark = this.ctx.createGain();
    oscBark.type = 'sawtooth';
    oscBark.frequency.setValueAtTime(320, now);
    oscBark.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gainBark.gain.setValueAtTime(0.3, now);
    gainBark.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    oscBark.connect(gainBark);
    gainBark.connect(this.ctx.destination);
    oscBark.start(now);
    oscBark.stop(now + 0.08);

    // 2. High-energy laser beam zap
    const oscLaser = this.ctx.createOscillator();
    const gainLaser = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    oscLaser.type = 'sawtooth';
    filter.type = 'bandpass';
    filter.Q.value = 4;

    const baseFreq = laserType === 'heavy' ? 700 : 1200;
    oscLaser.frequency.setValueAtTime(baseFreq, now);
    oscLaser.frequency.exponentialRampToValueAtTime(160, now + 0.16);

    filter.frequency.setValueAtTime(2800, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.16);

    gainLaser.gain.setValueAtTime(0.25, now);
    gainLaser.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    oscLaser.connect(filter);
    filter.connect(gainLaser);
    gainLaser.connect(this.ctx.destination);

    oscLaser.start(now);
    oscLaser.stop(now + 0.16);
  }

  // Laser hits personal energy shield
  playShieldHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.22);

    filter.type = 'highpass';
    filter.frequency.value = 600;

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Laser hits body / armor
  playDamageHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.18);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // Laser hits neon cover barrier
  playCoverHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Player deploys tactical barrier
  playDeployBarrier() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.18);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Dog activates dash boost
  playDash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Player K.O.
  playKill() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [440, 554, 659, 880].forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.2, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.15);
    });
  }

  // Power-up spawned in arena
  playPowerUpSpawn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.18);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Power-up collected by player
  playPowerUpCollect(type: string = 'speed_boost') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = type === 'invulnerability' 
      ? [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6 (radiant chime)
      : type === 'rapid_fire'
      ? [440, 554, 659, 880]
      : [392, 523.25, 659.25, 783.99]; // high cyber ascending arpeggio

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.25, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.16);
    });
  }

  // Laser hitting invulnerable quantum barrier
  playInvulnerableHit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Cyberpunk Synthwave Procedural Arpeggiator (Ambient Music)
  toggleBGM(): boolean {
    this.initCtx();
    this.bgmActive = !this.bgmActive;
    if (this.bgmActive) {
      this.startCyberArp();
    } else {
      this.stopCyberArp();
    }
    return this.bgmActive;
  }

  private startCyberArp() {
    if (this.bgmInterval) clearInterval(this.bgmInterval);
    const chords = [
      [110, 164.81, 220, 277.18], // A min / C cyber
      [98, 146.83, 196, 246.94],  // G
      [116.54, 174.61, 233.08, 293.66], // Bb
      [82.41, 123.47, 164.81, 220]  // E min
    ];
    let chordIdx = 0;
    let noteIdx = 0;

    this.bgmInterval = window.setInterval(() => {
      if (!this.bgmActive || this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = chords[chordIdx];
      const freq = notes[noteIdx % notes.length];
      noteIdx++;
      if (noteIdx >= 8) {
        noteIdx = 0;
        chordIdx = (chordIdx + 1) % chords.length;
      }

      // Play soft cyber bass pluck
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.2);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    }, 180);
  }

  private stopCyberArp() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
