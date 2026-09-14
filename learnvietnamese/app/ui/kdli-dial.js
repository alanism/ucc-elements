/**
 * KDLI physical dial (K51, owner decision 2026-09-14).
 *
 * One physical interaction: rotate to move through the practice stages, press to play or
 * replay, hold to return to the MODEL anchor.
 *
 * The owner's constraints, each enforced here rather than described:
 *   - rotate clockwise / counter-clockwise   -> HEAR .. APPLY, forward and back
 *   - press                                   -> play / replay the CURRENT stage (never advance)
 *   - hold (centre action)                    -> return to MODEL, one gesture from anywhere
 *   - practice_stage and content_slot stay separate: the reducer keeps mapping stages onto
 *     MODEL/HEAR/RESPOND/CHANGE/CONTINUE, and this module never invents a slot
 *   - no timers and no push-to-talk may advance the turn. The hold detector exists only to
 *     recognise a gesture the learner is still performing; it emits nothing by itself.
 *   - world selection and situation tuning are separate existing controls and are NOT wired
 *     to the dial at all
 *   - audio that is missing stays explicitly unavailable; nothing falls back to another
 *     actor or variant
 */
import { STAGES, STAGE_SLOT } from '../pedagogy/kdli-turn.js';

/** The whole mapping, in one place, so it can be asserted rather than inferred. */
export function dialEventToTurnEvent(event) {
  switch (event?.type) {
    case 'ROTATE':
      if (event.direction === 'cw') return { type: 'ADVANCE' };
      if (event.direction === 'ccw') return { type: 'BACK' };
      return null;
    case 'PRESS':
      return { type: 'AGAIN' };
    case 'HOLD':
      return { type: 'GO_TO_STAGE', stage: 'MODEL' };
    default:
      return null;
  }
}

export const DIAL_STAGES = STAGES;
export const DIAL_SLOT_FOR_STAGE = STAGE_SLOT;

/**
 * Map one dial notch to the stage it lands on, so the UI can show the target before the
 * turn moves. Rotation is bounded by the sequence: it does not wrap.
 */
export function stageAfterRotation(currentStage, direction) {
  const index = STAGES.indexOf(currentStage);
  if (index < 0) return null;
  const next = direction === 'cw' ? index + 1 : index - 1;
  return STAGES[next] ?? null;
}

export function createDialController({
  view,
  doc,
  root,
  rotationSurface = null,
  longPressMs = 600,
  notchDegrees = 25,
  dragThresholdPx = 12,
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = handle => clearTimeout(handle)
} = {}) {
  if (!view) throw new Error('createDialController requires a view');
  let holding = null;
  let heldLong = false;
  const listeners = [];
  const on = (target, type, handler, options) => {
    if (!target?.addEventListener) return;
    target.addEventListener(type, handler, options);
    listeners.push({ target, type, handler });
  };

  /** Returns what happened, including the explicit unavailable state when audio is absent. */
  function report(action, result) {
    const stage = view.state?.stage ?? null;
    const slot = stage ? STAGE_SLOT[stage] : null;
    const selection = stage ? view.model?.().lastPlayed : null;
    const unavailable = result?.effects?.some(effect => effect.type === 'GAP') === true
      || (result?.played?.length === 0 && action !== 'hold');
    return {
      action,
      stage,
      slot,
      played: result?.played?.length ?? 0,
      // Explicit, never a fallback: when the stage has no verified audio we say so.
      unavailable: action === 'press' ? unavailable : false
    };
  }

  function rotate(direction) {
    const target = stageAfterRotation(view.state?.stage, direction);
    if (!target) return { action: 'rotate', stage: view.state?.stage ?? null, at_boundary: true, unavailable: false };
    const result = direction === 'cw' ? view.act('next') : view.act('back');
    return { ...report('rotate', result), at_boundary: false, moved_to: target };
  }

  function press() {
    return report('press', view.act('again'));
  }

  function hold() {
    // The centre action: MODEL from anywhere, always one gesture.
    return report('hold', view.act('model'));
  }

  // --- DOM binding -------------------------------------------------------------------
  // One gesture at a time: a drag that rotates is a rotation, a stationary press is a
  // press, and a stationary press that outlives the threshold is the centre action.
  let gesture = null;
  const centreOf = () => {
    const surface = rotationSurface ?? root;
    const rect = surface?.getBoundingClientRect?.();
    if (!rect) return null;
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };
  const angleFrom = (event, centre) => Math.atan2(event.clientY - centre.y, event.clientX - centre.x) * (180 / Math.PI);

  const onPointerDown = event => {
    heldLong = false;
    gesture = { x: event?.clientX ?? 0, y: event?.clientY ?? 0, rotating: false, lastAngle: null, travelled: 0 };
    holding = setTimer(() => {
      // Only a stationary hold becomes the centre action; a drag cancels this first.
      if (gesture?.rotating) return;
      holding = null;
      heldLong = true;
      hold();
    }, longPressMs);
  };

  const onPointerMove = event => {
    if (!gesture || heldLong) return;
    const dx = (event?.clientX ?? 0) - gesture.x;
    const dy = (event?.clientY ?? 0) - gesture.y;
    if (!gesture.rotating && Math.hypot(dx, dy) < dragThresholdPx) return;
    if (!gesture.rotating) {
      // The learner is dragging, not pressing: abandon the press and the hold.
      gesture.rotating = true;
      if (holding !== null) { clearTimer(holding); holding = null; }
      const centre = centreOf();
      gesture.lastAngle = centre ? angleFrom(event, centre) : null;
      return;
    }
    const centre = centreOf();
    if (!centre) return;
    const angle = angleFrom(event, centre);
    let delta = angle - gesture.lastAngle;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    gesture.travelled += delta;
    gesture.lastAngle = angle;
    // Emit one notch per notchDegrees of travel, in the direction the learner turned.
    while (Math.abs(gesture.travelled) >= notchDegrees) {
      const direction = gesture.travelled > 0 ? 'cw' : 'ccw';
      gesture.travelled -= Math.sign(gesture.travelled) * notchDegrees;
      rotate(direction);
    }
  };

  const onPointerUp = () => {
    const wasRotating = gesture?.rotating === true;
    gesture = null;
    if (holding !== null) {
      clearTimer(holding);
      holding = null;
    }
    // A release after a rotation or a completed hold must not also fire a press.
    if (wasRotating || heldLong) { heldLong = false; return; }
    press();
  };
  const onPointerCancel = () => {
    gesture = null;
    if (holding !== null) { clearTimer(holding); holding = null; }
    heldLong = false;
  };
  const onWheel = event => {
    const delta = event?.deltaY ?? 0;
    if (delta === 0) return;
    rotate(delta > 0 ? 'cw' : 'ccw');
  };
  const onKey = event => {
    const key = event?.key;
    if (key === 'ArrowRight' || key === 'ArrowDown') rotate('cw');
    else if (key === 'ArrowLeft' || key === 'ArrowUp') rotate('ccw');
    else if (key === 'Enter' || key === ' ') press();
    else if (key === 'Escape' || key === 'Home') hold();
  };

  if (root) {
    on(root, 'pointerdown', onPointerDown);
    on(root, 'pointermove', onPointerMove);
    on(root, 'pointerup', onPointerUp);
    on(root, 'pointercancel', onPointerCancel);
    on(root, 'wheel', onWheel);
    on(root, 'keydown', onKey);
  }

  return {
    rotate, press, hold,
    get holding() { return holding !== null; },
    destroy() {
      if (holding !== null) { clearTimer(holding); holding = null; }
      for (const { target, type, handler } of listeners) target.removeEventListener?.(type, handler);
      listeners.length = 0;
    }
  };
}
