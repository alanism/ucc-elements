/**
 * Session-Owned Monotonic Timer & UTC Recovery Checkpoint
 * In accordance with Build Plan rd03 §6.3, §6.4 and Task P2.6
 */

export const PRESETS = {
  MIN_5: 300,
  MIN_10: 600,
  MIN_25: 1500
};

export class SessionTimer {
  constructor(options = {}) {
    this.totalSeconds = options.durationSeconds || PRESETS.MIN_10;
    this.totalMs = this.totalSeconds * 1000;
    this.state = 'ready'; // 'ready' | 'running' | 'paused' | 'expired' | 'ended'
    this.elapsedMs = 0;
    this.lastTickTime = null;
    this.startedAtUtc = null;
    this.pausedAtUtc = null;
    this.recapTriggered = false;

    this.onTick = options.onTick || (() => {});
    this.onRecap = options.onRecap || (() => {});
    this.onExpire = options.onExpire || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    this.timerHandle = null;
  }

  get remainingMs() {
    return Math.max(0, this.totalMs - this.elapsedMs);
  }

  get remainingSeconds() {
    return Math.ceil(this.remainingMs / 1000);
  }

  canStartChallenge() {
    // Build Plan §6.4: Do not start challenges with < 45 seconds remaining
    return this.state === 'running' && this.remainingMs >= 45000;
  }

  isInRecap() {
    // Final 30 seconds reserved for recap
    return this.remainingMs <= 30000 && this.remainingMs > 0;
  }

  start(monotonicNow = performance.now()) {
    if (this.state === 'running') return;
    if (this.state === 'expired' || this.state === 'ended') {
      throw new Error('Cannot start an expired or ended session; call reset() first');
    }

    this.state = 'running';
    this.lastTickTime = monotonicNow;
    if (!this.startedAtUtc) {
      this.startedAtUtc = new Date().toISOString();
    }
    this.pausedAtUtc = null;
    this.onStateChange(this.state);

    this._scheduleNextTick();
  }

  pause(monotonicNow = performance.now()) {
    if (this.state !== 'running') return;

    this._accumulateElapsed(monotonicNow);
    this.state = 'paused';
    this.pausedAtUtc = new Date().toISOString();
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    this.onStateChange(this.state);
  }

  reset(newDurationSeconds = null) {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    if (newDurationSeconds) {
      this.totalSeconds = newDurationSeconds;
      this.totalMs = this.totalSeconds * 1000;
    }
    this.state = 'ready';
    this.elapsedMs = 0;
    this.lastTickTime = null;
    this.startedAtUtc = null;
    this.pausedAtUtc = null;
    this.recapTriggered = false;
    this.onStateChange(this.state);
  }

  end() {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    this.state = 'ended';
    this.onStateChange(this.state);
  }

  dispose() {
    if (this.timerHandle) {
      clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
    this.state = 'ended';
  }

  handleVisibilityChange(hidden, monotonicNow = performance.now()) {
    // Build Plan §6.4: Background/lock pauses timer explicitly; remains paused on return
    if (hidden && this.state === 'running') {
      this.pause(monotonicNow);
    }
  }

  tick(monotonicNow = performance.now()) {
    if (this.state !== 'running') return;

    this._accumulateElapsed(monotonicNow);

    // Check recap threshold (<= 30s)
    if (this.isInRecap() && !this.recapTriggered) {
      this.recapTriggered = true;
      this.onRecap(this.remainingSeconds);
    }

    // Check expiry
    if (this.remainingMs <= 0) {
      this.state = 'expired';
      if (this.timerHandle) {
        clearTimeout(this.timerHandle);
        this.timerHandle = null;
      }
      this.onStateChange(this.state);
      this.onExpire();
      return;
    }

    this.onTick(this.remainingSeconds, this.remainingMs);
    this._scheduleNextTick();
  }

  _accumulateElapsed(monotonicNow) {
    if (this.lastTickTime !== null) {
      const delta = monotonicNow - this.lastTickTime;
      // System clock or monotonic anomaly guard
      if (delta > 0) {
        this.elapsedMs += delta;
      }
    }
    this.lastTickTime = monotonicNow;
  }

  _scheduleNextTick() {
    if (typeof setTimeout !== 'undefined' && this.state === 'running') {
      this.timerHandle = setTimeout(() => {
        this.tick(performance.now());
      }, 500);
      if (this.timerHandle && typeof this.timerHandle.unref === 'function') {
        this.timerHandle.unref();
      }
    }
  }

  // UTC Recovery Checkpoint serialization (R17)
  createCheckpoint() {
    return {
      version: 'v1',
      totalSeconds: this.totalSeconds,
      elapsedMs: this.elapsedMs,
      remainingMs: this.remainingMs,
      state: this.state === 'running' ? 'paused' : this.state, // Never auto-resume after crash/reload
      startedAtUtc: this.startedAtUtc,
      checkpointAtUtc: new Date().toISOString(),
      recapTriggered: this.recapTriggered
    };
  }

  static restoreFromCheckpoint(checkpoint, callbacks = {}) {
    const timer = new SessionTimer({
      durationSeconds: checkpoint.totalSeconds,
      ...callbacks
    });
    timer.elapsedMs = checkpoint.elapsedMs;
    timer.state = checkpoint.state;
    timer.startedAtUtc = checkpoint.startedAtUtc;
    timer.pausedAtUtc = checkpoint.checkpointAtUtc;
    timer.recapTriggered = checkpoint.recapTriggered;
    return timer;
  }
}
