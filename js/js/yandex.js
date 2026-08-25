/* ---------- Yandex Games SDK ---------- */
let ysdk = null;
let sdkReady = false;
let sdkPlayer = null;

// Инициализация при запуске
function initYandex() {
    if (typeof YaGames === 'undefined') {
        console.log('SDK not found - running in local mode');
        detectLocale();
        return;
    }
    YaGames.init()
        .then(sdk => {
            ysdk = sdk;
            sdkReady = true;
            console.log('SDK initialized');
            initPlayer();
            detectLocale();

            // Блокируем портретную ориентацию
            ysdk.screen?.lockOrientation?.('portrait')?.catch?.(() => { });

            // Сигнал Яндексу, что игра готова (ВАЖНО: после инициализации!)
            ysdk.features?.LoadingAPI?.ready?.()?.catch?.(() => { });
        })
        .catch(e => console.error('SDK init error', e));
}

// Получение игрока
function initPlayer() {
    if (!ysdk) return;
    ysdk.getPlayer({ scopes: false })
        .then(player => {
            sdkPlayer = player;
            console.log('Player loaded');
        })
        .catch(e => console.error('Player load error', e));
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
            .then(() => console.log('Data saved to cloud'))
            .catch(e => console.error('Save error', e));
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
            console.log('Data loaded from cloud');
        })
        .catch(e => console.error('Load error', e));
}

// === ЛИДЕРБОРДЫ ===
function sdkSubmitScore(score) {
    if (!sdkReady || !ysdk) return;
    ysdk.getLeaderboards()
        .then(boards => boards.setLeaderboardScore('main', Math.floor(score)))
        .then(() => console.log('Score submitted to leaderboard'))
        .catch(e => console.error('Leaderboard error', e));
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
                console.error('Ad error', e);
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
                console.error('Interstitial error', e);
            }
        }
    });
}

// === ПАУЗА ДЛЯ РЕКЛАМЫ ===
let stateBeforeAd = null;
function pauseForAd() {
    stateBeforeAd = state;
    sdkGameplayStop(); 
    if (state === 'play') pauseGame();
    // Гасим звук музыки
    if (Snd && Snd.stopMusic) Snd.stopMusic();
}

function resumeAfterAd() {
    if (stateBeforeAd === 'play') {
        resumeGame();
        sdkGameplayStart(); 
    }
    else if (Snd && Snd.startMusic) {
        if (state === 'play' && !dying) Snd.startMusic('game');
        else Snd.startMusic('menu');
    }
}

// ====== ГЕЙМПЛЕЙ API ======
function sdkGameplayStart() {
    ysdk?.features?.GameplayAPI?.start?.()?.catch?.(() => { });
}

function sdkGameplayStop() {
    ysdk?.features?.GameplayAPI?.stop?.()?.catch?.(() => { });
}

// ====== ЯРЛЫК НА РАБОЧИЙ СТОЛ ======
function sdkShowShortcut(onSuccess, onSkip) {
    if (!ysdk || !ysdk.shortcut) {
        onSkip && onSkip();
        return;
    }

    ysdk.shortcut.canShowPrompt()
        .then(prompt => {
            if (!prompt.canShow) {
                onSkip && onSkip();
                return;
            }
            return ysdk.shortcut.showPrompt();
        })
        .then(result => {
            if (result && result.outcome === 'accepted') {
                onSuccess && onSuccess();
            } else {
                onSkip && onSkip();
            }
        })
        .catch(() => onSkip && onSkip());
}

function detectLocale() {
    // Защита: проверяем, что locale.js загружен
    if (typeof LOCALES === 'undefined' || typeof applyLocale === 'undefined') {
        console.warn('locale.js not loaded, skipping');
        return;
    }

    if (ysdk && ysdk.environment && ysdk.environment.i18n) {
        const sdkLang = ysdk.environment.i18n.lang;
        if (LOCALES[sdkLang]) {
            setLocale(sdkLang);
            applyLocale();
            return;
        }
    }

    const browserLang = (navigator.language || 'ru').substring(0, 2);
    if (LOCALES[browserLang]) {
        setLocale(browserLang);
    } else {
        setLocale('ru');
    }
    applyLocale();
}

// Инициализация при загрузке страницы
initYandex();