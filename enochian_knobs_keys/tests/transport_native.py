"""Observe real Chromium Web Audio/MediaRecorder objects, not replacement DSP."""
NATIVE_AUDIT=r'''(() => {
  const audit=window.__audioAudit={contexts:[],sources:[],gains:[],filters:[],analysers:[],recorders:[],decodes:[],holdResume:false,resolvers:[]};
  const Original=window.AudioContext||window.webkitAudioContext;
  function watchSource(node,ctx,type){
    const rec={node,ctx,type,started:false,stopped:false,ended:false,disconnected:false,offset:0,targets:[]};audit.sources.push(rec);
    const start=node.start.bind(node),stop=node.stop.bind(node),connect=node.connect.bind(node),disconnect=node.disconnect.bind(node);
    node.start=(...args)=>{const result=start(...args);rec.started=true;rec.offset=args[1]||0;return result};
    node.stop=(...args)=>{const result=stop(...args);rec.stopped=true;return result};
    node.connect=(...args)=>{const result=connect(...args);rec.targets.push(args[0].constructor.name);rec.disconnected=false;return result};
    node.disconnect=(...args)=>{const result=disconnect(...args);rec.disconnected=true;return result};
    node.addEventListener('ended',()=>{rec.ended=true});return node;
  }
  if(Original){
    class ObservedContext extends Original{
      constructor(...args){super(...args);audit.contexts.push(this)}
      async resume(){const result=await super.resume();if(audit.holdResume)await new Promise(resolve=>audit.resolvers.push(resolve));return result}
      createBufferSource(){return watchSource(super.createBufferSource(),this,'buffer')}
      createOscillator(){return watchSource(super.createOscillator(),this,'oscillator')}
      createGain(){const n=super.createGain();audit.gains.push({node:n,ctx:this});return n}
      createBiquadFilter(){const n=super.createBiquadFilter();audit.filters.push({node:n,ctx:this});return n}
      createAnalyser(){const n=super.createAnalyser();audit.analysers.push({node:n,ctx:this});return n}
      async decodeAudioData(...args){const b=await super.decodeAudioData(...args);const data=b.getChannelData(0);let energy=0,peak=0;for(let i=0;i<data.length;i++){energy+=data[i]*data[i];peak=Math.max(peak,Math.abs(data[i]))}audit.decodes.push({duration:b.duration,length:b.length,rms:Math.sqrt(energy/data.length),peak});return b}
    }
    window.AudioContext=ObservedContext;if(window.webkitAudioContext)window.webkitAudioContext=ObservedContext;
  }
  const MR=window.MediaRecorder;
  if(MR){window.MediaRecorder=class extends MR{
    constructor(...args){super(...args);const rec={node:this,bytes:0,chunks:0};audit.recorders.push(rec);this.addEventListener('dataavailable',e=>{rec.bytes+=e.data.size;rec.chunks++})}
  }}
  audit.release=()=>{audit.holdResume=false;for(const resolve of audit.resolvers.splice(0))resolve()};
  audit.snapshot=()=>({
    contexts:audit.contexts.map(c=>c.state),
    active:audit.sources.filter(s=>s.started&&!s.stopped&&!s.ended&&s.ctx.state!=='closed').length,
    sources:audit.sources.map(s=>({type:s.type,started:s.started,stopped:s.stopped,ended:s.ended,disconnected:s.disconnected,offset:s.offset,context:s.ctx.state,rate:s.node.playbackRate?.value,targets:s.targets})),
    gains:audit.gains.map(s=>s.node.gain.value),filters:audit.filters.map(s=>({type:s.node.type,gain:s.node.gain.value,frequency:s.node.frequency.value})),
    rms:audit.analysers.map(s=>{if(s.ctx.state!=='running')return 0;const a=new Float32Array(s.node.fftSize);s.node.getFloatTimeDomainData(a);return Math.sqrt(a.reduce((sum,v)=>sum+v*v,0)/a.length)}),
    recorders:audit.recorders.map(r=>({state:r.node.state,bytes:r.bytes,chunks:r.chunks})),decodes:audit.decodes
  });
})()'''
