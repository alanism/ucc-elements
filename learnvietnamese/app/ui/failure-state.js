/**
 * Non-Blocking Failure State & Recovery UX Handler
 * In accordance with Build Plan rd03 §6.4 and Task P2.6
 */

export const FAILURE_TYPES = {
  PERMISSION_DENIED: 'permission_denied',
  AUTOPLAY_BLOCKED: 'autoplay_blocked',
  NETWORK_LOST: 'network_lost',
  QUOTA_DENIED: 'quota_denied',
  SAVE_FAILURE: 'save_failure',
  UNKNOWN_PROVIDER_CREATION: 'unknown_provider_creation'
};

export class FailureStateComponent {
  constructor(options = {}) {
    this.container = options.container || null;
    this.currentFailure = null;
    this.onRetry = options.onRetry || (() => {});
    this.onDismiss = options.onDismiss || (() => {});
    this.onEndSession = options.onEndSession || (() => {});
  }

  show(type, details = {}) {
    this.currentFailure = { type, details };
    this.render();
  }

  clear() {
    this.currentFailure = null;
    if (this.container) {
      this.container.innerHTML = '';
      this.container.style.display = 'none';
    }
  }

  render() {
    if (!this.container || !this.currentFailure) return;

    const { type, details } = this.currentFailure;
    let title = 'Notice';
    let message = 'An error occurred during practice.';
    let actionHtml = '';

    switch (type) {
      case FAILURE_TYPES.PERMISSION_DENIED:
        title = 'Microphone Access Required for LIVE';
        message = 'Microphone permission was not granted. You can continue practicing in PLAY mode anytime, or grant mic permission in your browser settings to speak with Tutor Mai.';
        actionHtml = `
          <button type="button" class="card-action-btn primary" id="btn-failure-retry" aria-label="Retry microphone permission">
            Retry Setup
          </button>
        `;
        break;

      case FAILURE_TYPES.AUTOPLAY_BLOCKED:
        title = 'Audio Playback Blocked';
        message = 'Your browser paused playback. Tap to hear native Vietnamese audio.';
        actionHtml = `
          <button type="button" class="card-action-btn primary" id="btn-failure-retry" aria-label="Tap to enable sound">
            Tap to Hear Audio
          </button>
        `;
        break;

      case FAILURE_TYPES.NETWORK_LOST:
        title = 'Offline Practice Active';
        message = 'Network connection dropped. Station 03 remains fully playable offline. Your progress is preserved safely on this device.';
        actionHtml = `
          <button type="button" class="card-action-btn secondary" id="btn-failure-dismiss" aria-label="Continue offline">
            Continue Offline
          </button>
        `;
        break;

      case FAILURE_TYPES.QUOTA_DENIED:
        title = 'Live Session Unavailable';
        message = 'Live voice budget envelope reached or session is restricted. Station 03 audio lessons remain 100% available offline.';
        actionHtml = `
          <button type="button" class="card-action-btn secondary" id="btn-failure-dismiss" aria-label="Stay in Play mode">
            Return to PLAY
          </button>
        `;
        break;

      case FAILURE_TYPES.SAVE_FAILURE:
        title = 'Sync Pending';
        message = 'Could not sync practice evidence immediately. It will be queued in local outbox and retried automatically.';
        actionHtml = `
          <button type="button" class="card-action-btn secondary" id="btn-failure-dismiss" aria-label="Dismiss notice">
            OK
          </button>
        `;
        break;

      case FAILURE_TYPES.UNKNOWN_PROVIDER_CREATION:
        title = 'Live Configuration Incomplete';
        message = 'Live voice provider requires verified parent authorization before first connection.';
        actionHtml = `
          <button type="button" class="card-action-btn secondary" id="btn-failure-dismiss" aria-label="Acknowledge and dismiss">
            Got it
          </button>
        `;
        break;
    }

    this.container.style.display = 'block';
    this.container.innerHTML = `
      <div class="failure-banner" role="alert" style="
        background: #fff8f8;
        border: 1px solid #ffd6d6;
        border-left: 4px solid var(--accent, #CC0000);
        border-radius: 6px;
        padding: 16px 20px;
        margin: 12px 0;
        font-family: var(--font-sans, sans-serif);
      ">
        <div style="font-weight: 700; font-size: 14px; color: var(--ink, #111); margin-bottom: 6px;">
          ${title}
        </div>
        <div style="font-size: 13px; color: var(--muted, #666); line-height: 1.5; margin-bottom: 12px;">
          ${message}
        </div>
        <div style="display: flex; gap: 10px; align-items: center; justify-content: flex-end;">
          <button type="button" class="card-action-btn help-escape" id="btn-failure-end" aria-label="End session immediately" style="color: #666;">
            End Practice
          </button>
          ${actionHtml}
        </div>
      </div>
    `;

    const retryBtn = this.container.querySelector('#btn-failure-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.clear();
        this.onRetry(type);
      });
    }

    const dismissBtn = this.container.querySelector('#btn-failure-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        this.clear();
        this.onDismiss(type);
      });
    }

    const endBtn = this.container.querySelector('#btn-failure-end');
    if (endBtn) {
      endBtn.addEventListener('click', () => {
        this.clear();
        this.onEndSession();
      });
    }
  }
}
