/* ---------- Yandex Games SDK ---------- */
let ysdk = null;
let sdkReady = false;
let sdkPlayer = null;

// Инициализация при запуске
function initYandex() {
    if (typeof YaGames === 'undefined') {
        console.log('SDK не найден — работаем без него (локально)');
        return;
    }
    YaGames.init()
        .then(sdk => {
            ysdk = sdk;
            sdkReady = true;
            console.log('SDK инициализирован');
            initPlayer();

            // Блокируем портретную ориентацию
            if (ysdk.screen && ysdk.screen.lockOrientation) {
                ysdk.screen.lockOrientation('portrait').catch(() => { });
            }
        })
        .catch(e => console.error('Ошибка инициализации SDK', e));
}

// Получение игрока
function initPlayer() {
    if (!ysdk) return;
    ysdk.getPlayer({ scopes: false })
        .then(player => {
            sdkPlayer = player;
            console.log('Игрок загружен');
        })
        .catch(e => console.error('Ошибка загрузки игрока', e));
}

// === СОХРАНЕНИЕ ДАННЫХ ===
let saveDataTimeout = null;

function sdkSaveData() {
    if (!sdkReady || !sdkPlayer) return;

    // Дебаунсинг: не чаще чем раз в 1000мс
    if (saveDataTimeout) clearTimeout(saveDataTimeout);
    saveDataTimeout = setTimeout(() => {
        const data = {
            best: bestMeters,
            wallet: wallet,
            owned: owned,
            skin: skinId,
            mute: muted,
            musicVol: musicVol,
            sfxVol: sfxVol,
            shakeIntensity: shakeIntensity,
            flashIntensity: flashIntensity,
        };
        sdkPlayer.setData(data)
            .then(() => console.log('Данные сохранены в облако'))
            .catch(e => console.error('Ошибка сохранения', e));
    }, 1000);
}

function sdkLoadData() {
    if (!sdkReady || !sdkPlayer) return;
    sdkPlayer.getData()
        .then(data => {
            if (!data || !Object.keys(data).length) return;
            if (data.best !== undefined) bestMeters = data.best;
            if (data.wallet !== undefined) wallet = data.wallet;
            if (data.owned) owned = data.owned;
            if (data.skin) skinId = data.skin;
            if (data.mute !== undefined) muted = data.mute;
            if (data.musicVol !== undefined) musicVol = data.musicVol;
            if (data.sfxVol !== undefined) sfxVol = data.sfxVol;
            if (data.shakeIntensity !== undefined) shakeIntensity = data.shakeIntensity;
            if (data.flashIntensity !== undefined) flashIntensity = data.flashIntensity;
            console.log('Данные загружены из облака');
        })
        .catch(e => console.error('Ошибка загрузки', e));
}

// === ЛИДЕРБОРДЫ ===
function sdkSubmitScore(score) {
    if (!sdkReady || !ysdk) return;
    ysdk.getLeaderboards()
        .then(boards => boards.setLeaderboardScore('main', Math.floor(score)))
        .then(() => console.log('Результат отправлен в лидерборд'))
        .catch(e => console.error('Ошибка лидерборда', e));
}

// === РЕКЛАМА ===
// Rewarded реклама для ревайва
function sdkShowRewarded(onSuccess, onFail) {
    if (!ysdk) { onFail && onFail(); return; }
    let rewarded = false;
    ysdk.adv.showRewardedVideo({
        callbacks: {
            onOpen: () => {
                // Останавливаем игру перед рекламой
                pauseForAd();
            },
            onRewarded: () => {
                rewarded = true;
                onSuccess && onSuccess();
            },
            onClose: () => {
                resumeAfterAd();
                if (!rewarded) onFail && onFail();
            },
            onError: (e) => {
                resumeAfterAd();
                console.error('Ошибка рекламы', e);
                onFail && onFail();
            }
        }
    });
}

// Interstitial между забегами
let lastInterstitialTime = 0;
function sdkShowInterstitial() {
    if (!ysdk) return;
    // Троттлинг: не чаще чем раз в 3 забега или 60 секунд
    const now = Date.now();
    if (now - lastInterstitialTime < 60000) return;
    lastInterstitialTime = now;

    ysdk.adv.showFullscreenAdv({
        callbacks: {
            onOpen: () => pauseForAd(),
            onClose: () => resumeAfterAd(),
            onError: (e) => {
                resumeAfterAd();
                console.error('Ошибка interstitial', e);
            }
        }
    });
}

// === ПАУЗА ДЛЯ РЕКЛАМЫ ===
let stateBeforeAd = null;
function pauseForAd() {
    stateBeforeAd = state;
    if (state === 'play') pauseGame();
    // Гасим звук музыки
    if (Snd && Snd.stopMusic) Snd.stopMusic();
}

function resumeAfterAd() {
    if (stateBeforeAd === 'play') resumeGame();
    else if (Snd && Snd.startMusic) {
        if (state === 'play' && !dying) Snd.startMusic('game');
        else Snd.startMusic('menu');
    }
}

// Инициализация при загрузке страницы
initYandex();