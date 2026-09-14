/**
 * KDLI context resolution, untuned feedback and suggestion (K57).
 *
 * Grounded in the decision record rather than a paraphrase of it:
 *   D7_D8 — "subtle untuned feedback, approved valid-context resolution visible; no error dialogs"
 *   D4_D5 — "manual tuning plus deterministic Surprise Me; no mastery claims"
 *
 * The three rules this encodes:
 *   1. An unsupported context is NOT an error. It reports itself as untuned, subtly, and
 *      never raises a dialog or blocks the learner.
 *   2. A context that DOES resolve shows how: which approved slot, variant and voice were
 *      chosen, so the resolution is visible rather than implied.
 *   3. A suggestion is only ever a proposal. It is deterministic, and it does nothing until
 *      the learner deliberately accepts it. Nothing here claims mastery of anything.
 */

/** FNV-1a: deterministic, tiny, and no dependency. Same seed and corpus, same suggestion. */
export function stableHash(input) {
  let hash = 0x811c9dc5;
  const text = String(input);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export const UNTUNED = 'UNTUNED';
export const RESOLVED = 'RESOLVED';

export function situationsFor(assetMap) {
  const ids = [...new Set(Object.values(assetMap?.phrases ?? {}).map(phrase => phrase.situation_id))];
  return ids.sort();
}

/**
 * Resolve one scene. Never throws for a missing context: an authored corpus only covers
 * part of the map, and tapping an unwritten situation is normal, not a fault.
 */
export function resolveContext({ assetMap, situationId, profile, slot = 'MODEL' }) {
  const phrases = Object.values(assetMap?.phrases ?? {}).filter(phrase => phrase.situation_id === situationId);
  const base = { situation_id: situationId, profile, slot };

  if (phrases.length === 0) {
    return {
      ...base,
      state: UNTUNED,
      // Subtle by construction: a tone for the UI to render quietly, and no error surface.
      feedback: { tone: 'subtle', kind: 'untuned', dialog: false, blocking: false, message: 'Not tuned yet' },
      resolution: null,
      reason: 'no authored content for this situation'
    };
  }

  const active = phrases.find(phrase => phrase.slot === slot) ?? phrases.find(phrase => phrase.slot === 'MODEL') ?? phrases[0];
  const variant = active.variants?.find(item => item.contexts?.some(context =>
    context.learnerGender === profile?.learnerGender
    && context.learnerRelativeAge === profile?.learnerRelativeAge)) ?? null;

  if (!variant) {
    return {
      ...base,
      state: UNTUNED,
      feedback: { tone: 'subtle', kind: 'untuned', dialog: false, blocking: false, message: 'Not tuned for this learner yet' },
      resolution: null,
      reason: 'authored, but no variant declared for this learner profile'
    };
  }

  const voice = variant.required_voice_codes?.[0] ?? null;
  const assetId = `${active.phrase_id}.${voice}.${variant.variant_id}`;
  const asset = assetMap.assets?.[assetId] ?? null;

  return {
    ...base,
    state: RESOLVED,
    feedback: null,
    reason: null,
    // Visible resolution: everything the UI needs to show WHY this was chosen.
    resolution: {
      situation_title: phrases[0].situation_title ?? null,
      phrase_id: active.phrase_id,
      slot: active.slot,
      variant_id: variant.variant_id,
      voice_code: voice,
      asset_id: assetId,
      has_audio: Boolean(asset),
      vietnamese_text: variant.vietnamese_text,
      review_state: active.review_state ?? assetMap.review_state,
      matched_context: variant.contexts.find(context =>
        context.learnerGender === profile?.learnerGender
        && context.learnerRelativeAge === profile?.learnerRelativeAge) ?? null
    }
  };
}

/**
 * Deterministic "Surprise Me" (D4_D5). Same corpus, same seed, same proposal — and a
 * proposal only: `applied` is always false here.
 */
export function suggestNext({ assetMap, currentSituation = null, seed = '', reason = 'deterministic-surprise-me' } = {}) {
  const ids = situationsFor(assetMap);
  if (ids.length === 0) {
    return { applied: false, suggestion: null, reason: 'no authored situations to suggest from', mastery_claim: null };
  }
  const pool = ids.filter(id => id !== currentSituation);
  const candidates = pool.length > 0 ? pool : ids;
  const index = stableHash(`${seed}|${candidates.join(',')}`) % candidates.length;
  const situationId = candidates[index];
  const phrases = Object.values(assetMap.phrases).filter(phrase => phrase.situation_id === situationId);
  return {
    applied: false,
    suggestion: {
      situation_id: situationId,
      situation_title: phrases[0]?.situation_title ?? null,
      world_id: situationId.slice(0, 2),
      slot: 'MODEL',
      review_state: phrases[0]?.review_state ?? assetMap.review_state,
      reason
    },
    mastery_claim: null
  };
}

/**
 * Deliberate acceptance. A suggestion does nothing until the learner says so, and an
 * acceptance that is not deliberate is refused rather than assumed.
 */
export function acceptSuggestion({ suggestion, accepted = false, deliberate = false } = {}) {
  if (!suggestion) return { applied: false, reason: 'no suggestion to accept' };
  if (accepted !== true) return { applied: false, reason: 'suggestion left unapplied — nothing happens without the learner accepting' };
  if (deliberate !== true) return { applied: false, reason: 'acceptance must be deliberate, not implied by a tap elsewhere' };
  return { applied: true, situation_id: suggestion.situation_id, mastery_claim: null };
}

/**
 * One call for the view: what to show, what to propose, and what may NOT be claimed.
 * `mastery_claim` is always null — this runtime reports exposure, never mastery.
 */
export function tuningView({ assetMap, situationId, profile, slot = 'MODEL', seed = '' }) {
  const context = resolveContext({ assetMap, situationId, profile, slot });
  const suggestion = context.state === UNTUNED
    ? suggestNext({ assetMap, currentSituation: situationId, seed })
    : { applied: false, suggestion: null, mastery_claim: null };
  return {
    context,
    suggestion,
    show_resolution: context.state === RESOLVED,
    show_untuned: context.state === UNTUNED,
    error_dialog: false,
    mastery_claim: null
  };
}
