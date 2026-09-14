/**
 * KDLI catalog and navigation (K53).
 *
 * The Café reference turn is one situation. This is the same architecture spread over the whole
 * curriculum: worlds → situations → the five canonical slots, with resolution delegated to the
 * single selection authority (`app/audio/kdli-select.js`) so there is one answer to "which render
 * plays here" for all 104 situations, not two.
 *
 * Everything is derived from the exported asset map. Nothing is hand-maintained, so a situation
 * cannot silently drift out of the catalog, and a situation with incomplete audio reports a gap
 * rather than disappearing.
 */
import { selectAsset } from '../audio/kdli-select.js';

export const SLOTS = Object.freeze(['MODEL', 'HEAR', 'RESPOND', 'CHANGE', 'CONTINUE']);

/** Learner profiles the runtime can present. Mirrors the four-profile render matrix (DEC-008). */
export const LEARNER_PROFILES = Object.freeze([
  Object.freeze({ name: 'child girl', learnerGender: 'female', learnerRelativeAge: 'younger', interlocutorGender: 'male' }),
  Object.freeze({ name: 'child boy', learnerGender: 'male', learnerRelativeAge: 'younger', interlocutorGender: 'female' }),
  Object.freeze({ name: 'adult woman', learnerGender: 'female', learnerRelativeAge: 'older', interlocutorGender: 'male' }),
  Object.freeze({ name: 'adult man', learnerGender: 'male', learnerRelativeAge: 'older', interlocutorGender: 'female' })
]);

const worldIdOf = situationId => String(situationId).slice(0, 2);

/**
 * Build the navigable catalog: every situation the map can serve, in world then situation order.
 * A situation is included if the map holds *any* of its content, so an incomplete situation is
 * visible as incomplete rather than absent.
 */
export function buildCatalog(assetMap, { worldTitles = {} } = {}) {
  if (!assetMap?.phrases || !assetMap?.assets) throw new Error('buildCatalog requires the exported asset map');
  const bySituation = new Map();
  for (const phrase of Object.values(assetMap.phrases)) {
    if (!bySituation.has(phrase.situation_id)) bySituation.set(phrase.situation_id, []);
    bySituation.get(phrase.situation_id).push(phrase);
  }

  const situations = [...bySituation.entries()].map(([situationId, phrases]) => {
    const slots = {};
    for (const slot of SLOTS) {
      const match = phrases.find(phrase => phrase.slot === slot);
      slots[slot] = match ? match.phrase_id : null;
    }
    const missing = SLOTS.filter(slot => slots[slot] === null);
    return Object.freeze({
      situation_id: situationId,
      world_id: worldIdOf(situationId),
      title: phrases[0]?.situation_title ?? null,
      phrase_count: phrases.length,
      asset_count: phrases.reduce((total, phrase) => total + (phrase.assets?.length ?? 0), 0),
      slots: Object.freeze(slots),
      missing_slots: Object.freeze(missing),
      complete: missing.length === 0
    });
  }).sort((a, b) => (a.situation_id < b.situation_id ? -1 : a.situation_id > b.situation_id ? 1 : 0));

  const worldIds = [...new Set(situations.map(situation => situation.world_id))].sort();
  const worlds = worldIds.map(worldId => Object.freeze({
    world_id: worldId,
    title: worldTitles[worldId] ?? null,
    situations: Object.freeze(situations.filter(situation => situation.world_id === worldId))
  }));

  return Object.freeze({
    release_id: assetMap.release_id,
    review_state: assetMap.review_state,
    worlds: Object.freeze(worlds),
    situations: Object.freeze(situations),
    counts: Object.freeze({
      worlds: worlds.length,
      situations: situations.length,
      slots: situations.reduce((total, situation) => total + (SLOTS.length - situation.missing_slots.length), 0),
      complete_situations: situations.filter(situation => situation.complete).length
    })
  });
}

/** Ordered neighbour, or null at the ends — the catalog never wraps. */
export function neighbour(catalog, situationId, direction) {
  const index = catalog.situations.findIndex(situation => situation.situation_id === situationId);
  if (index < 0) return null;
  const next = catalog.situations[index + (direction === 'previous' ? -1 : 1)];
  return next ? next.situation_id : null;
}

export function findSituation(catalog, situationId) {
  return catalog.situations.find(situation => situation.situation_id === situationId) ?? null;
}

/**
 * Resolve one situation for one learner profile across all five slots.
 *
 * A slot that cannot be resolved is reported as an explicit `gap` carrying the reason. It is
 * never filled with another actor's voice, another variant, or silence dressed up as success —
 * the same rule the single-slot selection path already follows.
 */
export function resolveSituation(assetMap, situationId, profile) {
  const phrases = Object.values(assetMap.phrases).filter(phrase => phrase.situation_id === situationId);
  if (phrases.length === 0) {
    return Object.freeze({ situation_id: situationId, profile: profile?.name ?? null, resolved: false, reason: 'no content for this situation', slots: Object.freeze({}), gaps: Object.freeze(SLOTS.map(slot => Object.freeze({ slot, reason: 'no content for this situation' }))) });
  }
  const slots = {};
  const gaps = [];
  for (const slot of SLOTS) {
    const phrase = phrases.find(item => item.slot === slot);
    if (!phrase) { slots[slot] = null; gaps.push(Object.freeze({ slot, reason: 'slot not authored' })); continue; }
    const selection = selectAsset({ phrase, profile, assetMap });
    if (!selection) { slots[slot] = null; gaps.push(Object.freeze({ slot, reason: 'no verified render for this profile' })); continue; }
    slots[slot] = selection;
  }
  return Object.freeze({
    situation_id: situationId,
    profile: profile?.name ?? null,
    resolved: gaps.length === 0,
    slots: Object.freeze(slots),
    gaps: Object.freeze(gaps)
  });
}

/**
 * Coverage across the whole curriculum and every learner profile. This is the number K53 has to
 * be able to state: how many situations x profiles resolve a complete five-slot turn, and exactly
 * which do not and why.
 */
export function coverage(assetMap, { profiles = LEARNER_PROFILES } = {}) {
  const catalog = buildCatalog(assetMap);
  const rows = [];
  for (const situation of catalog.situations) {
    for (const profile of profiles) {
      const resolved = resolveSituation(assetMap, situation.situation_id, profile);
      rows.push(Object.freeze({ situation_id: situation.situation_id, profile: profile.name, resolved: resolved.resolved, gaps: resolved.gaps }));
    }
  }
  const incomplete = rows.filter(row => !row.resolved);
  return Object.freeze({
    situations: catalog.counts.situations,
    profiles: profiles.length,
    expected_turns: rows.length,
    resolved_turns: rows.length - incomplete.length,
    incomplete_turns: incomplete.length,
    complete_situations: catalog.counts.complete_situations,
    situations_missing_slots: catalog.situations.filter(situation => !situation.complete).map(situation => Object.freeze({ situation_id: situation.situation_id, missing_slots: situation.missing_slots })),
    gaps: Object.freeze(incomplete.slice(0, 40).map(row => Object.freeze({ situation_id: row.situation_id, profile: row.profile, gaps: row.gaps })))
  });
}
