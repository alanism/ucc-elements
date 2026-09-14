/**
 * Strict schema for learning evidence and assessment validation
 * In accordance with Build Plan rd03 §8.3 & §9.4:
 * 5 labels:
 * 1. unexposed
 * 2. exposure
 * 3. supported_echo
 * 4. supported_retrieval
 * 5. spontaneous_transfer
 *
 * M1 Rule: pronunciationStatus is always 'unverified'
 */

export const ALLOWED_EVIDENCE_LABELS = new Set([
  'unexposed',
  'exposure',
  'supported_echo',
  'supported_retrieval',
  'spontaneous_transfer'
]);

export function validateLearningEvidenceRecord(record) {
  if (!record || typeof record !== 'object') {
    throw new Error('Evidence record must be an object');
  }

  if (!ALLOWED_EVIDENCE_LABELS.has(record.label)) {
    throw new Error(`Invalid evidence label: ${record.label}`);
  }

  // M1 Pronunciation Rule (R04 / §8.3): Must be explicitly unverified
  if (record.pronunciationStatus !== 'unverified') {
    throw new Error(`In M1, pronunciationStatus must be "unverified", found: ${record.pronunciationStatus}`);
  }

  if (typeof record.communicativeSuccess !== 'boolean') {
    throw new Error('communicativeSuccess must be a boolean');
  }

  // If spontaneous_transfer is claimed, check disqualifying support
  if (record.label === 'spontaneous_transfer') {
    if (record.fullModelProvided === true) {
      throw new Error('spontaneous_transfer cannot be awarded when full model was provided');
    }
    if (record.writtenTargetRevealed === true) {
      throw new Error('spontaneous_transfer cannot be awarded when written target was revealed');
    }
    if (record.effectiveHelpLevel && record.effectiveHelpLevel > 0) {
      throw new Error('spontaneous_transfer requires zero target assistance');
    }
  }

  return true;
}

export function evaluateProposalToEvidence(proposal, assistanceContext = {}) {
  // Enforces §8.3 & §9.4 evidence projection logic
  if (!proposal || proposal.outcome === 'unclear') {
    return {
      label: 'exposure',
      communicativeSuccess: false,
      pronunciationStatus: 'unverified',
      reason: proposal?.reason || 'unclear_outcome'
    };
  }

  if (proposal.outcome === 'needs_repair') {
    return {
      label: 'supported_echo',
      communicativeSuccess: false,
      pronunciationStatus: 'unverified',
      reason: 'needs_repair'
    };
  }

  // Proposal indicates communicative_success
  if (assistanceContext.fullModelProvided || assistanceContext.writtenTargetRevealed) {
    return {
      label: 'supported_echo',
      communicativeSuccess: true,
      pronunciationStatus: 'unverified',
      independent: false
    };
  }

  if (assistanceContext.effectiveHelpLevel && assistanceContext.effectiveHelpLevel > 0) {
    return {
      label: 'supported_retrieval',
      communicativeSuccess: true,
      pronunciationStatus: 'unverified',
      independent: false
    };
  }

  // No assistance, communicative success in transfer probe
  if (assistanceContext.isTransferMission) {
    return {
      label: 'spontaneous_transfer',
      communicativeSuccess: true,
      pronunciationStatus: 'unverified',
      independent: true
    };
  }

  // Independent retrieval
  return {
    label: 'supported_retrieval',
    communicativeSuccess: true,
    pronunciationStatus: 'unverified',
    independent: true
  };
}
