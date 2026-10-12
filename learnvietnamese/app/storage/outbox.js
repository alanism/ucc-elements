/**
 * Scoped Bounded Observation Outbox
 * In accordance with Build Plan rd03 §4.4, §8.2 and Task P4.4
 */

import { validateObservationEvent } from '../../shared/schemas/observations.js';

export const MAX_OUTBOX_ENTRIES = 100;
export const MAX_OUTBOX_BYTES = 65536; // 64 KiB

export class ObservationOutbox {
  constructor(options = {}) {
    this.learnerId = options.learnerId || 'default-learner';
    this.entries = []; // [{ id, event, status, sizeBytes }]
    this.lostTelemetryCount = 0;
    this.saveStatus = 'idle'; // 'idle' | 'saving' | 'saved' | 'offline' | 'error'
    this.onStatusChange = options.onStatusChange || (() => {});
  }

  setLearner(newLearnerId) {
    // Learner isolation: cannot leak prior learner items across learners
    if (this.learnerId !== newLearnerId) {
      this.learnerId = newLearnerId;
      this.entries = []; // scope to new learner
      this.lostTelemetryCount = 0;
      this._setStatus('idle');
    }
  }

  get totalBytes() {
    return this.entries.reduce((sum, e) => sum + e.sizeBytes, 0);
  }

  enqueue(event) {
    // 1. Prohibit raw audio, transcripts, or client-assigned learner IDs
    if ('audio' in event || 'audioBuffer' in event || 'audioData' in event || 'transcript' in event) {
      throw new Error('Forbidden key: raw audio or raw transcript cannot be stored in observation outbox');
    }
    if ('learnerId' in event) {
      throw new Error('Forbidden key: client cannot supply learnerId to outbox');
    }

    // 2. Validate strict observation event schema
    validateObservationEvent(event);

    const serialized = JSON.stringify(event);
    const sizeBytes = Buffer.byteLength(serialized, 'utf8');

    // 3. Overflow handling: Bound at MAX_OUTBOX_ENTRIES and MAX_OUTBOX_BYTES
    if (this.entries.length >= MAX_OUTBOX_ENTRIES || (this.totalBytes + sizeBytes) > MAX_OUTBOX_BYTES) {
      this.lostTelemetryCount++;
      // Reject adding beyond capacity to preserve existing pending un-synced items
      this._setStatus('error');
      return { enqueued: false, overflow: true, lostTelemetryCount: this.lostTelemetryCount };
    }

    this.entries.push({
      id: event.id,
      event,
      status: 'pending',
      sizeBytes,
      enqueuedAt: Date.now()
    });

    this._setStatus('saving');
    return { enqueued: true, queueLength: this.entries.length };
  }

  getPending() {
    return this.entries.filter(e => e.status === 'pending').map(e => ({ ...e.event }));
  }

  markSynced(syncedIds) {
    const idSet = new Set(syncedIds);
    this.entries = this.entries.filter(e => !idSet.has(e.id));
    this._setStatus(this.entries.length === 0 ? 'saved' : 'saving');
  }

  setOffline() {
    this._setStatus('offline');
  }

  setError() {
    this._setStatus('error');
  }

  clear() {
    this.entries = [];
    this.lostTelemetryCount = 0;
    this._setStatus('idle');
  }

  _setStatus(status) {
    this.saveStatus = status;
    this.onStatusChange(status);
  }
}
