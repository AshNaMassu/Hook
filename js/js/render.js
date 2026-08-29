// ============================================================================
// ОРКЕСТРАТОР КАЧЕСТВА РЕНДЕРА
// ============================================================================

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

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ОТРИСОВКИ
// ============================================================================

function applyShake(c) {
    if (shakeT > 0 && state === 'play') {
        const intensity = shakeT * 15 * dpr * shakeIntensity;
        c.translate((Math.random() * 2 - 1) * intensity, (Math.random() * 2 - 1) * intensity);
    }
}

function drawScene(c) {
    drawBG(c);
    drawBGParticles(c);
    
    c.save();
    applyShake(c);
    
    for (const co of coins) drawCoin(co, c);
    for (const s of spikes) drawSpike(s, c);
    drawAnchors(reachableSet(), c);
    drawOnboarding(c);
    drawRope(c);
    drawTrail(c);
    drawHero(c);
    drawParticles(c);
    drawFloats(c);
    c.restore();
    
    drawLava(c);
    drawWalls(c);
    drawVignette(c);
}

// ============================================================================
// УРОВНИ КАЧЕСТВА РЕНДЕРА
// ============================================================================

// Низкое качество: один канвас, без bloom (для бота)
function renderLowQuality() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawScene(ctx);
}

// Среднее качество: один канвас, простой bloom
function renderMediumQuality() {
    renderLowQuality();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.filter = 'blur(12px)';
    ctx.globalAlpha = 0.5;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.restore();
}

// Высокое качество: два канваса, полный bloom
function renderHighQuality() {
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
    drawWalls(bloomCtx);
    drawVignette(bloomCtx);

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
    drawWalls(ctx);
    drawVignette(ctx);

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

// ============================================================================
// ГЛАВНАЯ ФУНКЦИЯ РЕНДЕРА
// ============================================================================

function render() {
    const quality = (bot && state === 'menu') ? RenderQuality.LOW : RenderQuality.current;
    
    if (quality === RenderQuality.LOW) {
        renderLowQuality();
    } else if (quality === RenderQuality.MEDIUM) {
        renderMediumQuality();
    } else {
        renderHighQuality();
    }
    
    if (!dying) { 
        trail.push({ x: hero.x, y: hero.y }); 
        if (trail.length > 28) trail.shift(); 
    }
}
