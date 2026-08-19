const Snd = {
    ctx: null, noiseBuf: null, sfxGain: null, musicGain: null,
    music: { running: false, timer: null, step: 0, next: 0, bpm: 122, intensity: 0, mode: 'menu' },

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
            if (!this.sfxGain) {
                this.sfxGain = this.ctx.createGain();
                this.sfxGain.gain.value = sfxVol;
                this.sfxGain.connect(this.ctx.destination);
            }
        } catch (e) { }
        return this.ctx;
    },

    setSfxVol(vol) {
        sfxVol = Math.max(0, Math.min(1, vol));
        store.set('sfxVol', sfxVol);
        if (this.sfxGain) this.sfxGain.gain.value = sfxVol;
    },

    setMusicVol(vol) {
        musicVol = Math.max(0, Math.min(1, vol));
        store.set('musicVol', musicVol);
        this._applyMaster();
    },

    _applyMaster() {
        if (!this.musicGain || !this.ctx) return;
        const I = this.music.mode === 'menu' ? 0 : this.music.intensity;
        this.musicGain.gain.linearRampToValueAtTime(musicVol * (0.65 + 0.25 * I), this.ctx.currentTime + 0.2);
    },

    /* ---------- SFX ---------- */
    tone(type, f0, f1, dur, vol) {
        if (muted) return; const c = this.ensure(); if (!c) return;
        try {
            const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
            o.type = type; o.frequency.setValueAtTime(f0, t);
            o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
            g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
            o.connect(g).connect(this.sfxGain);
            o.start(t); o.stop(t + dur + .02);
        } catch (e) { }
    },
    noise(dur, vol, fq, type) {
        if (muted) return; const c = this.ensure(); if (!c) return;
        try {
            const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(), t = c.currentTime;
            s.buffer = this.noiseBuf; f.type = type || 'highpass'; f.frequency.value = fq;
            g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
            s.connect(f).connect(g).connect(this.sfxGain);
            s.start(t); s.stop(t + dur);
        } catch (e) { }
    },
    grab() { this.tone('triangle', 280, 880, .12, .35); this.tone('sine', 440, 660, .08, .15); this.noise(.06, .18, 2800); },
    release() { this.noise(.15, .25, 1100); this.tone('sawtooth', 520, 180, .18, .2); this.tone('sine', 330, 220, .1, .1); },
    coin() { this.tone('sine', 1100, 1480, .09, .35); this.tone('sine', 2200, 2960, .07, .12); this.tone('triangle', 550, 880, .05, .08); },
    perfect() { [587, 740, 880, 1175].forEach((f, i) => { setTimeout(() => { this.tone('sine', f, f, .18, .28); this.tone('triangle', f * 2, f * 2, .1, .12); }, i * 50); }); },
    death() { this.tone('sawtooth', 240, 48, .6, .45); this.tone('square', 180, 36, .5, .2); this.noise(.45, .35, 280, 'lowpass'); },
    ui() { this.tone('square', 780, 780, .04, .2); this.tone('sine', 1560, 1560, .03, .1); },
    deny() { this.tone('square', 165, 120, .16, .28); this.noise(.08, .15, 400, 'lowpass'); },

    /* ---------- МУЗЫКА: секвенсор ---------- */
    startMusic(mode) {
        if (muted) return;
        const c = this.ensure(); if (!c) return;
        if (mode) {
            this.music.mode = mode;
            if (mode === 'menu') this.music.intensity = 0;
        }
        if (this.music.running) { this._applyMaster(); return; }
        if (!this.musicGain) {
            this.musicGain = c.createGain();
            this.musicGain.gain.value = musicVol * 0.65;
            this.musicGain.connect(c.destination);
        }
        this.music.running = true;
        this.music.step = 0;
        this.music.next = c.currentTime + 0.06;
        this.music.timer = setInterval(() => this._schedule(), 25);
        this._applyMaster();
    },

    stopMusic() {
        this.music.running = false;
        if (this.music.timer) { clearInterval(this.music.timer); this.music.timer = null; }
    },

    setMusicIntensity(intensity) {
        this.music.intensity = Math.max(0, Math.min(1, intensity));
        this._applyMaster();
    },

    _schedule() {
        const c = this.ctx; if (!c || !this.music.running) return;
        const stepDur = 60 / this.music.bpm / 4;
        while (this.music.next < c.currentTime + 0.12) {
            this._playStep(this.music.step, this.music.next);
            this.music.next += stepDur;
            this.music.step = (this.music.step + 1) % 64;
        }
    },

    _playStep(step, t) {
        const I = this.music.mode === 'menu' ? 0 : this.music.intensity;
        const bar = (step / 16) | 0, s = step % 16;
        const chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]];
        const roots = [110, 87.31, 65.41, 98];
        const ch = chords[bar], root = roots[bar];

        if (s === 0) {
            for (const f of ch) this._voice('triangle', f, t, 2.0, 0.045, 0.4);
            if (I < 0.25) this._voice('sine', root, t, 2.0, 0.12, 0.1);
        }

        if (I >= 0.25 && s % 2 === 0) this._bass(root * (s === 14 ? 2 : 1), t);

        // ударные
        if (I >= 0.15 && s % 4 === 0) this._kick(t);
        if (I >= 0.35 && (s === 4 || s === 12)) this._clap(t);
        if (I >= 0.35 && s % 2 === 1) this._hat(t, s % 4 === 3 ? 0.18 : 0.1);
        else if (I >= 0.1 && s % 4 === 2) this._hat(t, 0.06);

        if (I >= 0.15) {
            const seq = [0, 1, 2, 1, 0, 2, 1, 2];
            const n = ch[seq[s % 8]] * (s >= 8 ? 2 : 1);
            this._voice('square', n, t, 0.14, 0.035 + 0.05 * I, 0.01);
        } else if (s % 8 === 0) {
            this._voice('sine', ch[(s / 8) | 0], t, 0.4, 0.05, 0.05);
        }
    },

    _voice(type, f, t, dur, vol, attack) {
        const c = this.ctx; if (!c) return;
        try {
            const o = c.createOscillator(), g = c.createGain();
            o.type = type; o.frequency.value = f;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(vol, t + (attack || 0.01));
            g.gain.exponentialRampToValueAtTime(0.001, t + dur);
            o.connect(g).connect(this.musicGain);
            o.start(t); o.stop(t + dur + 0.05);
        } catch (e) { }
    },
    _bass(f, t) {
        const c = this.ctx; if (!c) return;
        try {
            const o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
            o.type = 'sawtooth'; o.frequency.value = f;
            fl.type = 'lowpass'; fl.frequency.value = 420;
            g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
            o.connect(fl).connect(g).connect(this.musicGain);
            o.start(t); o.stop(t + 0.22);
        } catch (e) { }
    },
    _kick(t) {
        const c = this.ctx; if (!c) return;
        try {
            const o = c.createOscillator(), g = c.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(150, t);
            o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
            g.gain.setValueAtTime(0.8, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            o.connect(g).connect(this.musicGain);
            o.start(t); o.stop(t + 0.3);
        } catch (e) { }
    },
    _hat(t, vol) {
        const c = this.ctx; if (!c || !this.noiseBuf) return;
        try {
            const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
            s.buffer = this.noiseBuf; f.type = 'highpass'; f.frequency.value = 7000;
            g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
            s.connect(f).connect(g).connect(this.musicGain);
            s.start(t); s.stop(t + 0.05);
        } catch (e) { }
    },
    _clap(t) {
        const c = this.ctx; if (!c || !this.noiseBuf) return;
        try {
            const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
            s.buffer = this.noiseBuf; f.type = 'bandpass'; f.frequency.value = 1800;
            g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
            s.connect(f).connect(g).connect(this.musicGain);
            s.start(t); s.stop(t + 0.16);
        } catch (e) { }
    }
};