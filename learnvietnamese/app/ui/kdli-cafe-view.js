/**
 * KDLI Café view (K58).
 *
 * The DOM layer for the PLAY turn. Extracted from the demo page so its lifecycle can be
 * tested — the inline version could not be.
 *
 * Hardening this module owns:
 *   - HIDDEN-ANSWER-FREE: the veiled text and gloss never enter the DOM, in any node,
 *     attribute, aria-label or title. Everything rendered comes from the view model, which
 *     returns null while veiled.
 *   - AUDIO UNLOCKING: a play rejected before the first user gesture is expected on iOS;
 *     the first real tap marks the sink unlocked and re-offers the current stage.
 *   - POINTER CANCELLATION / LOST CAPTURE: a cancelled gesture stops playback rather than
 *     leaving audio running from a tap the learner aborted.
 *   - SUSPENSION / RETURN: hiding the page stops audio and marks the turn suspended; on
 *     return the state is restored but NOTHING auto-plays and nothing advances.
 *   - EXIT CLEANUP: destroy() removes every listener, releases the audio element and drops
 *     references so the release can be swapped without leaking the old turn.
 */
import { STAGE_SLOT, visibleGloss, visibleText } from '../pedagogy/kdli-turn.js';

/**
 * Everything the view is permitted to render. Pure, so the no-leak rule is testable
 * without a DOM: while veiled, `text` and `gloss` are null by construction.
 */
export function cafeViewModel({ state, turn, gap = null, lastPlayed = null }) {
  if (!state) return { stage: null, slot: null, plays: 0, text: null, gloss: null, revealed: false, gap: null, lastPlayed: null };
  const slot = STAGE_SLOT[state.stage] ?? null;
  return {
    stage: state.stage,
    slot,
    plays: state.plays,
    text: visibleText(state, turn),
    gloss: visibleGloss(state, turn),
    revealed: state.revealed === true,
    gap,
    lastPlayed
  };
}

const TEXT_INPUT_TYPES = new Set(['button', 'text', 'reset', 'submit']);

export function createCafeView({
  document: doc,
  root,
  player,
  assetMap,
  situationId = '03.01',
  initialProfile = 'child girl',
  profiles,
  onGap = null,
  onPlay = null,
  onState: onViewState = null,
  audioElement = null
} = {}) {
  if (!doc || !root || !player) throw new Error('createCafeView requires document, root and player');

  const ui = {
    stage: doc.getElementById('stage'),
    vn: doc.getElementById('vn'),
    gloss: doc.getElementById('gloss'),
    gap: doc.getElementById('gap'),
    profiles: doc.getElementById('profiles'),
    reveal: doc.getElementById('reveal')
  };

  let activeProfile = initialProfile;
  let suspended = false;
  let unlocked = false;
  let destroyed = false;
  let lastGap = null;
  let lastPlayed = null;

  const sound = audioElement ?? (doc.getElementById ? doc.getElementById('el') : null);

  const model = () => cafeViewModel({ state: player.state, turn: player.turn, gap: lastGap, lastPlayed });

  function paint() {
    if (destroyed) return;
    const vm = model();
    if (ui.stage) ui.stage.textContent = vm.stage ? `${vm.stage}  ·  ${vm.slot}  ·  ${vm.plays} play(s)` : '—';
    // The ONLY write of learner-facing Vietnamese text. Null means the node is emptied,
    // so a veiled answer cannot survive anywhere in the tree.
    if (ui.vn) {
      ui.vn.className = vm.text ? 'vn' : 'vn veiled';
      ui.vn.textContent = vm.text ?? (suspended ? '(paused — tap to continue)' : '(audio first — text is veiled until you ask for it)');
    }
    if (ui.gloss) ui.gloss.textContent = vm.gloss ?? '';
    if (ui.gap) ui.gap.textContent = vm.gap ? vm.gap : '';
    if (ui.reveal) ui.reveal.textContent = vm.revealed ? 'Hide text' : 'Show text';
    for (const chip of ui.profiles?.children ?? []) chip.setAttribute('aria-pressed', String(chip.dataset?.name === activeProfile));
    // One hook after every paint, so a host can render resolution/untuned state without
    // reaching into the view's internals.
    if (onViewState && !destroyed) onViewState({ ...vm, profileName: activeProfile, suspended, unlocked });
  }

  function after(result) {
    lastPlayed = result?.played?.at(-1) ?? null;
    if (onPlay && lastPlayed) onPlay(lastPlayed);
    paint();
    return result;
  }

  /** Any real gesture unlocks playback. */
  function unlock() {
    if (unlocked) return false;
    unlocked = true;
    return true;
  }

  function act(action) {
    if (destroyed || suspended) return { blocked: true, reason: suspended ? 'suspended' : 'destroyed' };
    // A tap that follows a rejected autoplay is the gesture that unlocks audio. The action
    // itself must still run: the learner asked for it.
    const justUnlocked = unlock();
    const result = action();
    paint();
    return justUnlocked ? { ...result, unlocked: true } : result;
  }

  const actions = {
    start: () => after(player.send({ type: 'START' })),
    again: () => after(player.again()),
    next: () => after(player.next()),
    back: () => after(player.back()),
    model: () => after(player.toStage('MODEL')),
    reveal: () => after(player.state?.revealed ? player.hide() : player.reveal())
  };

  const listeners = [];
  const on = (target, type, handler, options) => {
    if (!target?.addEventListener) return;
    target.addEventListener(type, handler, options);
    listeners.push({ target, type, handler });
  };

  for (const [name, fn] of Object.entries(actions)) {
    const node = doc.getElementById(name);
    if (node) on(node, 'click', event => { event?.preventDefault?.(); act(fn); });
  }

  // A cancelled or lost pointer means the learner aborted the gesture: stop, do not queue.
  const abort = () => {
    if (sound && typeof sound.stop === 'function') sound.stop();
    lastPlayed = null;
    paint();
  };
  on(root, 'pointercancel', abort);
  on(root, 'lostpointercapture', abort);
  on(doc, 'pointercancel', abort);

  const onVisibility = () => {
    const hidden = doc.visibilityState === 'hidden';
    if (hidden) {
      suspended = true;
      if (sound && typeof sound.stop === 'function') sound.stop();
    } else {
      suspended = false;
    }
    paint();
  };
  on(doc, 'visibilitychange', onVisibility);
  on(doc, 'pagehide', () => { suspended = true; if (sound?.stop) sound.stop(); });

  function selectProfile(name) {
    activeProfile = name;
    if (!profiles?.[name]) throw new Error(`Unknown profile: ${name}`);
    player.startTurn({ situationId, profile: profiles[name] });
    lastGap = null;
    lastPlayed = null;
    suspended = false;
    paint();
  }

  // Panel of chips, built once.
  if (ui.profiles && profiles) {
    ui.profiles.textContent = '';
    for (const name of Object.keys(profiles)) {
      const chip = doc.createElement('button');
      chip.className = 'chip';
      chip.textContent = name;
      chip.dataset.name = name;
      chip.type = 'button';
      on(chip, 'click', () => selectProfile(name));
      ui.profiles.appendChild(chip);
    }
  }

  player.startTurn({ situationId, profile: profiles[activeProfile] });
  paint();

  return {
    get state() { return player.state; },
    get suspended() { return suspended; },
    get unlocked() { return unlocked; },
    get activeProfile() { return activeProfile; },
    model,
    selectProfile,
    act: name => act(actions[name]),
    unlock,
    setGap: message => { lastGap = message; paint(); },
    destroy() {
      destroyed = true;
      for (const { target, type, handler } of listeners) target.removeEventListener?.(type, handler);
      listeners.length = 0;
      if (sound) {
        if (sound.stop) sound.stop();
        if ('src' in sound) sound.src = '';
      }
      if (ui.vn) ui.vn.textContent = '';
      if (ui.gloss) ui.gloss.textContent = '';
    }
  };
}
