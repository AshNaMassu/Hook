function flightHits(px, py, vx, vy, tx, ty, steps, dt) {
    // Адаптивное количество шагов по качеству графики
    steps = steps || QUALITY_SETTINGS[RenderQuality.current].flightSteps;
    dt = dt || 0.05;

    for (let i = 0; i < steps; i++) {
        vy -= PF.g * dt; px += vx * dt; py += vy * dt;
        const dx = px - tx, dy = py - ty;
        if (dx * dx + dy * dy < PF.grabRadius * PF.grabRadius) return true;
    }
    return false;
}

function reachQuality(ax, ay, sd, tx, ty) {
    let hits = 0, total = 0;
    const r = PHYSICS_PRECOMPUTED.avgRadius;
    const w = PHYSICS_PRECOMPUTED.avgSpeed;

    for (let k = 0; k < 4; k++) {
        const th = k / 4 * TAU + TAU / 8;
        const px = ax + Math.cos(th) * r;
        const py = ay + Math.sin(th) * r;
        const sp = w * r;
        total++;
        if (flightHits(px, py, -Math.sin(th) * sd * sp, Math.cos(th) * sd * sp + PF.upAssist, tx, ty, 20, 0.07)) {
            hits++;
        }
    }
    return [hits / total, hits >= 2 ? 1 : 0];
}

function pickSide() {
    // Первые N метров: строгое чередование сторон
    if (topAnchor && topAnchor.y < GEN.strictSideHeight) {
        prevSide = -prevSide;
        return prevSide;
    }

    // После — обычная логика со стриками
    if (streakLeft > 0) { streakLeft--; return prevSide; }

    const r = rng();
    let s;
    if (r < 0.2) { streakLeft = 1; s = prevSide; }
    else if (r < 0.3) { streakLeft = 2; s = prevSide; }
    else s = -prevSide;
    prevSide = s;
    return s;
}

function canonicalShot(a, side, diffG) {
    // Случайный угол: базовый ± angleJitter
    const baseAngle = side > 0 ? 315 : 225;
    const angleJitter = (rng() * 2 - 1) * GEN.angleJitter;
    const th = (baseAngle + angleJitter) * RAD;
    const sd = side > 0 ? 1 : -1;

    const r = PHYSICS_PRECOMPUTED.avgRadius;
    const w = PHYSICS_PRECOMPUTED.avgSpeed;

    let px = a.x + Math.cos(th) * r;
    let py = a.y + Math.sin(th) * r;
    let vx = -Math.sin(th) * sd * w * r;
    let vy = Math.cos(th) * sd * w * r + PF.upAssist;

    const T = 0.7 + 0.3 * rng();
    const path = [{ x: px, y: py }];
    for (let t = 0; t < T; t += 0.05) {
        vy -= PF.g * 0.05;
        px += vx * 0.05;
        py += vy * 0.05;
        path.push({ x: px, y: py });
    }

    // Случайное смещение (меньше на высокой сложности)
    const jitterScale = GEN.jitterScaleMax - GEN.jitterDiffScale * diffG;
    px += (rng() * 2 - 1) * jitterScale;
    py += (rng() * 2 - 1) * jitterScale * GEN.jitterVertical;

    return { x: px, y: py, sd, path };
}

function placeCoins(path, n) {
    for (let i = 0; i < n; i++) {
        const f = 0.22 + 0.56 * (n === 1 ? 0.5 : i / (n - 1));
        const p = path[Math.floor(f * (path.length - 1))];
        coins.push({
            x: p.x + (rng() * 2 - 1) * 0.15,
            y: p.y + (rng() * 2 - 1) * 0.15,
            phase: rng() * TAU,
            taken: false,
        });
    }
}

function maybeSpike(path, prevA, newA, diffG, idx) {
    if (idx < GEN.spikeStartIdx) return;
    if (rng() > GEN.spikeBaseChance + GEN.spikeDiffScale * diffG) return;

    const b = path[Math.floor(path.length * (0.25 + rng() * 0.5))];

    for (let k = 0; k < 7; k++) {
        const ang = rng() * TAU;
        const off = GEN.spikeRadiusMin + rng() * (GEN.spikeRadiusMax - GEN.spikeRadiusMin);
        const x = clamp(b.x + Math.cos(ang) * off, -GEN.spikeX, GEN.spikeX);
        const y = b.y + Math.sin(ang) * off;

        if (Math.hypot(x - prevA.x, y - prevA.y) < GEN.spikeMinDistToAnchor) continue;
        if (Math.hypot(x - newA.x, y - newA.y) < GEN.spikeMinDistToAnchor) continue;

        let ok = true;
        for (const pt of path) {
            if (Math.hypot(x - pt.x, y - pt.y) < GEN.spikeMinDistToPath) { ok = false; break; }
        }
        if (!ok) continue;

        for (const s of spikes) {
            if (Math.hypot(x - s.x, y - s.y) < GEN.spikeMinDistToOther) { ok = false; break; }
        }
        if (!ok) continue;

        for (const c of coins) {
            if (!c.taken && Math.hypot(x - c.x, y - c.y) < GEN.spikeMinDistToCoin) { ok = false; break; }
        }
        if (!ok) continue;

        spikes.push({ x, y, rot: rng() * TAU });
        return;
    }
}

function spawnNext() {
    // В обучалке генерируем простые точки
    if (tutorialActive && anchorIdx < 5) {
        return spawnTutorialAnchor();
    }

    const side = pickSide(), prev = topAnchor;
    prev.spinDir = side;

    const idx = anchorIdx++;
    const diffG = Math.min(1, idx / 70);
    const calm = (idx % GEN.calmPeriod === GEN.calmOffset);
    const bonus = (idx > 0 && idx % GEN.bonusPeriod >= GEN.bonusThreshold);

    const currentHeight = prev.y;
    let best = null;

    for (let at = 0; at < 7; at++) {
        const shot = canonicalShot(prev, side, diffG);
        let px = shot.x, py = shot.y;

        if (Math.abs(px - prev.x) > GEN.maxDx) {
            px = prev.x + Math.sign(px - prev.x) * GEN.maxDx;
        }

        const sd = shot.sd;

        // Минимальный горизонтальный разброс
        const minDx = currentHeight < GEN.minDxThreshold
            ? Math.max(GEN.minDxClose, PF.grabRadius * 0.8)
            : Math.max(GEN.minDxFar, PF.grabRadius * 0.6);

        if (Math.abs(px - prev.x) < minDx) {
            px = prev.x + sd * minDx;
        }

        // Плотность по вертикали
        let mdy;
        if (currentHeight < GEN.densityStartHeight) {
            mdy = GEN.densityClose;
        } else if (currentHeight < GEN.densityEndHeight) {
            const t = (currentHeight - GEN.densityStartHeight) / (GEN.densityEndHeight - GEN.densityStartHeight);
            mdy = lerp(GEN.densityClose, GEN.densityFar, t);
        } else {
            mdy = GEN.densityFar;
        }

        if (calm) mdy *= GEN.calmDensityFactor;

        // Больше свободы по вертикали на старте
        const minPyDiff = currentHeight < GEN.minDxThreshold ? mdy * GEN.verticalFreedom : mdy;
        if (py - prev.y < minPyDiff) py = prev.y + minPyDiff;

        px = clamp(px, -GEN.anchorClamp, GEN.anchorClamp);

        // Проверка достижимости
        const reachable = isReachableByDistance(prev, { x: px, y: py });
        const q = reachable ? 1 : 0;

        if (!best || q > best.q) best = { x: px, y: py, q, shot };
        if (reachable) break;
    }

    const a = { x: best.x, y: best.y, idx, spinDir: 0 };
    anchors.push(a);
    topAnchor = a;
    placeCoins(best.shot.path, bonus ? 5 : 3);
    maybeSpike(best.shot.path, prev, a, diffG, idx);
}

function spawnTutorialAnchor() {
    const side = pickSide();
    const prev = topAnchor;
    prev.spinDir = side;

    const idx = anchorIdx++;

    // Простая точка прямо над предыдущей
    const px = prev.x + side * 2.5;
    const py = prev.y + 3.0;

    const a = { x: px, y: py, idx, spinDir: 0 };
    anchors.push(a);
    topAnchor = a;

    // Монеты на пути
    placeCoins([{ x: px, y: py }], 2);
}

function spawnAhead() {
    while (topAnchor.y < camY + viewH * 1.6) spawnNext();
    updateWalls();
}

let wallsInitialized = false;

function updateWalls() {
    if (!WALLS.enabled || wallsInitialized) return;
    wallLeft = -(GEN.anchorClamp + PF.rMax + WALLS.margin);
    wallRight = GEN.anchorClamp + PF.rMax + WALLS.margin;
    wallsInitialized = true;
}

// Упрощённая проверка достижимости по расстоянию
function isReachableByDistance(prevA, newA) {
    const dx = newA.x - prevA.x;
    const dy = newA.y - prevA.y;
    const dist = Math.hypot(dx, dy);
    return dist <= PHYSICS_PRECOMPUTED.maxJumpDist;
}