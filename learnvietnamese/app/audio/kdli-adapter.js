/**
 * KDLI audio adapter (K52 binding).
 *
 * Performs the effects that `app/pedagogy/kdli-turn.js` emits. The reducer decides WHAT
 * happens; this decides how it reaches an <audio> element. Kept injectable (no global
 * document) so it can be tested without a browser.
 *
 * Two things this deliberately does NOT do:
 *   - it never rewrites audio bytes. Level differences between actors are corrected with
 *     playback gain only.
 *   - it never plays an asset the exported map does not contain, so audio that failed
 *     machine QA is unreachable rather than merely discouraged.
 */
import { createTurn, initialState, reduce } from '../pedagogy/kdli-turn.js';
import { selectSituation, resolvePublicPath } from './kdli-select.js';

/**
 * Playback-only gain, in dB, derived from measured full-library loudness:
 *   f1 -22.3 · f2 -14.7 · m1 -14.3 · m2 -22.6 LUFS
 * The loud pair is attenuated toward the quiet pair rather than boosting anyone, which
 * keeps every render below its measured true peak. Nothing is re-encoded.
 */
export const ACTOR_GAIN_DB = Object.freeze({ f1: 0, f2: -7, m1: -7.5, m2: 0 });

export function gainDbFor(voiceCode) {
  return ACTOR_GAIN_DB[voiceCode] ?? 0;
}

export function dbToLinear(db) {
  return Math.min(1, Math.max(0, 10 ** (db / 20)));
}

/** Fetch the exported map for a release. Throws rather than inventing an empty map. */
export async function loadAssetMap({ release, basePath = '', fetchImpl = globalThis.fetch } = {}) {
  if (!release) throw new Error('release is required');
  const url = `${basePath}audio/kdli/${release}/asset_map.json`;
  const response = await fetchImpl(url);
  if (!response?.ok) throw new Error(`Asset map unavailable: ${url} (${response?.status})`);
  const map = await response.json();
  if (!map?.assets || !map?.phrases) throw new Error(`Asset map malformed: ${url}`);
  return map;
}

/**
 * Asset IDs are `WW.SS.PP.<voice_code>.<variant>`, so the voice code is the token that
 * names a known actor. Matched by name rather than position: reading a fixed index here
 * silently produced the slot number instead of the actor and disabled the gain table.
 */
export function voiceCodeOf(assetId) {
  return String(assetId ?? '').split('.').find(part => part in ACTOR_GAIN_DB) ?? null;
}

export function createKdliPlayer({ assetMap, basePath = '', audio = null, onState = null, onGap = null } = {}) {
  if (!assetMap) throw new Error('createKdliPlayer requires an assetMap');
  let turn = null;
  let state = null;

  const perform = effects => {
    const played = [];
    for (const effect of effects) {
      if (effect.type === 'STOP') {
        if (audio && typeof audio.stop === 'function') audio.stop();
      } else if (effect.type === 'PLAY') {
        const url = resolvePublicPath({ assetMap, basePath }, effect.asset_id);
        // The map is the authority: no path means no playback, never a substitute.
        if (!url) continue;
        if (audio && typeof audio.play === 'function') {
          audio.play({ url, gain: dbToLinear(gainDbFor(voiceCodeOf(effect.asset_id))) });
        }
        played.push({ ...effect, url });
      } else if (effect.type === 'GAP') {
        if (onGap) onGap(effect);
      }
    }
    return played;
  };

  return {
    get state() { return state; },
    get turn() { return turn; },

    startTurn({ situationId, profile }) {
      const selection = selectSituation({ situationId, profile, assetMap });
      turn = createTurn({ situationId, profile, selection });
      state = initialState(turn);
      if (onState) onState(state, turn);
      return { state, turn, played: [] };
    },

    /** Send one event. Returns the new state and what was actually played. */
    send(event) {
      if (!turn) throw new Error('startTurn must be called before send');
      const result = reduce(state, event, turn);
      state = result.state;
      const played = perform(result.effects);
      if (onState) onState(state, turn);
      return { state, turn, played, effects: result.effects };
    },

    /** Replay the current stage — the learner's repeat request. */
    again() { return this.send({ type: 'AGAIN' }); },
    next() { return this.send({ type: 'ADVANCE' }); },
    back() { return this.send({ type: 'BACK' }); },
    reveal() { return this.send({ type: 'SHOW_TEXT' }); },
    hide() { return this.send({ type: 'HIDE_TEXT' }); },
    toStage(stage) { return this.send({ type: 'GO_TO_STAGE', stage }); }
  };
}

/**
 * Build an <audio>-backed sink. Separate from the player so tests can inject a fake and
 * so the caller controls when the element is created (audio unlocking on first gesture).
 */
export function createAudioSink({ audioElement }) {
  return {
    play({ url, gain }) {
      audioElement.src = url;
      audioElement.volume = gain;
      const attempt = audioElement.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
    },
    stop() {
      audioElement.pause();
      try { audioElement.currentTime = 0; } catch { /* element may not be seekable yet */ }
    }
  };
}
