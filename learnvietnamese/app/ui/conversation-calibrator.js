/**
 * Who's Talking? — Conversation Calibrator Physical Settings Plate
 * In accordance with Enochian Knobs & Keys Control Atlas & Drams—037 Canonical Toggle Switch
 * Subordinate physical instrument positioned directly beneath the Aether Receiver.
 */

export const DEFAULT_CONVERSATION_CONTEXT = {
  learnerGender: "female",        // "female" | "male"
  listenerGender: "female",       // "female" | "male"
  learnerRelativeAge: "younger",  // "younger" | "older"
  audience: "one"                 // "one" | "group"
};

const STORAGE_KEY = 'ucc_viet_radio_conversation_context';

export class ConversationCalibratorComponent {
  constructor(options = {}) {
    this.onChange = options.onChange || (() => {});
    this.context = {
      ...DEFAULT_CONVERSATION_CONTEXT,
      ...this.loadPersistedContext(),
      ...(options.initialContext || {})
    };
    this.element = null;
  }

  loadPersistedContext() {
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) {
        console.warn('Could not read conversationContext from localStorage:', e);
      }
    }
    return {};
  }

  savePersistedContext() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.context));
      } catch (e) {
        console.warn('Could not save conversationContext to localStorage:', e);
      }
    }
  }

  getContext() {
    return { ...this.context };
  }

  updateSetting(key, value) {
    if (this.context[key] === value) return;
    this.context[key] = value;
    this.savePersistedContext();
    this.renderState();
    this.onChange(this.getContext());
  }

  render() {
    const plate = document.createElement("div");
    plate.className = "calibrator-plate";
    plate.id = "conversation-calibrator";
    plate.setAttribute("role", "region");
    plate.setAttribute("aria-label", "Who's Talking conversation calibrator");
    plate.style.cssText = `
      width: 280px;
      background: #fdfdfd;
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 10px;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04);
      padding: 14px 16px 16px;
      color: #111111;
      box-sizing: border-box;
      margin-top: 14px;
      user-select: none;
    `;

    plate.innerHTML = `
      <div class="calibrator-header" style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #ebebee; padding-bottom: 8px; margin-bottom: 12px;">
        <span class="calibrator-title" style="font: 700 11px var(--font-mono, monospace); letter-spacing: 1.4px; color: #111; text-transform: uppercase;">WHO’S TALKING?</span>
        <span class="calibrator-tag" style="font: 600 9px var(--font-mono, monospace); letter-spacing: 0.8px; color: #777; text-transform: uppercase;">CALIBRATOR</span>
      </div>
      <div class="calibrator-rows" style="display: flex; flex-direction: column; gap: 10px;">
        ${this.buildToggleRowHtml("learnerGender", "A. I AM", "FEMALE", "MALE", this.context.learnerGender === "male")}
        ${this.buildToggleRowHtml("listenerGender", "B. THEY ARE", "FEMALE", "MALE", this.context.listenerGender === "male")}
        ${this.buildToggleRowHtml("learnerRelativeAge", "C. RELATIVE TO THEM", "YOUNGER", "OLDER", this.context.learnerRelativeAge === "older")}
        ${this.buildToggleRowHtml("audience", "D. I’M TALKING TO", "ONE", "GROUP", this.context.audience === "group")}
      </div>
    `;

    this.attachEventListeners(plate);
    this.element = plate;
    return plate;
  }

  buildToggleRowHtml(key, rowLabel, optA, optB, isB) {
    return `
      <div class="calibrator-row" data-key="${key}" style="display: flex; flex-direction: column; gap: 4px;">
        <span style="font: 600 9.5px var(--font-mono, monospace); letter-spacing: 0.6px; color: #666; text-transform: uppercase;">${rowLabel}</span>
        <div style="display: flex; align-items: center; justify-content: space-between; background: #f6f6f8; border-radius: 6px; padding: 4px 8px; border: 1px solid #ebebee;">
          <span class="opt-label opt-a ${!isB ? 'active-opt' : ''}" style="font: ${!isB ? '700' : '500'} 10px var(--font-sans, sans-serif); color: ${!isB ? '#111' : '#888'}; min-width: 55px;">${optA}</span>
          <button type="button" class="mini-drams-toggle" role="switch" aria-checked="${isB}" data-key="${key}" aria-label="${rowLabel}: ${optA} or ${optB}" style="
            width: 44px;
            height: 22px;
            border-radius: 999px;
            background: ${isB ? "var(--accent, #CC0000)" : "#dcdce0"};
            border: 0;
            padding: 2px;
            position: relative;
            cursor: pointer;
            touch-action: manipulation;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.18), inset 0 -1px 1px rgba(255,255,255,0.7);
            outline-offset: 2px;
            transition: background 0.18s ease;
          ">
            <span class="mini-knob" style="
              display: block;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: radial-gradient(circle at 35% 30%, #ffffff, #f4f4f4 70%, #ececec);
              box-shadow: 0 2px 4px rgba(0,0,0,0.25);
              transform: translateX(${isB ? "22px" : "0px"});
              transition: transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1);
            "></span>
          </button>
          <span class="opt-label opt-b ${isB ? 'active-opt' : ''}" style="font: ${isB ? '700' : '500'} 10px var(--font-sans, sans-serif); color: ${isB ? '#111' : '#888'}; min-width: 55px; text-align: right;">${optB}</span>
        </div>
      </div>
    `;
  }

  attachEventListeners(rootEl) {
    const buttons = rootEl.querySelectorAll ? rootEl.querySelectorAll('.mini-drams-toggle') : [];
    buttons.forEach(btn => {
      const key = btn.getAttribute('data-key');
      btn.addEventListener('click', () => {
        let nextVal;
        if (key === 'learnerGender') nextVal = this.context.learnerGender === 'female' ? 'male' : 'female';
        else if (key === 'listenerGender') nextVal = this.context.listenerGender === 'female' ? 'male' : 'female';
        else if (key === 'learnerRelativeAge') nextVal = this.context.learnerRelativeAge === 'younger' ? 'older' : 'younger';
        else if (key === 'audience') nextVal = this.context.audience === 'one' ? 'group' : 'one';
        this.updateSetting(key, nextVal);
      });
    });
  }

  renderState() {
    if (!this.element) return;
    const rows = this.element.querySelectorAll ? this.element.querySelectorAll('.calibrator-row') : [];
    rows.forEach(row => {
      const key = row.getAttribute('data-key');
      const btn = row.querySelector('.mini-drams-toggle');
      const knob = row.querySelector('.mini-knob');
      const optA = row.querySelector('.opt-a');
      const optB = row.querySelector('.opt-b');
      let isB = false;
      if (key === 'learnerGender') isB = this.context.learnerGender === 'male';
      else if (key === 'listenerGender') isB = this.context.listenerGender === 'male';
      else if (key === 'learnerRelativeAge') isB = this.context.learnerRelativeAge === 'older';
      else if (key === 'audience') isB = this.context.audience === 'group';

      if (btn) {
        btn.setAttribute('aria-checked', String(isB));
        btn.style.background = isB ? "var(--accent, #CC0000)" : "#dcdce0";
      }
      if (knob) {
        knob.style.transform = `translateX(${isB ? "22px" : "0px"})`;
      }
      if (optA) {
        optA.style.fontWeight = !isB ? '700' : '500';
        optA.style.color = !isB ? '#111' : '#888';
      }
      if (optB) {
        optB.style.fontWeight = isB ? '700' : '500';
        optB.style.color = isB ? '#111' : '#888';
      }
    });
  }
}
