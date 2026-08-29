function resetWorld(newSeed, isBot) {
    lavaY = LAVA.startY;
    seed = newSeed >>> 0;
    rng = mulberry32(seed);
    anchors.length = 0;
    coins.length = 0;
    spikes.length = 0;
    particles.length = 0;
    floats.length = 0;
    trail.length = 0;
    anchorIdx = 1;
    prevSide = 1;
    streakLeft = 0;
    topAnchor = { x: 0, y: -2.5, idx: 0, spinDir: 1 };            // первая точка на линии падения
    anchors.push(topAnchor);
    hero.x = 0;
    hero.y = 0;
    hero.vx = 0;
    hero.vy = 0;
    hero.attached = false;
    hero.anchor = null;
    hero.lastAnchor = null;
    hero.grabs = 0;
    hero.attachT = 0;

    hero.lastReleasePos = null;
    hero.flightProgress = 0;

    camY = viewH * 0.12;
    camFreeze = 3.5;
    runT = 0; maxAlt = 0;
    coinsRun = 0;
    combo = 0;
    maxCombo = 0;
    shieldT = 0;
    dying = false;
    reviveAvail = !isBot;
    revivePoint = { x: 0, y: -2.5 };
    bot = !!isBot;
    spawnAhead();

    // Вычисляем максимальный полёт один раз
    maxFlightDist = calculateMaxFlight();
}