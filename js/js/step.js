let currentLookahead = -1.5;

function stepWorld(dt) {
    if (state === 'pause') return;
    if (state === 'play' && runT === 0) lavaY = LAVA.startY;
    
    uiT += dt;
    if (bot) botThink();
    runT += dt;
    
    // Основные системы
    updateHero(dt);
    updateCamera(dt);
    updateLava(dt);
    updateCooldowns(dt);
    
    // Геймплей
    if (!dying) {
        collectCoins(dt);
        checkSpikes();
        checkLavaDeath();
    }
    
    // Таймер смерти
    if (dying) {
        deathT -= dt;
        if (deathT <= 0) finishDeath();
    }
    
    // Генерация и чистка
    spawnAhead();
    cleanupEntities();
    
    // Эффекты
    updateParticles(dt);
    updateFloats(dt);
    updateTimers(dt);
    updateBGParticles();
    
    // Музыка
    updateMusicIntensity();
}

// ---------- Подфункции ----------

function updateHero(dt) {
    if (!dying) {
        if (hero.attached) {
            hero.omega = Math.min(PF.wMax, hero.omega + PF.spinAccel * dt);
            hero.theta += hero.spinDir * hero.omega * dt;
            const a = hero.anchor;
            hero.x = a.x + Math.cos(hero.theta) * hero.r;
            hero.y = a.y + Math.sin(hero.theta) * hero.r;
            hero.attachT += dt;
            
            if (hero.comboTimer > 0) {
                hero.comboTimer -= dt;
                if (hero.comboTimer <= 0) {
                    combo = 0;
                    addFloat(hero.x, hero.y + 0.5, t('slow') + '...', '#ff2e5f', 16);
                }
            }
        } else {
            hero.vy -= PF.g * dt;
            hero.x += hero.vx * dt;
            hero.y += hero.vy * dt;
        }
    } else {
        hero.vy -= PF.g * dt;
        hero.x += hero.vx * dt;
        hero.y += hero.vy * dt;
    }
    
    if (shieldT > 0) shieldT -= dt;
    
    if (state === 'play' && !dying) {
        maxAlt = Math.max(maxAlt, hero.y);
    }
}

function updateCamera(dt) {
    if (!dying) {
        const camXTgt = clamp(hero.x * 0.3, -ANCH_CLAMP * 0.3, ANCH_CLAMP * 0.3);
        camX += (camXTgt - camX) * Math.min(1, 2 * dt);
    }
    
    if (camFreeze > 0) {
        camFreeze -= dt;
    } else {
        let targetLookahead = -1.5;
        
        if (!hero.attached && !dying) {
            if (hero.vy > 2) {
                targetLookahead = -1.5 - Math.min(2.0, hero.vy * 0.25);
            } else if (hero.vy < -2) {
                targetLookahead = -0.5 + Math.min(2.0, Math.abs(hero.vy) * 0.2);
            }
        } else if (hero.attached) {
            targetLookahead = -1.5;
        }
        
        currentLookahead += (targetLookahead - currentLookahead) * Math.min(1, 5 * dt);
        
        const focusY = hero.attached && hero.anchor ? hero.anchor.y : hero.y;
        const tgt = focusY + currentLookahead;
        
        if (!dying) {
            const maxCamSpeed = 12 * dt;
            let delta = tgt - camY;
            if (Math.abs(delta) > maxCamSpeed) {
                delta = Math.sign(delta) * maxCamSpeed;
            }
            camY += delta;
        }
    }
}

function updateLava(dt) {
    const diff = Math.min(1, runT / 180);
    let lavaSpeed = LAVA.baseSpeed + LAVA.speedRamp * diff;
    const distToLava = hero.y - lavaY;
    
    if (distToLava > 18) {
        lavaSpeed *= 1.5;
    } else if (distToLava < 4) {
        lavaSpeed *= 0.75;
    }
    
    lavaY += lavaSpeed * dt;
}

function updateCooldowns(dt) {
    for (const a of anchors) {
        if (a.cooldownT > 0) a.cooldownT -= dt;
    }
}

function collectCoins(dt) {
    for (const c of coins) {
        if (c.taken) continue;
        if (Math.hypot(c.x - hero.x, c.y - hero.y) < 0.6) {
            c.taken = true;
            const baseVal = 1;
            const val = Math.round(baseVal * getComboMult());
            
            if (state === 'play') {
                coinsRun += val;
                Snd.coin();
                let txt = '+' + val + '◈';
                if (combo >= 3) txt += ' ×' + getComboMult();
                addFloat(c.x, c.y, txt, '#ffc23d', 16);
            }
            burst(c.x, c.y, 7, '#ffc23d', 2.6);
        }
    }
}

function checkSpikes() {
    if (dying || shieldT <= 0) return;
    for (const s of spikes) {
        if (Math.hypot(s.x - hero.x, s.y - hero.y) < 0.5) {
            die();
            break;
        }
    }
}

function checkLavaDeath() {
    if (dying) return;
    if (hero.y < lavaY - LAVA.killMargin) die();
}

function cleanupEntities() {
    const cutA = camY - viewH / 2 - 25;
    const cutO = camY - viewH / 2 - 15;
    
    for (let i = anchors.length - 1; i >= 0; i--) {
        const a = anchors[i];
        if (a.y < cutA && a !== hero.anchor && a !== hero.lastAnchor) anchors.splice(i, 1);
    }
    for (let i = coins.length - 1; i >= 0; i--) {
        if (coins[i].taken || coins[i].y < cutO) {
            coins.splice(i, 1);
        }
    }
    for (let i = spikes.length - 1; i >= 0; i--) {
        if (spikes[i].y < cutO) spikes.splice(i, 1);
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        p.vy -= 6 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
    }
}

function updateFloats(dt) {
    for (let i = floats.length - 1; i >= 0; i--) {
        const f = floats[i];
        f.life -= dt;
        f.y += 1.2 * dt;
        if (f.life <= 0) floats.splice(i, 1);
    }
}

function updateTimers(dt) {
    if (perfectFlash > 0) perfectFlash -= dt;
    if (shakeT > 0) shakeT -= dt;
}

function updateBGParticles() {
    for (const p of bgParticles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < camY - viewH / 2 - 5) {
            p.y = camY + viewH / 2 + 5;
            p.x = (Math.random() * 2 - 1) * 8;
        }
    }
}

function updateMusicIntensity() {
    if (state === 'play' && !dying) {
        const intensity = Math.min(1, runT / 90 + maxAlt / 120);
        Snd.setMusicIntensity(intensity);
    }
}