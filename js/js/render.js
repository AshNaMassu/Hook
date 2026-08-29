// Оркестратор качества рендера
const RenderQuality = {
    LOW: 0,     // один канвас, без bloom (для бота и слабых девайсов)
    MEDIUM: 1,  // один канвас, простой bloom
    HIGH: 2,    // два канваса, полный bloom
    
    current: 2,  // по умолчанию высокое качество
    
    // Автоопределение для мобильных
    autoDetect() {
        const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
        this.current = isMobile ? this.MEDIUM : this.HIGH;
    },
    
    // Для бота в меню — всегда низкое качество
    forBot() {
        return this.LOW;
    }
};

// Инициализация
RenderQuality.autoDetect();

function drawBG(c) {
    c = c || ctx;
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0820'); g.addColorStop(0.5, '#070716'); g.addColorStop(1, '#04040d');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // звёзды с параллаксом
    c.fillStyle = 'rgba(160,200,255,0.5)';
    for (const st of stars) {
        const wy = (((st.y - camY * st.z) % 24) + 24) % 24;
        const px = SX(st.x - camX * 0.5 * st.z), py = H - wy * scale;  // параллакс по X
        if (py < -4 || py > H + 4) continue;
        c.globalAlpha = 0.15 + st.z * 0.4;
        c.fillRect(px, py, st.s * dpr, st.s * dpr);
    }
    c.globalAlpha = 1;
    // сетка
    c.strokeStyle = 'rgba(70,100,220,0.07)'; c.lineWidth = 1;
    c.beginPath();
    const step = 2;
    let y0 = Math.floor((camY - viewH / 2) / step) * step;
    for (let y = y0; y < camY + viewH / 2 + step; y += step) { const py = SY(y); c.moveTo(0, py); c.lineTo(W, py); }
    for (let x = -6; x <= 6; x += step) { const px = SX(x); c.moveTo(px, 0); c.lineTo(px, H); }
    c.stroke();
}
function drawCoin(c_item, c) {
    c = c || ctx;
    if (c_item.taken) return;
    const px = SX(c_item.x), py = SY(c_item.y);
    if (py < -40 || py > H + 40) return;
    const w = Math.cos(uiT * 4 + c_item.phase);
    const R = 0.3 * scale;
    c.save(); c.translate(px, py);
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R * 2.2);
    g.addColorStop(0, 'rgba(255,194,61,0.5)'); g.addColorStop(1, 'rgba(255,194,61,0)');
    c.fillStyle = g; c.fillRect(-R * 2.2, -R * 2.2, R * 4.4, R * 4.4);
    c.globalCompositeOperation = 'source-over';
    c.scale(Math.max(0.15, Math.abs(w)), 1);
    c.fillStyle = '#ffc23d';
    c.beginPath(); c.moveTo(0, -R); c.lineTo(R * 0.7, 0); c.lineTo(0, R); c.lineTo(-R * 0.7, 0); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath(); c.moveTo(0, -R * 0.45); c.lineTo(R * 0.3, 0); c.lineTo(0, R * 0.45); c.lineTo(-R * 0.3, 0); c.closePath(); c.fill();
    c.restore();
}
function drawSpike(s, c) {
    c = c || ctx;
    const px = SX(s.x), py = SY(s.y);
    if (py < -50 || py > H + 50) return;
    const R = 0.45 * scale, rot = s.rot + uiT * 1.2;
    c.save(); c.translate(px, py); c.rotate(rot);
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R * 2.4);
    g.addColorStop(0, 'rgba(255,46,95,0.5)'); g.addColorStop(1, 'rgba(255,46,95,0)');
    c.fillStyle = g; c.fillRect(-R * 2.4, -R * 2.4, R * 4.8, R * 4.8);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#ff2e5f';
    c.beginPath();
    for (let i = 0; i < 8; i++) {
        const a1 = i / 8 * TAU, a2 = (i + 0.5) / 8 * TAU;
        const r1 = R, r2 = R * 0.42;
        if (i === 0) c.moveTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
        else c.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
        c.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
    }
    c.closePath(); c.fill();
    c.fillStyle = '#ffd0dc'; c.beginPath(); c.arc(0, 0, R * 0.2, 0, TAU); c.fill();
    c.restore();
}
function anchorVisualState(a) {
    // тусклая во время кулдауна (перезарядка)
    if (a.cooldownT > 0) return 0.2;

    // flash: в радиусе захвата = момент максимальной силы (яркость ∝ ранний зацеп)
    let flash = 0;
    if (!hero.attached && a !== hero.lastAnchor && !dying) {
        const d = Math.hypot(a.x - hero.x, a.y - hero.y);
        if (d <= PF.grabRadius) flash = clamp(d / PF.grabRadius, 0.35, 1);
    }
    return flash;
}
function reachableSet() {
    const set = new Set();
    if (!hero.attached || dying) return set;
    const v = releaseVel();
    for (const a of anchors) {
        if (!hero.anchor) break;
        if (a.idx === hero.anchor.idx + 1 || a.idx === hero.anchor.idx + 2) {
            if (flightHits(hero.x, hero.y, v.vx, v.vy, a.x, a.y)) set.add(a.idx);
        }
    }
    return set;
}
function drawAnchors(reach, c) {
    c = c || ctx;
    for (const a of anchors) {
        const px = SX(a.x), py = SY(a.y);
        if (py < -60 || py > H + 60) continue;
        const isCur = hero.attached && hero.anchor === a;
        const col = isCur ? '#ff4fd8' : '#29e5ff';
        const flash = anchorVisualState(a);
        c.save(); c.translate(px, py);
        c.globalCompositeOperation = 'lighter';
        const haloR = (flash > 0 ? 0.9 : 0.55) * scale;
        const g = c.createRadialGradient(0, 0, 0, 0, 0, haloR);
        const ga = flash > 0 ? 0.35 + flash * 0.5 : (isCur ? 0.6 : 0.3);
        g.addColorStop(0, (flash > 0 ? 'rgba(255,255,255,' + ga + ')' : hexA(col, ga)));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.fillRect(-haloR, -haloR, haloR * 2, haloR * 2);
        c.globalCompositeOperation = 'source-over';
        c.strokeStyle = flash > 0 ? 'rgba(255,255,255,0.95)' : hexA(col, 0.85);
        c.lineWidth = Math.max(1.5, (flash > 0 ? 0.06 : 0.045) * scale);
        c.beginPath(); c.arc(0, 0, 0.3 * scale, 0, TAU); c.stroke();
        c.fillStyle = flash > 0 ? '#ffffff' : col;
        c.beginPath(); c.arc(0, 0, 0.14 * scale, 0, TAU); c.fill();
        if (flash > 0) {
            const pulseT = (uiT * 3) % 1;
            const ringR = (0.35 + pulseT * 0.6) * scale;
            const ringA = (1 - pulseT) * 0.7 * flash;
            c.strokeStyle = 'rgba(255,255,255,' + ringA + ')';
            c.lineWidth = 2.5 * dpr;
            c.beginPath(); c.arc(0, 0, ringR, 0, TAU); c.stroke();
            const pulseT2 = ((uiT * 3 + 0.5) % 1);
            const ringR2 = (0.35 + pulseT2 * 0.6) * scale;
            const ringA2 = (1 - pulseT2) * 0.5 * flash;
            c.strokeStyle = 'rgba(255,255,255,' + ringA2 + ')';
            c.lineWidth = 2 * dpr;
            c.beginPath(); c.arc(0, 0, ringR2, 0, TAU); c.stroke();
        }
        if (reach.has(a.idx)) {
            const p = 0.5 + 0.5 * Math.sin(uiT * 7);
            c.strokeStyle = 'rgba(255,194,61,' + (0.45 + 0.5 * p) + ')';
            c.lineWidth = Math.max(2, 0.06 * scale);
            c.beginPath(); c.arc(0, 0, (0.5 + 0.12 * p) * scale, 0, TAU); c.stroke();
        }
        if (hero.grabs < 3 && !hero.attached && !dying) {
            let tgt = null;
            for (const b of anchors) { if (b !== hero.lastAnchor && b.y > hero.y - 1 && (!tgt || b.y < tgt.y)) tgt = b; }
            if (tgt === a) {
                const p = 0.5 + 0.5 * Math.sin(uiT * 5);
                c.strokeStyle = 'rgba(38,224,255,' + (0.25 + 0.4 * p) + ')';
                c.lineWidth = 2 * dpr;
                c.beginPath(); c.arc(0, 0, (0.55 + 0.35 * p) * scale, 0, TAU); c.stroke();
            }
        }
        c.restore();
    }
}
function hexA(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}
function drawRope(c) {
    c = c || ctx;
    if (!hero.attached || !hero.anchor) return;
    const pw = power(), col = skinColor();
    const x1 = SX(hero.x), y1 = SY(hero.y), x2 = SX(hero.anchor.x), y2 = SY(hero.anchor.y);
    const wWorld = 0.05 + pw * 0.0045;
    c.save(); c.globalCompositeOperation = 'lighter';
    c.strokeStyle = hexA(col, 0.35); c.lineWidth = wWorld * scale * 2.4;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = wWorld * scale;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    c.restore();
}
function drawTrail(c) {
    c = c || ctx;
    if (trail.length < 2) return;
    const col = skinColor();
    c.save();
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    const boost = hero.attached ? 0.5 + Math.min(1, power() / 19.5) : 0.8;
    for (let i = 1; i < trail.length; i++) {
        const t0 = trail[i - 1], t1 = trail[i];
        const f = i / trail.length;
        c.strokeStyle = hexA(col, f * 0.3 * boost);
        c.lineWidth = Math.max(2, f * 0.22 * scale * (hero.attached ? (0.6 + power() / 25) : 1));
        c.beginPath(); c.moveTo(SX(t0.x), SY(t0.y)); c.lineTo(SX(t1.x), SY(t1.y)); c.stroke();
        c.strokeStyle = hexA(col, f * 0.8 * boost);
        c.lineWidth = Math.max(1, f * 0.12 * scale * (hero.attached ? (0.6 + power() / 25) : 1));
        c.beginPath(); c.moveTo(SX(t0.x), SY(t0.y)); c.lineTo(SX(t1.x), SY(t1.y)); c.stroke();
    }
    c.restore();
}
function drawHero(c) {
    c = c || ctx;
    if (dying) return;
    const px = SX(hero.x), py = SY(hero.y), col = skinColor();
    c.save(); c.translate(px, py);
    c.globalCompositeOperation = 'lighter';
    const R = 0.55 * scale;
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R);
    g.addColorStop(0, hexA(col, 0.7)); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(-R, -R, R * 2, R * 2);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = col; c.beginPath(); c.arc(0, 0, 0.19 * scale, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 0.1 * scale, 0, TAU); c.fill();
    if (shieldT > 0) {
        c.strokeStyle = 'rgba(120,240,255,' + (0.4 + 0.3 * Math.sin(uiT * 8)) + ')';
        c.lineWidth = 2 * dpr; c.setLineDash([6 * dpr, 5 * dpr]); c.lineDashOffset = -uiT * 40;
        c.beginPath(); c.arc(0, 0, 0.5 * scale, 0, TAU); c.stroke(); c.setLineDash([]);
    }
    c.restore();
}
function drawOnboarding(c) {
    c = c || ctx;
    if (state !== 'play' && state !== 'menu') return;
    if (hero.grabs < 3 && !hero.attached && !dying) {
        c.strokeStyle = 'rgba(38,224,255,0.22)'; c.lineWidth = 1.5 * dpr; c.setLineDash([5 * dpr, 6 * dpr]);
        c.beginPath(); c.arc(SX(hero.x), SY(hero.y), PF.grabRadius * scale, 0, TAU); c.stroke();
        c.setLineDash([]);
    }
    if (hero.attached && hero.grabs <= 2 && !dying) {
        const v = releaseVel();
        let px = hero.x, py = hero.y, vx = v.vx, vy = v.vy;
        c.fillStyle = 'rgba(255,255,255,0.5)';
        for (let i = 0; i < 46; i++) {
            vy -= PF.g * 0.045; px += vx * 0.045; py += vy * 0.045;
            if (i % 2 === 0) { c.globalAlpha = 0.55 * (1 - i / 46); c.fillRect(SX(px) - dpr, SY(py) - dpr, 2.4 * dpr, 2.4 * dpr); }
        }
        c.globalAlpha = 1;
    }
}
function drawParticles(c) {
    c = c || ctx;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const p of particles) {
        const f = p.life / p.max;
        c.fillStyle = hexA(p.color[0] === '#' ? p.color : '#ffffff', f * 0.9);
        const r = p.sz * scale * f + 0.5;
        c.fillRect(SX(p.x) - r, SY(p.y) - r, r * 2, r * 2);
    }
    c.restore();
}
function drawFloats(c) {
    c = c || ctx;
    c.textAlign = 'center';
    for (const f of floats) {
        c.globalAlpha = clamp(f.life / 0.5, 0, 1);
        c.font = f.size * dpr + 'px "Russo One", sans-serif';
        c.fillStyle = f.color;
        c.shadowColor = f.color; c.shadowBlur = 10 * dpr;
        c.fillText(f.txt, SX(f.x), SY(f.y));
        c.shadowBlur = 0;
    }
    c.globalAlpha = 1;
}
function drawDanger(c) {
    c = c || ctx;
    if (state !== 'play' || dying) return;
    const d = hero.y - (camY - viewH / 2);
    if (d < 3.2) {
        const a = (1 - d / 3.2) * (0.35 + 0.15 * Math.sin(uiT * 10));
        const g = c.createLinearGradient(0, H, 0, H * 0.55);
        g.addColorStop(0, 'rgba(255,46,95,' + a + ')'); g.addColorStop(1, 'rgba(255,46,95,0)');
        c.fillStyle = g; c.fillRect(0, H * 0.55, W, H * 0.45);
    }
}
function drawLava(c) {
    c = c || ctx;
    if (state !== 'play' || dying) return;
    const lavaScreenY = SY(lavaY);
    if (lavaScreenY < -50 || lavaScreenY > H + 50) return;

    const distToLava = hero.y - lavaY;
    const dangerLevel = Math.max(0, 1 - distToLava / 5);

    // свечение лавы
    c.save();
    c.globalCompositeOperation = 'lighter';
    const glowGrad = c.createLinearGradient(0, lavaScreenY, 0, lavaScreenY - 100);
    glowGrad.addColorStop(0, 'rgba(255,46,95,' + (0.6 + 0.3 * Math.sin(uiT * 8)) + ')');
    glowGrad.addColorStop(1, 'rgba(255,46,95,0)');
    c.fillStyle = glowGrad;
    c.fillRect(0, lavaScreenY - 100, W, 100);
    c.restore();

    // линия лавы
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = 'rgba(255,46,95,' + (0.8 + 0.2 * Math.sin(uiT * 10)) + ')';
    c.lineWidth = 4 * dpr;
    c.shadowColor = '#ff2e5f';
    c.shadowBlur = 20 * dpr;
    c.beginPath();
    c.moveTo(0, lavaScreenY);
    c.lineTo(W, lavaScreenY);
    c.stroke();
    c.shadowBlur = 0;
    c.restore();

    // рамка по периметру при близости
    if (dangerLevel > 0.3) {
        const a = dangerLevel * 0.5;
        c.strokeStyle = 'rgba(255,46,95,' + a + ')';
        c.lineWidth = 6 * dpr;
        c.strokeRect(0, 0, W, H);
    }
}
function drawVignette(c) {
    c = c || ctx;
    const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,10,0.55)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (perfectFlash > 0) {
        c.fillStyle = 'rgba(255,194,61,' + (perfectFlash * 0.5 * flashIntensity) + ')';  // ← добавь * flashIntensity
        c.fillRect(0, 0, W, H);
    }
}

function drawBGParticles(c) {
    c = c || ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (const p of bgParticles) {
        const px = SX(p.x), py = SY(p.y);
        if (py < -10 || py > H + 10) continue;
        c.fillStyle = 'rgba(120,180,255,' + p.alpha + ')';
        c.fillRect(px - p.size * dpr / 2, py - p.size * dpr / 2, p.size * dpr, p.size * dpr);
    }
    c.restore();
}

// Вспомогательная функция для тряски
function applyShake(c) {
    if (shakeT > 0 && state === 'play') {
        const intensity = shakeT * 15 * dpr * shakeIntensity;
        c.translate((Math.random() * 2 - 1) * intensity, (Math.random() * 2 - 1) * intensity);
    }
}

// Низкое качество: один канвас, без bloom (для бота и слабых девайсов)
function renderLowQuality() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    
    drawBG(ctx);
    drawBGParticles(ctx);
    
    ctx.save();
    applyShake(ctx);
    
    for (const c of coins) drawCoin(c, ctx);
    for (const s of spikes) drawSpike(s, ctx);
    drawAnchors(reachableSet(), ctx);
    drawOnboarding(ctx);
    drawRope(ctx);
    drawTrail(ctx);
    drawHero(ctx);
    drawParticles(ctx);
    drawFloats(ctx);
    ctx.restore();
    
    drawLava(ctx);
    drawVignette(ctx);
}

// Среднее качество: один канвас, простой bloom
function renderMediumQuality() {
    renderLowQuality();  // базовый рендер
    
    // Простой bloom: один проход размытия
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(12px)';
    ctx.globalAlpha = 0.5;
    ctx.drawImage(ctx.canvas, 0, 0);  // размытая копия самого канваса
    ctx.restore();
}

// Высокое качество: два канваса, полный bloom (как сейчас)
function renderHighQuality() {
    // 1. Рисуем сцену на offscreen canvas
    bloomCtx.setTransform(1, 0, 0, 1, 0, 0);
    bloomCtx.clearRect(0, 0, bloomCv.width, bloomCv.height);
    bloomCtx.scale(0.5, 0.5);

    drawBG(bloomCtx);
    bloomCtx.save();
    applyShake(bloomCtx);
    for (const c of coins) drawCoin(c, bloomCtx);
    for (const s of spikes) drawSpike(s, bloomCtx);
    drawAnchors(reachableSet(), bloomCtx);
    drawOnboarding(bloomCtx);
    drawRope(bloomCtx);
    drawTrail(bloomCtx);
    drawHero(bloomCtx);
    drawParticles(bloomCtx);
    drawFloats(bloomCtx);
    bloomCtx.restore();
    drawLava(bloomCtx);
    drawVignette(bloomCtx);

    // 2. Рисуем основную сцену на главном canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);

    drawBG(ctx);
    drawBGParticles(ctx);
    ctx.save();
    applyShake(ctx);
    for (const c of coins) drawCoin(c, ctx);
    for (const s of spikes) drawSpike(s, ctx);
    drawAnchors(reachableSet(), ctx);
    drawOnboarding(ctx);
    drawRope(ctx);
    drawTrail(ctx);
    drawHero(ctx);
    drawParticles(ctx);
    drawFloats(ctx);
    ctx.restore();
    drawLava(ctx);
    drawVignette(ctx);

    // 3. Накладываем bloom с размытием
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(8px)';
    ctx.globalAlpha = 0.6;
    ctx.drawImage(bloomCv, 0, 0, bloomCv.width, bloomCv.height, 0, 0, W, H);
    ctx.filter = 'blur(16px)';
    ctx.globalAlpha = 0.3;
    ctx.drawImage(bloomCv, 0, 0, bloomCv.width, bloomCv.height, 0, 0, W, H);
    ctx.restore();
}

function render() {
    // Определяем качество: для бота в меню — низкое
    const quality = (bot && state === 'menu') ? RenderQuality.LOW : RenderQuality.current;
    
    if (quality === RenderQuality.LOW) {
        renderLowQuality();
    } else if (quality === RenderQuality.MEDIUM) {
        renderMediumQuality();
    } else {
        renderHighQuality();
    }
    
    // Трейл пополняем всегда
    if (!dying) { 
        trail.push({ x: hero.x, y: hero.y }); 
        if (trail.length > 28) trail.shift(); 
    }
}