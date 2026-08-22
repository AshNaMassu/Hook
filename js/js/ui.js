const el = {};
['hud', 'meters', 'coinsHud', 'combo', 'hint', 'menu', 'over', 'pauseScr', 'settingsScr', 'bestLine', 'walletMenu', 'skins',
    'overMeters', 'overCoins', 'overCombo', 'recordBadge', 'btnPlay', 'btnAgain', 'btnSame', 'btnMenu1', 'btnMenu2',
    'btnRevive', 'btnResume', 'btnRestart', 'btnMute', 'btnPause',
    'btnSettings', 'btnBackMenu'].forEach(id => el[id] = document.getElementById(id));

const show = e => e.classList.remove('hidden'), hide = e => e.classList.add('hidden');

let hudM = -1, hudC = -1, hudCombo = -1;
function hudSync() {
    if (state !== 'play') return;
    const m = Math.floor(maxAlt);
    if (m !== hudM) { hudM = m; el.meters.textContent = m + ' м'; }
    if (coinsRun !== hudC) { hudC = coinsRun; el.coinsHud.textContent = '◈ ' + coinsRun; }
    if (combo !== hudCombo) {
        hudCombo = combo;
        if (combo >= 1) {
            const mult = getComboMult();
            el.combo.textContent = 'СЕРИЯ ×' + combo + ' (×' + mult + ')';
            el.combo.classList.add('show');
            el.combo.classList.remove('pop'); void el.combo.offsetWidth; el.combo.classList.add('pop');
        }
        else el.combo.classList.remove('show');
    }
    let txt = '', hot = false;
    if (!dying) {
        if (hero.grabs === 0 && !hero.attached) {
            let near = false;
            for (const a of anchors) if (a !== hero.lastAnchor && Math.hypot(a.x - hero.x, a.y - hero.y) <= PF.grabRadius) { near = true; break; }
            txt = near ? 'ДЕРЖИ!!!' : 'ДЕРЖИ ЭКРАН — ЗАЦЕПИТЬСЯ КРЮКОМ'; hot = near;
        } else if (hero.attached && hero.grabs <= 1 && hero.attachT > 0.5) {
            txt = 'ОТПУСТИ — ПОЛЁТ ПО КАСАТЕЛЬНОЙ';
        } else if (hero.grabs === 2 && !hero.attached) {
            txt = 'ЖМИ, КОГДА ТОЧКА ВСПЫХНЕТ';
        }
    }
    if (txt) { el.hint.textContent = txt; el.hint.classList.add('show'); el.hint.classList.toggle('hot', hot); }
    else el.hint.classList.remove('show');
}

function buildSkins() {
    el.skins.innerHTML = '';
    SKINS.forEach(s => {
        const d = document.createElement('div');
        d.className = 'skin' + (s.id === skinId ? ' sel' : '');
        const own = owned.includes(s.id);
        d.innerHTML = '<div class="sw" style="background:' + s.color + ';box-shadow:0 0 14px ' + s.color + '"></div>' +
            '<div class="p">' + (own ? (s.id === skinId ? '✓' : '') : ('◈ ' + s.price)) + '</div>';
        d.addEventListener('click', () => {
            if (owned.includes(s.id)) {
                skinId = s.id;
                saveAllData();
                Snd.ui();
            } else if (wallet >= s.price) {
                wallet -= s.price;
                owned.push(s.id);
                skinId = s.id;
                saveAllData();
                Snd.coin();
            } else {
                Snd.deny();
                d.classList.remove('deny');
                void d.offsetWidth;
                d.classList.add('deny');
                return;
            }
            el.walletMenu.textContent = wallet; buildSkins();
        });
        el.skins.appendChild(d);
    });
}

function startRun(newSeed) {
    lastSeed = newSeed;
    resetWorld(newSeed, false);
    state = 'play';
    hide(el.menu); hide(el.over); hide(el.pauseScr); hide(el.settingsScr); show(el.hud);
    hudM = -1; hudC = -1; hudCombo = -1;
    Snd.startMusic('game');
    Snd.setMusicIntensity(0);
}

function toMenu() {
    resetWorld((Math.random() * 2 ** 31) | 0, true);
    state = 'menu';
    hide(el.over); hide(el.pauseScr); hide(el.hud); hide(el.settingsScr); show(el.menu);
    el.bestLine.textContent = 'Рекорд: ' + bestMeters + ' м';
    el.walletMenu.textContent = wallet;
    buildSkins();
    Snd.startMusic('menu');
}

function pauseGame() {
    if (state !== 'play') return;
    state = 'pause';
    show(el.pauseScr);
    updateVolumeUI();
    Snd.startMusic('menu');
}

function resumeGame() {
    if (state !== 'pause') return;
    state = 'play';
    hide(el.pauseScr);
    last = performance.now();
    Snd.startMusic('game');
}

const musicSliders = document.querySelectorAll('.musicVolSlider');
const sfxSliders = document.querySelectorAll('.sfxVolSlider');
const musicLabels = document.querySelectorAll('.musicVolLabel');
const sfxLabels = document.querySelectorAll('.sfxVolLabel');

const shakeSliders = document.querySelectorAll('.shakeSlider');
const flashSliders = document.querySelectorAll('.flashSlider');
const shakeLabels = document.querySelectorAll('.shakeLabel');
const flashLabels = document.querySelectorAll('.flashLabel');

function updateVolumeUI() {
    const musicVal = Math.round(musicVol * 100);
    const sfxVal = Math.round(sfxVol * 100);
    musicSliders.forEach(s => s.value = musicVal);
    sfxSliders.forEach(s => s.value = sfxVal);
    musicLabels.forEach(l => l.textContent = musicVal + '%');
    sfxLabels.forEach(l => l.textContent = sfxVal + '%');
    updateSettingsUI();
}

function updateSettingsUI() {
    const shakeVal = Math.round(shakeIntensity * 100);
    const flashVal = Math.round(flashIntensity * 100);
    shakeSliders.forEach(s => s.value = shakeVal);
    flashSliders.forEach(s => s.value = flashVal);
    shakeLabels.forEach(l => l.textContent = shakeVal + '%');
    flashLabels.forEach(l => l.textContent = flashVal + '%');
}

function showSettings() {
    hide(el.menu);
    show(el.settingsScr);
    updateVolumeUI();
    Snd.ui();
}

function hideSettings() {
    hide(el.settingsScr);
    show(el.menu);
    Snd.ui();
}

if (el.btnSettings) {
    el.btnSettings.addEventListener('click', showSettings);
}

if (el.btnBackMenu) {
    el.btnBackMenu.addEventListener('click', hideSettings);
}

musicSliders.forEach(slider => {
    slider.addEventListener('input', (e) => {
        const vol = parseInt(e.target.value) / 100;
        Snd.setMusicVol(vol);
        musicLabels.forEach(l => l.textContent = Math.round(vol * 100) + '%');
        musicSliders.forEach(s => { if (s !== slider) s.value = e.target.value; });
    });
});

sfxSliders.forEach(slider => {
    slider.addEventListener('input', (e) => {
        const vol = parseInt(e.target.value) / 100;
        Snd.setSfxVol(vol);
        sfxLabels.forEach(l => l.textContent = Math.round(vol * 100) + '%');
        sfxSliders.forEach(s => { if (s !== slider) s.value = e.target.value; });
        Snd.ui();
    });
});

shakeSliders.forEach(slider => {
    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value) / 100;
        shakeIntensity = val;
        saveAllData(); 
        shakeLabels.forEach(l => l.textContent = Math.round(val * 100) + '%');
        shakeSliders.forEach(s => { if (s !== slider) s.value = e.target.value; });
    });
});

flashSliders.forEach(slider => {
    slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value) / 100;
        flashIntensity = val;
        saveAllData(); 
        flashLabels.forEach(l => l.textContent = Math.round(val * 100) + '%');
        flashSliders.forEach(s => { if (s !== slider) s.value = e.target.value; });
    });
});

el.btnPlay.addEventListener('click', () => { Snd.ensure(); Snd.ui(); startRun((Math.random() * 2 ** 31) | 0); });
el.btnSame.addEventListener('click', () => { Snd.ui(); startRun(lastSeed); });
el.btnMenu1.addEventListener('click', () => { Snd.ui(); toMenu(); });
el.btnMenu2.addEventListener('click', () => { Snd.ui(); toMenu(); });
el.btnResume.addEventListener('click', () => { Snd.ui(); resumeGame(); });
el.btnPause.addEventListener('click', () => { Snd.ui(); pauseGame(); });

el.btnAgain.addEventListener('click', () => {
    Snd.ui();
    sdkShowInterstitial();  // Показываем рекламу между забегами
    startRun((Math.random() * 2 ** 31) | 0);
});

el.btnRestart.addEventListener('click', () => {
    Snd.ui();
    hide(el.pauseScr);
    sdkShowInterstitial();
    startRun((Math.random() * 2 ** 31) | 0);
});

el.btnRevive.addEventListener('click', () => {
    // Показываем rewarded рекламу перед ревайвом
    if (sdkReady) {
        sdkShowRewarded(
            () => doRevive(),  // успех — ревайвим
            () => doRevive()   // отказ — все равно ревайвим (мягкий режим)
        );
    } else {
        doRevive();  // без SDK ревайвим сразу
    }
});

el.btnMute.addEventListener('click', () => {
    muted = !muted;
    saveAllData(); 
    el.btnMute.textContent = muted ? '🔇' : '🔊';
    if (muted) {
        Snd.stopMusic();
    } else {
        Snd.ensure();
        Snd.ui();
        if (state === 'play' && !dying) Snd.startMusic('game');
        else Snd.startMusic('menu');
    }
});
el.btnMute.textContent = muted ? '🔇' : '🔊';

window.addEventListener('pointerdown', function once() {
    if (!muted && state !== 'play') Snd.startMusic('menu');
    window.removeEventListener('pointerdown', once);
});