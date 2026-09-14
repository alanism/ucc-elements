/**
 * Vigil Clock — Session Countdown & Recap Timer Face
 * Adapted from Enochian Knobs & Keys Control Atlas §6.1, §6.4
 * Faithfully matches the approved Freeform tabletop mockup
 */

export class ClockComponent {
  constructor(options = {}) {
    this.totalSeconds = options.totalSeconds || 600;
    this.remainingSeconds = this.totalSeconds;
    this.state = options.state || "ready";
    this.onStart = options.onStart || (() => {});
    this.onPause = options.onPause || (() => {});
    this.onReset = options.onReset || (() => {});
    this.element = null;
  }

  buildSvgFace() {
    const TCX = 152, TCY = 152;
    let ticks = '';
    for (let s = 0; s < 60; s++) {
      const rad = (s * 6 * Math.PI) / 180;
      const quarter = s % 15 === 0;
      const major = s % 5 === 0;
      const r1 = quarter ? 122 : (major ? 126 : 130);
      const r2 = 138;
      const x1 = (TCX + r1 * Math.sin(rad)).toFixed(1);
      const y1 = (TCY - r1 * Math.cos(rad)).toFixed(1);
      const x2 = (TCX + r2 * Math.sin(rad)).toFixed(1);
      const y2 = (TCY - r2 * Math.cos(rad)).toFixed(1);
      const sw = quarter ? 3 : (major ? 2 : 1);
      ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="timer-tick" stroke-width="${sw}"/>`;

      if (major) {
        const xn = (TCX + 110 * Math.sin(rad)).toFixed(1);
        const yn = (TCY - 110 * Math.cos(rad) + 6).toFixed(1);
        const label = s === 0 ? "60" : (s < 10 ? `0${s}` : String(s));
        const fs = s === 0 ? 20 : 16;
        ticks += `<text x="${xn}" y="${yn}" text-anchor="middle" class="timer-number" font-size="${fs}" font-family="'IBM Plex Sans', sans-serif" font-weight="600">${label}</text>`;
      }
    }

    const SCY = 103;
    let subTicks = '';
    for (let m = 0; m < 30; m++) {
      const rad = (m * 12 * Math.PI) / 180;
      const major = m % 5 === 0;
      const r1 = major ? 31 : 34;
      const r2 = 38;
      const x1 = (TCX + r1 * Math.sin(rad)).toFixed(1);
      const y1 = (SCY - r1 * Math.cos(rad)).toFixed(1);
      const x2 = (TCX + r2 * Math.sin(rad)).toFixed(1);
      const y2 = (SCY - r2 * Math.cos(rad)).toFixed(1);
      const sw = major ? 1.5 : 0.7;
      subTicks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="timer-subtick" stroke-width="${sw}"/>`;

      if (major) {
        const xn = (TCX + 23 * Math.sin(rad)).toFixed(1);
        const yn = (SCY - 23 * Math.cos(rad) + 3).toFixed(1);
        const label = m === 0 ? "30" : String(m);
        subTicks += `<text x="${xn}" y="${yn}" text-anchor="middle" class="timer-subnum" font-size="8" font-family="'IBM Plex Mono', monospace" font-weight="600">${label}</text>`;
      }
    }

    return `
      <circle cx="${TCX}" cy="${TCY}" r="142" fill="none" class="timer-subface" stroke-width="1.5"/>
      <circle id="timerProgressArc" cx="${TCX}" cy="${TCY}" r="137" fill="none" class="timer-progress" stroke-width="6"
              stroke-dasharray="860.8" stroke-dashoffset="860.8" stroke-linecap="round"
              transform="rotate(-90 ${TCX} ${TCY})"/>
      ${ticks}
      <circle cx="${TCX}" cy="${SCY}" r="39" class="timer-subface" stroke-width="1.5"/>
      ${subTicks}
      <line id="timerSubHand" x1="${TCX}" y1="${SCY}" x2="${TCX}" y2="${SCY - 27}" class="timer-hand-min" stroke-width="3" stroke-linecap="round"/>
      <line id="timerSecHand" x1="${TCX}" y1="${TCY + 18}" x2="${TCX}" y2="${TCY - 116}" class="timer-hand-sec" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="${TCX}" cy="${SCY}" r="4" class="timer-hub-outer" stroke-width="1.5"/>
      <circle cx="${TCX}" cy="${TCY}" r="10" class="timer-hub-outer" stroke-width="2"/>
      <circle cx="${TCX}" cy="${TCY}" r="4" class="timer-hub-inner"/>
    `;
  }

  render() {
    const div = document.createElement("div");
    div.className = "timercase";
    div.id = "timerCase";
    div.setAttribute("role", "group");
    div.setAttribute("aria-label", "Vigil Clock countdown timer");

    div.innerHTML = `
      <div class="timerdial">
        <svg class="timer-svg" id="timerSvg" viewBox="0 0 304 304" aria-hidden="true">
          ${this.buildSvgFace()}
        </svg>
        <div class="timer-brand">UnCommon Core</div>
        <div class="timer-digital" id="timerDigital" data-testid="timer-display" role="timer" aria-label="${this.formatAriaTime()}">
          ${this.formatDisplayTime()}
        </div>
        <div class="timer-state" id="timerState" aria-live="polite">
          ${this.getStateDescription()}
        </div>
      </div>
      <button class="corner c-tl timer-control" type="button" id="timerStart" aria-label="${this.state === 'running' ? 'Pause timer' : 'Start timer'}" title="Start / pause timer">
        <span class="timer-start-glyph" id="timerStartGlyph" aria-hidden="true">${this.state === 'running' ? '⏸' : '▶'}</span>
      </button>
      <button class="corner c-tr timer-control" type="button" id="timerReset" aria-label="Reset timer" title="Reset timer">
        <span class="timer-reset-glyph" aria-hidden="true">↻</span>
      </button>
    `;

    const startBtn = div.querySelector("#timerStart");
    if (startBtn) {
      startBtn.addEventListener("click", () => {
        if (this.state === "running") {
          this.pause();
          this.onPause();
        } else {
          this.start();
          this.onStart();
        }
      });
    }

    const resetBtn = div.querySelector("#timerReset");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.reset();
        this.onReset();
      });
    }

    this.element = div;
    return div;
  }

  formatDisplayTime() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = Math.floor(this.remainingSeconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  formatAriaTime() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = Math.floor(this.remainingSeconds % 60);
    return `${mins} minutes ${secs} seconds remaining`;
  }

  getStateDescription() {
    if (this.remainingSeconds <= 0) return "SESSION COMPLETE";
    if (this.remainingSeconds <= 30) return "RECAP & REVIEW";
    if (this.state === "running") return "PRACTICE ACTIVE";
    if (this.state === "paused") return "PAUSED";
    return "READY";
  }

  update(remainingSeconds, state) {
    this.remainingSeconds = Math.max(0, remainingSeconds);
    if (state) this.state = state;
    if (!this.element) return;

    const digital = this.element.querySelector("#timerDigital");
    const stEl = this.element.querySelector("#timerState");
    const arc = this.element.querySelector("#timerProgressArc");
    const secHand = this.element.querySelector("#timerSecHand");
    const subHand = this.element.querySelector("#timerSubHand");
    const startGlyph = this.element.querySelector("#timerStartGlyph");
    const startBtn = this.element.querySelector("#timerStart");

    if (digital) {
      digital.textContent = this.formatDisplayTime();
      digital.setAttribute("aria-label", this.formatAriaTime());
    }
    if (stEl) {
      stEl.textContent = this.getStateDescription();
    }
    if (arc) {
      const elapsedFraction = 1 - (this.remainingSeconds / this.totalSeconds);
      const dashoffset = 860.8 * (1 - elapsedFraction);
      arc.style.strokeDashoffset = String(dashoffset);
      if (this.remainingSeconds <= 30 && this.remainingSeconds > 0) {
        arc.setAttribute("stroke", "#ffaa00");
      } else {
        arc.setAttribute("stroke", "var(--accent)");
      }
    }
    if (secHand) {
      const elapsed = this.totalSeconds - this.remainingSeconds;
      const angle = (elapsed % 60) * 6;
      secHand.setAttribute("transform", `rotate(${angle} 152 152)`);
    }
    if (subHand) {
      const mins = this.remainingSeconds / 60;
      const angle = (mins % 30) * 12;
      subHand.setAttribute("transform", `rotate(${angle} 152 103)`);
    }
    if (startGlyph) {
      startGlyph.textContent = this.state === "running" ? "⏸" : "▶";
    }
    if (startBtn) {
      startBtn.setAttribute("aria-label", this.state === "running" ? "Pause timer" : "Start timer");
    }
  }

  start() {
    this.state = "running";
    this.update(this.remainingSeconds, "running");
  }

  pause() {
    this.state = "paused";
    this.update(this.remainingSeconds, "paused");
  }

  reset() {
    this.remainingSeconds = this.totalSeconds;
    this.state = "ready";
    this.update(this.totalSeconds, "ready");
  }
}
