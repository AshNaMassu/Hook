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
    const r = (PF.rMin + PF.rMax) / 2;  // средний радиус
    const w = PF.wMin + (PF.wMax - PF.wMin) * 0.6;  // средняя скорость

    // 4 угла вместо 16
    for (let k = 0; k < 4; k++) {
        const th = k / 4 * TAU + TAU / 8;  // смещение на 45° для разнообразия
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
    // Первые 50 метров: строгое чередование сторон (без стриков)
    if (topAnchor && topAnchor.y < 50) {
        prevSide = -prevSide;
        return prevSide;
    }

    // После 50 метров: обычная логика со стриками
    if (streakLeft > 0) { streakLeft--; return prevSide; }
    const r = rng();
    let s;
    if (r < 0.2) { streakLeft = 1; s = prevSide; }
    else if (r < 0.3) { streakLeft = 2; s = prevSide; }
    else s = -prevSide;
    prevSide = s; return s;
}

function canonicalShot(a, side, diffG) {
    // Случайный угол вместо фиксированных 315°/225°
    // Базовый угол + рандомное отклонение ±25°
    const baseAngle = side > 0 ? 315 : 225;
    const angleJitter = (rng() * 2 - 1) * 25;  // ±25 градусов
    const th = (baseAngle + angleJitter) * RAD;
    const sd = side > 0 ? 1 : -1;

    const r = (PF.rMin + PF.rMax) / 2, w = PF.wMin + (PF.wMax - PF.wMin) * 0.6;
    let px = a.x + Math.cos(th) * r, py = a.y + Math.sin(th) * r;
    let vx = -Math.sin(th) * sd * w * r, vy = Math.cos(th) * sd * w * r + PF.upAssist;
    const T = 0.7 + 0.3 * rng(), path = [{ x: px, y: py }];
    for (let t = 0; t < T; t += 0.05) { vy -= PF.g * 0.05; px += vx * 0.05; py += vy * 0.05; path.push({ x: px, y: py }); }

    // Увеличенное случайное смещение (было ±0.5, стало ±1.0)
    const jitterScale = 1.0 - 0.5 * diffG;  // меньше рандома на высокой сложности
    px += (rng() * 2 - 1) * jitterScale;
    py += (rng() * 2 - 1) * jitterScale * 0.6;  // по вертикали меньше

    return { x: px, y: py, sd, path };
}

function placeCoins(path, n) {
    for (let i = 0; i < n; i++) {
        const f = 0.22 + 0.56 * (n === 1 ? 0.5 : i / (n - 1));
        const p = path[Math.floor(f * (path.length - 1))];
        coins.push({ x: p.x + (rng() * 2 - 1) * 0.15, y: p.y + (rng() * 2 - 1) * 0.15, phase: rng() * TAU, taken: false });
    }
}
function maybeSpike(path, prevA, newA, diffG, idx) {
    if (idx < 100) return;
    if (rng() > 0.22 + 0.4 * diffG) return;
    const b = path[Math.floor(path.length * (0.25 + rng() * 0.5))];
    for (let k = 0; k < 7; k++) {
        const ang = rng() * TAU, off = 1.9 + rng() * 1.5;
        const x = clamp(b.x + Math.cos(ang) * off, -SPIKE_X, SPIKE_X), y = b.y + Math.sin(ang) * off;
        if (Math.hypot(x - prevA.x, y - prevA.y) < 3.8 || Math.hypot(x - newA.x, y - newA.y) < 3.8) continue;
        let ok = true;
        for (const pt of path) { if (Math.hypot(x - pt.x, y - pt.y) < 1.9) { ok = false; break; } }
        if (ok) for (const s of spikes) { if (Math.hypot(x - s.x, y - s.y) < 2.4) { ok = false; break; } }
        if (ok) for (const c of coins) { if (!c.taken && Math.hypot(x - c.x, y - c.y) < 1) { ok = false; break; } }
        if (ok) { spikes.push({ x, y, rot: rng() * TAU }); return; }
    }
}
function spawnNext() {
    const side = pickSide(), prev = topAnchor;
    prev.spinDir = side;
    const idx = anchorIdx++;
    const diffG = Math.min(1, idx / 70);
    const calm = (idx % 11 === 10), bonus = (idx > 0 && idx % 10 >= 7);

    // Высота текущей точки (для прогрессии плотности)
    const currentHeight = prev.y;

    let best = null;
    for (let at = 0; at < 7; at++) {
        const shot = canonicalShot(prev, side, diffG);
        let px = shot.x, py = shot.y;
        if (Math.abs(px - prev.x) > MAXDX) px = prev.x + Math.sign(px - prev.x) * MAXDX;

        const sd = shot.sd;
        // На старте (до 100м) — больший горизонтальный разброс
        // чтобы точки не были в один столбец
        let minDx;
        if (currentHeight < 100) {
            minDx = Math.max(2.5, PF.grabRadius * 0.8);  // больше разброс
        } else {
            minDx = Math.max(1.5, PF.grabRadius * 0.6);  // как было
        }

        if (Math.abs(px - prev.x) < minDx)
            px = prev.x + sd * minDx;

        // Плотность точек по высоте:
        // 0-50м:   плотно (mdy = 2.0)
        // 50-200м: плавный переход 2.0 → 4.5
        // 200м+:   нормально (mdy = 4.5)
        let mdy;
        if (currentHeight < 50) {
            mdy = 2.5;  // плотно на старте
        } else if (currentHeight < 200) {
            const t = (currentHeight - 50) / 150;  // 0 → 1
            mdy = lerp(2.5, 4.5, t);  // плавный переход
        } else {
            mdy = 4.5;  // нормальная плотность
        }

        if (calm)
            mdy *= 0.6;
        // На старте даём больше свободы по вертикали
        if (currentHeight < 100) {
            if (py - prev.y < mdy * 0.7) py = prev.y + mdy * 0.7;
        } else {
            if (py - prev.y < mdy) py = prev.y + mdy;
        }

        // Принудительное чередование сторон при малых расстояниях
        // (чтобы точки не были в один столбец)
        if (currentHeight < 100) {
            const minDx = Math.max(2.0, PF.grabRadius * 0.7);
            if (Math.abs(px - prev.x) < minDx) {
                px = prev.x + sd * minDx;
            }
        }

        px = clamp(px, -ANCH_CLAMP, ANCH_CLAMP);

        // Быстрая проверка достижимости по расстоянию
        const reachable = isReachableByDistance(prev, { x: px, y: py });
        const q = reachable ? 1 : 0;

        if (!best || q > best.q) best = { x: px, y: py, q, shot };
        if (reachable) break;
    }

    const a = { x: best.x, y: best.y, idx, spinDir: 0 };
    anchors.push(a); topAnchor = a;
    placeCoins(best.shot.path, bonus ? 5 : 3);
    maybeSpike(best.shot.path, prev, a, diffG, idx);
}

function spawnAhead() {
    while (topAnchor.y < camY + viewH * 1.6) spawnNext();
    updateWalls();
}

let wallsInitialized = false;

function updateWalls() {
    if (!WALLS.enabled || wallsInitialized) return;

    // Фиксированные стены на границе диапазона точек
    wallLeft = -(ANCH_CLAMP + PF.rMax + WALLS.margin);
    wallRight = ANCH_CLAMP + PF.rMax + WALLS.margin;

    wallsInitialized = true;
}

// Упрощённая проверка достижимости по расстоянию
function isReachableByDistance(prevA, newA) {
    const dx = newA.x - prevA.x;
    const dy = newA.y - prevA.y;
    const dist = Math.hypot(dx, dy);
    return dist <= PHYSICS_PRECOMPUTED.maxJumpDist;
}