function die() {
    if (dying) return;
    maxReachedIdx = 0;
    lastGrabIdx = -1;
    dying = true; deathT = 0.55; shakeT = 0.6;
    burst(hero.x, hero.y, 42, '#ff2e5f', 7);
    burst(hero.x, hero.y, 20, '#ffffff', 5);
    if (state === 'play') Snd.death();
}
function finishDeath() {
    lastGrabIdx = -1;
    Snd.startMusic('menu')
    if (state === 'menu') {
        resetWorld((Math.random() * 2 ** 31) | 0, true);
        return;
    }
    state = 'over';
    const m = Math.floor(maxAlt);
    const rec = m > bestMeters;
    if (rec) {
        bestMeters = m;
        // Отправляем в лидерборд
        if (sdkReady) sdkSubmitScore(m);
    }
    wallet += coinsRun;
    saveAllData();
    el.overMeters.textContent = m + ' м';
    el.overCoins.textContent = '◈ +' + coinsRun;
    el.overCombo.textContent = 'серия ×' + maxCombo;
    el.recordBadge.classList.toggle('hidden', !rec);
    el.btnRevive.classList.toggle('hidden', !reviveAvail);
    show(el.over); hide(el.hud);
}
function doRevive() {
    reviveAvail = false;
    hide(el.over); show(el.hud); state = 'play'; dying = false;
    // Сброс комбо при ревайве
    combo = 0;
    maxCombo = Math.max(maxCombo, combo);
   
    // спасательная точка на месте последнего зацепа
    const ra = { x: revivePoint.x, y: revivePoint.y, idx: anchorIdx++, spinDir: 1 };
    lastGrabIdx = ra.idx;

    let above = null;
    for (const a of anchors) if (a.y > ra.y && (!above || a.y < above.y)) above = a;
    ra.spinDir = above ? (above.x >= ra.x ? 1 : -1) : 1;
    anchors.push(ra);
    hero.x = ra.x; hero.y = ra.y + 3; hero.vx = 0; hero.vy = 0;
    hero.attached = false; hero.lastAnchor = null;
    camY = ra.y + 1; camFreeze = 2.5; shieldT = 3;
    burst(ra.x, ra.y, 16, '#26e0ff', 4);
    addFloat(ra.x, ra.y + 1, 'ЩИТ 3с', '#26e0ff', 18);
    Snd.ui();
}