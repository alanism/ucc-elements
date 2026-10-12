/**
 * KDLI PLAY selection.
 *
 * Answers one question: given the current learner/social profile, WHICH audio asset
 * does a slot play? Kept pure and DOM-free so it is testable and so the same rules
 * serve the browser adapter, the tests and the later 104-situation rollout.
 *
 * Selection is not invention. It reads the exported asset map, which was built from the
 * frozen generation manifest and only contains audio that passed machine QA. If nothing
 * matches, this returns null and the caller must surface the gap — it never falls back to
 * a different voice or a different variant, because a wrong-voice render is worse than a
 * silent one for a learner imitating the model.
 */

/** Age band and gender determine the actor whose voice realises a profile (DEC-008). */
export const VOICE_FOR_PROFILE = Object.freeze({
  female: Object.freeze({ younger: 'f1', older: 'f2' }),
  male: Object.freeze({ younger: 'm1', older: 'm2' })
});

export function voiceCodeFor({ learnerGender, learnerRelativeAge }) {
  return VOICE_FOR_PROFILE[learnerGender]?.[learnerRelativeAge] ?? null;
}

/**
 * A profile matches a variant when the variant declares a social context for it.
 *
 * The learner is the listener on interlocutor lines and the speaker on learner lines, so
 * the two cases need different fields:
 *   learner_model  -> context.learnerGender/learnerRelativeAge are the learner,
 *                     context.listenerGender is the COUNTERPARTY.
 *   interlocutor   -> context.learnerGender is still the learner, and the listener IS the
 *                     learner, so listenerGender is redundant and must not be re-checked
 *                     against the counterparty's gender.
 */
export function profileMatchesContext(context, profile, speakerRole = 'learner_model') {
  if (context.learnerGender !== profile.learnerGender) return false;
  if (context.learnerRelativeAge !== profile.learnerRelativeAge) return false;
  if (speakerRole === 'interlocutor') return context.listenerGender === profile.learnerGender;
  return context.listenerGender === profile.interlocutorGender;
}

/**
 * Resolve the asset for one phrase under one profile.
 * Returns { asset_id, variant_id, voice_code, vietnamese_text, matched_context } or null.
 */
export function selectAsset({ phrase, profile, assetMap }) {
  if (!phrase || !profile || !assetMap) return null;
  const candidates = [];
  for (const variant of phrase.variants ?? []) {
    for (const context of variant.contexts ?? []) {
      if (profileMatchesContext(context, profile, phrase.speaker_role)) {
        candidates.push({ variant, context });
        break;
      }
    }
  }
  if (candidates.length === 0) return null;

  // The speaker's own gender/age decides the voice, not the listener's controls.
  const voiceCode = voiceCodeFor(variantSpeakerProfile(candidates[0].variant, profile));
  if (!voiceCode) return null;

  for (const { variant, context } of candidates) {
    const assetId = `${phrase.phrase_id}.${voiceCode}.${variant.variant_id}`;
    if (assetMap.assets?.[assetId]) {
      return {
        asset_id: assetId,
        variant_id: variant.variant_id,
        voice_code: voiceCode,
        vietnamese_text: variant.vietnamese_text,
        gloss: phrase.english_gloss,
        slot: phrase.slot,
        speaker_role: phrase.speaker_role,
        matched_context: context,
        flagged: assetMap.assets[assetId].flagged === true
      };
    }
  }
  return null;
}

/** Speaker lines are cast by whoever speaks: the variant carries the speaker profile. */
function variantSpeakerProfile(variant, profile) {
  if (variant.speaker?.role === 'interlocutor') {
    return { learnerGender: variant.speaker.gender, learnerRelativeAge: variant.speaker.age_band };
  }
  return { learnerGender: profile.learnerGender, learnerRelativeAge: profile.learnerRelativeAge };
}

/**
 * The whole five-slot turn for a situation under one profile. A slot that cannot be
 * resolved is reported as null rather than omitted, so a caller can see the hole.
 */
export function selectSituation({ situationId, profile, assetMap }) {
  const slots = {};
  const missing = [];
  for (const phrase of Object.values(assetMap.phrases ?? {})) {
    if (phrase.situation_id !== situationId) continue;
    const selection = selectAsset({ phrase, profile, assetMap });
    slots[phrase.slot] = selection;
    if (!selection) missing.push(phrase.phrase_id);
  }
  return { situation_id: situationId, profile, slots, missing, complete: missing.length === 0 };
}

export function resolvePublicPath({ assetMap, basePath = '' }, assetId) {
  const asset = assetMap?.assets?.[assetId];
  if (!asset) return null;
  const base = basePath && !basePath.endsWith('/') ? `${basePath}/` : basePath;
  return `${base}${asset.public_path}`;
}
