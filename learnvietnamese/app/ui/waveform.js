/**
 * Audio Waveform Signal Scope Component
 * In accordance with approved layout §9:
 * Shallow physical receiver signal scope attached beneath the station selector.
 * Height: 58px. States: IDLE, LEARNER SPEAKING, MAI SPEAKING, PROCESSING, MIC UNAVAILABLE.
 * Real audio energy driven via WebAudio AnalyserNode; zero fake waveform when idle.
 */

export class WaveformComponent {
  constructor(options = {}) {
    this.height = options.height || 58;
    this.state = options.initialState || 'idle'; // 'idle' | 'listening' | 'speaking' | 'thinking' | 'mic_off'
    this.audioEnergy = 0; // 0.0 to 1.0
    this.element = null;
    this.canvas = null;
    this.ctx = null;
    this.animFrameId = null;

    // WebAudio analysis infrastructure
    this.audioContext = null;
    this.analyser = null;
    this.micStream = null;
    this.dataArray = null;
    this.isMicActive = false;
  }

  render() {
    const scope = document.createElement("div");
    scope.className = "signal-scope-panel";
    scope.id = "audio-waveform-scope";
    scope.setAttribute("role", "region");
    scope.setAttribute("aria-label", "Audio Signal Scope");
    scope.style.cssText = `
      width: 100%;
      height: ${this.height}px;
      background: #fbfbfd;
      border: 1px solid #e0e0e6;
      border-radius: 8px;
      box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
      display: flex;
      align-items: center;
      padding: 0 14px;
      box-sizing: border-box;
      gap: 16px;
      margin-top: 10px;
      user-select: none;
      overflow: hidden;
    `;

    // Metadata readout on left
    const readout = document.createElement("div");
    readout.className = "scope-readout";
    readout.style.cssText = `
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 90px;
      flex-shrink: 0;
    `;

    const title = document.createElement("span");
    title.style.cssText = "font: 700 9px var(--font-mono, monospace); letter-spacing: 1px; color: #888890; text-transform: uppercase;";
    title.textContent = "SIGNAL SCOPE";

    const stateLabel = document.createElement("span");
    stateLabel.id = "scopeStateLabel";
    stateLabel.style.cssText = "font: 700 11px var(--font-mono, monospace); letter-spacing: 0.8px; color: #111111; margin-top: 2px;";
    stateLabel.textContent = this.getStateLabel();

    readout.appendChild(title);
    readout.appendChild(stateLabel);

    // Canvas element for oscilloscope raster
    const canvasWrap = document.createElement("div");
    canvasWrap.style.cssText = "flex: 1; height: 100%; display: flex; align-items: center; position: relative; min-width: 0;";

    const canvas = document.createElement("canvas");
    canvas.id = "scopeCanvas";
    canvas.style.cssText = "width: 100%; height: 42px; display: block;";
    canvasWrap.appendChild(canvas);

    scope.appendChild(readout);
    scope.appendChild(canvasWrap);

    this.element = scope;
    this.canvas = canvas;

    // Initialize canvas resolution and start drawing
    setTimeout(() => {
      this.initCanvas();
      this.startRenderLoop();
    }, 0);

    return scope;
  }

  initCanvas() {
    if (!this.canvas) return;
    const rect = typeof this.canvas.getBoundingClientRect === 'function'
      ? this.canvas.getBoundingClientRect()
      : { width: 360, height: 42 };
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    this.canvas.width = (rect.width || 360) * dpr;
    this.canvas.height = (rect.height || 42) * dpr;
    this.ctx = typeof this.canvas.getContext === 'function' ? this.canvas.getContext('2d') : null;
    if (this.ctx && typeof this.ctx.scale === 'function') {
      this.ctx.scale(dpr, dpr);
    }
  }

  getStateLabel() {
    switch (this.state) {
      case 'listening': return 'LISTENING…';
      case 'speaking': return 'MAI';
      case 'thinking': return 'THINKING…';
      case 'mic_off': return 'MIC OFF';
      case 'idle':
      default: return 'READY';
    }
  }

  setState(newState, audioEnergy = 0) {
    this.state = newState;
    this.audioEnergy = audioEnergy;
    if (this.element) {
      const label = this.element.querySelector('#scopeStateLabel');
      if (label) {
        label.textContent = this.getStateLabel();
        if (this.state === 'listening') {
          label.style.color = 'var(--accent, #CC0000)';
        } else if (this.state === 'speaking') {
          label.style.color = '#111111';
        } else {
          label.style.color = '#555560';
        }
      }
    }
  }

  async startMicrophone() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.setState('mic_off');
      return false;
    }

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioContext && AudioCtx) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;

      const source = this.audioContext.createMediaStreamSource(this.micStream);
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.isMicActive = true;
      this.setState('listening');
      return true;
    } catch (err) {
      console.warn('Microphone access denied or unavailable for Signal Scope:', err.message);
      this.setState('mic_off');
      this.isMicActive = false;
      return false;
    }
  }

  stopMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    this.isMicActive = false;
    if (this.state === 'listening') {
      this.setState('idle');
    }
  }

  // Seam for Codex GPT-Live remote audio stream
  attachRemoteMediaStream(stream) {
    if (!stream || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.audioContext && AudioCtx) {
        this.audioContext = new AudioCtx();
      }
      const remoteAnalyser = this.audioContext.createAnalyser();
      remoteAnalyser.fftSize = 256;
      this.remoteSource?.disconnect();
      const remoteSource = this.audioContext.createMediaStreamSource(stream);
      remoteSource.connect(remoteAnalyser);
      this.remoteSource = remoteSource;
      void this.audioContext.resume();
      this.remoteAnalyser = remoteAnalyser;
      this.remoteDataArray = new Uint8Array(remoteAnalyser.frequencyBinCount);
      this.setState('speaking');
    } catch (e) {
      console.warn('Could not attach remote media stream to Signal Scope:', e);
    }
  }

  attachInputMediaStream(stream) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.audioContext ||= new AudioCtx();
    void this.audioContext.resume();
    this.inputSource?.disconnect();
    this.inputSource = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.inputSource.connect(this.analyser);
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  remoteEnergy() {
    if (!this.remoteAnalyser) return 0;
    this.remoteAnalyser.getByteTimeDomainData(this.remoteDataArray);
    return Math.sqrt(this.remoteDataArray.reduce((sum, n) => sum + ((n - 128) / 128) ** 2, 0) / this.remoteDataArray.length);
  }

  detachLiveMedia() {
    this.inputSource?.disconnect(); this.remoteSource?.disconnect();
    this.inputSource = null; this.remoteSource = null; this.remoteAnalyser = null;
    this.analyser = null; this.dataArray = null; this.remoteDataArray = null;
    this.setState('idle');
  }

  startRenderLoop() {
    if (typeof requestAnimationFrame === 'undefined') return;
    let phase = 0;
    const draw = () => {
      this.drawScope(phase);
      phase += 0.08;
      this.animFrameId = requestAnimationFrame(draw);
    };
    this.animFrameId = requestAnimationFrame(draw);
  }

  stopRenderLoop() {
    if (this.animFrameId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  drawScope(phase) {
    if (!this.canvas || !this.ctx) return;
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const w = this.canvas.width / dpr;
    const h = this.canvas.height / dpr;
    const cy = h / 2;

    this.ctx.clearRect(0, 0, w, h);

    // Subtle background grid tick marks
    this.ctx.strokeStyle = '#f0f0f4';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, cy);
    this.ctx.lineTo(w, cy);
    this.ctx.stroke();

    if (this.state === 'mic_off') {
      // Flatline muted baseline
      this.ctx.strokeStyle = '#c5c5cb';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(0, cy);
      this.ctx.lineTo(w, cy);
      this.ctx.stroke();
      return;
    }

    if (this.state === 'idle') {
      // Neutral resting baseline with subtle center reticle dots
      this.ctx.strokeStyle = '#9999a4';
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([4, 4]);
      this.ctx.beginPath();
      this.ctx.moveTo(0, cy);
      this.ctx.lineTo(w, cy);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      return;
    }

    if (this.state === 'thinking') {
      this.ctx.strokeStyle = '#777782';
      this.ctx.beginPath(); this.ctx.moveTo(0, cy); this.ctx.lineTo(w, cy); this.ctx.stroke();
      return;
    }

    // Real audio energy sampling if analyser is active
    let energy = this.audioEnergy;
    if (this.state === 'listening' && this.analyser && this.dataArray) {
      this.analyser.getByteTimeDomainData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        const v = (this.dataArray[i] - 128) / 128;
        sum += v * v;
      }
      energy = Math.sqrt(sum / this.dataArray.length) * 3; // boosted sensitivity
    } else if (this.state === 'speaking' && this.remoteAnalyser && this.remoteDataArray) {
      this.remoteAnalyser.getByteTimeDomainData(this.remoteDataArray);
      let sum = 0;
      for (let i = 0; i < this.remoteDataArray.length; i++) {
        const v = (this.remoteDataArray[i] - 128) / 128;
        sum += v * v;
      }
      energy = Math.sqrt(sum / this.remoteDataArray.length) * 3;
    }

    const strokeColor = this.state === 'listening' ? '#CC0000' : '#111111';
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    const maxAmp = Math.min(18, (h / 2 - 4) * Math.max(0, energy));
    for (let x = 0; x < w; x += 2) {
      const normX = x / w;
      const envelope = Math.sin(normX * Math.PI); // Window function: zeroes at endpoints
      const samples = this.state === 'speaking' ? this.remoteDataArray : this.dataArray;
      const sample = samples ? (samples[Math.min(samples.length - 1, Math.floor(normX * samples.length))] - 128) / 128 : 0;
      const y = cy + sample * Math.min(18, h / 2 - 4) * 3 * envelope;
      if (x === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
  }
}
