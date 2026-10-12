/**
 * Presentation Policy Reducer
 * In accordance with Build Plan rd03 §6.2 & Adversarial Findings R02/R05:
 * Enforces ear-first concealment across activities.
 * Prohibits unauthorized early reveal of Vietnamese target and pronunciation aids.
 */

export const INITIAL_PRESENTATION_STATE = {
  activeActivity: 'first_introduction', // 'first_introduction', 'echo', 'retrieval', 'recognition', 'roleplay', 'review'
  phraseId: null,
  vietnameseTarget: '',
  meaningCue: '',
  vietnameseRevealed: false,
  pronunciationAidRevealed: false,
  attemptStatus: 'none', // 'none', 'self_reported', 'evaluated'
  helpLevel: 0,
  independenceDisqualified: false
};

export function presentationReducer(state = INITIAL_PRESENTATION_STATE, action) {
  switch (action.type) {
    case 'LOAD_PHRASE': {
      // New phrase presentation: Vietnamese text and phonetics MUST be concealed
      return {
        ...state,
        phraseId: action.phraseId,
        vietnameseTarget: action.vietnamese || '',
        meaningCue: action.english || '',
        activeActivity: action.activity || 'first_introduction',
        vietnameseRevealed: false,
        pronunciationAidRevealed: false,
        attemptStatus: 'none',
        helpLevel: 0,
        independenceDisqualified: false
      };
    }

    case 'SELF_REPORT_ATTEMPT': {
      // Learner clicked "I've tried": records explicit ungraded attempt signal
      // Enables optional reveal but DOES NOT auto-reveal text!
      return {
        ...state,
        attemptStatus: 'self_reported'
      };
    }

    case 'REVEAL_TARGET': {
      // Learner explicitly requested text reveal
      // Disqualifies independent retrieval evidence
      return {
        ...state,
        vietnameseRevealed: true,
        independenceDisqualified: true
      };
    }

    case 'REVEAL_PRONUNCIATION_AID': {
      return {
        ...state,
        pronunciationAidRevealed: true,
        independenceDisqualified: true
      };
    }

    case 'REQUEST_HELP': {
      // Level progression 0 -> 1 -> 2 -> 3
      const nextLevel = Math.min(state.helpLevel + 1, 3);
      const revealsAtLevel3 = nextLevel === 3;
      return {
        ...state,
        helpLevel: nextLevel,
        vietnameseRevealed: revealsAtLevel3 ? true : state.vietnameseRevealed,
        independenceDisqualified: true
      };
    }

    case 'TRANSITION_ACTIVITY': {
      const newActivity = action.activity;
      const isReview = newActivity === 'review';
      return {
        ...state,
        activeActivity: newActivity,
        // In review, allowed on request; in fresh retrieval, reset concealment
        vietnameseRevealed: isReview ? state.vietnameseRevealed : false,
        pronunciationAidRevealed: isReview ? state.pronunciationAidRevealed : false,
        attemptStatus: 'none',
        helpLevel: 0
      };
    }

    case 'RETURN_TO_PLAY': {
      // In accordance with R02 / §6.2: Returning from LIVE restores current activity policy
      // It does NOT automatically spoil/reveal answers!
      return {
        ...state,
        // Preserve concealment status
        vietnameseRevealed: state.activeActivity === 'review' ? state.vietnameseRevealed : false
      };
    }

    default:
      return state;
  }
}
