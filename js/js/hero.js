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

function tryGrab() {
    let best = null, bd = PF.grabRadius;
    for (const a of anchors) {
        if (a.cooldownT > 0) continue;
        const d = Math.hypot(a.x - hero.x, a.y - hero.y);
        if (d <= bd) { bd = d; best = a; }
    }
    if (!best) return;
    hero.attached = true; hero.anchor = best; hero.attachT = 0;
    const dx = hero.x - best.x, dy = hero.y - best.y;
    const dist = Math.hypot(dx, dy) || 1e-3;
    hero.r = clamp(dist, PF.rMin, PF.rMax);
    hero.theta = Math.atan2(dy, dx);
    const w = (dx * hero.vy - dy * hero.vx) / (hero.r * hero.r);              // угловой момент
    hero.spinDir = Math.abs(w) > PF.mom ? (w > 0 ? 1 : -1) : (best.spinDir || 1); // момент → иначе замысел маршрута
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

            // Дальний прыжок: пропустили 1+ точек
            if (skipCount >= COMBO.longJump.skipPoints) {
                addFloat(best.x, best.y + 1.0, t('longJump') + ' (+' + skipCount + ')', '#ff4fd8', 26);
                burst(best.x, best.y, 14, '#ff4fd8', 5);
                if (state === 'play') Snd.perfect();
            }

            // Перфект: зацеп за следующую точку без пропуска
            if (skipCount === 0) {
                perfectFlash = 0.35;
                addFloat(best.x, best.y + 0.4, t('perfect') + ' ×' + combo, '#ffc23d', combo > 1 ? 24 : 20);
                burst(best.x, best.y, 14, '#ffc23d', 4);
                if (state === 'play') Snd.perfect();
            }

            // БЫСТРО! если зацепились в первые 0.2с после релиза
            const timeSinceRelease = uiT - hero.lastReleaseTime;
            if (timeSinceRelease <= COMBO.fastThreshold) {
                addFloat(best.x, best.y + 0.8, t('fast'), '#26e0ff', 22);
                if (state === 'play') Snd.perfect();
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
    if (state === 'play') Snd.grab();
}
function doRelease() {
    if (!hero.attached) return;
    hero.attached = false; hero.lastAnchor = hero.anchor;

    // БЫСТРО! если отпустили в первые 0.2с
    const holdTime = uiT - hero.grabTime;
    if (holdTime <= COMBO.fastThreshold) {
        addFloat(hero.x, hero.y + 0.6, t('fast'), '#26e0ff', 22);
        if (state === 'play') Snd.perfect(); // или отдельный звук
    }

    if (hero.lastAnchor) hero.lastAnchor.cooldownT = 0.2;
    const v = releaseVel();
    hero.vx = v.vx; hero.vy = v.vy;
    hero.lastReleaseTime = uiT;

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