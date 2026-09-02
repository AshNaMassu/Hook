let lastGrabIdx = -1;
function getComboMult() {
    let mult = 1.0;
    for (const m of COMBO.multipliers) {
        if (combo >= m.min) mult = m.mult;
    }
    return mult;
}
let maxReachedIdx = 0; // максимальный индекс точки, до которой долетели
function releaseVel() {
    const rP = PF.normalizePower ? PF.rNorm : hero.r;
    const sp = hero.spinDir * hero.omega * rP;
    return { vx: -Math.sin(hero.theta) * sp, vy: Math.cos(hero.theta) * sp + PF.upAssist, sp: Math.abs(sp) };
}
function power() { return hero.attached ? hero.omega * hero.r : 0; }

// Проверка награды за серию
function checkStreakReward(type, count, x, y) {
    // Берём массив уровней для конкретной серии
    const levels = STREAKS[type];

    for (const level of levels) {
        if (count === level.count) {
            const bonusCoins = level.bonusCoins;
            coinsRun += bonusCoins;

            // Цвет берём из FEEDBACK_COLORS
            const color = FEEDBACK_COLORS[type];

            // Надпись серии
            addFloat(x, y + 1.5, t('streak') + ' ×' + count + ' +' + bonusCoins + '◈', color, 30);
            burst(x, y, 16, color, 6);
            if (state === 'play') Snd.perfect();

            // Запоминаем вспышку (если она редче текущей)
            if (!pendingStreakFlash || STREAKS.priority[type] > STREAKS.priority[pendingStreakFlash.type]) {
                pendingStreakFlash = { type: type, color: color, intensity: 0.5 };
            }

            break;  // только один уровень за раз
        }
    }
}

function tryGrab() {
    let best = null;
    let bestScore = -Infinity;
    
    for (const a of anchors) {
        // Быстрая проверка: если точка далеко по Y — пропускаем
        if (Math.abs(a.y - hero.y) > PF.grabRadius) continue;
        // Быстрая проверка: если точка далеко по X — пропускаем
        if (Math.abs(a.x - hero.x) > PF.grabRadius) continue;
        
        const d = Math.hypot(a.x - hero.x, a.y - hero.y);
        if (d > PF.grabRadius) continue;  // вне радиуса — пропускаем
        
        // Скоринг: приоритет по маршруту (idx) + высоте (y) + близости
        const idxPriority = a.idx * 100;          // маршрут — главный приоритет
        const heightBonus = a.y;                  // высота — вторичный
        const distBonus = (PF.grabRadius - d) * 0.5;  // близость — третичный
        const score = idxPriority + heightBonus + distBonus;
        
        if (score > bestScore) {
            bestScore = score;
            best = a;
        }
    }
    if (!best) return;
    hero.attached = true; hero.anchor = best; hero.attachT = 0;
    const dx = hero.x - best.x, dy = hero.y - best.y;
    const dist = Math.hypot(dx, dy) || 1e-3;
    hero.targetR = clamp(dist, PF.rMin, PF.rMax);  // целевая длина
    hero.r = dist;  // начинаем с реальной длины (без скачка)
    hero.theta = Math.atan2(dy, dx);
    const w = (dx * hero.vy - dy * hero.vx) / (hero.r * hero.r);              // угловой момент
    
    // Если момент совсем мал (герой летит прямо на точку) — выбираем по стороне подлёта
    // dx < 0 → герой слева от точки → вращение по часовой (1)
    // dx > 0 → герой справа от точки → вращение против часовой (-1)
    if (Math.abs(w) < 0.05) {
        hero.spinDir = dx < 0 ? 1 : -1;
    } else {
        hero.spinDir = w > 0 ? 1 : -1;
    }
    
    let wm = Math.abs(w); if (wm < PF.wMin) wm = PF.wMin;
    hero.omega = clamp(wm, PF.wMin, PF.wMax);
    hero.x = best.x + Math.cos(hero.theta) * hero.r;
    hero.y = best.y + Math.sin(hero.theta) * hero.r;
    hero.grabs++;
    hero.grabTime = uiT;
    hero.comboTimer = COMBO.window;

    // Логика комбо по зацепу: если зацепились за точку дальше по маршруту
    if (best.idx > lastGrabIdx) {
        const skipCount = (best.idx - lastGrabIdx) - 1;

        // Комбо растёт если отпустили в окно времени
        if (hero.comboTimer > 0 || hero.grabs === 1) {
            combo++;
            maxCombo = Math.max(maxCombo, combo);

            // Дальний прыжок и мега-прыжок: по высоте полёта
            if (hero.lastReleasePos && maxFlightDist > 0) {
                const flightHeight = hero.y - hero.lastReleasePos.y;
                const flightRatio = flightHeight / maxFlightDist;

                // МЕГА-ПРЫЖОК! (100%+ высоты)
                if (flightRatio >= COMBO.megaJump.threshold) {
                    const bonusCoins = COMBO.megaJump.bonusCoins || 15;
                    coinsRun += bonusCoins;

                    addFloat(best.x, best.y + 1.2, t('megaJump') + ' +' + bonusCoins + '◈', FEEDBACK_COLORS.megaJump, 30);
                    burst(best.x, best.y, 20, '#ff4fd8', 6);
                    burst(best.x, best.y, 10, '#ffc23d', 4);
                    if (state === 'play') Snd.perfect();

                    // Сильная тряска и вибрация (если включена и не бот)
                    if (!bot) {
                        shakeT = 0.3;
                        if (vibrationEnabled && navigator.vibrate) navigator.vibrate([50, 30, 50]);
                    }
                }
                // ДАЛЬНИЙ! (75%+ высоты)
                else if (flightRatio >= COMBO.longJump.threshold) {
                    streakLongJump++;

                    const bonusCoins = COMBO.longJump.bonusCoins || 5;
                    coinsRun += bonusCoins;

                    addFloat(best.x, best.y + 1.0, t('longJump') + ' ×' + streakLongJump + ' +' + bonusCoins + '◈', FEEDBACK_COLORS.longJump, 26);
                    burst(best.x, best.y, 14, '#ff4fd8', 5);
                    if (state === 'play') Snd.perfect();

                    if (!bot) {
                        shakeT = 0.2;
                        if (vibrationEnabled && navigator.vibrate) navigator.vibrate(30);
                    }

                    // Проверяем уровень серии
                    checkStreakReward('longJump', streakLongJump, best.x, best.y);
                }

                // Сбрасываем после зацепа
                hero.lastReleasePos = null;
                hero.flightProgress = 0;
            }

            // ПЕРФЕКТ: идеальный тайминг (зацеп на вспышку)
            const flash = anchorVisualState(best);
            if (flash >= STREAKS.perfectFlashThreshold) {
                streakPerfect++;

                // Надпись
                addFloat(best.x, best.y + 0.4, t('perfect') + ' ×' + streakPerfect, FEEDBACK_COLORS.perfect, 24);
                burst(best.x, best.y, 14, '#ffc23d', 4);
                if (state === 'play') Snd.perfect();

                // Проверяем уровень серии
                checkStreakReward('perfect', streakPerfect, best.x, best.y);
            } else {
                streakPerfect = 0;  // сброс серии если не на вспышку
            }

            // ЦЕП: быстрый зацеп
            const timeSinceRelease = uiT - hero.lastReleaseTime;
            if (timeSinceRelease <= COMBO.fastThreshold) {
                streakFastGrab++;

                // Надпись
                addFloat(best.x, best.y + 0.8, t('fastGrab') + ' ×' + streakFastGrab, FEEDBACK_COLORS.fastGrab, 22);
                if (state === 'play') Snd.perfect();

                // Проверяем уровень серии
                checkStreakReward('fastGrab', streakFastGrab, best.x, best.y);
            } else {
                streakFastGrab = 0;  // сброс серии если не быстро
            }
        }

        lastGrabIdx = best.idx;
    } else {
        // Зацеп за ту же или предыдущую точку — комбо сброс
        combo = 0;
    }
    // Обновляем максимальный достигнутый индекс
    if (best.idx > maxReachedIdx) {
        maxReachedIdx = best.idx;
    }
    revivePoint = { x: best.x, y: best.y };
    burst(hero.x, hero.y, 10, skinColor(), 3);
    if (state === 'play')
        Snd.grab();

    // Размораживаем камеру после первого зацепа
    if (!firstGrabDone) {
        firstGrabDone = true;
        camFreeze = 0;
    }

    // Лёгкая тряска при зацепе (только если не бот)
    if (!bot) {
        shakeT = 0.15;
    }

    // Вибрация на мобильных (если включена и не бот)
    if (vibrationEnabled && !bot && navigator.vibrate) {
        navigator.vibrate(30);
    }
}
function doRelease() {
    if (!hero.attached) return;
    hero.attached = false; hero.lastAnchor = hero.anchor;

    // ПУФ: быстрое отпускание
    const holdTime = uiT - hero.grabTime;
    if (holdTime <= COMBO.fastThreshold) {
        streakFastRelease++;

        // Надпись
        addFloat(hero.x, hero.y + 0.6, t('fastRelease') + ' ×' + streakFastRelease, FEEDBACK_COLORS.fastRelease, 22);
        if (state === 'play') Snd.perfect();

        // Проверяем уровень серии
        checkStreakReward('fastRelease', streakFastRelease, hero.x, hero.y);
    } else {
        streakFastRelease = 0;  // сброс серии если не быстро
    }

    const v = releaseVel();
    hero.vx = v.vx; hero.vy = v.vy;
    hero.lastReleaseTime = uiT;

    // Запоминаем позицию релиза для дальнего прыжка
    hero.lastReleasePos = { x: hero.x, y: hero.y };
    hero.flightProgress = 0;

    burst(hero.x, hero.y, 6, skinColor(), 2.5);
    if (state === 'play') Snd.release();
}
function pressAction() {
    if (state !== 'play' || dying) return;
    if (hero.attached) return;  // уже зацеплен — ждём отпускания
    tryGrab();
}
function releaseAction() {
    if (state !== 'play') return;
    if (hero.attached) doRelease();
}

function calculateMaxFlight() {
    // Максимальная скорость на конце верёвки
    const maxSpeed = PF.wMax * PF.rMax;

    // Симулируем 8 разных углов релиза и берём максимум высоты
    let maxHeight = 0;

    for (let theta = 0; theta < TAU; theta += TAU / 8) {
        // Позиция релиза (на окружности радиуса rMax)
        const px0 = Math.cos(theta) * PF.rMax;
        const py0 = Math.sin(theta) * PF.rMax;

        // Скорость по касательной (перпендикулярно радиусу)
        const vx = -Math.sin(theta) * maxSpeed;
        const vy = Math.cos(theta) * maxSpeed + PF.upAssist;

        let px = px0, py = py0;
        let cvx = vx, cvy = vy;
        let height = 0;

        // Симуляция полёта
        for (let i = 0; i < 46; i++) {
            cvy -= PF.g * 0.045;
            px += cvx * 0.045;
            py += cvy * 0.045;

            // ← СЧИТАЕМ ТОЛЬКО ВЫСОТУ (вертикальная составляющая)
            const h = py - py0;
            if (h > height) height = h;
        }

        if (height > maxHeight) maxHeight = height;
    }

    return maxHeight;
}