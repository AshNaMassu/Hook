const Snd={
  ctx:null, noiseBuf:null,
  ensure(){
    try{
      if(!this.ctx) this.ctx=new (window.AudioContext||window.webkitAudioContext)();
      if(this.ctx.state==='suspended') this.ctx.resume();
      if(!this.noiseBuf){
        const n=this.ctx.sampleRate*0.5|0;
        this.noiseBuf=this.ctx.createBuffer(1,n,this.ctx.sampleRate);
        const d=this.noiseBuf.getChannelData(0);
        for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
      }
    }catch(e){}
    return this.ctx;
  },
  tone(type,f0,f1,dur,vol){
    if(muted)return; const c=this.ensure(); if(!c)return;
    try{
      const o=c.createOscillator(),g=c.createGain(),t=c.currentTime;
      o.type=type;o.frequency.setValueAtTime(f0,t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
      g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
      o.connect(g).connect(c.destination);o.start(t);o.stop(t+dur+.02);
    }catch(e){}
  },
  noise(dur,vol,fq,type){
    if(muted)return; const c=this.ensure(); if(!c)return;
    try{
      const s=c.createBufferSource(),g=c.createGain(),f=c.createBiquadFilter(),t=c.currentTime;
      s.buffer=this.noiseBuf;f.type=type||'highpass';f.frequency.value=fq;
      g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);
      s.connect(f).connect(g).connect(c.destination);s.start(t);s.stop(t+dur);
    }catch(e){}
  },
  grab(){this.tone('triangle',240,760,.09,.4);this.noise(.05,.12,2500);},
  release(){this.noise(.12,.22,900);this.tone('sawtooth',480,170,.13,.16);},
  coin(){this.tone('sine',990,1320,.08,.3);this.tone('sine',1980,2640,.06,.1);},
  perfect(){[523,659,784].forEach((f,i)=>setTimeout(()=>this.tone('sine',f,f,.16,.22),i*40));},
  death(){this.tone('sawtooth',210,42,.5,.4);this.noise(.35,.3,300,'lowpass');},
  ui(){this.tone('square',700,700,.05,.18);},
  deny(){this.tone('square',150,110,.14,.25);},
};