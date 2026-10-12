/**
 * Strict schemas for model-facing sideband functions
 * In accordance with Build Plan rd03 §8.2:
 * Exactly three model functions are exposed:
 * 1. submit_assessment_proposal
 * 2. propose_discovery
 * 3. get_lesson_context
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ALLOWED_MODEL_FUNCTIONS = new Set([
  'submit_assessment_proposal',
  'propose_discovery',
  'get_lesson_context'
]);

export function validateSubmitAssessmentProposal(params) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new Error('params must be an object');
  }
  const allowedKeys = new Set(['challengeId', 'attemptId', 'contextRevision', 'fragmentIds', 'outcome', 'reason', 'confidence']);
  for (const k of Object.keys(params)) {
    if (!allowedKeys.has(k)) {
      throw new Error(`Unexpected unknown key in submit_assessment_proposal: ${k}`);
    }
  }

  if (!UUID_REGEX.test(params.challengeId)) {
    throw new Error('challengeId must be a valid UUID');
  }
  if (!UUID_REGEX.test(params.attemptId)) {
    throw new Error('attemptId must be a valid UUID');
  }
  if (typeof params.contextRevision !== 'number' || params.contextRevision < 1 || !Number.isInteger(params.contextRevision)) {
    throw new Error('contextRevision must be a positive integer');
  }

  if (!Array.isArray(params.fragmentIds) || params.fragmentIds.length < 1 || params.fragmentIds.length > 32) {
    throw new Error('fragmentIds must be an array of 1 to 32 strings');
  }
  for (const fid of params.fragmentIds) {
    if (typeof fid !== 'string' || fid.length < 1 || fid.length > 128) {
      throw new Error('each fragmentId must be a string between 1 and 128 chars');
    }
  }

  const ALLOWED_OUTCOMES = new Set(['communicative_success', 'needs_repair', 'unclear']);
  if (!ALLOWED_OUTCOMES.has(params.outcome)) {
    throw new Error(`Invalid outcome: ${params.outcome}`);
  }

  if (params.reason !== undefined) {
    const ALLOWED_REASONS = new Set([
      'correct_meaning',
      'meaningful_repair',
      'inintelligible',
      'silence',
      'tutor_only',
      'unsupported_claim'
    ]);
    if (!ALLOWED_REASONS.has(params.reason)) {
      throw new Error(`Invalid reason: ${params.reason}`);
    }
  }

  if (typeof params.confidence !== 'number' || params.confidence < 0 || params.confidence > 1 || Number.isNaN(params.confidence)) {
    throw new Error('confidence must be a number between 0 and 1');
  }

  return true;
}

export function validateProposeDiscovery(params) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new Error('params must be an object');
  }
  const allowedKeys = new Set(['challengeId', 'contextRevision', 'vietnamese', 'english', 'sourceFragmentIds']);
  for (const k of Object.keys(params)) {
    if (!allowedKeys.has(k)) {
      throw new Error(`Unexpected unknown key in propose_discovery: ${k}`);
    }
  }

  if (!UUID_REGEX.test(params.challengeId)) {
    throw new Error('challengeId must be a valid UUID');
  }
  if (typeof params.contextRevision !== 'number' || params.contextRevision < 1 || !Number.isInteger(params.contextRevision)) {
    throw new Error('contextRevision must be a positive integer');
  }

  if (typeof params.vietnamese !== 'string' || params.vietnamese.length < 2 || params.vietnamese.length > 100) {
    throw new Error('vietnamese text must be between 2 and 100 chars');
  }
  if (typeof params.english !== 'string' || params.english.length < 2 || params.english.length > 100) {
    throw new Error('english text must be between 2 and 100 chars');
  }

  if (!Array.isArray(params.sourceFragmentIds) || params.sourceFragmentIds.length < 1 || params.sourceFragmentIds.length > 8) {
    throw new Error('sourceFragmentIds must be an array of 1 to 8 strings');
  }
  for (const fid of params.sourceFragmentIds) {
    if (typeof fid !== 'string' || fid.length < 1 || fid.length > 128) {
      throw new Error('each sourceFragmentId must be a string between 1 and 128 chars');
    }
  }

  return true;
}

export function validateGetLessonContext(params) {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    throw new Error('params must be an object');
  }
  if (Object.keys(params).length !== 0) {
    throw new Error('get_lesson_context must be called with empty object {}');
  }
  return true;
}

export function validateModelFunctionCall(functionName, rawArgs) {
  if (!ALLOWED_MODEL_FUNCTIONS.has(functionName)) {
    throw new Error(`Forbidden or unknown model function: ${functionName}`);
  }

  let args = rawArgs;
  if (typeof rawArgs === 'string') {
    if (rawArgs.length > 16384) {
      throw new Error('Function argument body exceeds 16 KiB limit');
    }
    args = JSON.parse(rawArgs);
  }

  if (functionName === 'submit_assessment_proposal') {
    validateSubmitAssessmentProposal(args);
  } else if (functionName === 'propose_discovery') {
    validateProposeDiscovery(args);
  } else if (functionName === 'get_lesson_context') {
    validateGetLessonContext(args);
  }

  return args;
}
