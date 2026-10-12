/**
 * Discovery Review Modal & Authorization Controller
 * Implements Build Plan rd03 §4.2, §9.6 and Task P6d.2.
 */

export class DiscoveryReviewModal {
  constructor(options = {}) {
    this.auth = options.auth || { role: 'learner' };
    this.onReviewCompleted = options.onReviewCompleted || null;
    this.audioRequestsInitiated = 0; // Guard tracking ElevenLabs / TTS invocations
  }

  setAuth(auth) {
    this.auth = auth;
  }

  /**
   * Executes an approve or dismiss review decision on a proposed discovery.
   * Enforces fresh parent authorization (§4.2) and strict text-only promotion (§9.6).
   *
   * @param {string} discoveryId
   * @param {'approve'|'dismiss'} decision
   * @param {object} [metadata={}]
   * @returns {{ eventType: string, discoveryId: string, status: string, reviewedAt: string }}
   */
  processDecision(discoveryId, decision, metadata = {}) {
    // 1. Authorization check: learner cannot approve/dismiss discoveries
    if (!this.auth || this.auth.role !== 'parent') {
      throw new Error('Unauthorized: Only an authenticated parent can approve or dismiss discoveries');
    }

    if (decision !== 'approve' && decision !== 'dismiss') {
      throw new Error(`Invalid review decision: ${decision}. Must be 'approve' or 'dismiss'.`);
    }

    const newStatus = decision === 'approve' ? 'approved' : 'dismissed';
    const reviewedAt = new Date().toISOString();

    // 2. Strict M1 boundary: Text-only! Zero audio/TTS requests allowed
    // Note: Canonical curriculum is never touched.
    const event = {
      eventType: 'discovery_reviewed',
      discoveryId,
      status: newStatus,
      reviewedBy: this.auth.id || 'parent_authorized',
      decision,
      pronunciationStatus: 'unverified',
      isTextOnly: true,
      audioGenerated: false,
      reviewedAt,
      notes: metadata.notes || ''
    };

    if (typeof this.onReviewCompleted === 'function') {
      this.onReviewCompleted(event);
    }

    return event;
  }
}
