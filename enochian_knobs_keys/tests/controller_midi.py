"""Web MIDI boundary TEST DOUBLE; never evidence of physical hardware.

Production MIDI serialization, selection, channel switching and disconnect
handlers run unchanged. Native Web Audio is instrumented separately.
"""
MIDI_BOUNDARY = r'''(() => {
  const audit = window.__midiAudit = {requests: [], messages: [], hold: false, resolvers: []};
  class Port extends EventTarget {
    constructor(id, name) { super(); Object.assign(this, {id, name, manufacturer: 'Test boundary', type: 'output', state: 'connected', connection: 'closed'}); }
    send(bytes, timestamp) { audit.messages.push({port: this.id, bytes: Array.from(bytes), timestamp: timestamp ?? null}); }
    async open() {this.connection = 'open'; return this;}
    async close() {this.connection = 'closed'; return this;}
    clear() {}
  }
  const access = new EventTarget();
  access.outputs = new Map([['a', new Port('a', 'Test output A')], ['b', new Port('b', 'Test output B')]]);
  access.inputs = new Map(); access.sysexEnabled = false;
  Object.defineProperty(navigator, 'requestMIDIAccess', {configurable: true, value: async options => {
    audit.requests.push(options);
    if (audit.hold) await new Promise(resolve => audit.resolvers.push(resolve));
    return access;
  }});
  audit.access = access;
  audit.release = () => {audit.hold = false; for (const resolve of audit.resolvers.splice(0)) resolve();};
  audit.disconnect = id => {
    const port = access.outputs.get(id); port.state = 'disconnected';
    const event = new Event('statechange'); Object.defineProperty(event, 'port', {value: port});
    access.dispatchEvent(event); if(access.onstatechange) access.onstatechange(event);
  };
})()'''
