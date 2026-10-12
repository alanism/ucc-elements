/**
 * Physical PLAY / LIVE Toggle Switch
 * Adapted from Enochian Knobs & Keys Control Atlas toggle.html & Build Plan §6.1
 */

export class ModeSwitchComponent {
  constructor(options = {}) {
    this.mode = options.initialMode || "PLAY";
    this.onModeToggle = options.onModeToggle || (() => {});
    this.element = null;
  }

  render() {
    const isLive = this.mode === "LIVE";
    const button = document.createElement("button");
    button.className = "track";
    button.id = "mode-switch";
    button.setAttribute("role", "switch");
    button.setAttribute("aria-checked", String(isLive));
    button.setAttribute("aria-label", "Mode switch: REC offline or LIVE with Tutor Mai");
    button.style.cssText = `
      width: 110px;
      height: 52px;
      border-radius: 999px;
      background: var(--accent);
      position: relative;
      cursor: pointer;
      border: 0;
      outline-offset: 6px;
      min-height: 44px;
      min-width: 44px;
      box-shadow: inset 0 2px 6px rgba(0,0,0,.15), inset 0 -1px 2px rgba(255,255,255,.9);
    `;

    button.innerHTML = `
      <span class="knob" style="
        position: absolute;
        top: 4px;
        left: 4px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: radial-gradient(circle at 35% 30%, #ffffff, #f4f4f4 70%, #ececec);
        box-shadow: 0 8px 18px rgba(0,0,0,.22), 0 2px 4px rgba(0,0,0,.18);
        transform: translateX(${isLive ? "58px" : "0px"});
        transition: transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1);
        display: flex;
        align-items: center;
        justify-content: center;
      "></span>
    `;

    button.addEventListener("click", () => {
      const nextMode = this.mode === "PLAY" ? "LIVE" : "PLAY";
      this.setMode(nextMode);
      this.onModeToggle(this.mode);
    });

    this.element = button;
    return button;
  }

  setMode(mode) {
    this.mode = mode;
    if (!this.element) return;
    const isLive = mode === "LIVE";
    this.element.setAttribute("aria-checked", String(isLive));
    this.element.style.background = "var(--accent)";
    const knob = this.element.querySelector(".knob");
    if (knob) {
      knob.style.transform = isLive ? "translateX(58px)" : "translateX(0px)";
    }

    if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
      const recLabel = document.getElementById('recLabel');
      const liveLabel = document.getElementById('liveLabel');
      if (recLabel && recLabel.classList) recLabel.classList.toggle('active', !isLive);
      if (liveLabel && liveLabel.classList) liveLabel.classList.toggle('active', isLive);
    }
  }
}
