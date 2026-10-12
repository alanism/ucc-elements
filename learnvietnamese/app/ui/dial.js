/**
 * Choir Dial — 5-Position Phrase Selector
 * Adapted from Enochian Knobs & Keys Control Atlas §6.1, §6.3
 */

const PHRASE_INTENTS = [
  { id: "cafe_01", index: 1, intent: "Order one iced coffee" },
  { id: "cafe_02", index: 2, intent: "Ask for less sugar" },
  { id: "cafe_03", index: 3, intent: "Specify no milk" },
  { id: "cafe_04", index: 4, intent: "Ask for some water" },
  { id: "cafe_05", index: 5, intent: "Ask to sit here" }
];

export class PhraseDialComponent {
  constructor(options = {}) {
    this.phrases = options.phrases || PHRASE_INTENTS;
    this.selectedIndex = options.selectedIndex || 1;
    this.disabled = options.disabled || false;
    this.onSelect = options.onSelect || (() => {});
    this.element = null;
  }

  render() {
    const div = document.createElement("div");
    div.className = "dial";
    div.id = "phrase-dial";
    div.setAttribute("role", "slider");
    div.setAttribute("tabindex", "0");
    div.setAttribute("aria-label", "Phrase selector dial");
    div.setAttribute("aria-valuemin", "1");
    div.setAttribute("aria-valuemax", String(this.phrases.length));
    div.setAttribute("aria-valuenow", String(this.selectedIndex));
    div.setAttribute("aria-valuetext", this.getAriaValueText());
    div.setAttribute("aria-disabled", String(this.disabled));
    div.style.cssText = "position: relative; width: 220px; height: 220px; cursor: grab; min-width: 44px; min-height: 44px;";

    div.innerHTML = `
      <div class="light-base" style="position: absolute; inset: 18px; border-radius: 50%; background: #efefef; box-shadow: 6px 10px 20px rgba(0,0,0,0.1);"></div>
      <div class="light-knob" id="phraseKnob" style="position: absolute; inset: 52px; border-radius: 50%; background: #fff; box-shadow: 4px 6px 14px rgba(0,0,0,0.15); transform: rotate(${this.getAngle()}deg); transition: transform 0.25s;">
        <div class="dot" style="position: absolute; left: 50%; top: 14%; width: 14px; height: 14px; border-radius: 50%; background: var(--accent); transform: translateX(-50%);"></div>
      </div>
      <div class="phrase-readout" aria-live="polite" style="position: absolute; bottom: -30px; left: 0; right: 0; text-align: center; font: 12px sans-serif; color: var(--muted);">
        ${this.disabled ? "Phrase dial disabled in LIVE mode" : this.getAriaValueText()}
      </div>
    `;

    div.addEventListener("keydown", (e) => {
      if (this.disabled) return;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        this.selectIndex(Math.min(this.phrases.length, this.selectedIndex + 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        this.selectIndex(Math.max(1, this.selectedIndex - 1));
      }
    });

    this.element = div;
    return div;
  }

  getAngle() {
    const step = 240 / (this.phrases.length - 1);
    return -120 + (this.selectedIndex - 1) * step;
  }

  getAriaValueText() {
    const item = this.phrases[this.selectedIndex - 1];
    return item ? `Position ${item.index} of ${this.phrases.length}: ${item.intent}` : "Phrase";
  }

  selectIndex(index) {
    if (this.disabled) return;
    this.selectedIndex = index;
    if (!this.element) return;
    this.element.setAttribute("aria-valuenow", String(this.selectedIndex));
    this.element.setAttribute("aria-valuetext", this.getAriaValueText());
    const knob = this.element.querySelector("#phraseKnob");
    if (knob) knob.style.transform = `rotate(${this.getAngle()}deg)`;
    const readout = this.element.querySelector(".phrase-readout");
    if (readout) readout.textContent = this.getAriaValueText();
    this.onSelect(this.phrases[this.selectedIndex - 1]);
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    if (!this.element) return;
    this.element.setAttribute("aria-disabled", String(disabled));
    this.element.style.opacity = disabled ? "0.5" : "1";
    this.element.style.cursor = disabled ? "not-allowed" : "grab";
    const readout = this.element.querySelector(".phrase-readout");
    if (readout) {
      readout.textContent = disabled ? "Phrase dial disabled in LIVE mode" : this.getAriaValueText();
    }
  }
}
