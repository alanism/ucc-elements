/**
 * Parent Summary & Learning Outcome View
 * Implements Build Plan rd03 §4.2, §9.4, §9.6 and Task P6d.2.
 */
import { escapeHtml } from '../utils/string.js';

export { escapeHtml };

export class ParentSummaryView {
  constructor(options = {}) {
    this.container = options.container || null;
    this.currentUser = options.currentUser || { role: 'parent', id: 'parent_default' };
    this.discoveries = options.discoveries || [];
    this.learningOutcomes = options.learningOutcomes || [];
    this.onAction = options.onAction || null;
  }

  setAuth(user) {
    this.currentUser = user;
    if (this.container) this.render();
  }

  setDiscoveries(discoveries) {
    this.discoveries = discoveries || [];
    if (this.container) this.render();
  }

  setOutcomes(outcomes) {
    this.learningOutcomes = outcomes || [];
    if (this.container) this.render();
  }

  /**
   * Submits an attributed parent correction.
   * Does not edit history; appends an attributed superseding event (§4.2, §9.4).
   */
  submitCorrection({ targetId, previousOutcome, correctedOutcome, note = '' }) {
    if (!this.currentUser || this.currentUser.role !== 'parent') {
      throw new Error('Unauthorized: parent role required to submit corrections');
    }

    const event = {
      eventType: 'assessment_corrected',
      targetId,
      previousOutcome,
      correctedOutcome,
      attributedTo: 'parent',
      authorId: this.currentUser.id,
      note: escapeHtml(note),
      timestamp: new Date().toISOString()
    };

    if (typeof this.onAction === 'function') {
      this.onAction(event);
    }
    return event;
  }

  render() {
    if (!this.container) return;

    const isParent = this.currentUser && this.currentUser.role === 'parent';

    const discoveriesHtml = this.discoveries.map(d => `
      <div class="discovery-card" data-discovery-id="${escapeHtml(d.id || d.discovery_id)}">
        <div class="discovery-texts">
          <span class="discovery-vietnamese">${escapeHtml(d.vietnamese)}</span>
          <span class="discovery-english">${escapeHtml(d.english)}</span>
        </div>
        <div class="discovery-meta">
          <span class="status-badge pronunciation-unverified" data-status="unverified">
            Pronunciation: Unverified
          </span>
          <span class="provenance-label">Context: ${escapeHtml(d.challenge_id || 'Saigon Café')}</span>
          <span class="discovery-status">Status: ${escapeHtml(d.status || 'proposed')}</span>
        </div>
        ${isParent && d.status === 'proposed' ? `
          <div class="discovery-actions">
            <button class="btn-approve" data-action="approve" data-id="${escapeHtml(d.id || d.discovery_id)}">Approve Text</button>
            <button class="btn-dismiss" data-action="dismiss" data-id="${escapeHtml(d.id || d.discovery_id)}">Dismiss</button>
          </div>
        ` : ''}
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="parent-summary-panel">
        <header class="parent-summary-header">
          <h2>Learner Progress & Discovery Bank</h2>
          <span class="user-badge">${isParent ? 'Parent Mode (Authorized)' : 'Learner Mode (Read-Only)'}</span>
        </header>

        <section class="discoveries-section">
          <h3>Discovered Phrases (${this.discoveries.length})</h3>
          <p class="discovery-explainer">
            Phrases proposed during conversation. Approved phrases are added to the learner's personal text bank.
            No audio generation or recordings are retained.
          </p>
          <div class="discovery-list">
            ${discoveriesHtml || '<p class="empty-notice">No discoveries recorded yet.</p>'}
          </div>
        </section>
      </div>
    `;
  }
}
