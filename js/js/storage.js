const store = {
    get(k, d) {
        try {
            const v = localStorage.getItem('nh_' + k);
            return v === null ? d : JSON.parse(v);
        } catch (e) {
            return d;
        }
    },
    set(k, v) {
        try {
            localStorage.setItem('nh_' + k, JSON.stringify(v));
        } catch (e) { }
    }
};

// Загрузка данных при старте (только один раз)
let bestMeters = store.get('best', 0) || 0;
let wallet = store.get('wallet', 0) || 0;
let owned = store.get('owned', ['cyan']) || ['cyan'];
let skinId = store.get('skin', 'cyan') || 'cyan';
let muted = store.get('mute', false);
let musicVol = store.get('musicVol', 0.65) || 0.65;
let sfxVol = store.get('sfxVol', 0.65) || 0.65;
let shakeIntensity = store.get('shakeIntensity', 1.0) || 1.0;
let flashIntensity = store.get('flashIntensity', 1.0) || 1.0;

// Двойное сохранение: локально + облако
function saveAllData() {
    store.set('best', bestMeters);
    store.set('wallet', wallet);
    store.set('owned', owned);
    store.set('skin', skinId);
    store.set('mute', muted);
    store.set('musicVol', musicVol);
    store.set('sfxVol', sfxVol);
    store.set('shakeIntensity', shakeIntensity);
    store.set('flashIntensity', flashIntensity);

    // Сохраняем в облако (не блокируя игру)
    if (typeof sdkReady !== 'undefined' && sdkReady) {
        sdkSaveData();
    }
}

// Пытаемся загрузить из облака (если есть интернет)
setTimeout(() => {
    if (typeof sdkReady !== 'undefined' && sdkReady) {
        sdkLoadData();
    }
}, 1000);