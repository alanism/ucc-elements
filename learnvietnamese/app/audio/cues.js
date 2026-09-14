/**
 * Client Audio Cue Controller
 * In accordance with Build Plan rd03 §7.2, §9.3
 */

export class AudioCueController {
  constructor(options = {}) {
    this.audioElement = options.audioElement || null;
    this.manifest = options.manifest || null;
    this.onCueStarted = options.onCueStarted || (() => {});
    this.onCueFinished = options.onCueFinished || (() => {});
  }

  playCue(cueId) {
    let audioUrl = `/audio/${cueId}.mp3`;
    if (this.manifest && this.manifest.assets && this.manifest.assets[cueId]) {
      audioUrl = this.manifest.assets[cueId].publicPath;
    }

    this.onCueStarted(cueId);

    if (this.audioElement) {
      this.audioElement.src = audioUrl;
      const p = this.audioElement.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          this.onCueFinished(cueId, true);
        }).catch(() => {
          this.onCueFinished(cueId, false);
        });
      }
    } else {
      // Mock / headless immediate finish
      this.onCueFinished(cueId, true);
    }
  }
}
