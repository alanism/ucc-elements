/**
 * Unified Mai Interaction Console Component
 * Combines:
 * 1. Top status LED
 * 2. Canonical large concave push button with Cinnabar outer socket (#help-button)
 * 3. Clear button state copy: PRESS TO TALK WITH MAI / HOLD, SPEAK, RELEASE
 * 4. Etched mechanical divider
 * 5. Canonical PLAY [toggle] LIVE Drams—037 switch
 * Mounts directly below the Vigil Clock in the right column.
 */

export class MaiConsoleComponent {
  constructor(options = {}) {
    this.onHelp = options.onHelp || options.onHelpClick || (() => {});
    this.onTalkPress = options.onTalkPress || (() => {});
    this.onTalkRelease = options.onTalkRelease || (() => {});
    this.onModeToggle = options.onModeToggle || (() => {});
    this.mode = options.initialMode || "PLAY";
    this.element = null;
    this.isPressed = false;
    this.pressCount = 0;
  }

  render() {
    const consolePlate = document.createElement("div");
    consolePlate.className = "mai-console-plate";
    consolePlate.id = "mai-console";
    consolePlate.setAttribute("role", "region");
    consolePlate.setAttribute("aria-label", "Tutor Mai interaction console");
    consolePlate.style.cssText = `
      width: 100%;
      max-width: 340px;
      background: #fdfdfd;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 14px;
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
      padding: 22px 20px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-sizing: border-box;
      margin-top: 14px;
      user-select: none;
    `;

    // 1. Top Cinnabar Status LED
    const led = document.createElement("div");
    led.className = "talk-dial-led";
    led.id = "talkDialLed";
    led.style.cssText = `
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #CC0000;
      margin-bottom: 14px;
      box-shadow: 0 0 6px rgba(204, 0, 0, 0.6);
      transition: background-color 0.15s ease, box-shadow 0.15s ease;
    `;

    // 2. Canonical Outer Socket (Approved UCC Cinnabar Red)
    const socket = document.createElement("div");
    socket.className = "talk-dial-socket";
    socket.id = "talkDialSocket";
    socket.style.cssText = `
      width: 124px;
      height: 124px;
      border-radius: 50%;
      background: radial-gradient(circle at 40% 35%, #e01b1b, #CC0000 65%, #990000 100%);
      border: 1px solid #aa0000;
      box-shadow: 0 10px 24px rgba(0,0,0,0.18), inset 0 2px 4px rgba(255,255,255,0.35), inset 0 -3px 6px rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      flex-shrink: 0;
      transition: background 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
    `;

    // 3. Canonical Dished Ivory Push Button (#help-button)
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "talk-dial-btn concave-button";
    btn.id = "help-button";
    btn.setAttribute("aria-label", "Press to talk with Mai");
    btn.setAttribute("aria-pressed", "false");
    btn.style.cssText = `
      width: 98px;
      height: 98px;
      min-width: 44px;
      min-height: 44px;
      border-radius: 50%;
      border: 1px solid #a9a9ae;
      padding: 0;
      position: relative;
      cursor: pointer;
      touch-action: manipulation;
      background: linear-gradient(150deg, #fafafa, #d9d9dc 72%);
      box-shadow: 0 6px 12px rgba(0,0,0,0.35), 0 -2px 3px rgba(255,255,255,0.95), inset 0 1px 2px #fff;
      transform-origin: 50% 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      outline-offset: 5px;
      transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease;
    `;

    // Authentic Concave Dished Surface
    const concaveTop = document.createElement("span");
    concaveTop.className = "concave-top";
    concaveTop.id = "concaveTop";
    concaveTop.setAttribute("aria-hidden", "true");
    concaveTop.style.cssText = `
      position: absolute;
      inset: 6px;
      border-radius: 50%;
      background: radial-gradient(ellipse at 50% 58%, #c5c5c8 0%, #dadadd 48%, #f9f9f9 76%, #c9c9cd 100%);
      box-shadow: inset 6px 8px 14px rgba(0,0,0,.18), inset -6px -8px 14px rgba(255,255,255,.88), 0 1px 1px rgba(255,255,255,.9);
      pointer-events: none;
      transition: box-shadow 0.15s ease;
    `;

    const spec = document.createElement("span");
    spec.setAttribute("aria-hidden", "true");
    spec.style.cssText = `
      position: absolute;
      inset: 10%;
      border-radius: 50%;
      background: radial-gradient(ellipse at 35% 24%, rgba(255,255,255,.55), transparent 48%);
      mix-blend-mode: screen;
      pointer-events: none;
    `;
    concaveTop.appendChild(spec);
    btn.appendChild(concaveTop);
    socket.appendChild(btn);

    // 4. Clean Canonical Copy
    const labelWrap = document.createElement("div");
    labelWrap.className = "talk-dial-labels";
    labelWrap.style.cssText = "display: flex; flex-direction: column; align-items: center; text-align: center; margin-top: 14px;";

    const statusLine = document.createElement("div");
    statusLine.className = "talk-dial-status";
    statusLine.id = "talkDialStatus";
    statusLine.style.cssText = "font: 700 11px var(--font-mono, monospace); color: #111111; letter-spacing: 1px; text-transform: uppercase;";
    statusLine.textContent = `READY · ${this.pressCount} PRESSES`;

    const titleLine = document.createElement("div");
    titleLine.style.cssText = "font: 700 11.5px var(--font-sans, sans-serif); color: #111111; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.8px;";
    titleLine.textContent = "PRESS TO TALK WITH MAI";

    const subLine = document.createElement("div");
    subLine.style.cssText = "font: 500 10px var(--font-mono, monospace); color: #777780; margin-top: 2px; letter-spacing: 0.6px;";
    subLine.textContent = "HOLD, SPEAK, RELEASE";

    labelWrap.appendChild(statusLine);
    labelWrap.appendChild(titleLine);
    labelWrap.appendChild(subLine);

    // 5. Etched Mechanical Divider
    const divider = document.createElement("div");
    divider.className = "mai-console-divider";
    divider.style.cssText = "width: 100%; height: 1px; background: #e5e5ea; margin: 18px 0 16px; border-bottom: 1px solid #ffffff;";

    // 6. Unified PLAY [toggle] LIVE Control
    const modeWrap = document.createElement("div");
    modeWrap.className = "mai-mode-switch-wrap";
    modeWrap.style.cssText = "display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%;";

    const playLabel = document.createElement("span");
    playLabel.id = "recLabel";
    playLabel.className = `mode-tag ${this.mode === 'PLAY' ? 'active' : ''}`;
    playLabel.style.cssText = `font: ${this.mode === 'PLAY' ? '700' : '500'} 11px var(--font-mono, monospace); color: ${this.mode === 'PLAY' ? '#111' : '#888'}; letter-spacing: 1px;`;
    playLabel.textContent = "PLAY";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "track mode-toggle-track";
    toggleBtn.id = "mode-switch";
    toggleBtn.setAttribute("role", "switch");
    toggleBtn.setAttribute("aria-checked", String(this.mode === "LIVE"));
    toggleBtn.setAttribute("aria-label", "Mode selector: PLAY offline lesson or LIVE Tutor Mai");
    toggleBtn.style.cssText = `
      width: 78px;
      height: 38px;
      border-radius: 999px;
      background: var(--accent, #CC0000);
      position: relative;
      cursor: pointer;
      border: 0;
      padding: 3px;
      touch-action: manipulation;
      box-shadow: inset 0 2px 5px rgba(0,0,0,0.18), inset 0 -1px 2px rgba(255,255,255,0.8);
      outline-offset: 3px;
      transition: background 0.2s ease;
    `;

    const toggleKnob = document.createElement("span");
    toggleKnob.className = "knob";
    toggleKnob.style.cssText = `
      display: block;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #ffffff, #f4f4f4 70%, #ececec);
      box-shadow: 0 4px 10px rgba(0,0,0,0.22), 0 1px 3px rgba(0,0,0,0.15);
      transform: translateX(${this.mode === "LIVE" ? "40px" : "0px"});
      transition: transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
    `;
    toggleBtn.appendChild(toggleKnob);

    const liveLabel = document.createElement("span");
    liveLabel.id = "liveLabel";
    liveLabel.className = `mode-tag ${this.mode === 'LIVE' ? 'active' : ''}`;
    liveLabel.style.cssText = `font: ${this.mode === 'LIVE' ? '700' : '500'} 11px var(--font-mono, monospace); color: ${this.mode === 'LIVE' ? '#CC0000' : '#888'}; letter-spacing: 1px;`;
    liveLabel.textContent = "LIVE";

    modeWrap.appendChild(playLabel);
    modeWrap.appendChild(toggleBtn);
    modeWrap.appendChild(liveLabel);

    // Mechanical Andy Allen Game Feel Transitions for Push Button
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const press = () => {
      if (this.isPressed) return;
      this.isPressed = true;
      if (this.mode === 'LIVE') this.onTalkPress();
      btn.setAttribute("aria-pressed", "true");
      statusLine.textContent = `ACTIVE · ${this.pressCount} PRESSES`;

      if (!prefersReducedMotion) {
        btn.style.transform = "translateY(3px) scale(0.975)";
        btn.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3), inset 0 2px 5px rgba(0,0,0,0.25)";
        concaveTop.style.boxShadow = "inset 8px 10px 16px rgba(0,0,0,.28), inset -4px -5px 10px rgba(255,255,255,.66)";
        socket.style.background = "radial-gradient(circle at 40% 35%, #ff2e2e, #e60000 65%, #b30000 100%)";
        socket.style.boxShadow = "0 0 20px rgba(204, 0, 0, 0.55), 0 6px 16px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.3)";
        led.style.background = "#ff2222";
        led.style.boxShadow = "0 0 10px rgba(255, 34, 34, 0.95)";
      }
    };

    const release = () => {
      if (this.isPressed) {
        this.isPressed = false;
        this.pressCount++;
        statusLine.textContent = `READY · ${this.pressCount} ${this.pressCount === 1 ? 'PRESS' : 'PRESSES'}`;
        btn.setAttribute("aria-pressed", "false");

        if (!prefersReducedMotion) {
          btn.style.transform = "translateY(0) scale(1)";
          btn.style.boxShadow = "0 6px 12px rgba(0,0,0,0.35), 0 -2px 3px rgba(255,255,255,0.95), inset 0 1px 2px #fff";
          concaveTop.style.boxShadow = "inset 6px 8px 14px rgba(0,0,0,.18), inset -6px -8px 14px rgba(255,255,255,.88), 0 1px 1px rgba(255,255,255,.9)";
          socket.style.background = "radial-gradient(circle at 40% 35%, #e01b1b, #CC0000 65%, #990000 100%)";
          socket.style.boxShadow = "0 10px 24px rgba(0,0,0,0.18), inset 0 2px 4px rgba(255,255,255,0.35), inset 0 -3px 6px rgba(0,0,0,0.45)";
          led.style.background = "#CC0000";
          led.style.boxShadow = "0 0 5px rgba(204, 0, 0, 0.6)";
        }

        if (this.mode === 'LIVE') this.onTalkRelease();
        else this.onHelp();
      }
    };

    btn.addEventListener("pointerdown", (event) => { btn.setPointerCapture?.(event.pointerId); press(); });
    btn.addEventListener("pointerup", release);
    btn.addEventListener("lostpointercapture", release);
    btn.addEventListener("blur", release);
    btn.addEventListener("pointercancel", release);

    btn.addEventListener("keydown", (e) => {
      if (!e.repeat && (e.key === " " || e.key === "Enter")) {
        e.preventDefault(); press();
      }
    });
    btn.addEventListener("keyup", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault(); release();
      }
    });

    btn.addEventListener("click", (event) => {
      if ((event.detail === 0 || event.detail === undefined) && !this.isPressed && this.mode === "PLAY") {
        this.onHelp();
      }
    });

    // Mode Toggle Event
    toggleBtn.addEventListener("click", () => {
      const nextMode = this.mode === "PLAY" ? "LIVE" : "PLAY";
      this.setMode(nextMode);
      this.onModeToggle(nextMode);
    });

    consolePlate.appendChild(led);
    consolePlate.appendChild(socket);
    consolePlate.appendChild(labelWrap);
    consolePlate.appendChild(divider);
    consolePlate.appendChild(modeWrap);

    this.element = consolePlate;
    return consolePlate;
  }

  setMode(newMode) {
    this.mode = newMode;
    if (!this.element) return;
    const isLive = newMode === "LIVE";
    const toggleBtn = this.element.querySelector("#mode-switch");
    const toggleKnob = toggleBtn ? toggleBtn.querySelector(".knob") : null;
    const playLabel = this.element.querySelector("#recLabel");
    const liveLabel = this.element.querySelector("#liveLabel");

    if (toggleBtn) toggleBtn.setAttribute("aria-checked", String(isLive));
    if (toggleKnob) toggleKnob.style.transform = `translateX(${isLive ? "40px" : "0px"})`;

    if (playLabel) {
      playLabel.style.fontWeight = isLive ? '500' : '700';
      playLabel.style.color = isLive ? '#888' : '#111';
    }
    if (liveLabel) {
      liveLabel.style.fontWeight = isLive ? '700' : '500';
      liveLabel.style.color = isLive ? '#CC0000' : '#888';
    }
  }

  getHelpButton() {
    return this.element ? this.element.querySelector('#help-button') : null;
  }

  getModeSwitch() {
    return this.element ? this.element.querySelector('#mode-switch') : null;
  }

  setLiveMode(isLive) {
    this.setMode(isLive ? "LIVE" : "PLAY");
  }

  setStatus(newStatus) {
    this.status = newStatus;
    if (!this.element) return;
    const led = this.element.querySelector('#talkDialLed');
    const statusLine = this.element.querySelector('#talkDialStatus');
    if (led) {
      if (newStatus === 'listening') {
        led.style.background = '#ff2222';
        led.style.boxShadow = '0 0 10px rgba(255, 34, 34, 0.95)';
      } else if (newStatus === 'speaking') {
        led.style.background = '#CC0000';
        led.style.boxShadow = '0 0 8px rgba(204, 0, 0, 0.7)';
      } else {
        led.style.background = '#CC0000';
        led.style.boxShadow = '0 0 5px rgba(204, 0, 0, 0.6)';
      }
    }
    if (statusLine) {
      switch (newStatus) {
        case 'listening':
          statusLine.textContent = 'LISTENING…';
          break;
        case 'speaking':
          statusLine.textContent = 'MAI SPEAKING';
          break;
        case 'connecting':
          statusLine.textContent = 'CONNECTING…';
          break;
        case 'error':
          statusLine.textContent = 'ERROR · PLAY AVAILABLE';
          break;
        case 'thinking':
        case 'waiting':
          statusLine.textContent = 'THINKING…';
          break;
        case 'idle':
        default:
          statusLine.textContent = `READY · ${this.pressCount} ${this.pressCount === 1 ? 'PRESS' : 'PRESSES'}`;
          break;
      }
    }
  }
}
