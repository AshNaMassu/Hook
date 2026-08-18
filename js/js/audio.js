const Snd = {
    ctx: null, noiseBuf: null, musicNodes: null, musicGain: null,

    ensure() {
        try {
            if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (this.ctx.state === 'suspended') this.ctx.resume();
            if (!this.noiseBuf) {
                const n = this.ctx.sampleRate * 0.5 | 0;
                this.noiseBuf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
                const d = this.noiseBuf.getChannelData(0);
                for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
            }
        } catch (e) { }
        return this.ctx;
    },

    tone(type, f0, f1, dur, vol) {
        if (muted) return; const c = this.ensure(); if (!c) return;
        try {
            const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
            o.type = type; o.frequency.setValueAtTime(f0, t);
            o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
            g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
            o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + .02);
        } catch (e) { }
    },

    noise(dur, vol, fq, type) {
        if (muted) return; const c = this.ensure(); if (!c) return;
        try {
            const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(), t = c.currentTime;
            s.buffer = this.noiseBuf; f.type = type || 'highpass'; f.frequency.value = fq;
            g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
            s.connect(f).connect(g).connect(c.destination); s.start(t); s.stop(t + dur);
        } catch (e) { }
    },

    // УЛУЧШЕННЫЕ ЗВУКИ
    grab() {
        this.tone('triangle', 280, 880, .12, .35);
        this.tone('sine', 440, 660, .08, .15);
        this.noise(.06, .18, 2800);
    },

    release() {
        this.noise(.15, .25, 1100);
        this.tone('sawtooth', 520, 180, .18, .2);
        this.tone('sine', 330, 220, .1, .1);
    },

    coin() {
        this.tone('sine', 1100, 1480, .09, .35);
        this.tone('sine', 2200, 2960, .07, .12);
        this.tone('triangle', 550, 880, .05, .08);
    },

    perfect() {
        [587, 740, 880, 1175].forEach((f, i) => {
            setTimeout(() => {
                this.tone('sine', f, f, .18, .28);
                this.tone('triangle', f * 2, f * 2, .1, .12);
            }, i * 50);
        });
    },

    death() {
        this.tone('sawtooth', 240, 48, .6, .45);
        this.tone('square', 180, 36, .5, .2);
        this.noise(.45, .35, 280, 'lowpass');
    },

    ui() {
        this.tone('square', 780, 780, .04, .2);
        this.tone('sine', 1560, 1560, .03, .1);
    },

    deny() {
        this.tone('square', 165, 120, .16, .28);
        this.noise(.08, .15, 400, 'lowpass');
    },

    // ФОНОВАЯ МУЗЫКА (synthwave ambient)
    startMusic() {
        if (muted) return;
        const c = this.ensure();
        if (!c || this.musicNodes) return;

        this.musicGain = c.createGain();
        this.musicGain.gain.value = 0.08;
        this.musicGain.connect(c.destination);

        // Bass drone
        const bass = c.createOscillator();
        bass.type = 'sine';
        bass.frequency.value = 55;
        const bassGain = c.createGain();
        bassGain.gain.value = 0.3;
        bass.connect(bassGain).connect(this.musicGain);
        bass.start();

        // Pad chord (Am)
        const pad1 = c.createOscillator();
        pad1.type = 'triangle';
        pad1.frequency.value = 220;
        const pad1Gain = c.createGain();
        pad1Gain.gain.value = 0.15;
        pad1.connect(pad1Gain).connect(this.musicGain);
        pad1.start();

        const pad2 = c.createOscillator();
        pad2.type = 'triangle';
        pad2.frequency.value = 277;
        const pad2Gain = c.createGain();
        pad2Gain.gain.value = 0.12;
        pad2.connect(pad2Gain).connect(this.musicGain);
        pad2.start();

        const pad3 = c.createOscillator();
        pad3.type = 'sine';
        pad3.frequency.value = 330;
        const pad3Gain = c.createGain();
        pad3Gain.gain.value = 0.1;
        pad3.connect(pad3Gain).connect(this.musicGain);
        pad3.start();

        // Arp (high plucks)
        const arpNotes = [440, 554, 659, 880, 1109];
        let arpIndex = 0;
        const arpInterval = setInterval(() => {
            if (muted || !this.musicNodes) {
                clearInterval(arpInterval);
                return;
            }
            const freq = arpNotes[arpIndex % arpNotes.length];
            const arp = c.createOscillator();
            arp.type = 'square';
            arp.frequency.value = freq;
            const arpGain = c.createGain();
            arpGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            arpGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
            arp.connect(arpGain).connect(this.musicGain);
            arp.start();
            arp.stop(this.ctx.currentTime + 0.3);
            arpIndex++;
        }, 400);

        // LFO для пульсации
        const lfo = c.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.5;
        const lfoGain = c.createGain();
        lfoGain.gain.value = 0.02;
        lfo.connect(lfoGain).connect(this.musicGain.gain);
        lfo.start();

        this.musicNodes = { bass, pad1, pad2, pad3, lfo, arpInterval, bassGain, pad1Gain, pad2Gain, pad3Gain };
    },

    stopMusic() {
        if (!this.musicNodes) return;
        const t = this.ctx.currentTime;
        this.musicGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        setTimeout(() => {
            try {
                if (this.musicNodes.arpInterval) clearInterval(this.musicNodes.arpInterval);
                this.musicNodes.bass.stop();
                this.musicNodes.pad1.stop();
                this.musicNodes.pad2.stop();
                this.musicNodes.pad3.stop();
                this.musicNodes.lfo.stop();
                this.musicNodes = null;
                this.musicGain = null;
            } catch (e) { }
        }, 600);
    },

    // Динамическая громкость музыки (ускоряется с прогрессом)
    setMusicIntensity(intensity) {
        if (!this.musicNodes || !this.musicGain) return;
        const targetVol = 0.06 + intensity * 0.04; // 0.06 при старте, 0.10 при max
        this.musicGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 0.3);

        // Ускоряем LFO пульсацию
        if (this.musicNodes.lfo) {
            this.musicNodes.lfo.frequency.linearRampToValueAtTime(0.5 + intensity * 1.5, this.ctx.currentTime + 0.3);
        }
    }
};