/**
 * KDLI scene-aware LIVE context (K54).
 *
 * LIVE is the open-repertory half of the product: PLAY is a controlled repertoire, LIVE
 * improvises. This builds what LIVE is allowed to know about the current scene, from
 * APPROVED curriculum artefacts only.
 *
 * Deliberately NOT a rewrite of the LiveClient. The existing gpt-live-1 plumbing already
 * carries the budget guard, session reconciliation and the return-to-PLAY messaging
 * (daily_budget_exhausted, session_pending, finalization_incomplete). This module supplies
 * the `context()` payload in the shape that plumbing already posts.
 *
 * Hard rules this encodes:
 *   - Vietnamese text comes only from the exported asset map. Nothing here writes or
 *     rewrites Vietnamese, so LIVE cannot be fed invented language.
 *   - LIVE-generated language can never modify the canonical PLAY curriculum. The returned
 *     context is frozen and carries no write path; `canonical_play_immutable` states it.
 *   - No learner identifiers, no conversation transcript, no retained history. Privacy is
 *     preserved by simply never putting those things in the payload.
 *   - Review state is carried through honestly: this corpus is PROVISIONAL and LIVE is told
 *     so, rather than being handed text that looks approved.
 */

/** Address terms follow the declared policy (DEC-002 self-reference, DEC-003 address). */
export const CHILD_SELF_REFERENCE = 'em';
export const ADULT_SELF_REFERENCE = 'tôi';
export const ADDRESS_BY_LISTENER_GENDER = Object.freeze({ male: 'anh', female: 'chị' });

export function selfReferenceFor({ learnerRelativeAge }) {
  return learnerRelativeAge === 'younger' ? CHILD_SELF_REFERENCE : ADULT_SELF_REFERENCE;
}

export function addressTermFor({ gender }) {
  return ADDRESS_BY_LISTENER_GENDER[gender] ?? null;
}

/** The repair functions the curriculum actually contains, so LIVE can offer them. */
export function repairLanguageFrom(assetMap) {
  const found = new Map();
  for (const phrase of Object.values(assetMap?.phrases ?? {})) {
    for (const ref of phrase.structure_refs ?? []) {
      if (!ref.startsWith('repair.')) continue;
      if (!found.has(ref)) found.set(ref, { function: ref, vietnamese: phrase.vietnamese_baseline, phrase_id: phrase.phrase_id });
    }
  }
  return [...found.values()];
}

/**
 * Ready-made `context()` for the existing LiveClient.
 *
 * The client calls its context function when it opens a session, so this reads the current
 * scene through a getter rather than capturing a snapshot — the learner may have advanced
 * a stage between opening the panel and connecting.
 */
export function createKdliContextFn({ assetMap, getScene, fallback = null } = {}) {
  if (typeof getScene !== 'function') throw new Error('createKdliContextFn requires a getScene function');
  const legacy = () => (typeof fallback === 'function' ? fallback() : {});
  return () => {
    const scene = getScene();
    // No asset map or no active KDLI scene: hand back the legacy context rather than
    // failing the session, so this seam is safe to install before the KDLI runtime is ready.
    if (!assetMap || !scene?.situationId || !scene?.profile) return legacy();
    return collectKdliScene({
      assetMap,
      situationId: scene.situationId,
      profile: scene.profile,
      stage: scene.stage,
      revealed: scene.revealed === true,
      station: scene.station,
      conversationContext: scene.conversationContext ?? ''
    });
  };
}

/**
 * The LIVE boundary takes four enums and rejects the entire request without them, so they are
 * derived here and validated HERE, failing with a readable message instead of letting the
 * server answer `invalid_context` for a payload we could have judged ourselves.
 *
 * `listenerGender` is written from the learner's side: it is the party the learner addresses.
 */
function conversationContextFor(profile = {}, { audience = 'one' } = {}) {
  const enums = {
    learnerGender: ['male', 'female'],
    listenerGender: ['male', 'female'],
    learnerRelativeAge: ['older', 'younger'],
    audience: ['one', 'group']
  };
  const value = {
    learnerGender: profile.learnerGender,
    listenerGender: profile.interlocutorGender,
    learnerRelativeAge: profile.learnerRelativeAge,
    audience
  };
  for (const [key, allowed] of Object.entries(enums)) {
    if (!allowed.includes(value[key])) {
      throw new Error(`LIVE conversation context needs a valid ${key} (${allowed.join('|')}), received ${JSON.stringify(value[key])}`);
    }
  }
  return value;
}

/**
 * Build the payload for one scene. Pure: same inputs, same output, no clock, no ids that
 * could identify a learner.
 */
export function collectKdliScene({
  assetMap,
  situationId,
  profile,
  stage = 'HEAR',
  revealed = false,
  station = 'KDLI-104',
  audience = 'one'
} = {}) {
  if (!assetMap?.phrases) throw new Error('collectKdliScene requires the exported asset map');
  const phrases = Object.values(assetMap.phrases).filter(phrase => phrase.situation_id === situationId);
  if (phrases.length === 0) throw new Error(`No approved content for situation ${situationId}`);

  const bySlot = Object.fromEntries(phrases.map(phrase => [phrase.slot, phrase]));
  const model = bySlot.MODEL;
  const hear = bySlot.HEAR;
  // The substitution dimension belongs to CHANGE, not MODEL: it is what varies while the
  // MODEL frame is held. Reading it off MODEL yielded an always-empty list.
  const change = bySlot.CHANGE;

  // The line the learner is working on right now, taken verbatim from the map.
  const active = bySlot[stage] ?? model ?? phrases[0];
  const variant = active.variants?.find(item => item.contexts?.some(context =>
    context.learnerGender === profile?.learnerGender
    && context.learnerRelativeAge === profile?.learnerRelativeAge)) ?? active.variants?.[0] ?? null;

  const vocabulary = [...new Set(phrases.flatMap(phrase => phrase.vocabulary_refs ?? []))];
  const structures = [...new Set(phrases.flatMap(phrase => phrase.structure_refs ?? []))];

  return Object.freeze({
    // Shape the existing client already posts.
    station,
    phraseId: active.phrase_id,
    english: active.english_gloss,
    vietnamese: variant?.vietnamese_text ?? active.vietnamese_baseline,
    conversationContext: Object.freeze(conversationContextFor(profile ?? {}, { audience })),
    // The server forwards exactly SELF and OTHER. Anything else is dropped at the boundary,
    // so the resolved terms must be published under the names it reads.
    resolvedTerms: Object.freeze({
      SELF: selfReferenceFor(profile ?? {}),
      OTHER: addressTermFor({ gender: active.speaker_role === 'interlocutor' ? profile?.learnerGender : profile?.interlocutorGender })
    }),
    stage,
    revealed: revealed === true,

    // Scene awareness LIVE needs to stay in character.
    kdli: Object.freeze({
      curriculum_version: assetMap.curriculum_version,
      release_id: assetMap.release_id,
      world_id: situationId.slice(0, 2),
      situation_id: situationId,
      situation_title: phrases[0].situation_title ?? null,
      review_state: assetMap.review_state,
      canonical_play_immutable: true,
      // These terms come from the declared policy (DEC-002/003), not from the corpus text.
      resolved_terms_source: 'policy',
      learner_role: 'learner',
      interlocutor_role: 'interlocutor',
      speaker_roles: Object.freeze({
        model: model?.speaker_role ?? null,
        hear: hear?.speaker_role ?? null
      }),
      model_structure: Object.freeze({ phrase_id: model?.phrase_id ?? null, vietnamese: model?.vietnamese_baseline ?? null, structures: Object.freeze(model?.structure_refs ?? []) }),
      substitution_dimension: Object.freeze(change?.substitution_refs ?? []),
      vocabulary: Object.freeze(vocabulary),
      structures: Object.freeze(structures),
      repair: Object.freeze(repairLanguageFrom(assetMap)),
      available_slots: Object.freeze(phrases.map(phrase => phrase.slot))
    })
  });
}
