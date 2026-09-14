/**
 * Dark Instructional Phrase / Reference Panel UI Component
 * In accordance with approved Freeform tabletop mockup & Build Plan rd03 §6.1, §6.2
 * Preserves dark charcoal panel surface, 3-column table, and progressive disclosure
 */

const STATION_03_PHRASES = [
  {
    id: "cafe_01",
    english: "One iced coffee, please.",
    phonetic: "choh toy mot kah-feh dah",
    vietnamese: "Cho tôi một cà phê đá."
  },
  {
    id: "cafe_02",
    english: "Less sugar, please.",
    phonetic: "eet doong toy",
    vietnamese: "Ít đường thôi."
  },
  {
    id: "cafe_03",
    english: "No milk, please.",
    phonetic: "khong soo-ah",
    vietnamese: "Không sữa."
  },
  {
    id: "cafe_04",
    english: "Can I have some water?",
    phonetic: "choh toy sin eet nook",
    vietnamese: "Cho tôi xin ít nước."
  },
  {
    id: "cafe_05",
    english: "Can I sit here?",
    phonetic: "toy ngoy dai DOOK khong?",
    vietnamese: "Tôi ngồi đây được không?"
  }
];

export class LearningCard {
  constructor(options = {}) {
    this.container = options.container || null;
    this.onSelfReport = options.onSelfReport || (() => {});
    this.onReveal = options.onReveal || (() => {});
    this.onRequestHelp = options.onRequestHelp || (() => {});
    this.onNext = options.onNext || (() => {});
    this.onOptionSelect = options.onOptionSelect || (() => {});
    this.onReplay = options.onReplay || (() => {});
    this.onPlayAudio = options.onPlayAudio || options.onReplay || (() => {});
    this.onSelectPhrase = options.onSelectPhrase || (() => {});
    this.onSelectStation = options.onSelectStation || (() => {});
    this.phrases = options.phrases || STATION_03_PHRASES;
    this.state = {
      cardState: options.initialState || 'focus',
      phraseIndex: options.initialPhraseIndex || 0,
      phraseId: null,
      situationCue: '',
      targetVietnamese: '',
      pronunciationAid: '',
      vietnameseRevealed: false,
      attemptStatus: 'none',
      options: [],
      helpRequested: false,
      isGraded: true,
      station: null
    };
  }

  update(newState) {
    if (newState && newState.phrases) {
      this.phrases = newState.phrases;
    }
    this.state = { ...this.state, ...newState };
    this.render();
  }

  render() {
    if (!this.container) return;

    const cardState = this.state.cardState || 'focus';
    const situationCue = this.state.situationCue || this.state.meaningCue || this.state.english || '';
    const targetVietnamese = this.state.targetVietnamese || this.state.vietnameseTarget || this.state.vietnamese || '';
    const pronunciationAid = this.state.pronunciationAid || '';
    const vietnameseRevealed = this.state.vietnameseRevealed;
    const attemptStatus = this.state.attemptStatus || 'none';
    const options = this.state.options || [];

    let bodyContent = '';
    let footerContent = '';

    switch (cardState) {
      case 'station_unavailable':
        const unavailStation = this.state.station || { label: '??', name: 'Upcoming Station' };
        bodyContent = `
          <div class="card-hero-prompt" style="flex-direction: column; align-items: flex-start; text-align: left; margin: 16px 0 24px;">
            <div class="card-situation-cue" data-testid="meaning-cue" style="color: var(--accent); font-weight: 700; letter-spacing: 0.8px;">
              STATION ${unavailStation.label} · COMING SOON
            </div>
            <div class="hero-target-english" style="font-size: 22px; margin-top: 6px;">
              ${unavailStation.name || `Station ${unavailStation.label}`}
            </div>
            <p style="font-size: 13.5px; line-height: 1.6; color: #666672; margin-top: 14px; max-width: 520px;">
              Curriculum content and recordings for this station are currently in production. Station 03: At a Café is currently active.
            </p>
          </div>
        `;
        footerContent = `
          <button type="button" class="panel-action-btn primary" data-testid="btn-return-station" aria-label="Return to Station 03">
            Return to Station 03 (Café)
          </button>
        `;
        break;

      case 'overview':
        const overviewRows = this.phrases.map((p, idx) => `
          <tr class="phrase-table-row" data-idx="${idx}" style="cursor: pointer;">
            <td class="col-english">${p.english}</td>
            <td class="col-phonetic">${p.phonetic || p.pronunciationAid || ''}</td>
            <td class="col-vietnamese">${p.vietnamese}</td>
          </tr>
        `).join('');
        bodyContent = `
          <div class="card-situation-cue" data-testid="meaning-cue">
            Station 03: The Vietnamese Café · Five Essential Phrases
          </div>
          <table class="phrase-table" aria-label="Café Phrases Overview">
            <thead>
              <tr><th class="col-english">English</th><th class="col-phonetic">Say it like</th><th class="col-vietnamese">Vietnamese</th></tr>
            </thead>
            <tbody>${overviewRows}</tbody>
          </table>
        `;
        footerContent = `
          <button type="button" class="panel-action-btn primary" data-testid="btn-start" aria-label="Start practice session">
            Begin Practice
          </button>
        `;
        break;

      case 'recognition':
        const optionsList = (options || []).map((opt, idx) => `
          <button type="button" class="panel-action-btn secondary option-choice" data-idx="${idx}" data-testid="option-${idx}"
                  style="width: 100%; text-align: left; margin-bottom: 8px;">
            ${opt.intent}
          </button>
        `).join('');
        bodyContent = `
          <div class="card-situation-cue" data-testid="meaning-cue">
            ${situationCue || "Listen to the audio and select what the speaker requested:"}
          </div>
          <div class="card-options-list" role="radiogroup" aria-label="Phrase choices" style="margin-top: 14px;">
            ${optionsList}
          </div>
        `;
        break;

      case 'conversation':
        bodyContent = `
          <div class="card-situation-cue" data-testid="meaning-cue">
            ${situationCue || "You are conversing with Tutor Mai. Respond naturally in Vietnamese."}
          </div>
          <div style="padding: 16px; background: rgba(255,255,255,0.06); border-radius: 8px; margin-top: 12px; border-left: 3px solid var(--accent);">
            <div style="font-weight: 600; color: #fff;">TUTOR MAI · LIVE AUDIO SESSION</div>
            <div style="font-size: 13px; color: #aaa; margin-top: 4px;">WAITING FOR CODEX — WebRTC real-time audio channel</div>
          </div>
        `;
        footerContent = `
          <button type="button" class="panel-action-btn secondary" data-testid="btn-help-escape" aria-label="Ask Mai for help">
            Ask Mai for help
          </button>
        `;
        break;

      case 'correction':
        bodyContent = `
          <div class="card-situation-cue" data-testid="meaning-cue">
            ${situationCue || "Helpful tip from Tutor Mai:"}
          </div>
          <div class="card-repair-box" style="padding: 14px; background: rgba(255,255,255,0.06); border-left: 3px solid var(--accent); border-radius: 8px; margin-top: 12px;">
            <div style="font-weight: 600; color: #fff;">${targetVietnamese}</div>
            <div style="font-size: 13px; color: #aaa; margin-top: 4px;">${pronunciationAid}</div>
          </div>
        `;
        footerContent = `
          <button type="button" class="panel-action-btn primary" data-testid="btn-next">
            Understood
          </button>
        `;
        break;

      case 'discovery':
        bodyContent = `
          <div class="card-situation-cue" data-testid="meaning-cue">
            New Phrase Discovered: <strong>${targetVietnamese}</strong> (${situationCue})
          </div>
          <p style="font-size: 13px; color: #aaa; margin-top: 8px;">This candidate will be saved for parent review before addition to your curriculum.</p>
        `;
        footerContent = `
          <button type="button" class="panel-action-btn primary" data-testid="btn-next">
            Save for Review
          </button>
        `;
        break;

      case 'review':
        bodyContent = `
          <div class="card-situation-cue" data-testid="meaning-cue">
            Session Summary & Recap
          </div>
          <div class="card-target-text revealed" data-testid="target-text" aria-live="polite" style="font-size: 18px; font-weight: 600; color: #fff; margin-top: 12px;">
            ${targetVietnamese || "All five café phrases completed."}
          </div>
          ${pronunciationAid ? `<div class="card-phonetic-guide" style="color: #aaa; font-family: var(--font-mono); margin-top: 4px;">${pronunciationAid}</div>` : ''}
        `;
        footerContent = `
          <button type="button" class="panel-action-btn primary" data-testid="btn-next">
            Finish Session
          </button>
        `;
        break;

      case 'focus':
      case 'retrieval':
      default:
        // Match active phrase index from state, phraseId, targetVietnamese, or situationCue
        let activeIdx = -1;
        if (typeof this.state.phraseIndex === 'number' && this.state.phraseIndex >= 0 && this.state.phraseIndex < this.phrases.length) {
          activeIdx = this.state.phraseIndex;
        } else if (this.state.phraseId) {
          activeIdx = this.phrases.findIndex(p => p.id === this.state.phraseId);
        }
        if (activeIdx === -1) {
          activeIdx = this.phrases.findIndex(p => p.vietnamese === targetVietnamese || p.english === situationCue);
        }
        if (activeIdx === -1) activeIdx = 0;

        const activePhrase = this.phrases[activeIdx] || this.phrases[0];
        const heroEnglish = activePhrase.english;

        const tableRows = this.phrases.map((p, idx) => {
          const isActive = idx === activeIdx;
          const displayVietnamese = p.renderedVietnamese || p.vietnamese;
          if (isActive) {
            const engText = p.english;
            const phonHtml = vietnameseRevealed 
              ? (pronunciationAid || p.phonetic)
              : `<span class="concealed-dots intentional-veil" aria-hidden="true" title="Veiled until active retrieval"><span class="veil-badge">VEILED</span><span class="veil-dots">••••••••••••</span></span>`;
            const vietHtml = vietnameseRevealed
              ? `<span class="card-target-text revealed" data-testid="target-text" aria-live="polite">${targetVietnamese || displayVietnamese}</span>`
              : `<span class="card-target-text concealed intentional-veil" data-testid="target-text" aria-hidden="true" title="Veiled until active retrieval"><span class="veil-badge">VEILED</span><span class="veil-dots">••••••••••••</span></span>`;

            return `
              <tr class="phrase-table-row active-row" data-idx="${idx}" tabindex="0" role="button" aria-label="Phrase ${idx + 1}: ${engText}. Currently active." style="cursor: pointer;" aria-selected="true">
                <td class="col-english">${engText}</td>
                <td class="col-phonetic">${phonHtml}</td>
                <td class="col-vietnamese">${vietHtml}</td>
              </tr>
            `;
          } else {
            // Non-active phrases
            const isTarget = (p.vietnamese === targetVietnamese || p.renderedVietnamese === targetVietnamese);
            const viet = (isTarget && !vietnameseRevealed) ? `<span class="concealed-dots intentional-veil" aria-hidden="true"><span class="veil-badge">VEILED</span><span class="veil-dots">••••••••••••</span></span>` : displayVietnamese;
            const phon = (isTarget && !vietnameseRevealed) ? `<span class="concealed-dots intentional-veil" aria-hidden="true"><span class="veil-badge">VEILED</span><span class="veil-dots">••••••••••••</span></span>` : (p.phonetic || p.pronunciationAid || '');
            return `
              <tr class="phrase-table-row" data-idx="${idx}" tabindex="0" role="button" aria-label="Select phrase ${idx + 1}: ${p.english}" style="cursor: pointer;" aria-selected="false">
                <td class="col-english">${p.english}</td>
                <td class="col-phonetic">${phon}</td>
                <td class="col-vietnamese">${viet}</td>
              </tr>
            `;
          }
        }).join('');

        const stationNoticeHtml = this.state.stationNotice
          ? `<div class="card-station-notice" style="font-size: 11px; font-weight: 700; letter-spacing: 0.8px; color: #888894; text-transform: uppercase; margin-bottom: 6px;">${this.state.stationNotice}</div>`
          : '';

        bodyContent = `
          <div class="card-hero-prompt">
            <div class="hero-prompt-text">
              ${stationNoticeHtml}
              <div class="card-situation-cue" data-testid="meaning-cue">
                ${situationCue || "Listen to native pronunciation for:"}
              </div>
              <div class="hero-target-english">
                “${heroEnglish}”
              </div>
            </div>
            <button type="button" class="hero-play-btn" id="btn-hero-play" data-testid="btn-play-hero" aria-label="Play native audio for ${heroEnglish}">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--accent)"><polygon points="7,5 19,12 7,19"/></svg>
            </button>
          </div>
          <div class="phrase-table-wrap">
            <table class="phrase-table" aria-label="${this.state.stationTitle ? this.state.stationTitle + ' Phrases Table' : 'Café Phrases Table'}">
              <thead>
                <tr><th class="col-english">English</th><th class="col-phonetic">Say it like</th><th class="col-vietnamese">Vietnamese</th></tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        `;

        const isAttempted = attemptStatus === 'attempted' || attemptStatus === 'self_reported';

        if (isAttempted && !vietnameseRevealed) {
          footerContent = `
            <button type="button" class="panel-action-btn primary" data-testid="btn-reveal" aria-label="Reveal Vietnamese phrase">
              Show phrase
            </button>
          `;
        } else if (!vietnameseRevealed) {
          footerContent = `
            <button type="button" class="panel-action-btn secondary" data-testid="btn-show-phrase-direct" aria-label="Show phrase without attempt">
              Show phrase
            </button>
            <button type="button" class="panel-action-btn primary" data-testid="btn-attempt" aria-label="I have tried speaking">
              I've tried
            </button>
          `;
        } else {
          footerContent = `
            <button type="button" class="panel-action-btn primary" data-testid="btn-next" aria-label="Continue to next step">
              Next
            </button>
          `;
        }
        break;
    }

    const isUnavailable = cardState === 'station_unavailable';
    const unavailStation = this.state.station || { label: '??', name: 'Upcoming Station' };
    const currentPhraseIndex = (this.state && typeof this.state.phraseIndex === 'number') 
      ? this.state.phraseIndex + 1 
      : 1;

    const headerLeft = isUnavailable
      ? `STATION ${unavailStation.label} · STATUS`
      : `1. AT A RESTAURANT<span class="visually-hidden" style="display:none;" aria-hidden="true"> SITUATION</span>`;
    const headerRight = isUnavailable
      ? `<span class="card-counter" style="color: var(--accent);">COMING SOON</span>`
      : `<span class="card-counter">PHRASE ${currentPhraseIndex} / 5</span>`;

    this.container.innerHTML = `
      <div class="ivory-card-shell state-${cardState}" id="ivoryCard" role="region" aria-label="Instructional Learning Card">
        <div class="panel-header card-header">
          <span class="panel-topic-title card-topic-title">${headerLeft}</span>
          ${headerRight}
        </div>
        <div class="card-body">
          ${bodyContent}
        </div>
        <div class="panel-actions card-footer">
          ${footerContent}
        </div>
      </div>
    `;

    // Event listeners
    const attemptBtn = this.container.querySelector ? this.container.querySelector('[data-testid="btn-attempt"]') : null;
    if (attemptBtn) {
      attemptBtn.addEventListener('click', () => {
        this.update({ attemptStatus: 'attempted' });
        this.onSelfReport();
      });
    }

    const revealBtn = this.container.querySelector ? this.container.querySelector('[data-testid="btn-reveal"]') : null;
    if (revealBtn) {
      revealBtn.addEventListener('click', () => {
        this.update({ vietnameseRevealed: true });
        this.onReveal({ attempted: true });
      });
    }

    const directRevealBtn = this.container.querySelector ? this.container.querySelector('[data-testid="btn-show-phrase-direct"]') : null;
    if (directRevealBtn) {
      directRevealBtn.addEventListener('click', () => {
        this.update({ vietnameseRevealed: true, isGraded: false });
        this.onReveal({ attempted: false, supportEscape: true });
      });
    }

    const nextBtn = this.container.querySelector ? this.container.querySelector('[data-testid="btn-next"], [data-testid="btn-start"]') : null;
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.onNext());
    }

    const returnStationBtn = this.container.querySelector ? this.container.querySelector('[data-testid="btn-return-station"]') : null;
    if (returnStationBtn) {
      returnStationBtn.addEventListener('click', () => {
        if (typeof this.onSelectStation === 'function') {
          this.onSelectStation('station_03');
        }
      });
    }

    const phraseRows = typeof this.container.querySelectorAll === 'function' ? this.container.querySelectorAll('.phrase-table-row') : [];
    phraseRows.forEach(row => {
      const selectHandler = () => {
        const idx = Number(row.getAttribute('data-idx'));
        if (!isNaN(idx) && typeof this.onSelectPhrase === 'function') {
          this.onSelectPhrase(idx);
        }
      };
      row.addEventListener('click', selectHandler);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (typeof e.preventDefault === 'function') e.preventDefault();
          selectHandler();
        }
      });
    });

    const optionBtns = typeof this.container.querySelectorAll === 'function' ? this.container.querySelectorAll('.option-choice') : [];
    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-idx'));
        this.onOptionSelect(idx);
      });
    });

    const heroPlayBtn = this.container.querySelector ? this.container.querySelector('#btn-hero-play') : null;
    if (heroPlayBtn) {
      heroPlayBtn.addEventListener('click', () => {
        if (typeof this.onPlayAudio === 'function') this.onPlayAudio();
      });
    }
  }
}
