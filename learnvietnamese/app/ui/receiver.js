/**
 * Aether Receiver — Physical Radio Player Shell
 * Adapted from Enochian Knobs & Keys Control Atlas §6.1
 */

export class ReceiverComponent {
  constructor(options = {}) {
    this.theme = options.theme || "light";
    this.power = options.power || false;
    this.volume = options.volume ?? 50;
    this.statusLine1 = options.statusLine1 || "STATION 03 · CAFÉ";
    this.statusLine2 = options.statusLine2 || "PHRASE 1 / 5";
    this.onPowerToggle = options.onPowerToggle || (() => {});
    this.onVolumeChange = options.onVolumeChange || (() => {});
    this.element = null;
  }

  render() {
    const div = document.createElement("div");
    div.className = "radio";
    div.id = "radio";
    div.setAttribute("data-theme", this.theme);
    div.setAttribute("role", "region");
    div.setAttribute("aria-label", "Aether Radio Receiver");

    div.innerHTML = `
      <div class="rhead">
        <button class="pwr" id="pwrBtn" data-testid="power-switch" role="switch" aria-checked="${this.power}" aria-label="Radio power" style="min-width: 44px; min-height: 44px;">
          <span class="pring"><span class="pdot" id="pdot" style="background: ${this.power ? "var(--r-power-on)" : "var(--r-power-off)"}"></span></span>
        </button>
        <div class="rdisp" aria-live="polite">
          <div class="rbrand-title" style="font: 700 11px var(--font-sans, sans-serif); letter-spacing: 0.8px; color: #111;">UNCOMMON CORE</div>
          <div class="rbrand-sub" style="font: 500 9px var(--font-mono, monospace); letter-spacing: 0.8px; color: #777; margin-bottom: 4px;">VIETNAMESE RADIO</div>
          <div class="rl1" id="rl1" style="font: 700 10.5px var(--font-mono, monospace); letter-spacing: 1px; color: #111;">${this.power ? this.statusLine1 : (this.statusLine1 || "STATION 03 · CAFÉ")}</div>
          <div class="rl2" id="rl2" style="font: 500 9.5px var(--font-mono, monospace); letter-spacing: 0.5px; color: #777;">${this.power ? this.statusLine2 : (this.statusLine2 || "PHRASE 1 / 5")}</div>
        </div>
      </div>
      <div class="grill" data-testid="receiver-grill" aria-hidden="true"></div>
      <div class="rfoot">
        <div class="rscale" id="rscale" aria-hidden="true">
          ${Array.from({length: 19}, (_, i) => `<div class="rtick" style="left: ${(i * (100 / 18)).toFixed(2)}%;"></div>`).join('')}
          <div class="rdash" style="left: ${((this.volume / 100) * 90).toFixed(1)}%;"></div>
        </div>
        <div class="rrow">
          <div class="rknob-small" style="width: 28px; height: 28px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ffffff, #ececed); border: 1px solid #d4d4d8; box-shadow: 0 2px 5px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.9); flex-shrink: 0;" aria-hidden="true"></div>
          <div class="rbrand" aria-label="UnCommon Core Receiver" style="display: flex; align-items: center; gap: 7px;">
            <svg viewBox="0 0 100 100" width="22" height="22" role="img" aria-hidden="true">
              <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="13" stroke-dasharray="209.4 29.4" stroke-dashoffset="-11.7"/>
              <circle cx="50" cy="50" r="21" fill="none" stroke="currentColor" stroke-width="8" stroke-dasharray="116.5 15.4" stroke-dashoffset="-7.7"/>
              <text x="50" y="58" text-anchor="middle" font-weight="800" font-size="18" fill="currentColor">U</text>
            </svg>
            <div class="rb-t" style="display: flex; flex-direction: column;">
              <span style="font-weight: 700; font-size: 10.5px; letter-spacing: 0.5px; color: #111;">UnCommon Core</span>
              <span style="font-size: 7px; letter-spacing: 0.5px; color: #888; font-weight: 500;">LEARN FOR A MORE HUMAN WORLD</span>
            </div>
          </div>
          <div class="rknob" id="rknob" role="slider" tabindex="0" 
               aria-label="Radio volume" aria-valuemin="0" aria-valuemax="100" 
               aria-valuenow="${this.volume}" aria-valuetext="Volume ${this.volume} percent"
               style="min-width: 44px; min-height: 44px; cursor: grab;">
            <div class="rgloss"></div>
            <div class="rmarker" aria-hidden="true" style="transform: rotate(${(this.volume / 100) * 270 - 135}deg)"></div>
          </div>
        </div>
      </div>
    `;

    const pwrBtn = div.querySelector("#pwrBtn");
    pwrBtn.addEventListener("click", () => {
      this.setPower(!this.power);
      this.onPowerToggle(this.power);
    });

    const knob = div.querySelector("#rknob");
    knob.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowRight") {
        this.setVolume(Math.min(100, this.volume + 5));
        this.onVolumeChange(this.volume);
      } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
        this.setVolume(Math.max(0, this.volume - 5));
        this.onVolumeChange(this.volume);
      }
    });

    this.element = div;
    return div;
  }

  setPower(on) {
    this.power = on;
    if (!this.element) return;
    const pwrBtn = this.element.querySelector("#pwrBtn");
    const pdot = this.element.querySelector("#pdot");
    const rl1 = this.element.querySelector("#rl1");
    const rl2 = this.element.querySelector("#rl2");
    if (pwrBtn) pwrBtn.setAttribute("aria-checked", String(on));
    if (pdot) pdot.style.background = on ? "var(--accent)" : "var(--ink)";
    if (rl1) rl1.textContent = this.statusLine1 || "STATION 03 · CAFÉ";
    if (rl2) rl2.textContent = this.statusLine2 || "PHRASE 1 / 5";
  }

  setStatus(l1, l2) {
    this.statusLine1 = l1;
    if (l2) this.statusLine2 = l2;
    if (this.element && this.power) {
      const rl1 = this.element.querySelector("#rl1");
      const rl2 = this.element.querySelector("#rl2");
      if (rl1) rl1.textContent = l1;
      if (rl2 && l2) rl2.textContent = l2;
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(100, val));
    if (!this.element) return;
    const knob = this.element.querySelector("#rknob");
    if (knob) {
      knob.setAttribute("aria-valuenow", String(this.volume));
      knob.setAttribute("aria-valuetext", `Volume ${this.volume} percent`);
      const marker = knob.querySelector(".rmarker");
      if (marker) {
        marker.style.transform = `rotate(${(this.volume / 100) * 270 - 135}deg)`;
      }
    }
  }
}
