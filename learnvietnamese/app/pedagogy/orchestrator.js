/**
 * Pedagogical Learning Loop Orchestrator
 * In accordance with Build Plan rd03 §6.2, §9.4 and Task P6b.2
 */

import { CANONICAL_ITEMS } from '../../scripts/audio/plan.js';

export const DLIC_ACTIVITIES = [
  'first_introduction',
  'echo',
  'retrieval',
  'recognition',
  'transfer',
  'review'
];

export class LessonOrchestrator {
  constructor(options = {}) {
    this.card = options.card || null;
    this.timer = options.timer || null;
    this.outbox = options.outbox || null;
    this.onActivityChange = options.onActivityChange || (() => {});
    this.onSessionComplete = options.onSessionComplete || (() => {});

    this.phrases = CANONICAL_ITEMS.filter(i => i.type === 'full');
    this.currentPhraseIndex = 0;
    this.activityIndex = 0;
    this.activeChallengeId = null;
    this.history = [];
  }

  get currentPhrase() {
    return this.phrases[this.currentPhraseIndex] || this.phrases[0];
  }

  get currentActivity() {
    return DLIC_ACTIVITIES[this.activityIndex] || 'first_introduction';
  }

  startLesson() {
    this.currentPhraseIndex = 0;
    this.activityIndex = 0;
    this._loadCurrentStep();
  }

  nextStep() {
    // Check if session timer allows starting next challenge (>= 45s)
    if (this.timer && !this.timer.canStartChallenge() && this.activityIndex < DLIC_ACTIVITIES.length - 1) {
      // If remaining time < 45s, jump directly to recap and review
      this.activityIndex = DLIC_ACTIVITIES.indexOf('review');
      this._loadCurrentStep();
      return;
    }

    if (this.activityIndex < DLIC_ACTIVITIES.length - 1) {
      this.activityIndex++;
    } else {
      // Completed all activities for current phrase, advance to next phrase
      if (this.currentPhraseIndex < this.phrases.length - 1) {
        this.currentPhraseIndex++;
        this.activityIndex = 0;
      } else {
        // All 5 phrases completed
        this.activityIndex = DLIC_ACTIVITIES.indexOf('review');
        this._loadCurrentStep();
        this.onSessionComplete();
        return;
      }
    }

    this._loadCurrentStep();
  }

  selectPhraseIndex(index) {
    this.currentPhraseIndex = Math.max(0, Math.min(this.phrases.length - 1, index));
    this.activityIndex = 0;
    this._loadCurrentStep();
  }

  _loadCurrentStep() {
    const phrase = this.currentPhrase;
    const activity = this.currentActivity;
    this.activeChallengeId = `ch-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;

    let cardState = 'focus';
    let situationCue = `You are ordering at the café: ${phrase.text}`;
    let vietnameseRevealed = false;
    let options = [];

    switch (activity) {
      case 'first_introduction':
        cardState = 'focus';
        situationCue = `Listen to the model phrase for: ${phrase.text}`;
        vietnameseRevealed = false;
        break;

      case 'echo':
        cardState = 'focus';
        situationCue = `Repeat after Mai: ${phrase.text}`;
        vietnameseRevealed = false;
        break;

      case 'retrieval':
        cardState = 'retrieval';
        situationCue = `Challenge: Recall how to say "${phrase.text}" in Vietnamese without looking!`;
        vietnameseRevealed = false;
        break;

      case 'recognition':
        cardState = 'recognition';
        situationCue = `Listen to the audio and choose the correct English meaning:`;
        options = [
          { intent: 'One iced coffee, please' },
          { intent: 'Less sugar, please' },
          { intent: 'No milk, please' }
        ];
        break;

      case 'transfer':
        cardState = 'conversation';
        situationCue = `Mai asks you a question at the table. Respond using your café phrases!`;
        break;

      case 'review':
        cardState = 'review';
        situationCue = `Session Complete! Review your five café anchors.`;
        vietnameseRevealed = true;
        break;
    }

    if (this.card) {
      this.card.update({
        cardState,
        situationCue,
        targetVietnamese: phrase.text,
        vietnameseRevealed,
        attemptStatus: 'none',
        options
      });
    }

    this.onActivityChange({
      phraseId: phrase.id,
      activity,
      challengeId: this.activeChallengeId
    });
  }
}
