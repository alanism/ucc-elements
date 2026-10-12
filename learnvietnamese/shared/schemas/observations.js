/**
 * Strict schema for client UI observation events
 * In accordance with Build Plan rd03 §4.4 & §8.2:
 * Browser outbox stores bounded observations (max 100 entries, 64 KiB total).
 * Closed discriminated union:
 * - replay
 * - self_report
 * - reveal
 * - recognition_choice
 * - help
 * - mode_switch
 * - timer_event
 * - delivery
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ALLOWED_OBSERVATION_TYPES = new Set([
  'replay',
  'self_report',
  'reveal',
  'recognition_choice',
  'help',
  'mode_switch',
  'timer_event',
  'delivery'
]);

export function validateObservationEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) {
    throw new Error('Observation event must be an object');
  }

  // Client cannot supply learnerId or claim direct mastery
  if ('learnerId' in event) {
    throw new Error('Forbidden key: learnerId must be assigned by trusted server session');
  }
  if ('mastery' in event || 'grade' in event) {
    throw new Error('Forbidden key: client cannot supply mastery or grade claims');
  }

  if (!UUID_REGEX.test(event.id)) {
    throw new Error('Observation event must have a valid UUID id');
  }
  if (typeof event.timestamp !== 'string' || Number.isNaN(Date.parse(event.timestamp))) {
    throw new Error('Observation event must have a valid ISO timestamp');
  }

  if (!ALLOWED_OBSERVATION_TYPES.has(event.type)) {
    throw new Error(`Invalid observation type: ${event.type}`);
  }

  switch (event.type) {
    case 'replay': {
      if (typeof event.phraseId !== 'string' || event.phraseId.length < 1) {
        throw new Error('replay event must specify phraseId');
      }
      break;
    }
    case 'self_report':
    case 'reveal': {
      if (!UUID_REGEX.test(event.challengeId)) {
        throw new Error(`${event.type} event must specify valid challengeId UUID`);
      }
      if (!UUID_REGEX.test(event.attemptId)) {
        throw new Error(`${event.type} event must specify valid attemptId UUID`);
      }
      if (typeof event.contextRevision !== 'number' || event.contextRevision < 1) {
        throw new Error(`${event.type} event must specify valid contextRevision`);
      }
      break;
    }
    case 'recognition_choice': {
      if (!UUID_REGEX.test(event.challengeId)) {
        throw new Error('recognition_choice must specify valid challengeId UUID');
      }
      if (typeof event.selectedOption !== 'string' || event.selectedOption.length === 0) {
        throw new Error('recognition_choice must specify selectedOption');
      }
      if (typeof event.isCorrect !== 'boolean') {
        throw new Error('recognition_choice must specify isCorrect boolean');
      }
      break;
    }
    case 'help': {
      if (!UUID_REGEX.test(event.challengeId)) {
        throw new Error('help event must specify valid challengeId UUID');
      }
      if (typeof event.requestedLevel !== 'number' || event.requestedLevel < 0 || event.requestedLevel > 3) {
        throw new Error('help event requestedLevel must be 0, 1, 2, or 3');
      }
      break;
    }
    case 'mode_switch': {
      if (event.requestedMode !== 'play' && event.requestedMode !== 'live') {
        throw new Error('mode_switch requestedMode must be "play" or "live"');
      }
      break;
    }
    case 'timer_event': {
      const allowedActions = new Set(['start', 'pause', 'resume', 'reset', 'expired']);
      if (!allowedActions.has(event.action)) {
        throw new Error(`Invalid timer_event action: ${event.action}`);
      }
      if (typeof event.elapsedSeconds !== 'number' || event.elapsedSeconds < 0) {
        throw new Error('timer_event elapsedSeconds must be non-negative number');
      }
      break;
    }
    case 'delivery': {
      if (typeof event.contentId !== 'string' || event.contentId.length === 0) {
        throw new Error('delivery event must specify contentId');
      }
      if (event.modality !== 'audio' && event.modality !== 'text') {
        throw new Error('delivery event modality must be "audio" or "text"');
      }
      if (typeof event.confirmed !== 'boolean') {
        throw new Error('delivery event confirmed must be boolean');
      }
      break;
    }
  }

  return true;
}

export function validateObservationBatch(events) {
  if (!Array.isArray(events)) {
    throw new Error('Observation batch must be an array');
  }
  if (events.length > 100) {
    throw new Error('Observation batch exceeds 100 events limit');
  }
  const serialized = JSON.stringify(events);
  if (serialized.length > 65536) {
    throw new Error('Observation batch exceeds 64 KiB byte size limit');
  }

  for (const ev of events) {
    validateObservationEvent(ev);
  }
  return true;
}
