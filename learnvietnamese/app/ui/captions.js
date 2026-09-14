/**
 * Safe Realtime Closed Captions UI
 * In accordance with Build Plan rd03 §6.2, §8.2 and Task P6b.1
 */

import { evaluateCaptionPolicy } from '../state/caption-policy.js';
import { escapeHtml } from '../utils/string.js';

export { escapeHtml };

export class SafeCaptionView {
  constructor(options = {}) {
    this.container = options.container || null;
    this.currentContext = options.context || { activity: 'focus', attemptStatus: 'none' };
    this.history = [];
    this.activeStreamingText = '';
  }

  setContext(newContext) {
    this.currentContext = { ...this.currentContext, ...newContext };
    this.render();
  }

  ingestDelta(speakerRole, textDelta, isFinal = false) {
    this.activeStreamingText += textDelta;

    if (isFinal) {
      this.history.push({
        role: speakerRole,
        text: this.activeStreamingText,
        timestamp: Date.now()
      });
      this.activeStreamingText = '';
    }

    this.render();
  }

  render() {
    if (!this.container) return;

    const policy = evaluateCaptionPolicy(this.currentContext);

    // If suppressed by policy, render nothing or quiet typing dots with aria-hidden
    if (policy.suppressed) {
      this.container.innerHTML = `
        <div class="captions-tray suppressed" aria-hidden="true" style="opacity: 0.3; font-style: italic; font-size: 12px; color: var(--muted, #666);">
          <span>Listening…</span>
        </div>
      `;
      this.container.setAttribute('aria-hidden', 'true');
      return;
    }

    // When allowed, render safely escaped text
    const escapedStreaming = escapeHtml(this.activeStreamingText);
    const recentHistory = this.history.slice(-3).map(h => `
      <div class="caption-line speaker-${h.role}" style="margin-bottom: 4px;">
        <span style="font-weight: 600; font-size: 11px; text-transform: uppercase; color: var(--muted, #666);">
          ${h.role === 'tutor' ? 'Mai' : 'You'}:
        </span>
        <span class="caption-text" style="font-size: 14px; margin-left: 6px;">
          ${escapeHtml(h.text)}
        </span>
      </div>
    `).join('');

    this.container.removeAttribute('aria-hidden');
    this.container.innerHTML = `
      <div class="captions-tray" role="log" aria-live="polite" aria-label="Conversation subtitles">
        ${recentHistory}
        ${escapedStreaming ? `<div class="caption-streaming">${escapedStreaming}</div>` : ''}
      </div>
    `;
  }
}
