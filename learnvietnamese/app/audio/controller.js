/**
 * Audio Effect Controller
 * In accordance with Build Plan rd03 §5.1:
 * Bridges pure reducer state transitions to real WebAudio/MediaStream operations.
 * Supports injected adapter for deterministic unit testing.
 */

import { audioReducer, INITIAL_AUDIO_STATE } from './reducer.js';

export class AudioController {
  constructor(options = {}) {
    this.state = options.initialState || INITIAL_AUDIO_STATE;
    this.mediaAdapter = options.mediaAdapter || new DefaultMediaAdapter();
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispatch(action) {
    const nextState = audioReducer(this.state, action);
    if (nextState === this.state) return;
    this.state = nextState;

    // Execute declarative side-effects emitted by reducer
    if (Array.isArray(nextState.effectsToRun) && nextState.effectsToRun.length > 0) {
      for (const effect of nextState.effectsToRun) {
        this.executeEffect(effect);
      }
    }

    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  executeEffect(effect) {
    switch (effect.type) {
      case 'STOP_ALL_MEDIA':
        this.mediaAdapter.stopRecordedAudio();
        this.mediaAdapter.stopMicrophone();
        this.mediaAdapter.detachRemoteAudio();
        break;

      case 'DISPOSE_ALL':
        this.mediaAdapter.dispose();
        break;

      case 'START_PLAYBACK':
        this.mediaAdapter.playRecorded(effect.phraseId);
        break;

      case 'STOP_RECORDED_AUDIO':
        this.mediaAdapter.stopRecordedAudio();
        break;

      case 'GATE_GAIN_ZERO':
        this.mediaAdapter.setGain(0);
        break;

      case 'STOP_MIC_TRACKS':
        this.mediaAdapter.stopMicrophone();
        break;

      case 'DETACH_REMOTE_AUDIO':
        this.mediaAdapter.detachRemoteAudio();
        break;

      case 'SEND_SIDEBAND_CLOSE':
        this.mediaAdapter.closeSideband();
        break;

      case 'INITIATE_LIVE_CONNECT':
        this.mediaAdapter.initiateLiveConnection(effect.generation, (err, connectionData) => {
          if (err) {
            this.dispatch({ type: 'LIVE_ERROR', generation: effect.generation, error: err });
          } else {
            this.dispatch({ type: 'LIVE_CONNECTED', generation: effect.generation, tracks: connectionData?.tracks });
          }
        });
        break;

      case 'DISPOSE_STALE_CONNECTION':
        this.mediaAdapter.disposeTracks(effect.acquiredTracks);
        break;

      case 'ATTACH_LIVE_MEDIA':
        this.mediaAdapter.attachLiveMedia();
        break;

      case 'LOCAL_EMERGENCY_DISPATCH_MUTE':
        this.mediaAdapter.emergencyLocalMute();
        break;
    }
  }
}

export class DefaultMediaAdapter {
  constructor() {
    this.isPlaying = false;
    this.micActive = false;
    this.gain = 1;
  }

  playRecorded() { this.isPlaying = true; }
  stopRecordedAudio() { this.isPlaying = false; }
  stopMicrophone() { this.micActive = false; }
  detachRemoteAudio() {}
  dispose() { this.stopRecordedAudio(); this.stopMicrophone(); }
  setGain(g) { this.gain = g; }
  closeSideband() {}
  initiateLiveConnection(gen, cb) { cb(null, {}); }
  disposeTracks() {}
  attachLiveMedia() { this.micActive = true; }
  emergencyLocalMute() { this.gain = 0; this.micActive = false; }
}
