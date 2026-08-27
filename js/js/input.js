let holding = false;  // просто флаг "палец на экране"

cv.addEventListener('pointerdown', e => {
    e.preventDefault();
    Snd.ensure();
    holding = true;
    pressAction();  // попытка зацепа
});

cv.addEventListener('pointerup', e => {
    e.preventDefault();
    holding = false;
    releaseAction();  // отпускание
});

cv.addEventListener('pointercancel', e => {
    holding = false;
    releaseAction();
});

cv.addEventListener('contextmenu', e => e.preventDefault());

// Клавиатура (для ПК)
window.addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        Snd.ensure();
        if (state === 'play') {
            holding = true;
            pressAction();
        }
        else if (state === 'menu') startRun((Math.random() * 2 ** 31) | 0);
        else if (state === 'over') startRun((Math.random() * 2 ** 31) | 0);
    }
    if (e.code === 'Escape' || e.code === 'KeyP') {
        if (state === 'play') pauseGame();
        else if (state === 'pause') resumeGame();
    }
});

window.addEventListener('keyup', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        holding = false;
        releaseAction();
    }
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Сворачиваем — пауза
        if (state === 'play') {
            pauseGame();
        }
        // Останавливаем музыку
        if (Snd && Snd.stopMusic) {
            Snd.stopMusic();
        }
    } else {
        // Возвращаемся — восстанавливаем аудио
        if (Snd && Snd.ensure) {
            Snd.ensure();
        }
        // Возобновляем музыку если не в паузе и не в мьюте
        if (!muted) {
            if (state === 'play' && !dying) {
                Snd.startMusic('game');
            } else if (state === 'menu' || state === 'over') {
                Snd.startMusic('menu');
            }
        }
    }
});

// Если звук не восстановился автоматически — восстанавливаем при первом клике
window.addEventListener('pointerdown', function restoreAudio() {
    if (needsAudioRestore && Snd && Snd.ctx && Snd.ctx.state === 'suspended') {
        Snd.ctx.resume().then(() => {
            needsAudioRestore = false;
            if (!muted && Snd) {
                if (state === 'play' && !dying) {
                    Snd.startMusic('game');
                } else if (state === 'menu' || state === 'over') {
                    Snd.startMusic('menu');
                }
            }
        }).catch(() => { });
    }
}, { once: false });