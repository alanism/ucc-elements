/**
 * Canonical Tactile Talk Button / Tutor Mai Physical Control
 * Restores canonical concave button with UCC Cinnabar Red outer ring
 * and Andy-Allen-style tactile game feel (aesthetic sensation of control).
 */

export class HelpButtonComponent {
  constructor(options = {}) {
    this.onHelp = options.onHelp || (() => {});
    this.element = null;
    this.isPressed = false;
    this.pressCount = 0;
  }

  render() {
    const stage = document.createElement("div");
    stage.className = "talk-dial-wrapper";
    stage.id = "help-button-stage";
    stage.style.cssText = "display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; user-select: none;";

    // Top Cinnabar Indicator LED
    const led = document.createElement("div");
    led.className = "talk-dial-led";
    led.id = "talkDialLed";
    led.style.cssText = `
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #CC0000;
      margin-bottom: 12px;
      box-shadow: 0 0 5px rgba(204, 0, 0, 0.6);
      transition: background-color 0.15s ease, box-shadow 0.15s ease;
    `;

    // Canonical Outer Ring / Machined Socket (Approved UCC Cinnabar Red)
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

    // Canonical Dished Ivory Push Button (#help-button)
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "talk-dial-btn concave-button";
    btn.id = "help-button";
    btn.setAttribute("aria-label", "Press to talk with Mai");
    btn.setAttribute("aria-pressed", "false");
    btn.style.cssText = `
      width: 98px;
      height: 98px;
      min-width: var(--min-touch-target, 44px);
      min-height: var(--min-touch-target, 44px);
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

    // Subtle specular reflection on the upper rim of the dish
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

    // Simplified Canonical Copy
    const labelWrap = document.createElement("div");
    labelWrap.className = "talk-dial-labels";
    labelWrap.style.cssText = "display: flex; flex-direction: column; align-items: center; text-align: center; margin-top: 14px;";

    const statusLine = document.createElement("div");
    statusLine.className = "talk-dial-status";
    statusLine.id = "talkDialStatus";
    statusLine.style.cssText = "font: 700 11px var(--font-mono, monospace); color: #111111; letter-spacing: 0.8px; text-transform: uppercase;";
    statusLine.textContent = `READY · ${this.pressCount} PRESSES`;

    const titleLine = document.createElement("div");
    titleLine.style.cssText = "font: 600 12.5px var(--font-sans, sans-serif); color: #222226; margin-top: 3px;";
    titleLine.textContent = "Press to talk with Mai";

    labelWrap.appendChild(statusLine);
    labelWrap.appendChild(titleLine);

    // Mechanical Andy Allen Game Feel Transitions
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const press = () => {
      this.isPressed = true;
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

        this.onHelp();
      }
    };

    btn.addEventListener("pointerdown", press);
    btn.addEventListener("pointerup", release);
    btn.addEventListener("pointerleave", release);
    btn.addEventListener("pointercancel", release);

    btn.addEventListener("keydown", (e) => {
      if (!e.repeat && (e.key === " " || e.key === "Enter")) {
        press();
      }
    });
    btn.addEventListener("keyup", (e) => {
      if (e.key === " " || e.key === "Enter") {
        release();
      }
    });

    socket.appendChild(btn);
    stage.appendChild(led);
    stage.appendChild(socket);
    stage.appendChild(labelWrap);

    this.element = stage;
    return stage;
  }
}
