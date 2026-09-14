/**
 * UCC Vietnamese Radio Main Application Core
 * In accordance with Build Plan rd03 §2.1, §5–6 and M1 Café Deployment Brief
 * 
 * Drives the complete tactile radio instrument and the 10-stage DLIC pedagogical loop:
 * 1. Situation
 * 2. Ear-first Model
 * 3. Echo
 * 4. Retrieval
 * 5. Recognition
 * 6. Frame Variation
 * 7. Role-play with Mai (ephemeral GPT-Live 1)
 * 8. Repair
 * 9. Transfer
 * 10. Recap
 */

import { LiveClient, collectLesson } from './live/client.js';
import { createKdliContextFn } from './live/kdli-scene-context.js';
import { AudioController } from './audio/controller.js';
import { BrowserMediaAdapter, ASSET_MAP } from './audio/browser-adapter.js';
import { presentationReducer, INITIAL_PRESENTATION_STATE } from './state/presentation-reducer.js';
import { ReceiverComponent } from './ui/receiver.js';
import { ClockComponent } from './ui/clock.js';
import { ModeSwitchComponent } from './ui/switch.js';
import { PhraseDialComponent } from './ui/dial.js';
import { OrdinalVeilComponent } from './ui/ordinal-veil.js';
import { HelpButtonComponent } from './ui/help-button.js';
import { ConversationCalibratorComponent, DEFAULT_CONVERSATION_CONTEXT } from './ui/conversation-calibrator.js';
import { MaiConsoleComponent } from './ui/mai-console.js';
import { WaveformComponent } from './ui/waveform.js';
import { SafeCaptionView } from './ui/captions.js';
import { LearningCard } from './ui/card.js';
import { ParentSummaryView } from './ui/parent-summary.js';
import { ContextualAudioRouter, STATION_METADATA } from './audio/contextual-router.js';

export const CAFE_PHRASES = [
  {
    id: "cafe_01",
    index: 1,
    vietnamese: "Cho tôi một cà phê đá.",
    english: "One iced coffee, please.",
    pronunciationAid: "choh toy mot kah-feh dah",
    situationPrompt: "You walk up to the café counter and order an iced black coffee.",
    cues: {
      level1: "Cho…",
      level2: "Cho tôi…",
      level3: "Cho tôi một cà phê đá."
    },
    audioAsset: "cafe_01",
    cueL1Asset: "cafe_01_cue_l1",
    cueL2Asset: "cafe_01_cue_l2"
  },
  {
    id: "cafe_02",
    index: 2,
    vietnamese: "Ít đường thôi.",
    english: "Less sugar, please.",
    pronunciationAid: "eet doong toy",
    situationPrompt: "You prefer your coffee with only a little sweetness.",
    cues: {
      level1: "Ít…",
      level2: "Ít đường…",
      level3: "Ít đường thôi."
    },
    audioAsset: "cafe_02",
    cueL1Asset: "cafe_02_cue_l1",
    cueL2Asset: "cafe_02_cue_l2"
  },
  {
    id: "cafe_03",
    index: 3,
    vietnamese: "Không sữa.",
    english: "No milk, please.",
    pronunciationAid: "khong soo-ah",
    situationPrompt: "You specify that you want your coffee black, without condensed milk.",
    cues: {
      level1: "Không…",
      level2: "Không…",
      level3: "Không sữa."
    },
    audioAsset: "cafe_03",
    cueL1Asset: "cafe_03_cue_l1",
    cueL2Asset: "cafe_03_cue_l2"
  },
  {
    id: "cafe_04",
    index: 4,
    vietnamese: "Cho tôi xin ít nước.",
    english: "Can I have some water?",
    pronunciationAid: "choh toy sin eet nook",
    situationPrompt: "You feel thirsty while waiting and ask politely for a glass of water.",
    cues: {
      level1: "Cho…",
      level2: "Cho tôi xin…",
      level3: "Cho tôi xin ít nước."
    },
    audioAsset: "cafe_04",
    cueL1Asset: "cafe_04_cue_l1",
    cueL2Asset: "cafe_04_cue_l2"
  },
  {
    id: "cafe_05",
    index: 5,
    vietnamese: "Tôi ngồi đây được không?",
    english: "Can I sit here?",
    pronunciationAid: "toy ngoy dai DOOK khong?",
    situationPrompt: "The café is busy. You spot an empty chair and ask politely if you may sit.",
    cues: {
      level1: "Tôi…",
      level2: "Tôi ngồi đây…",
      level3: "Tôi ngồi đây được không?"
    },
    audioAsset: "cafe_05",
    cueL1Asset: "cafe_05_cue_l1",
    cueL2Asset: "cafe_05_cue_l2"
  }
];

export const REPAIR_PHRASES = [
  { id: 'repair_11_01', vietnamese: 'Tôi không hiểu.', english: "I don't understand.", audio: 'repair_11_01' },
  { id: 'repair_11_02', vietnamese: 'Làm ơn nói chậm hơn.', english: "Please speak more slowly.", audio: 'repair_11_02' },
  { id: 'repair_12_03', vietnamese: 'Chờ một chút.', english: "Please wait a moment.", audio: 'repair_12_03' }
];

export const RECOGNITION_TASKS = {
  cafe_01: {
    prompt: "Listen to the English cue or Vietnamese audio. What was ordered?",
    correctIndex: 0,
    options: [
      { intent: "One iced coffee, please.", isCorrect: true, distractorAsset: null },
      { intent: "One iced tea, please.", isCorrect: false, distractorAsset: "recog_distractor_01" },
      { intent: "One hot milk coffee, please.", isCorrect: false, distractorAsset: null }
    ]
  },
  cafe_02: {
    prompt: "Mai gave a special request about sweetness. What was it?",
    correctIndex: 1,
    options: [
      { intent: "No sugar, please.", isCorrect: false, distractorAsset: null },
      { intent: "Less sugar, please.", isCorrect: true, distractorAsset: null },
      { intent: "Extra sugar, please.", isCorrect: false, distractorAsset: "recog_distractor_02" }
    ]
  },
  cafe_03: {
    prompt: "Listen closely to the order specification.",
    correctIndex: 0,
    options: [
      { intent: "No milk, please.", isCorrect: true, distractorAsset: null },
      { intent: "With milk, please.", isCorrect: false, distractorAsset: "recog_distractor_03" },
      { intent: "Hot milk, please.", isCorrect: false, distractorAsset: null }
    ]
  },
  cafe_04: {
    prompt: "What extra item did the speaker request?",
    correctIndex: 0,
    options: [
      { intent: "Can I have some water?", isCorrect: true, distractorAsset: null },
      { intent: "Can I have some coffee?", isCorrect: false, distractorAsset: "recog_distractor_04" },
      { intent: "Can I have a napkin?", isCorrect: false, distractorAsset: null }
    ]
  },
  cafe_05: {
    prompt: "The customer walked up to a table and asked something. What was it?",
    correctIndex: 1,
    options: [
      { intent: "Can I stand here?", isCorrect: false, distractorAsset: "recog_distractor_05" },
      { intent: "Can I sit here?", isCorrect: true, distractorAsset: null },
      { intent: "Where is the restroom?", isCorrect: false, distractorAsset: null }
    ]
  }
};

export const DLIC_STAGES = [
  'situation',
  'ear_first_model',
  'echo',
  'retrieval',
  'recognition',
  'frame_variation',
  'roleplay',
  'repair',
  'transfer',
  'recap'
];

export class RadioApp {
  constructor(options = {}) {
    this.basePath = options.basePath || '';
    
    // Support injected mediaAdapter or create BrowserMediaAdapter
    const audioOpts = options.audioOptions || {};
    if (audioOpts.mediaAdapter) {
      this.mediaAdapter = audioOpts.mediaAdapter;
    } else {
      this.mediaAdapter = new BrowserMediaAdapter({ basePath: this.basePath });
    }

    this.audioController = new AudioController({
      ...audioOpts,
      mediaAdapter: this.mediaAdapter
    });

    this.phrases = options.phrases || CAFE_PHRASES;
    this.activePhraseIndex = 0;
    this.activeStageIndex = 0;
    this.mode = 'PLAY'; // 'PLAY' | 'LIVE'
    this.isPoweredOn = false;
    this.helpLevel = 0;

    this.presentationState = INITIAL_PRESENTATION_STATE;
    this.cardContainer = options.cardContainer || (typeof document !== 'undefined' ? document.getElementById('card-container') : null);

    // Component instances
    this.receiver = null;
    this.calibrator = null;
    this.clock = null;
    this.maiConsole = null;
    this.modeSwitch = null;
    this.phraseDial = null;
    this.ordinalVeil = null;
    this.waveform = null;
    this.helpButton = null;
    this.captionView = null;
    this.currentStationId = options.currentStationId || 'station_03';
    let persistedContext = {};
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('ucc_viet_radio_conversation_context');
        if (raw) persistedContext = JSON.parse(raw);
      } catch (e) {}
    }
    this.conversationContext = {
      ...DEFAULT_CONVERSATION_CONTEXT,
      ...persistedContext,
      ...(options.conversationContext || {})
    };
    this.currentRoute = null;
    this.currentVoice = null;

    this.contextualRouter = new ContextualAudioRouter({
      basePath: this.basePath,
      routesData: options.routesData
    });
    this.syncContextualPhrases();

    this.card = new LearningCard({
      container: this.cardContainer,
      onSelfReport: () => this.handleSelfReport(),
      onReveal: () => this.handleReveal(),
      onNext: () => this.handleNext(),
      onOptionSelect: (idx) => this.handleOptionSelect(idx),
      onSelectPhrase: (idx) => this.loadPhraseByIndex(idx, true),
      onSelectStation: (stId) => this.handleStationChange(stId),
      onPlayAudio: () => {
        const currentPhrase = this.phrases[this.activePhraseIndex];
        if (currentPhrase) {
          if (!this.isPoweredOn) this.powerOn();
          this.playPhraseAudio(currentPhrase.id);
        }
      }
    });

    // Timer management
    this.timerInterval = null;
    this.sessionRemainingSeconds = 600; // 10 minutes

    this.onStateChange = options.onStateChange || (() => {});
    if (typeof window !== 'undefined' && typeof RTCPeerConnection !== 'undefined') {
      this.liveClient = new LiveClient({
        // KDLI scene context when the KDLI runtime has an active scene, the legacy lesson
        // context otherwise. Reading through a getter rather than a snapshot, because the
        // learner can advance a stage between opening the panel and connecting.
        context: createKdliContextFn({
          assetMap: this.kdliAssetMap ?? null,
          getScene: () => this.kdliScene ?? null,
          fallback: () => collectLesson(this)
        }), waveform: () => this.waveform,
        onState: (state, message) => {
          this.liveStatus = state; this.liveMessage = message;
          if (this.mode === 'LIVE') {
            this.maiConsole?.setStatus(state);
            const status = document.getElementById('live-status');
            if (status) status.textContent = message || ({ connecting: 'Connecting…', ready: 'Ready. Hold Mai to speak, then release.', listening: 'Listening…', thinking: 'Thinking…', speaking: 'Mai speaking' }[state] || state);
          }
        }
      });
      this.mediaAdapter.liveClient = this.liveClient;
      window.addEventListener('pagehide', () => { void this.liveClient.close(); });
      window.addEventListener('blur', () => { void this.liveClient.release(); });
      document.addEventListener('visibilitychange', () => { if (document.hidden) void this.liveClient.close(); });
    }
  }

  syncContextualPhrases() {
    if (!this.contextualRouter) return;
    const stNum = this.contextualRouter.normalizeStationId(this.currentStationId);
    const stationPhrases = this.contextualRouter.getStationPhrases(stNum, this.conversationContext);

    if (stNum === '03') {
      this.phrases = CAFE_PHRASES.map((cp, idx) => {
        const sp = stationPhrases[idx] || {};
        return {
          ...cp,
          phonetic: cp.pronunciationAid || sp.phonetic || '',
          pronunciationAid: cp.pronunciationAid || sp.phonetic || '',
          vietnamese: sp.renderedVietnamese || cp.vietnamese,
          renderedVietnamese: sp.renderedVietnamese || cp.vietnamese,
          contextualAsset: sp.publicPath || null,
          voice: sp.voice || null,
          routeKey: sp.routeKey || null
        };
      });
    } else {
      this.phrases = stationPhrases.map(sp => ({
        id: sp.id,
        index: sp.index,
        vietnamese: sp.renderedVietnamese,
        renderedVietnamese: sp.renderedVietnamese,
        english: sp.english,
        phonetic: sp.phonetic,
        situationPrompt: sp.english,
        audioAsset: sp.publicPath || sp.id,
        contextualAsset: sp.publicPath || null,
        voice: sp.voice || null,
        routeKey: sp.routeKey || null
      }));
    }

    const active = this.phrases[this.activePhraseIndex] || this.phrases[0];
    if (active) {
      this.currentRoute = this.contextualRouter.resolveRoute(stNum, active.id, this.conversationContext);
      const rawVoice = this.currentRoute ? this.currentRoute.voice : (active.voice || null);
      this.currentVoice = (rawVoice && typeof rawVoice === 'object') ? rawVoice.name : rawVoice;
    }
  }

  init() {
    this.readyPromise = this.contextualRouter.init().then(() => {
      this.syncContextualPhrases();
      if (this.card) {
        this.renderCurrentCardState ? this.renderCurrentCardState() : this.renderLearningCard();
      }
      this.notifyState();
      return this;
    });
    this.syncContextualPhrases();
    if (typeof document !== 'undefined') {
      this.mountComponents();
    }
    this.audioController.subscribe(() => {
      this.notifyState();
    });
    return this.readyPromise;
  }

  mountComponents() {
    if (typeof document === 'undefined') return;

    // 1. Receiver Component
    const receiverEl = document.getElementById('receiver-container');
    if (receiverEl) {
      this.receiver = new ReceiverComponent({
        theme: 'light',
        power: this.isPoweredOn,
        volume: 80,
        statusLine1: 'STATION 03 · CAFÉ',
        statusLine2: 'PHRASE 1 / 5',
        onPowerToggle: (on) => {
          if (on) this.powerOn();
          else this.powerOff();
        },
        onVolumeChange: (vol) => {
          if (this.mediaAdapter && this.mediaAdapter.setGain) {
            this.mediaAdapter.setGain(vol / 100);
          }
        }
      });
      receiverEl.innerHTML = '';
      receiverEl.appendChild(this.receiver.render());
    }

    // 2. Who's Talking? Conversation Calibrator Component
    const calibratorEl = document.getElementById('calibrator-container');
    if (calibratorEl) {
      this.calibrator = new ConversationCalibratorComponent({
        initialContext: this.conversationContext,
        onChange: (ctx) => {
          this.setConversationContext(ctx);
        }
      });
      this.conversationContext = this.calibrator.getContext();
      calibratorEl.innerHTML = '';
      calibratorEl.appendChild(this.calibrator.render());
    }

    // 3. Vigil Clock Component
    const clockEl = document.getElementById('clock-container');
    if (clockEl) {
      this.clock = new ClockComponent({
        totalSeconds: 600,
        onStart: () => this.startClock(),
        onPause: () => this.pauseClock(),
        onReset: () => this.resetClock()
      });
      clockEl.innerHTML = '';
      clockEl.appendChild(this.clock.render());
    }

    // 4. Unified Mai Interaction Console (Push Button + PLAY/LIVE Switch)
    const maiConsoleEl = document.getElementById('mai-console-container') || document.getElementById('help-container');
    if (maiConsoleEl) {
      this.maiConsole = new MaiConsoleComponent({
        initialMode: this.mode,
        onHelp: () => this.handleHelp(),
        onTalkPress: () => { void this.liveClient?.press(); },
        onTalkRelease: () => { void this.liveClient?.release(); },
        onModeToggle: (newMode) => this.switchMode(newMode)
      });
      this.helpButton = this.maiConsole; // backwards-compatible alias
      this.modeSwitch = this.maiConsole; // backwards-compatible alias
      maiConsoleEl.innerHTML = '';
      maiConsoleEl.appendChild(this.maiConsole.render());
    }

    // Legacy switch container fallback if standalone element exists
    const switchEl = document.getElementById('switch-container');
    if (switchEl && !this.maiConsole) {
      this.modeSwitch = new ModeSwitchComponent({
        initialMode: this.mode,
        onModeToggle: (newMode) => this.switchMode(newMode)
      });
      switchEl.innerHTML = '';
      switchEl.appendChild(this.modeSwitch.render());
    }

    // 5. Choir Dial Component
    const dialEl = document.getElementById('dial-container');
    if (dialEl) {
      this.phraseDial = new PhraseDialComponent({
        phrases: this.phrases.map((p, i) => ({ id: p.id, index: i + 1, intent: p.english })),
        selectedIndex: this.activePhraseIndex + 1,
        onSelect: (item) => {
          const idx = item.index - 1;
          this.loadPhraseByIndex(idx, true);
        }
      });
      dialEl.innerHTML = '';
      dialEl.appendChild(this.phraseDial.render());
    }

    // 6. Ordinal Veil Component (12-Station Selector)
    const veilEl = document.getElementById('veil-container');
    if (veilEl) {
      this.ordinalVeil = new OrdinalVeilComponent({
        activeStationId: this.currentStationId || 'station_03',
        onStationChange: (stId) => this.handleStationChange(stId)
      });
      veilEl.innerHTML = '';
      veilEl.appendChild(this.ordinalVeil.render());
    }

    // 7. Audio Waveform Signal Scope Component
    const waveformEl = document.getElementById('waveform-container');
    if (waveformEl) {
      this.waveform = new WaveformComponent({
        initialState: 'idle'
      });
      waveformEl.innerHTML = '';
      waveformEl.appendChild(this.waveform.render());
    }

    // 7. Captions Component
    const captionsEl = document.getElementById('captions-container');
    if (captionsEl) {
      this.captionView = new SafeCaptionView({
        container: captionsEl,
        context: { activity: 'focus', attemptStatus: 'none' }
      });
      this.captionView.render();
    }

    // 8. Learning Card initial render
    this.renderCurrentCardState();

    // 9. Parent Summary Component & Toggle
    const parentToggleEl = document.getElementById('parent-toggle-container');
    const parentContainerEl = document.getElementById('parent-container');
    if (parentToggleEl && parentContainerEl) {
      const pBtn = document.createElement('button');
      pBtn.type = 'button';
      pBtn.className = 'card-action-btn secondary';
      pBtn.style.cssText = 'min-height: 44px; padding: 8px 16px; border-radius: 999px; font-size: 12px; cursor: pointer;';
      pBtn.textContent = 'Parent Review';
      pBtn.setAttribute('aria-expanded', 'false');
      pBtn.setAttribute('aria-controls', 'parent-container');

      this.parentSummary = new ParentSummaryView({
        container: parentContainerEl,
        currentUser: { role: 'parent', id: 'parent_alan' },
        discoveries: [
          { id: 'disc_01', vietnamese: 'Cà phê đen đá', english: 'Black iced coffee', status: 'proposed' },
          { id: 'disc_02', vietnamese: 'Cho thêm đá', english: 'Extra ice, please', status: 'proposed' }
        ]
      });

      let parentVisible = false;
      parentContainerEl.style.display = 'none';

      pBtn.addEventListener('click', () => {
        parentVisible = !parentVisible;
        pBtn.setAttribute('aria-expanded', String(parentVisible));
        parentContainerEl.style.display = parentVisible ? 'block' : 'none';
        if (parentVisible) {
          this.parentSummary.render();
        }
      });

      parentToggleEl.innerHTML = '';
      parentToggleEl.appendChild(pBtn);
    }
  }

  powerOn() {
    this.isPoweredOn = true;
    this.audioController.dispatch({ type: 'POWER_ON' });
    this.audioController.dispatch({ type: 'START_SESSION' });

    if (this.receiver) {
      this.receiver.setPower(true);
      const stNum = this.contextualRouter ? this.contextualRouter.normalizeStationId(this.currentStationId) : '03';
      const activeP = this.phrases[this.activePhraseIndex] || this.phrases[0];
      const vi = activeP ? (activeP.renderedVietnamese || activeP.vietnamese) : '';
      this.receiver.setStatus(`STATION ${stNum} · PHRASE ${this.activePhraseIndex + 1}/5`, vi);
    }

    this.startClock();
    this.notifyState();
  }

  powerOff() {
    if (this.mode === 'LIVE') this.switchMode('PLAY');
    this.isPoweredOn = false;
    this.audioController.dispatch({ type: 'POWER_OFF' });
    if (this.mediaAdapter && this.mediaAdapter.stopRecordedAudio) {
      this.mediaAdapter.stopRecordedAudio();
    }
    if (this.waveform) {
      this.waveform.setState('idle');
    }
    this.pauseClock();

    if (this.receiver) {
      this.receiver.setPower(false);
      const stNum = this.contextualRouter ? this.contextualRouter.normalizeStationId(this.currentStationId) : '03';
      const meta = (STATION_METADATA && STATION_METADATA[stNum]) ? STATION_METADATA[stNum] : { title: 'Café' };
      this.receiver.setStatus(`STATION ${stNum} · ${meta.title.toUpperCase()}`, `PHRASE ${this.activePhraseIndex + 1} / 5`);
    }

    this.presentationState = INITIAL_PRESENTATION_STATE;
    if (this.card) {
      const stNum = this.contextualRouter ? this.contextualRouter.normalizeStationId(this.currentStationId) : '03';
      const meta = (STATION_METADATA && STATION_METADATA[stNum]) ? STATION_METADATA[stNum] : { title: 'Café' };
      this.card.update({
        cardState: 'overview',
        situationCue: `Radio is powered off. Press the power button to start practicing Station ${stNum}: ${meta.title}.`
      });
    }

    this.notifyState();
  }

  startClock() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.clock) this.clock.start();

    this.timerInterval = setInterval(() => {
      if (this.sessionRemainingSeconds > 0) {
        this.sessionRemainingSeconds--;
        if (this.clock) {
          this.clock.update(this.sessionRemainingSeconds, 'running');
        }

        if (this.sessionRemainingSeconds <= 30 && this.activeStageIndex < DLIC_STAGES.indexOf('recap')) {
          this.setStage('recap');
        }
      } else {
        this.pauseClock();
        this.setStage('recap');
      }
    }, 1000);

    if (this.timerInterval && typeof this.timerInterval.unref === 'function') {
      this.timerInterval.unref();
    }
  }

  pauseClock() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.clock) this.clock.pause();
  }

  resetClock() {
    this.pauseClock();
    this.sessionRemainingSeconds = 600;
    if (this.clock) this.clock.reset();
  }

  loadPhrase(phrase) {
    this._microSliceMode = true;
    this.audioController.dispatch({ type: 'SELECT_PHRASE', phraseId: phrase.id });
    this.presentationState = presentationReducer(this.presentationState, {
      type: 'LOAD_PHRASE',
      phraseId: phrase.id,
      vietnamese: phrase.vietnamese,
      english: phrase.english,
      activity: 'first_introduction'
    });

    this.audioController.dispatch({ type: 'PLAY_RECORDED_AUDIO', phraseId: phrase.id });
    if (this.mediaAdapter && this.mediaAdapter.playRecorded) {
      this.mediaAdapter.playRecorded(phrase.id);
    }

    if (this.card) {
      this.card.update({
        cardState: 'focus',
        phraseId: phrase.id,
        situationCue: phrase.english,
        targetVietnamese: phrase.vietnamese,
        pronunciationAid: phrase.pronunciationAid || '',
        vietnameseRevealed: false,
        attemptStatus: 'none'
      });
    }

    this.notifyState();
  }

  loadPhraseByIndex(index, playAudio = false) {
    this.activePhraseIndex = Math.max(0, Math.min(this.phrases.length - 1, index));
    const phrase = this.phrases[this.activePhraseIndex];
    this.activeStageIndex = 0;
    this.helpLevel = 0;

    this.presentationState = presentationReducer(this.presentationState, {
      type: 'LOAD_PHRASE',
      phraseId: phrase.id,
      vietnamese: phrase.vietnamese,
      english: phrase.english,
      activity: 'first_introduction'
    });

    if (this.audioController && this.isPoweredOn) {
      this.audioController.dispatch({ type: 'SELECT_PHRASE', phraseId: phrase.id });
    }

    if (this.phraseDial && typeof document !== 'undefined') {
      this.phraseDial.selectedIndex = this.activePhraseIndex + 1;
      const knob = document.getElementById('phraseKnob');
      if (knob) knob.style.transform = `rotate(${this.phraseDial.getAngle()}deg)`;
      const ro = document.querySelector('.phrase-readout');
      if (ro) ro.textContent = this.phraseDial.getAriaValueText();
    }

    if (this.receiver) {
      const stNum = this.contextualRouter ? this.contextualRouter.normalizeStationId(this.currentStationId) : '03';
      const meta = (STATION_METADATA && STATION_METADATA[stNum]) ? STATION_METADATA[stNum] : { title: 'Café' };
      const vi = phrase.renderedVietnamese || phrase.vietnamese;
      if (this.isPoweredOn) {
        this.receiver.setStatus(`STATION ${stNum} · PHRASE ${this.activePhraseIndex + 1}/5`, vi);
      } else {
        this.receiver.setStatus(`STATION ${stNum} · ${meta.title.toUpperCase()}`, `PHRASE ${this.activePhraseIndex + 1} / 5`);
      }
    }

    if (this.captionView) {
      this.captionView.setContext({ activity: 'focus', attemptStatus: 'none' });
    }

    this.renderCurrentCardState();

    if (playAudio) {
      if (!this.isPoweredOn) this.powerOn();
      else this.playPhraseAudio(phrase.id);
    }

    this.notifyState();
  }

  playPhraseAudio(phraseId) {
    const stNum = this.contextualRouter ? this.contextualRouter.normalizeStationId(this.currentStationId) : '03';
    const targetId = phraseId || (this.phrases[this.activePhraseIndex] ? this.phrases[this.activePhraseIndex].id : 'cafe_01');
    const route = this.contextualRouter ? this.contextualRouter.resolveRoute(stNum, targetId, this.conversationContext) : null;

    this.currentRoute = route;
    const rawVoice = route ? route.voice : null;
    this.currentVoice = (rawVoice && typeof rawVoice === 'object') ? rawVoice.name : rawVoice;

    const audioPath = route ? route.public_path : targetId;

    this.audioController.dispatch({ type: 'PLAY_RECORDED_AUDIO', phraseId: targetId });
    if (this.waveform) this.waveform.setState('speaking', 0.6);
    if (this.mediaAdapter && this.mediaAdapter.playRecorded) {
      this.mediaAdapter.playRecorded(audioPath, () => {
        if (this.waveform) this.waveform.setState('idle');
      });
    }
  }

  setStage(stageName) {
    const idx = DLIC_STAGES.indexOf(stageName);
    if (idx !== -1) {
      this.activeStageIndex = idx;
      this.renderCurrentCardState();
      this.notifyState();
    }
  }

  renderCurrentCardState() {
    if (!this.card) return;

    const stNum = this.contextualRouter ? this.contextualRouter.normalizeStationId(this.currentStationId) : '03';
    const meta = (STATION_METADATA && STATION_METADATA[stNum]) ? STATION_METADATA[stNum] : { title: 'Café' };

    if (!this.isPoweredOn && typeof document !== 'undefined' && !this.cardContainer) {
      this.card.update({
        cardState: 'overview',
        situationCue: `Radio is powered off. Press the power button to start practicing Station ${stNum}: ${meta.title}.`
      });
      return;
    }

    if (this.mode === 'LIVE') {
      this.renderLiveWaitingState();
      return;
    }

    const currentPhrase = this.phrases[this.activePhraseIndex];
    if (!currentPhrase) return;

    const activeVietnamese = currentPhrase.renderedVietnamese || currentPhrase.vietnamese;
    const isPhrasePractice = stNum !== '03';

    if (isPhrasePractice) {
      this.card.update({
        cardState: 'focus',
        stationNotice: 'Phrase Practice Available · Full lesson sequence in production',
        stationTitle: `Station ${stNum} (${meta.title})`,
        phraseIndex: this.activePhraseIndex,
        phraseId: currentPhrase.id,
        phrases: this.phrases,
        situationCue: currentPhrase.english,
        targetVietnamese: activeVietnamese,
        pronunciationAid: currentPhrase.phonetic || '',
        vietnameseRevealed: this.presentationState.vietnameseRevealed,
        attemptStatus: this.presentationState.attemptStatus
      });
      return;
    }

    const stage = DLIC_STAGES[this.activeStageIndex];

    switch (stage) {
      case 'situation':
        this.card.update({
          cardState: 'focus',
          stationNotice: null,
          stationTitle: `Station 03 (${meta.title})`,
          phrases: this.phrases,
          phraseIndex: this.activePhraseIndex,
          phraseId: currentPhrase.id,
          situationCue: currentPhrase.situationPrompt || currentPhrase.english,
          targetVietnamese: activeVietnamese,
          pronunciationAid: currentPhrase.pronunciationAid || '',
          vietnameseRevealed: false,
          attemptStatus: 'none'
        });
        break;

      case 'ear_first_model':
        this.card.update({
          cardState: 'focus',
          stationNotice: null,
          stationTitle: `Station 03 (${meta.title})`,
          phrases: this.phrases,
          phraseIndex: this.activePhraseIndex,
          phraseId: currentPhrase.id,
          situationCue: `Listen to native pronunciation for: "${currentPhrase.english}"`,
          targetVietnamese: activeVietnamese,
          pronunciationAid: currentPhrase.pronunciationAid || '',
          vietnameseRevealed: false,
          attemptStatus: 'none'
        });
        break;

      case 'echo':
        this.card.update({
          cardState: 'retrieval',
          stationNotice: null,
          stationTitle: `Station 03 (${meta.title})`,
          phrases: this.phrases,
          phraseIndex: this.activePhraseIndex,
          phraseId: currentPhrase.id,
          situationCue: `Echo Practice: Speak aloud in Vietnamese: "${currentPhrase.english}"`,
          targetVietnamese: activeVietnamese,
          pronunciationAid: currentPhrase.pronunciationAid || '',
          vietnameseRevealed: false,
          attemptStatus: this.presentationState.attemptStatus
        });
        break;

      case 'retrieval':
        this.card.update({
          cardState: 'retrieval',
          stationNotice: null,
          stationTitle: `Station 03 (${meta.title})`,
          phrases: this.phrases,
          phraseIndex: this.activePhraseIndex,
          phraseId: currentPhrase.id,
          situationCue: `Retrieval Check: Without looking, how do you say "${currentPhrase.english}"?`,
          targetVietnamese: activeVietnamese,
          pronunciationAid: currentPhrase.pronunciationAid || '',
          vietnameseRevealed: this.presentationState.vietnameseRevealed,
          attemptStatus: this.presentationState.attemptStatus
        });
        break;

      case 'recognition':
        const task = RECOGNITION_TASKS[currentPhrase.id] || RECOGNITION_TASKS['cafe_01'];
        this.card.update({
          cardState: 'recognition',
          stationNotice: null,
          stationTitle: `Station 03 (${meta.title})`,
          phrases: this.phrases,
          phraseIndex: this.activePhraseIndex,
          phraseId: currentPhrase.id,
          situationCue: task.prompt,
          options: task.options,
          attemptStatus: 'none'
        });
        break;

      case 'frame_variation':
        let varCue = `Slot Variation: Swap words into the pattern: "Cho tôi một [drink]…"\nTry saying: "Cho tôi một nước." (One water, please.)`;
        if (currentPhrase.id === 'cafe_05') {
          varCue = `Slot Variation: "[Action] được không?"\nTry saying: "Tôi ngồi đây được không?" (Can I sit here?)`;
        }
        this.card.update({
          cardState: 'focus',
          stationNotice: null,
          stationTitle: `Station 03 (${meta.title})`,
          phrases: this.phrases,
          phraseIndex: this.activePhraseIndex,
          phraseId: currentPhrase.id,
          situationCue: varCue,
          targetVietnamese: activeVietnamese,
          pronunciationAid: currentPhrase.pronunciationAid || '',
          vietnameseRevealed: true,
          attemptStatus: 'attempted'
        });
        break;

      case 'roleplay':
        this.card.update({
          cardState: 'conversation',
          stationNotice: null,
          stationTitle: `Station 03 (${meta.title})`,
          phrases: this.phrases,
          phraseIndex: this.activePhraseIndex,
          phraseId: currentPhrase.id,
          situationCue: `Role-play with Mai: Mai says: "Chào bạn! Bạn muốn uống gì?" (Hello! What would you like to drink?)\nRespond with: "${activeVietnamese}"`,
          targetVietnamese: activeVietnamese,
          pronunciationAid: currentPhrase.pronunciationAid || '',
          vietnameseRevealed: true
        });
        break;

      case 'repair':
        const rItem = REPAIR_PHRASES[0];
        this.card.update({
          cardState: 'correction',
          stationNotice: null,
          stationTitle: `Station 03 (${meta.title})`,
          phrases: this.phrases,
          phraseIndex: this.activePhraseIndex,
          phraseId: currentPhrase.id,
          situationCue: `Repair Pack: If you didn't catch what Mai said, use this phrase:`,
          targetVietnamese: rItem.vietnamese,
          pronunciationAid: `(${rItem.english}) — "Làm ơn nói chậm hơn" (speak slower) or "Chờ một chút" (wait a moment)`
        });
        break;

      case 'transfer':
        this.card.update({
          cardState: 'focus',
          stationNotice: null,
          stationTitle: `Station 03 (${meta.title})`,
          phrases: this.phrases,
          phraseIndex: this.activePhraseIndex,
          phraseId: currentPhrase.id,
          situationCue: `Held-Out Transfer Mission: You want an iced black coffee, but customized: less sugar AND no milk!\nCombine phrases 1, 2, and 3:\n"Cho tôi một cà phê đá, ít đường, không sữa."`,
          targetVietnamese: "Cho tôi một cà phê đá, ít đường, không sữa.",
          pronunciationAid: "choh toy mot kah-feh dah, eet doong, khong soo-ah",
          vietnameseRevealed: true,
          attemptStatus: 'attempted'
        });
        break;

      case 'recap':
        const summary = this.phrases.map((p, i) => `${i + 1}. ${p.renderedVietnamese || p.vietnamese} (${p.english})`).join('<br/>');
        this.card.update({
          cardState: 'review',
          stationNotice: null,
          stationTitle: `Station 03 (${meta.title})`,
          phrases: this.phrases,
          phraseIndex: this.activePhraseIndex,
          phraseId: currentPhrase.id,
          situationCue: 'Session Recap: Station 03: At a Café Completed!',
          targetVietnamese: summary,
          pronunciationAid: 'Excellent work! You can turn the Choir Dial to revisit any phrase, or practice again.'
        });
        break;
    }
  }

  renderLiveWaitingState() {
    const cardEl = this.cardContainer || (typeof document !== 'undefined' ? document.getElementById('card-container') : null);
    if (!cardEl) return;

    cardEl.innerHTML = `
      <div class="ivory-card-shell state-conversation" role="region" aria-label="Live practice with Mai">
        <div class="card-header"><span class="card-situation-label">TUTOR MAI · LIVE</span></div>
        <div class="card-body">
          <p id="live-status" role="status" aria-live="polite"></p>
          <p>Hold the Mai button while you speak. Release to hear Mai respond. Take your time.</p>
          <p>No conversation audio or transcripts are saved by this app.</p>
        </div>
        <div class="card-footer"><button type="button" class="card-action-btn primary" id="btn-return-play">Return to PLAY</button></div>
      </div>`;
    document.getElementById('live-status').textContent = this.liveMessage || (this.liveStatus === 'ready' ? 'Ready. Hold Mai to speak, then release.' : 'Connecting…');

    const returnBtn = document.getElementById('btn-return-play');
    if (returnBtn) {
      returnBtn.addEventListener('click', () => {
        this.switchMode('PLAY');
        if (this.modeSwitch) {
          this.modeSwitch.setMode('PLAY');
        }
      });
    }
  }

  handleSelfReport() {
    this.presentationState = presentationReducer(this.presentationState, {
      type: 'SELF_REPORT_ATTEMPT'
    });
    if (this.card) {
      this.card.update({
        attemptStatus: 'self_reported'
      });
    }
    this.notifyState();
  }

  handleReveal() {
    this.presentationState = presentationReducer(this.presentationState, {
      type: 'REVEAL_TARGET'
    });
    if (this.card) {
      this.card.update({
        vietnameseRevealed: true
      });
    }
    this.notifyState();
  }

  handleNext() {
    if (this._microSliceMode && (this.presentationState.activeActivity === 'first_introduction' || this.presentationState.activeActivity === 'focus')) {
      this.presentationState = presentationReducer(this.presentationState, {
        type: 'TRANSITION_ACTIVITY',
        activity: 'retrieval'
      });
      if (this.card) {
        this.card.update({
          cardState: 'retrieval',
          vietnameseRevealed: false,
          attemptStatus: 'none'
        });
      }
      this.notifyState();
      return;
    }

    // 1. If currently in recap or review state, restart at phrase 1
    if (this.activeStageIndex === DLIC_STAGES.indexOf('recap') || (this.card && this.card.state.cardState === 'review')) {
      this.loadPhraseByIndex(0, true);
      return;
    }

    // 2. If currently on a coming soon station, return to station 03
    if (this.card && this.card.state.cardState === 'station_unavailable') {
      this.handleStationChange('station_03');
      return;
    }

    // 3. If in overview, start phrase 1
    if (this.card && this.card.state.cardState === 'overview') {
      this.loadPhraseByIndex(0, true);
      return;
    }

    // 4. Advance phrase: Phrase 1 (idx 0) -> Phrase 2 (idx 1) -> Phrase 3 (idx 2) -> Phrase 4 (idx 3) -> Phrase 5 (idx 4)
    if (this.activePhraseIndex < this.phrases.length - 1) {
      this.loadPhraseByIndex(this.activePhraseIndex + 1, true);
    } else {
      // At Phrase 5: transition to session recap / summary
      this.setStage('recap');
    }
    this.notifyState();
  }

  handleStationChange(stationId) {
    this.currentStationId = stationId;
    const stNum = this.contextualRouter ? this.contextualRouter.normalizeStationId(stationId) : '03';
    const meta = (STATION_METADATA && STATION_METADATA[stNum]) ? STATION_METADATA[stNum] : { title: `Station ${stNum}` };

    if (this.ordinalVeil) {
      this.ordinalVeil.setActiveStation(stationId);
    }

    if (this.mediaAdapter && this.mediaAdapter.stopRecordedAudio) {
      this.mediaAdapter.stopRecordedAudio();
    }
    if (this.waveform) {
      this.waveform.setState('idle');
    }

    const sublabel = typeof document !== 'undefined' ? document.querySelector('.station-selector-wrapper .control-sublabel') : null;

    if (stNum === '03') {
      if (this.phraseDial) this.phraseDial.setDisabled(false);
      if (sublabel) sublabel.innerHTML = '<strong>Station Selector</strong><br/>03: Café Active';
      this.syncContextualPhrases();
      this.loadPhraseByIndex(this.activePhraseIndex, false);
      return;
    }

    // Stations 01, 02, 04–12: Phrase Practice Mode
    this.activePhraseIndex = 0;
    this.activeStageIndex = 0;
    this.helpLevel = 0;
    this.syncContextualPhrases();

    if (this.phraseDial) {
      this.phraseDial.setDisabled(false);
      this.phraseDial.selectedIndex = 1;
      const knob = typeof document !== 'undefined' ? document.getElementById('phraseKnob') : null;
      if (knob) knob.style.transform = `rotate(${this.phraseDial.getAngle()}deg)`;
      const ro = typeof document !== 'undefined' ? document.querySelector('.phrase-readout') : null;
      if (ro) ro.textContent = this.phraseDial.getAriaValueText();
    }

    if (sublabel) {
      sublabel.innerHTML = `<strong>Station Selector</strong><br/>${stNum}: ${meta.title}`;
    }

    const firstPhrase = this.phrases[0];
    const vi = firstPhrase ? (firstPhrase.renderedVietnamese || firstPhrase.vietnamese) : '';

    if (this.receiver) {
      if (this.isPoweredOn) {
        this.receiver.setStatus(`STATION ${stNum} · PHRASE 1/5`, vi);
      } else {
        this.receiver.setStatus(`STATION ${stNum} · ${meta.title.toUpperCase()}`, 'PHRASE 1 / 5');
      }
    }

    if (this.card && firstPhrase) {
      this.card.update({
        cardState: 'focus',
        stationNotice: 'Phrase Practice Available · Full lesson sequence in production',
        stationTitle: `Station ${stNum} (${meta.title})`,
        phraseIndex: 0,
        phraseId: firstPhrase.id,
        phrases: this.phrases,
        situationCue: firstPhrase.english,
        targetVietnamese: vi,
        pronunciationAid: firstPhrase.phonetic || '',
        vietnameseRevealed: false,
        attemptStatus: 'none'
      });
    }

    if (this.audioController && firstPhrase) {
      this.audioController.dispatch({ type: 'SELECT_PHRASE', phraseId: firstPhrase.id });
    }

    this.notifyState();
  }

  handleOptionSelect(choiceIdx) {
    const currentPhrase = this.phrases[this.activePhraseIndex];
    const task = RECOGNITION_TASKS[currentPhrase.id] || RECOGNITION_TASKS['cafe_01'];
    const chosen = task.options[choiceIdx];

    if (chosen && chosen.isCorrect) {
      this.playPhraseAudio(currentPhrase.id);
      setTimeout(() => {
        this.handleNext();
      }, 900);
    } else if (chosen && chosen.distractorAsset) {
      if (this.mediaAdapter && this.mediaAdapter.playRecorded) {
        this.mediaAdapter.playRecorded(chosen.distractorAsset);
      }
      if (typeof window !== 'undefined' && window.alert) {
        alert(`That means: "${chosen.intent}". Try listening again!`);
      }
    } else {
      if (typeof window !== 'undefined' && window.alert) {
        alert(`Not quite. Try another option!`);
      }
    }
  }

  handleHelp() {
    if (!this.isPoweredOn || this.mode === 'LIVE') return;

    this.helpLevel = Math.min(3, this.helpLevel + 1);
    const phrase = this.phrases[this.activePhraseIndex];

    this.presentationState = presentationReducer(this.presentationState, {
      type: 'REQUEST_HELP'
    });

    if (this.helpLevel === 1) {
      if (this.mediaAdapter && this.mediaAdapter.playRecorded) {
        this.mediaAdapter.playRecorded(phrase.cueL1Asset);
      }
      if (this.card) {
        this.card.update({
          situationCue: `[HELP Level 1] First word hint: "${phrase.cues.level1}"`,
          targetVietnamese: phrase.cues.level1,
          vietnameseRevealed: true
        });
      }
    } else if (this.helpLevel === 2) {
      if (this.mediaAdapter && this.mediaAdapter.playRecorded) {
        this.mediaAdapter.playRecorded(phrase.cueL2Asset);
      }
      if (this.card) {
        this.card.update({
          situationCue: `[HELP Level 2] Sentence fragment hint: "${phrase.cues.level2}"`,
          targetVietnamese: phrase.cues.level2,
          vietnameseRevealed: true
        });
      }
    } else {
      this.playPhraseAudio(phrase.id);
      if (this.card) {
        this.card.update({
          situationCue: `[HELP Level 3] Full Model: "${phrase.english}"`,
          targetVietnamese: phrase.vietnamese,
          pronunciationAid: phrase.pronunciationAid,
          vietnameseRevealed: true
        });
      }
    }

    this.notifyState();
  }

  switchMode(newMode) {
    if (newMode === this.mode) return;
    if (newMode === 'LIVE' && !this.isPoweredOn) this.powerOn();
    this.mode = newMode;
    this.audioController.dispatch({ type: 'SWITCH_MODE', mode: newMode.toLowerCase() });

    if (this.maiConsole) {
      this.maiConsole.setMode(newMode);
    }
    if (this.modeSwitch && typeof this.modeSwitch.setMode === 'function') {
      this.modeSwitch.setMode(newMode);
    }

    if (newMode === 'LIVE') {
      if (this.phraseDial) this.phraseDial.setDisabled(true);
      if (this.receiver) this.receiver.setStatus('STATION 03 · CAFÉ', `PHRASE ${this.activePhraseIndex + 1} / 5`);
      this.renderLiveWaitingState();
      // Toggling LIVE is the whole ritual: open a session quietly in the background. If it
      // cannot be opened the learner sees one quiet line and Return to PLAY, never a gate.
      void this.liveClient?.ensure?.();
    } else {
      this.liveStatus = 'ready'; this.liveMessage = '';
      this.mediaAdapter.setGain?.(0.8);
      this.maiConsole?.setStatus('ready');
      this.waveform?.setState('idle');
      if (this.phraseDial) this.phraseDial.setDisabled(false);
      const phrase = this.phrases[this.activePhraseIndex];
      if (this.receiver && this.isPoweredOn) {
        this.receiver.setStatus(`STATION 03 · PHRASE ${this.activePhraseIndex + 1}/5`, phrase.vietnamese);
      }
      this.presentationState = presentationReducer(this.presentationState, {
        type: 'RETURN_TO_PLAY'
      });
      this.renderCurrentCardState();
    }

    this.notifyState();
  }

  getConversationContext() {
    return this.calibrator ? this.calibrator.getContext() : { ...this.conversationContext };
  }

  setConversationContext(newCtx) {
    this.conversationContext = { ...this.conversationContext, ...newCtx };
    if (this.calibrator) {
      this.calibrator.context = { ...this.conversationContext };
      this.calibrator.savePersistedContext();
      this.calibrator.renderState();
    }

    this.syncContextualPhrases();

    const activePhrase = this.phrases[this.activePhraseIndex];
    if (this.card) {
      this.renderCurrentCardState();
    }

    if (this.receiver) {
      const stNum = this.contextualRouter ? this.contextualRouter.normalizeStationId(this.currentStationId) : '03';
      const meta = (STATION_METADATA && STATION_METADATA[stNum]) ? STATION_METADATA[stNum] : { title: 'Café' };
      if (this.isPoweredOn && activePhrase) {
        this.receiver.setStatus(`STATION ${stNum} · PHRASE ${this.activePhraseIndex + 1}/5`, activePhrase.renderedVietnamese || activePhrase.vietnamese);
      } else {
        this.receiver.setStatus(`STATION ${stNum} · ${meta.title.toUpperCase()}`, `PHRASE ${this.activePhraseIndex + 1} / 5`);
      }
    }

    this.notifyState();
  }

  getCurrentVoice() {
    if (this.currentVoice && typeof this.currentVoice === 'object') {
      return this.currentVoice.name || null;
    }
    return this.currentVoice;
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  getContextualRouter() {
    return this.contextualRouter;
  }

  notifyState() {
    this.onStateChange({
      mode: this.mode,
      isPoweredOn: this.isPoweredOn,
      activePhraseIndex: this.activePhraseIndex,
      activeStage: DLIC_STAGES[this.activeStageIndex],
      presentationState: this.presentationState,
      audioState: this.audioController.getState(),
      conversationContext: this.getConversationContext(),
      currentVoice: this.currentVoice,
      currentRoute: this.currentRoute,
      waveformState: this.waveform ? this.waveform.state : 'idle'
    });
  }
}

// Browser bootstrap
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const boot = () => {
    if (!window.__RADIO_APP_INSTANCE__) {
      const isSubpath = window.location.pathname.startsWith('/learnvietnamese');
      const basePath = isSubpath ? '/learnvietnamese/' : '';

      const app = new RadioApp({ basePath });
      app.init();
      window.__RADIO_APP_INSTANCE__ = app;
      window.app = app;
      console.log('UCC Vietnamese Radio initialized successfully.');
    }
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}
