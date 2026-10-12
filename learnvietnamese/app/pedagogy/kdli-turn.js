/**
 * KDLI PLAY turn state machine (K50 / K52).
 *
 * TWO DIMENSIONS, deliberately kept apart (brief §14: do not confuse content slots with
 * learning stages):
 *
 *   Content slots  MODEL / HEAR / RESPOND / CHANGE / CONTINUE   — what the curriculum is
 *   Learning stages HEAR / ECHO / MODEL / CHANGE / RETRIEVE / APPLY — what the learner does
 *
 * The mapping between them is explicit in STAGE_SLOT below. ECHO and RETRIEVE are the two
 * stages with no content slot of their own: ECHO surfaces the MODEL for imitation, and
 * RETRIEVE surfaces RESPOND with the support of the model withheld.
 *
 * Rules this enforces, because they are the ones a learner actually feels:
 *   - audio first: starting a stage plays audio and re-veils any revealed text
 *   - NO timers: TICK is a no-op and can never advance the machine
 *   - NO push-to-talk auto-advance: PTT_RELEASE is a no-op
 *   - MODEL is reachable from every stage, always
 *   - a slot with no verified audio yields a GAP effect, never a substituted voice
 *
 * Pure: no DOM, no audio element, no provider. It returns effects for a caller to perform.
 */

export const STAGES = Object.freeze(['HEAR', 'ECHO', 'MODEL', 'CHANGE', 'RETRIEVE', 'APPLY']);

/** Which content slot each learning stage surfaces. */
export const STAGE_SLOT = Object.freeze({
  HEAR: 'HEAR',
  ECHO: 'MODEL',
  MODEL: 'MODEL',
  CHANGE: 'CHANGE',
  RETRIEVE: 'RESPOND',
  APPLY: 'CONTINUE'
});

/** Stages where the learner is expected to produce language, so text stays veiled. */
export const PRODUCTION_STAGES = Object.freeze(['ECHO', 'CHANGE', 'RETRIEVE', 'APPLY']);

export function createTurn({ situationId, profile, selection }) {
  if (!selection) throw new Error('createTurn requires a resolved selection');
  const slots = {};
  for (const stage of STAGES) {
    slots[stage] = selection.slots?.[STAGE_SLOT[stage]] ?? null;
  }
  return {
    situation_id: situationId,
    profile,
    slots,
    missing: Object.entries(slots).filter(([, value]) => !value).map(([stage]) => `${stage}:${STAGE_SLOT[stage]}`)
  };
}

export function initialState(turn) {
  return {
    situation_id: turn.situation_id,
    profile: turn.profile,
    stage: 'HEAR',
    revealed: false,
    plays: 0,
    visited: ['HEAR']
  };
}

/**
 * Apply one event. Returns the next state and the effects to perform, e.g.
 *   { state, effects: [{ type: 'PLAY', stage, slot, asset_id }] }
 * Reduced state is always a fresh object; the input is never mutated.
 */
export function reduce(state, event, turn) {
  const done = nextState => ({ state: nextState, effects: [] });
  const play = (stage, revealed = false) => {
    const selection = turn.slots[stage];
    const base = {
      ...state,
      stage,
      revealed,
      plays: state.plays + 1,
      visited: state.visited.includes(stage) ? state.visited : [...state.visited, stage]
    };
    if (!selection) {
      // No verified audio for this slot. Surface the gap; never substitute another voice.
      return { state: base, effects: [{ type: 'GAP', stage, slot: STAGE_SLOT[stage] }] };
    }
    return {
      state: base,
      effects: [{ type: 'STOP' }, { type: 'PLAY', stage, slot: STAGE_SLOT[stage], asset_id: selection.asset_id, text: selection.vietnamese_text }]
    };
  };

  switch (event?.type) {
    case 'START':
      return play('HEAR');

    case 'ADVANCE': {
      const index = STAGES.indexOf(state.stage);
      const nextStage = STAGES[index + 1];
      if (!nextStage) return done(state);
      return play(nextStage);
    }

    case 'BACK': {
      const index = STAGES.indexOf(state.stage);
      const previous = STAGES[index - 1];
      if (!previous) return done(state);
      return play(previous);
    }

    case 'AGAIN':
      // Replay the current stage. This is the learner asking for repetition, not progress.
      return play(state.stage, state.revealed);

    case 'GO_TO_STAGE': {
      if (!STAGES.includes(event.stage)) throw new Error(`Unknown stage: ${event.stage}`);
      return play(event.stage, state.revealed && !PRODUCTION_STAGES.includes(event.stage) && event.stage !== 'ECHO');
    }

    case 'SHOW_TEXT':
      // Explicit reveal only. Text is never revealed as a side effect of advancing.
      return done({ ...state, revealed: true });

    case 'HIDE_TEXT':
      return done({ ...state, revealed: false });

    case 'TICK':
    case 'PTT_RELEASE':
      // Deliberate no-ops. A timer or a push-to-talk release must never move the machine.
      return done(state);

    default:
      return done(state);
  }
}

/**
 * The single source of truth for what text the view may render. Callers must use this
 * rather than reading selection.vietnamese_text directly, so a veiled answer cannot leak
 * into the DOM or the accessibility tree by accident.
 */
export function visibleText(state, turn) {
  if (!state.revealed) return null;
  return turn.slots[state.stage]?.vietnamese_text ?? null;
}

export function visibleGloss(state, turn) {
  if (!state.revealed) return null;
  return turn.slots[state.stage]?.gloss ?? null;
}

export function canReturnToModel(state) {
  return state.stage !== 'MODEL';
}

export function progress(state) {
  const index = STAGES.indexOf(state.stage);
  return { stage: state.stage, index, total: STAGES.length, complete: index === STAGES.length - 1 };
}
