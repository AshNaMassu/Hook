function flightHits(px, py, vx, vy, tx, ty, steps, dt) {
    steps = steps || 30; dt = dt || 0.05;
    for (let i = 0; i < steps; i++) {
        vy -= PF.g * dt; px += vx * dt; py += vy * dt;
        const dx = px - tx, dy = py - ty;
        if (dx * dx + dy * dy < PF.grabRadius * PF.grabRadius) return true;
    }
    return false;
}
function reachQuality(ax, ay, sd, tx, ty) {
    let hits = 0, mid = 0, total = 0;
    for (const r of [2.1, 3.0]) for (const w of [4.5, 5.75, 6.5]) for (let k = 0; k < 16; k++) {
        const th = k / 16 * TAU; total++;
        const px = ax + Math.cos(th) * r, py = ay + Math.sin(th) * r, sp = w * r;
        if (flightHits(px, py, -Math.sin(th) * sd * sp, Math.cos(th) * sd * sp + PF.upAssist, tx, ty, 24, 0.06)) {
            hits++; if (w <= 5.75) mid++;
        }
    }
    return [hits / total, mid];
}


function pickSide() {
    if (streakLeft > 0) { streakLeft--; return prevSide; }
    const r = rng();
    let s;
    if (r < 0.2) { streakLeft = 1; s = prevSide; }
    else if (r < 0.3) { streakLeft = 2; s = prevSide; }
    else s = -prevSide;
    prevSide = s; return s;
}
function canonicalShot(a, side, diffG) {
    const th = (side > 0 ? 315 : 225) * RAD, sd = side > 0 ? 1 : -1;
    const r = (PF.rMin + PF.rMax) / 2, w = PF.wMin + (PF.wMax - PF.wMin) * 0.6;
    let px = a.x + Math.cos(th) * r, py = a.y + Math.sin(th) * r;
    let vx = -Math.sin(th) * sd * w * r, vy = Math.cos(th) * sd * w * r + PF.upAssist;
    const T = 0.7 + 0.3 * rng(), path = [{ x: px, y: py }];
    for (let t = 0; t < T; t += 0.05) { vy -= PF.g * 0.05; px += vx * 0.05; py += vy * 0.05; path.push({ x: px, y: py }); }
    px += (rng() * 2 - 1) * 0.5 * (1 - diffG); py += (rng() * 2 - 1) * 0.5 * (1 - diffG);
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
    if (idx < 8) return;
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
    prev.spinDir = side;                                   // вращение вокруг prev — к новой
    const idx = anchorIdx++;
    const diffG = Math.min(1, idx / 70);
    const calm = (idx % 11 === 10), bonus = (idx > 0 && idx % 10 >= 7);
    let best = null;
    for (let at = 0; at < 7; at++) {                             // ретрии по качеству (GDD §5.7)
        const shot = canonicalShot(prev, side, diffG);
        let px = shot.x, py = shot.y;
        if (Math.abs(px - prev.x) > MAXDX) px = prev.x + Math.sign(px - prev.x) * MAXDX;
        const sd = shot.sd, minDx = Math.max(1.5, PF.grabRadius * 0.6);
        if (Math.abs(px - prev.x) < minDx) px = prev.x + sd * minDx;
        let mdy = idx < 5 ? 2.2 : (idx < 9 ? 3.4 : 4.5);
        if (calm) mdy *= 0.6;
        if (py - prev.y < mdy) py = prev.y + mdy;
        px = clamp(px, -ANCH_CLAMP, ANCH_CLAMP);
        const [q, qm] = reachQuality(prev.x, prev.y, sd, px, py);
        if (!best || q > best.q) best = { x: px, y: py, q, shot };
        if (q >= 0.025 && qm >= 1) break;
    }
    const a = { x: best.x, y: best.y, idx, spinDir: 0 };
    anchors.push(a); topAnchor = a;
    placeCoins(best.shot.path, bonus ? 5 : 3);
    maybeSpike(best.shot.path, prev, a, diffG, idx);
}
function spawnAhead() {
    while (topAnchor.y < camY + viewH * 1.6) spawnNext();
}