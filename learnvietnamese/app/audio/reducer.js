/**
 * Audio Intent Pure Reducer
 * In accordance with Build Plan rd03 §5.1 & Adversarial Finding R07
 */

export const INITIAL_AUDIO_STATE = {
  power: 'off',
  requestedMode: 'play',
  session: 'ready',
  transport: 'absent',
  audioOwner: 'none',
  connectionGeneration: 1,
  pendingConnection: null,
  activePhraseId: null,
  effectsToRun: [] // Declarative side-effects for controller to execute
};

export function audioReducer(state = INITIAL_AUDIO_STATE, action) {
  switch (action.type) {
    case 'POWER_ON': {
      if (state.power === 'on') return state;
      return {
        ...state,
        power: 'on',
        session: 'ready',
        requestedMode: 'play',
        transport: 'absent',
        audioOwner: 'none',
        connectionGeneration: state.connectionGeneration + 1,
        pendingConnection: null,
        effectsToRun: [{ type: 'STOP_ALL_MEDIA' }]
      };
    }

    case 'POWER_OFF': {
      if (state.power === 'off') return state;
      return {
        ...state,
        power: 'off',
        session: 'ended',
        transport: 'absent',
        audioOwner: 'none',
        connectionGeneration: state.connectionGeneration + 1,
        pendingConnection: null,
        effectsToRun: [{ type: 'STOP_ALL_MEDIA' }, { type: 'DISPOSE_ALL' }]
      };
    }

    case 'START_SESSION': {
      if (state.power !== 'on') return state;
      return {
        ...state,
        session: 'running',
        effectsToRun: []
      };
    }

    case 'PAUSE_SESSION': {
      if (state.power !== 'on' || state.session !== 'running') return state;
      return {
        ...state,
        session: 'paused',
        audioOwner: 'none',
        connectionGeneration: state.connectionGeneration + 1,
        pendingConnection: null,
        effectsToRun: [{ type: 'STOP_ALL_MEDIA' }]
      };
    }

    case 'RESUME_SESSION': {
      if (state.power !== 'on' || state.session !== 'paused') return state;
      return {
        ...state,
        session: 'running',
        effectsToRun: []
      };
    }

    case 'SELECT_PHRASE': {
      if (state.power !== 'on') return state;
      // In LIVE mode, phrase dial is disabled
      if (state.requestedMode === 'live') {
        return state;
      }
      return {
        ...state,
        activePhraseId: action.phraseId,
        audioOwner: 'none',
        effectsToRun: [{ type: 'STOP_RECORDED_AUDIO' }]
      };
    }

    case 'PLAY_RECORDED_AUDIO': {
      if (state.power !== 'on' || state.session !== 'running') return state;
      if (state.requestedMode !== 'play') return state;

      return {
        ...state,
        audioOwner: 'recording',
        effectsToRun: [{ type: 'START_PLAYBACK', phraseId: action.phraseId || state.activePhraseId }]
      };
    }

    case 'RECORDED_AUDIO_FINISHED': {
      if (state.audioOwner !== 'recording') return state;
      return {
        ...state,
        audioOwner: 'none',
        effectsToRun: []
      };
    }

    case 'SWITCH_MODE': {
      if (state.power !== 'on') return state;
      const targetMode = action.mode;
      if (targetMode === state.requestedMode) return state;

      const nextGen = state.connectionGeneration + 1;

      if (targetMode === 'play') {
        // Emergency stop of live media, increment generation to invalidate pending LIVE callbacks
        return {
          ...state,
          requestedMode: 'play',
          transport: 'absent',
          audioOwner: 'none',
          connectionGeneration: nextGen,
          pendingConnection: null,
          effectsToRun: [
            { type: 'GATE_GAIN_ZERO' },
            { type: 'STOP_MIC_TRACKS' },
            { type: 'DETACH_REMOTE_AUDIO' },
            { type: 'SEND_SIDEBAND_CLOSE' }
          ]
        };
      }

      // targetMode === 'live'
      return {
        ...state,
        requestedMode: 'live',
        transport: 'connecting',
        audioOwner: 'none',
        connectionGeneration: nextGen,
        pendingConnection: { generation: nextGen },
        effectsToRun: [
          { type: 'STOP_RECORDED_AUDIO' },
          { type: 'INITIATE_LIVE_CONNECT', generation: nextGen }
        ]
      };
    }

    case 'LIVE_CONNECTED': {
      // In accordance with R07 / §5.1: Check generation AND current requestedMode
      const isStale = (
        state.power !== 'on' ||
        state.session !== 'running' ||
        state.requestedMode !== 'live' ||
        action.generation !== state.connectionGeneration
      );

      if (isStale) {
        // Late or stale callback! Must reject and immediately dispose acquired resources
        return {
          ...state,
          effectsToRun: [
            { type: 'DISPOSE_STALE_CONNECTION', acquiredTracks: action.tracks, generation: action.generation }
          ]
        };
      }

      return {
        ...state,
        transport: 'active',
        audioOwner: 'live',
        pendingConnection: null,
        effectsToRun: [{ type: 'ATTACH_LIVE_MEDIA', generation: action.generation }]
      };
    }

    case 'LIVE_ERROR': {
      if (action.generation !== state.connectionGeneration) {
        return state;
      }
      return {
        ...state,
        transport: 'failed',
        audioOwner: 'none',
        pendingConnection: null,
        effectsToRun: [{ type: 'STOP_MIC_TRACKS' }, { type: 'GATE_GAIN_ZERO' }]
      };
    }

    case 'EMERGENCY_END': {
      return {
        ...state,
        power: 'off',
        session: 'ended',
        transport: 'absent',
        audioOwner: 'none',
        connectionGeneration: state.connectionGeneration + 1,
        pendingConnection: null,
        effectsToRun: [
          { type: 'LOCAL_EMERGENCY_DISPATCH_MUTE' },
          { type: 'STOP_MIC_TRACKS' },
          { type: 'STOP_RECORDED_AUDIO' },
          { type: 'SEND_SIDEBAND_CLOSE' }
        ]
      };
    }

    default:
      return state;
  }
}
