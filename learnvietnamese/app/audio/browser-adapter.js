/**
 * Browser Audio Media Adapter
 * In accordance with Build Plan rd03 §5.1, §6.1 and M1 Deployment Brief
 * Bridges the AudioController to real HTMLAudio / WebAudio playback in browsers.
 * Built for laptop browsers (Chrome/Safari/Firefox) and iPad Safari.
 */

export const ASSET_MAP = {
  // Canonical Anchors (Anh Vien - Vietnamese)
  cafe_01: 'audio/cafe_01_anhvien_f94593600f5d.mp3',
  cafe_02: 'audio/cafe_02_anhvien_441045cca13d.mp3',
  cafe_03: 'audio/cafe_03_anhvien_b49aa74e1bfd.mp3',
  cafe_04: 'audio/cafe_04_anhvien_be8095cf4bdc.mp3',
  cafe_05: 'audio/cafe_05_anhvien_3070cf0c00c4.mp3',

  // Foundational Repair Pack (Anh Vien - Vietnamese)
  repair_11_01: 'audio/repair_11_01_anhvien_7df72af77348.mp3',
  repair_11_02: 'audio/repair_11_02_anhvien_a40d3e98a8ec.mp3',
  repair_12_03: 'audio/repair_12_03_anhvien_5c10eee69840.mp3',

  // Cue Ladder Level 1 & Level 2 (Anh Vien - Vietnamese)
  cafe_01_cue_l1: 'audio/cafe_01_cue_l1_anhvien_a061fb5546d2.mp3',
  cafe_01_cue_l2: 'audio/cafe_01_cue_l2_anhvien_f34ea59c6d9b.mp3',
  cafe_02_cue_l1: 'audio/cafe_02_cue_l1_anhvien_8b8ddf8ac2c3.mp3',
  cafe_02_cue_l2: 'audio/cafe_02_cue_l2_anhvien_2c4a5f12be7d.mp3',
  cafe_03_cue_l1: 'audio/cafe_03_cue_l1_anhvien_34773452179e.mp3',
  cafe_03_cue_l2: 'audio/cafe_03_cue_l2_anhvien_48763c3ed6f1.mp3',
  cafe_04_cue_l1: 'audio/cafe_04_cue_l1_anhvien_615b00db54a2.mp3',
  cafe_04_cue_l2: 'audio/cafe_04_cue_l2_anhvien_54287295e281.mp3',
  cafe_05_cue_l1: 'audio/cafe_05_cue_l1_anhvien_ad62596bedd7.mp3',
  cafe_05_cue_l2: 'audio/cafe_05_cue_l2_anhvien_6a364e9a7864.mp3',

  // Recognition Distractors (Taylin - English)
  recog_distractor_01: 'audio/recognition/recog_distractor_01_taylin_7d2b57fb7523.mp3',
  recog_distractor_02: 'audio/recognition/recog_distractor_02_taylin_5f10345bdcd4.mp3',
  recog_distractor_03: 'audio/recognition/recog_distractor_03_taylin_490d60f9e93c.mp3',
  recog_distractor_04: 'audio/recognition/recog_distractor_04_taylin_1590c1254664.mp3',
  recog_distractor_05: 'audio/recognition/recog_distractor_05_taylin_4fd4d8ab6f86.mp3'
};

export class BrowserMediaAdapter {
  constructor(options = {}) {
    this.basePath = options.basePath || '';
    this.audioElement = null;
    this.isPlaying = false;
    this.micActive = false;
    this.gain = 1.0;
    this.unlocked = false;
    this.onStateChange = options.onStateChange || (() => {});

    if (typeof window !== 'undefined') {
      this.initAudioElement();
      this.setupUnlockListeners();
    }
  }

  initAudioElement() {
    if (this.audioElement) return;
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';

    this.audioElement.addEventListener('playing', () => {
      this.isPlaying = true;
      this.onStateChange({ isPlaying: true });
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlaying = false;
      this.onStateChange({ isPlaying: false });
    });

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      this.onStateChange({ isPlaying: false });
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio element error:', e);
      this.isPlaying = false;
      this.onStateChange({ isPlaying: false, error: e });
    });
  }

  setupUnlockListeners() {
    const unlock = () => {
      if (this.unlocked) return;
      this.unlocked = true;

      // Unlock iOS Safari audio by loading or playing empty buffer
      if (this.audioElement) {
        this.audioElement.play().then(() => {
          this.audioElement.pause();
          this.audioElement.currentTime = 0;
        }).catch(() => {
          // Play was rejected, which is expected for empty src on first touch
        });
      }

      window.removeEventListener('click', unlock, true);
      window.removeEventListener('touchstart', unlock, true);
    };

    window.addEventListener('click', unlock, true);
    window.addEventListener('touchstart', unlock, true);
  }

  resolveUrl(relativePath) {
    if (!relativePath) return '';
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    if (!this.basePath) return relativePath;
    const base = this.basePath.endsWith('/') ? this.basePath : `${this.basePath}/`;
    const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    return `${base}${cleanPath}`;
  }

  playRecorded(assetId, onEnded) {
    const path = ASSET_MAP[assetId] || assetId;
    if (!path) {
      console.warn(`BrowserMediaAdapter: Unknown audio asset ID "${assetId}"`);
      return false;
    }

    this.stopRecordedAudio();

    const resolvedUrl = this.resolveUrl(path);
    this.audioElement.src = resolvedUrl;
    this.audioElement.volume = this.gain;

    if (onEnded) {
      this._handleEnded = () => {
        if (this.audioElement && this._handleEnded) {
          this.audioElement.removeEventListener('ended', this._handleEnded);
          this._handleEnded = null;
        }
        onEnded();
      };
      this.audioElement.addEventListener('ended', this._handleEnded);
    }

    const promise = this.audioElement.play();
    if (promise && promise.catch) {
      promise.catch(err => {
        console.warn(`Autoplay blocked or playback failed for ${resolvedUrl}:`, err.message);
      });
    }
    return true;
  }

  stopRecordedAudio() {
    if (this.audioElement) {
      if (this._handleEnded) {
        this.audioElement.removeEventListener('ended', this._handleEnded);
        this._handleEnded = null;
      }
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.isPlaying = false;
  }

  stopMicrophone() {
    this.micActive = false;
    void this.liveClient?.close();
  }

  detachRemoteAudio() { void this.liveClient?.close(); }

  dispose() {
    this.stopRecordedAudio();
    this.stopMicrophone();
  }

  setGain(g) {
    this.gain = Math.max(0, Math.min(1, g));
    if (this.audioElement) {
      this.audioElement.volume = this.gain;
    }
  }

  closeSideband() { void this.liveClient?.close(); }

  async initiateLiveConnection(gen, cb) {
    if (!this.liveClient) { cb?.(new Error('Live is unavailable in this environment')); return; }
    await this.liveClient.connect();
    if (this.liveClient.active?.ready) cb?.(null, { tracks: this.liveClient.active.stream.getTracks() });
    else cb?.(new Error('Live connection did not complete'));
  }

  disposeTracks(tracks) { tracks?.forEach(track => track.stop()); }
  attachLiveMedia() { this.micActive = false; }

  emergencyLocalMute() {
    void this.liveClient?.close();
    this.gain = 0;
    if (this.audioElement) {
      this.audioElement.volume = 0;
      this.audioElement.pause();
    }
    this.micActive = false;
    this.isPlaying = false;
  }
}
