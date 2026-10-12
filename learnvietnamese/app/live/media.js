/**
 * Client Media Binding & Emergency Cutoff
 * In accordance with Build Plan rd03 §5, §6.3 & Gates T01, T12
 */

export class LiveMediaBinding {
  constructor(options = {}) {
    this.audioController = options.audioController || null;
    this.audioContext = options.audioContext || null;
    this.gainNode = options.gainNode || null;
    this.currentGeneration = options.generation || 1;
    this.micStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.isMuted = false;
    this.isPlayingRecorded = false;
    this.isLiveAudioActive = false;
    this.lastExitLatencyMs = null;
    this.emergencyDispatchLatencyMs = null;
  }

  setGeneration(gen) {
    this.currentGeneration = gen;
  }

  async acquireMicrophone(mediaDevices = (typeof navigator !== 'undefined' ? navigator.mediaDevices : null)) {
    try {
      if (!mediaDevices || typeof mediaDevices.getUserMedia !== 'function') {
        throw new Error('MediaDevices getUserMedia not available');
      }
      const stream = await mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;
      return { success: true, stream };
    } catch (err) {
      const isPermissionDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      return {
        success: false,
        permissionDenied: isPermissionDenied,
        error: err.message
      };
    }
  }

  bindRemoteTrack(track, generation) {
    // Generation-aware check: reject stale tracks from previous connections
    if (generation !== this.currentGeneration) {
      if (track && typeof track.stop === 'function') {
        track.stop();
      }
      return { attached: false, reason: 'stale_generation', generation, currentGeneration: this.currentGeneration };
    }

    this.isLiveAudioActive = true;
    if (this.isPlayingRecorded) {
      // Invariant T01: NEVER allow concurrent recorded and live speech
      this.stopRecordedPlayback();
    }

    return { attached: true, generation };
  }

  playRecordedPhrase(phraseId) {
    if (this.isLiveAudioActive) {
      // Invariant T01: Cannot play recorded audio while live audio is active
      this.isLiveAudioActive = false;
      this.muteLiveAudio();
    }
    this.isPlayingRecorded = true;
    return { playing: true, phraseId };
  }

  stopRecordedPlayback() {
    this.isPlayingRecorded = false;
  }

  muteLiveAudio() {
    if (this.gainNode) {
      if (typeof this.gainNode.gain?.setValueAtTime === 'function' && this.audioContext) {
        this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      } else {
        this.gainNode.gain = 0;
      }
    }
    this.isMuted = true;
  }

  handleServerDisconnect() {
    // Stop local mic immediately upon server-link loss without waiting for server response
    this.muteLiveAudio();
    this.stopAllMicTracks();
    this.isLiveAudioActive = false;
    if (this.audioController) {
      this.audioController.dispatch({ type: 'SWITCH_MODE', mode: 'play' });
    }
    return { disconnected: true, micStopped: true };
  }

  stopAllMicTracks() {
    if (this.micStream) {
      const tracks = this.micStream.getTracks ? this.micStream.getTracks() : [];
      for (const track of tracks) {
        if (typeof track.stop === 'function') {
          track.stop();
        }
      }
      this.micStream = null;
    }
  }

  emergencyEnd() {
    const t0 = performance.now();

    // 1. Instant local gain clamp to 0
    this.muteLiveAudio();

    // 2. Stop all local microphone tracks synchronously
    this.stopAllMicTracks();

    // 3. Close peer connection synchronously
    if (this.peerConnection && typeof this.peerConnection.close === 'function') {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // 4. Invalidate generation to drop any in-flight callbacks
    this.currentGeneration++;
    this.isLiveAudioActive = false;
    this.isPlayingRecorded = false;

    // 5. Notify controller if bound
    if (this.audioController) {
      this.audioController.dispatch({ type: 'EMERGENCY_END' });
    }

    const t1 = performance.now();
    this.emergencyDispatchLatencyMs = t1 - t0;
    this.lastExitLatencyMs = t1 - t0;

    return {
      emergencyEnded: true,
      dispatchLatencyMs: this.emergencyDispatchLatencyMs,
      under50ms: this.emergencyDispatchLatencyMs < 50
    };
  }

  measurePhysicalSilenceExit() {
    const t0 = performance.now();
    this.emergencyEnd();
    const t1 = performance.now();
    const latencyMs = t1 - t0;
    return latencyMs;
  }
}
