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
let vibrationEnabled = store.get('vibration', true);
// Качество графики: 0 = низкое, 1 = среднее, 2 = высокое
// По умолчанию: автоопределение (-1)
let graphicsQuality = store.get('graphicsQuality', -1);

// Массив скинов
const SKINS = [
    { id: 'cyan', color: '#26e0ff', price: 0 },    // бесплатный
    { id: 'gold', color: '#ffc23d', price: 100 },
    { id: 'lime', color: '#39ff14', price: 200 },
    { id: 'pink', color: '#ff4fd8', price: 300 },
];

// Функция получения цвета текущего скина
function skinColor() {
    const skin = SKINS.find(s => s.id === skinId);
    return skin ? skin.color : '#26e0ff';
}

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
    store.set('vibration', vibrationEnabled); 
    store.set('graphicsQuality', graphicsQuality); 

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