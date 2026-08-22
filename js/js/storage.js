const store = {
    get(k, d) { try { const v = localStorage.getItem('nh_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('nh_' + k, JSON.stringify(v)); } catch (e) { } }
};
let bestMeters = store.get('best', 0);
let wallet = store.get('wallet', 0);
let owned = store.get('owned', ['cyan']);
let skinId = store.get('skin', 'cyan');
let muted = store.get('mute', false);
let musicVol = store.get('musicVol', 1.0);
let sfxVol = store.get('sfxVol', 1.0);
let shakeIntensity = store.get('shakeIntensity', 1.0);
let flashIntensity = store.get('flashIntensity', 1.0);

const SKINS = [
    { id: 'cyan', name: 'Импульс', color: '#26e0ff', price: 0 },
    { id: 'mag', name: 'Неон-Роза', color: '#ff3fd4', price: 50 },
    { id: 'lime', name: 'Кислота', color: '#9dff3d', price: 120 },
    { id: 'gold', name: 'Плазма', color: '#ffc23d', price: 250 },
];
const skinColor = () => (SKINS.find(s => s.id === skinId) || SKINS[0]).color;


// Загрузка из localStorage при старте
bestMeters = parseInt(store.get('best')) || 0;
wallet = parseInt(store.get('wallet')) || 0;
owned = JSON.parse(store.get('owned') || '[0]');
skinId = parseInt(store.get('skin')) || 0;
muted = store.get('mute') === '1';
musicVol = parseFloat(store.get('musicVol')) ?? 0.65;
sfxVol = parseFloat(store.get('sfxVol')) ?? 0.65;
shakeIntensity = parseFloat(store.get('shakeIntensity')) ?? 1.0;
flashIntensity = parseFloat(store.get('flashIntensity')) ?? 1.0;

setTimeout(() => {
    if (sdkReady) sdkLoadData();
}, 1000);

// Двойное сохранение: локально + облако
function saveAllData() {
    store.set('best', bestMeters);
    store.set('wallet', wallet);
    store.set('owned', JSON.stringify(owned));
    store.set('skin', skinId);
    store.set('mute', muted ? '1' : '0');
    store.set('musicVol', musicVol);
    store.set('sfxVol', sfxVol);
    store.set('shakeIntensity', shakeIntensity);
    store.set('flashIntensity', flashIntensity);

    // Сохраняем в облако (не блокируя игру)
    if (sdkReady) sdkSaveData();
}