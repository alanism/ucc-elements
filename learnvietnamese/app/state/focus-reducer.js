/**
 * Focus State Reducer
 * In accordance with Build Plan rd03 §6.1 & §6.4:
 * Manages spatial focus identity and temporary overlay focus stack.
 * Does not jump focus on incoming streaming transcript deltas.
 */

export const INITIAL_FOCUS_STATE = {
  currentFocusElementId: 'power-switch',
  focusStack: [] // Stack of element IDs for restoring focus after closing modals/overlays
};

export function focusReducer(state = INITIAL_FOCUS_STATE, action) {
  switch (action.type) {
    case 'SET_FOCUS': {
      if (!action.elementId || typeof action.elementId !== 'string') return state;
      return {
        ...state,
        currentFocusElementId: action.elementId
      };
    }

    case 'PUSH_FOCUS_OVERLAY': {
      // Pushing an overlay (e.g. Parent Review modal or Help overlay)
      return {
        currentFocusElementId: action.overlayInitialFocusId || action.elementId,
        focusStack: [...state.focusStack, state.currentFocusElementId]
      };
    }

    case 'POP_FOCUS_OVERLAY': {
      if (state.focusStack.length === 0) return state;
      const nextStack = [...state.focusStack];
      const restoredFocusId = nextStack.pop();
      return {
        currentFocusElementId: restoredFocusId,
        focusStack: nextStack
      };
    }

    case 'STREAM_TRANSCRIPT_DELTA': {
      // Intentional invariant: transcript deltas DO NOT modify focus target!
      return state;
    }

    default:
      return state;
  }
}
