// Live is a learning surface, not a service gate. When it is unavailable for ANY
// infrastructure reason the learner sees one quiet line and keeps their PLAY turn — never a
// prompt, a code field, a modal or a setup ceremony. Nothing here asks who they are.
const OFFLINE = 'LIVE OFFLINE · PLAY AVAILABLE';
const MESSAGES = {
  not_configured: OFFLINE,
  live_unavailable: OFFLINE,
  provider_rejected: OFFLINE,
  provider_budget_or_rate: OFFLINE,
  sideband_unavailable: OFFLINE,
  negotiation_failed: OFFLINE,
  remote_missing: OFFLINE,
  finalization_incomplete: OFFLINE,
  connect_timeout: OFFLINE,
  // Not the same as no microphone: over plain http the browser withholds the microphone API
  // entirely, so this must not be reported as missing hardware. iOS Safari refuses
  // getUserMedia outside a secure context (https, or localhost), which is exactly what a
  // LAN-IP device test hits.
  insecure_context: 'LIVE OFFLINE · PLAY AVAILABLE — the microphone needs a secure (https) page.',
  NotAllowedError: 'Microphone permission was denied. Allow the microphone, then retry.',
  NotFoundError: 'No microphone found. Connect one, then retry.',
  daily_budget_exhausted: 'Today’s Live budget is used. PLAY is still available.',
  session_pending: 'A previous session is still closing or needs reconciliation. PLAY is available.',
  creation_uncertain: 'Connection outcome is uncertain. No automatic retry; the server is holding the budget.',
  session_expired: 'Live has ended. Return to PLAY, or start a fresh session.',
  playback_blocked: 'Tap the Mai button to enable speaker playback.',
  finalization_incomplete: 'PLAY is ready. Live closure is unconfirmed; further spending is locked pending reconciliation.'
};

export function collectLesson(app) {
  const phrase = app.phrases[app.activePhraseIndex] || {};
  return {
    station: app.currentStationId, phraseId: phrase.id,
    english: phrase.english, vietnamese: phrase.renderedVietnamese || phrase.vietnamese,
    conversationContext: app.getConversationContext(),
    resolvedTerms: app.getCurrentRoute()?.resolved_terms || {},
    stage: app.presentationState?.activeActivity || app.presentationState?.stage || String(app.activeStageIndex),
    revealed: app.presentationState?.vietnameseRevealed === true
  };
}

export class LiveClient {
  constructor({ context, onState, waveform, fetcher = (...args) => fetch(...args), mediaDevices = navigator.mediaDevices, Peer = RTCPeerConnection, AudioElement = Audio, connectTimeoutMs = 30000 }) {
    Object.assign(this, { context, onState, waveform, fetcher, mediaDevices, Peer, AudioElement, connectTimeoutMs });
    this.active = null;
  }
  async request(path, body, keepalive = false) {
    const res = await this.fetcher(`/api/live/${path}`, {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), keepalive, signal: AbortSignal.timeout(path === 'session' ? 40000 : 12000)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.code || 'live_unavailable');
    return data;
  }
  state(value, error) {
    this.onState?.(value, error ? (MESSAGES[error] || OFFLINE) : '');
    this.waveform()?.setState(value === 'error' ? 'mic_off' : value === 'ready' ? 'idle' : value);
  }
  async connect() {
    const version = this.version = (this.version || 0) + 1;
    await this.close(false);
    if (this.version !== version) return;
    const run = { canceled: false, held: false, ready: false, pending: new Map() };
    this.active = run;
    this.state('connecting');
    const current = () => this.active === run && !run.canceled;
    try {
      // No mediaDevices API at all means an insecure origin or a browser that withholds it —
      // not missing hardware. Reporting this as NotFoundError sent a device test chasing a
      // microphone that was present and working the whole time.
      if (!this.mediaDevices?.getUserMedia) throw new Error('insecure_context');
      run.output = new this.AudioElement(); run.output.autoplay = true;
      run.output.setAttribute?.('playsinline', '');
      run.stream = await this.awaitMicrophone();
      run.stream.getTracks().forEach(track => { track.enabled = false; });
      if (!current()) { run.stream.getTracks().forEach(track => track.stop()); return; }
      this.waveform()?.attachInputMediaStream?.(run.stream);
      const peer = run.peer = new this.Peer();
      run.stream.getTracks().forEach(track => peer.addTrack(track, run.stream));
      const channel = run.channel = peer.createDataChannel('oai-events');
      const started = new Promise((resolve, reject) => { run.resolveStarted = resolve; run.rejectStarted = reject; });
      // Attach a rejection handler immediately while SDP negotiation is pending.
      started.catch(() => {});
      channel.onmessage = ({ data }) => {
        if (!current()) return;
        let event; try { event = JSON.parse(data); } catch { return; }
        if (event.type === 'session.started') { run.started = true; run.resolveStarted(); }
        if (event.type === 'session.closed') { run.finalized = true; void this.fail(run, 'session_expired'); }
        if (event.type === 'error') { void this.fail(run, 'live_unavailable'); }
        const pending = run.pending.get(event.client_event_id);
        if (pending && event.type === pending.type) {
          clearTimeout(pending.timer); run.pending.delete(event.client_event_id); pending.resolve();
        }
      };
      channel.onclose = () => { if (current()) void this.fail(run, 'negotiation_failed'); };
      peer.ontrack = ({ streams, track }) => {
        if (!current()) { track.stop(); return; }
        run.remote = streams[0] || new MediaStream([track]);
        run.output.srcObject = run.remote;
        this.waveform()?.attachRemoteMediaStream(run.remote);
        run.output.play().catch(() => { if (current()) this.state('error', 'playback_blocked'); });
      };
      peer.onconnectionstatechange = () => {
        if (current() && ['failed', 'disconnected', 'closed'].includes(peer.connectionState)) void this.fail(run, 'negotiation_failed');
      };
      await peer.setLocalDescription(await peer.createOffer());
      await new Promise((resolve, reject) => {
        if (peer.iceGatheringState === 'complete') return resolve();
        const timer = setTimeout(() => reject(new Error('negotiation_failed')), 10000);
        peer.onicegatheringstatechange = () => {
          if (peer.iceGatheringState === 'complete') { clearTimeout(timer); resolve(); }
        };
      });
      if (!current()) return;
      const session = await this.request('session', { sdp: peer.localDescription.sdp, context: this.context() });
      run.id = session.id;
      if (!current()) { await this.request('close', { id: run.id }, true); return; }
      await peer.setRemoteDescription({ type: 'answer', sdp: session.sdp });
      run.startTimer = setTimeout(() => run.rejectStarted(new Error('negotiation_failed')), 15000);
      await started; clearTimeout(run.startTimer);
      if (!current()) return;
      await this.command(run, 'mute');
      run.ready = true; this.state('ready');
      await this.request('control', { id: run.id, action: 'greet' });
      run.heartbeat = setInterval(() => {
        this.request('heartbeat', { id: run.id }).catch(() => { if (current()) void this.fail(run, 'session_expired'); });
      }, 15000);
      run.deadline = setTimeout(() => { if (current()) void this.fail(run, 'session_expired'); }, session.maxSeconds * 1000);
      run.remoteTimer = setTimeout(() => { if (current() && !run.remote) void this.fail(run, 'remote_missing'); }, 12000);
      run.meter = setInterval(() => {
        if (!current() || run.held) return;
        const energy = this.waveform()?.remoteEnergy?.() || 0;
        if (energy > 0.01) { run.lastSpeech = Date.now(); this.state('speaking'); }
        else if (run.lastSpeech && Date.now() - run.lastSpeech > 500) { run.lastSpeech = 0; this.state('ready'); }
      }, 80);
    } catch (error) { if (current()) await this.fail(run, error.name === 'NotAllowedError' || error.name === 'NotFoundError' ? error.name : error.message); }
  }
  command(run, verb) {
    return new Promise((resolve, reject) => {
      if (run.channel?.readyState !== 'open') return reject(new Error('negotiation_failed'));
      const id = crypto.randomUUID();
      const timer = setTimeout(() => { run.pending.delete(id); reject(new Error('negotiation_failed')); }, 5000);
      run.pending.set(id, { resolve, reject, timer, type: `session.input_audio.${verb === 'mute' ? 'muted' : 'unmuted'}` });
      run.channel.send(JSON.stringify({ type: `session.input_audio.${verb}`, event_id: id }));
    });
  }
  /**
   * Make sure a session exists, without asking the learner anything.
   *
   * Toggling LIVE or holding Mai is the ONLY interaction: there is no gate, no code and no
   * unlock step. Concurrent callers share one attempt so a double-tap cannot open two
   * sessions (the server would refuse the second anyway, at the cost of a failed turn).
   */
  async ensure() {
    if (this.active?.ready) return this.active;
    if (this.connecting) return this.connecting;
    this.connecting = this.connect().finally(() => { this.connecting = null; });
    try { await this.connecting; } catch { /* state() has already reported it quietly */ }
    return this.active ?? null;
  }
  /**
   * Acquire the microphone under a deadline.
   *
   * Asking for the microphone is the ONLY step of a connect attempt with no natural bound: a
   * permission dialog the learner never answers — or a browser that neither grants nor refuses
   * — leaves the promise pending forever, and the card sits on "Connecting…" indefinitely.
   * Every later step is already bounded (ICE gathering 10s, session request 40s, channel
   * commands 5s), so bounding this one bounds the whole attempt.
   *
   * The wait is generous — long enough to read a permission dialog and tap Allow — but finite.
   * Past it the attempt fails as `connect_timeout`, which the learner sees as the single quiet
   * line, with PLAY still available and no retry ceremony.
   */
  awaitMicrophone() {
    const permission = this.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    return new Promise((resolve, reject) => {
      const deadline = setTimeout(() => {
        // If the microphone arrives after we stopped waiting, release it immediately: an
        // unstopped stream keeps the recording indicator on and the device busy.
        permission.then(stream => stream?.getTracks?.().forEach(track => track.stop())).catch(() => {});
        reject(new Error('connect_timeout'));
      }, this.connectTimeoutMs);
      permission.then(
        stream => { clearTimeout(deadline); resolve(stream); },
        error => { clearTimeout(deadline); reject(error); }
      );
    });
  }
  async press() {
    let run = this.active;
    // Holding Mai with no session yet is the learner asking to speak: connect, then speak.
    if (!run?.ready) run = await this.ensure();
    if (!run?.ready || run.canceled || run.held) return;
    run.held = true;
    try {
      await run.output.play();
      await this.command(run, 'unmute');
      if (this.active !== run || !run.held || run.canceled) return;
      run.stream.getTracks().forEach(track => { track.enabled = true; });
      this.state('listening');
    } catch { if (this.active === run) await this.fail(run, 'negotiation_failed'); }
  }
  async release() {
    const run = this.active;
    if (!run?.held || run.canceled) return;
    run.held = false;
    run.stream.getTracks().forEach(track => { track.enabled = false; });
    this.state('thinking');
    try {
      await this.command(run, 'mute');
      if (this.active === run && !run.held) await this.request('control', { id: run.id, action: 'release' });
    } catch { if (this.active === run) await this.fail(run, 'negotiation_failed'); }
    // Deliberately leave remote playback, peer and output gain alone.
  }
  async fail(run, code) {
    if (this.active !== run) return;
    await this.close(); if (!this.active) this.state('error', code);
  }
  async close(invalidate = true) {
    if (invalidate) this.version = (this.version || 0) + 1;
    const run = this.active;
    if (!run) return;
    this.active = null; run.canceled = true;
    for (const key of ['heartbeat', 'deadline', 'remoteTimer', 'meter', 'startTimer']) clearTimeout(run[key]);
    for (const pending of run.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error('session_expired')); }
    run.pending.clear(); run.rejectStarted?.(new Error('session_expired'));
    run.stream?.getTracks().forEach(track => track.stop());
    if (run.output) { run.output.pause(); run.output.srcObject = null; }
    this.waveform()?.detachLiveMedia?.();
    // Backend sideband drains final usage while local microphone/audio stop immediately.
    if (run.channel?.readyState === 'open') run.channel.send(JSON.stringify({ type: 'session.close', event_id: crypto.randomUUID() }));
    run.peer?.close(); run.remote?.getTracks().forEach(track => track.stop());
    if (run.id && !run.finalized) {
      try {
        const result = await this.request('close', { id: run.id }, true);
        if (!result.finalized && !this.active) this.state('error', 'finalization_incomplete');
      } catch { if (!this.active) this.state('error', 'finalization_incomplete'); }
    }
  }
}
