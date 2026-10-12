/**
 * Lesson Bridge (Client Session to Pedagogical Orchestrator)
 * In accordance with Build Plan rd03 §9.1–9.5 and Task P6c.3
 */

export class LessonBridge {
  constructor(options = {}) {
    this.orchestrator = options.orchestrator || null;
    this.audioController = options.audioController || null;
    this.currentMode = options.mode || 'play';
    this.currentStage = 'situation';
    this.listeners = new Set();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const listener of this.listeners) {
      listener({ stage: this.currentStage, mode: this.currentMode });
    }
  }

  handleModeSwitch(newMode) {
    this.currentMode = newMode;
    if (this.orchestrator) {
      this.orchestrator.switchMode(newMode);
    }
    if (this.audioController) {
      this.audioController.dispatch({ type: 'SWITCH_MODE', mode: newMode });
    }
    this.notify();
  }

  handleTryClick() {
    if (this.orchestrator) {
      return this.orchestrator.recordAttempt({ selfReported: true });
    }
    return { outcome: 'unassessed', label: 'exposure', graded: false };
  }

  handleRecognitionChoice(choice) {
    if (this.orchestrator) {
      return this.orchestrator.recordAttempt({ recognitionChoice: choice });
    }
    return null;
  }

  handleHelpClick() {
    if (this.orchestrator) {
      return this.orchestrator.requestHelp();
    }
    return null;
  }

  advanceStage() {
    if (this.orchestrator) {
      const res = this.orchestrator.advanceStage();
      this.currentStage = res.stage;
      this.notify();
      return res;
    }
    return null;
  }

  skipStage(reason = 'user_skipped') {
    if (this.orchestrator) {
      const res = this.orchestrator.skipStage(reason);
      this.currentStage = res.stage;
      this.notify();
      return res;
    }
    return null;
  }
}
