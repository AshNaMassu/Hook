let currentLookahead = -1.5;
let tutorialActive = false;

// ============================================================================
// ОРКЕСТРАТОР: главная функция обновления мира
// ============================================================================

function stepWorld(dt) {
    if (state === 'pause') return;
    
    // Инициализация
    if (state === 'play' && runT === 0) lavaY = LAVA.startY;
    
    uiT += dt;
    runT += dt;
    
    // Основные системы
    if (bot) botThink();
    updateHero(dt);
    updateAutoGrab();
    updateCamera(dt);
    updateViewport(dt);
    updateLava(dt);
    
    // Геймплей
    if (!dying) {
        collectCoins(dt);
        checkSpikes(dt);
        checkLavaDeath();
        checkWalls();
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
    updateBGParticles(dt);
    
    // Музыка
    updateMusicIntensity();
}

// ============================================================================
// ПОДФУНКЦИИ: обновление систем
// ============================================================================

function updateHero(dt) {
    if (!dying) {
        if (hero.attached) {
            hero.omega = Math.min(PF.wMax, hero.omega + PF.spinAccel * dt);
            hero.theta += hero.spinDir * hero.omega * dt;

            // Плавная анимация длины верёвки
            if (hero.targetR !== undefined) {
                hero.r += (hero.targetR - hero.r) * Math.min(1, 8 * dt);
                if (Math.abs(hero.targetR - hero.r) < 0.01) {
                    hero.r = hero.targetR;
                    delete hero.targetR;
                }
            }

            const a = hero.anchor;
            hero.x = a.x + Math.cos(hero.theta) * hero.r;
            hero.y = a.y + Math.sin(hero.theta) * hero.r;
            hero.attachT += dt;

            // === Логирование разгона ===
            const currentSpeed = hero.omega * hero.r;

            // Начало измерения (первый кадр зацепа)
            if (!_accelStarted) {
                _accelStartTime = uiT;
                _accelStarted = true;
                _accelLogged = false;
            }

            // Логируем когда достигли максимальной скорости (15+)
            if (_accelStarted && !_accelLogged && currentSpeed >= 15) {
                const accelTime = uiT - _accelStartTime;
                console.log(`⏱️ Разгон до ${currentSpeed.toFixed(1)} занял ${accelTime.toFixed(2)} сек | r=${hero.r.toFixed(2)} | ω=${hero.omega.toFixed(2)}`);
                _accelLogged = true;
            }
            // === Конец логирования ===

            // Таймер комбо
            if (hero.comboTimer > 0) {
                hero.comboTimer -= dt;
                if (hero.comboTimer <= 0) {
                    combo = 0;
                    addFloat(hero.x, hero.y + 0.5, t('slow') + '...', FEEDBACK_COLORS.slow, 16);
                }
            }
        } else {
            // Сброс логирования при полёте
            _accelStarted = false;

            hero.vy -= PF.g * dt;
            hero.x += hero.vx * dt;
            hero.y += hero.vy * dt;

            // Обновляем прогресс дальнего прыжка (только высота)
            if (hero.lastReleasePos && maxFlightDist > 0) {
                const currentHeight = hero.y - hero.lastReleasePos.y;
                hero.flightProgress = Math.max(0, currentHeight / maxFlightDist);
            }
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

function updateAutoGrab() {
    // Автозацеп при удержании: раз в 3 кадра для производительности
    if (holding && !hero.attached && !dying && state === 'play') {
        if (!window._grabFrame) window._grabFrame = 0;
        window._grabFrame++;
        if (window._grabFrame % 3 === 0) {
            tryGrab();
        }
    }
}

function updateCamera(dt) {
    if (!dying) {
        const focusX = hero.attached && hero.anchor ? hero.anchor.x : hero.x;
        const camXTgt = clamp(focusX * 0.3, -CAMERA.anchorClamp * 0.3, CAMERA.anchorClamp * 0.3);
        camX += (camXTgt - camX) * Math.min(1, 2 * dt);

        // Ограничение камеры по стенам: край экрана не выходит за стену
        if (WALLS.enabled) {
            const halfView = viewW / 2;
            const minCamX = wallLeft + halfView;
            const maxCamX = wallRight - halfView;

            // Если стены уже чем вью — центрируем камеру
            if (minCamX > maxCamX) {
                camX = (wallLeft + wallRight) / 2;
            } else {
                camX = clamp(camX, minCamX, maxCamX);
            }
        }
    }

    if (camFreeze > 0) {
        camFreeze -= dt;
    } else {
        // Адаптивный lookahead
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

        // По Y тоже на точку зацепа при закреплении
        const focusY = hero.attached && hero.anchor ? hero.anchor.y : hero.y;
        const tgt = focusY + currentLookahead;

        if (!dying) {
            const maxCamSpeed = 18 * dt;
            let delta = tgt - camY;
            if (Math.abs(delta) > maxCamSpeed) {
                delta = Math.sign(delta) * maxCamSpeed;
            }
            camY += delta;
        }
    }
}

function updateLava(dt) {
    // Лава не двигается в обучении
    if (tutorialActive) return;
    
    const diff = Math.min(1, runT / 180);
    const heightDiff = Math.min(1, maxAlt / 300);
    let lavaSpeed = LAVA.baseSpeed + LAVA.speedRamp * diff * (1 + heightDiff * 0.3);
    
    const distToLava = hero.y - lavaY;
    
    // Rubber-band: отстал >18 юнитов → ×1.5, подошла ближе ~4 → ×0.75
    if (distToLava > 18) {
        lavaSpeed *= 1.5;
    } else if (distToLava < 4) {
        lavaSpeed *= 0.75;
    }
    
    lavaY += lavaSpeed * dt;
}

// ============================================================================
// ПОДФУНКЦИИ: геймплей
// ============================================================================

function collectCoins(dt) {
    if (dying) return;
    
    for (const c of coins) {
        if (c.taken) continue;
        if (Math.hypot(c.x - hero.x, c.y - hero.y) < 0.6) {
            c.taken = true;
            const baseVal = 1;
            const val = Math.round(baseVal * getComboMult());
            
            // Бонус за дальний прыжок (если собрали монету из длинной секции)
            const bonus = 0;
            
            if (state === 'play') {
                coinsRun += val + bonus;
                Snd.coin();
                let txt = '+' + val + '◈';
                if (combo >= 3) txt += ' ×' + getComboMult();
                addFloat(c.x, c.y, txt, '#ffc23d', 16);
            }
            burst(c.x, c.y, 7, '#ffc23d', 2.6);
        }
    }
}

function checkSpikes(dt) {
    if (tutorialActive || dying || shieldT > 0) return;
    
    for (const s of spikes) {
        if (Math.hypot(s.x - hero.x, s.y - hero.y) < 0.5) {
            die();
            break;
        }
    }
}

function checkLavaDeath() {
    if (tutorialActive || dying) return;
    if (hero.y < lavaY - LAVA.killMargin) die();
}

function checkWalls() {
    if (!WALLS.enabled || tutorialActive || dying) return;
    if (hero.x < wallLeft || hero.x > wallRight) {
        die();
    }
}

// ============================================================================
// ПОДФУНКЦИИ: генерация и чистка
// ============================================================================

function cleanupEntities() {
    const cutA = camY - viewH / 2 - 25;
    const cutO = camY - viewH / 2 - 15;
    
    for (let i = anchors.length - 1; i >= 0; i--) {
        const a = anchors[i];
        if (a.y < cutA && a !== hero.anchor && a !== hero.lastAnchor) anchors.splice(i, 1);
    }
    for (let i = coins.length - 1; i >= 0; i--) {
        if (coins[i].taken || coins[i].y < cutO) {
            coins[i] = coins[coins.length - 1];
            coins.pop();
        }
    }
    for (let i = spikes.length - 1; i >= 0; i--) {
        if (spikes[i].y < cutO) {
            spikes[i] = spikes[spikes.length - 1];
            spikes.pop();
        }
    }
}

// ============================================================================
// ПОДФУНКЦИИ: эффекты
// ============================================================================

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
            particles[i] = particles[particles.length - 1];
            particles.pop();
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
        if (f.life <= 0) {
            floats[i] = floats[floats.length - 1];
            floats.pop();
        }
    }
}

function updateTimers(dt) {
    if (perfectFlash > 0) perfectFlash -= dt;
    if (shakeT > 0) shakeT -= dt;

    // Затухание вспышки серии (если не в рендере)
    if (pendingStreakFlash && pendingStreakFlash.intensity > 0) {
        pendingStreakFlash.intensity -= dt * 0.8;
        if (pendingStreakFlash.intensity <= 0) pendingStreakFlash = null;
    }
}

function updateBGParticles(dt) {
    for (const p of bgParticles) {
        p.x += p.vx * dt * 60; // 60 = нормализация к 60 FPS
        p.y += p.vy * dt * 60;
        if (p.y < camY - viewH / 2 - 5) {
            p.y = camY + viewH / 2 + 5;
            p.x = (Math.random() * 2 - 1) * 8;
        }
    }
}

// ============================================================================
// ПОДФУНКЦИИ: музыка
// ============================================================================

function updateMusicIntensity() {
    if (state === 'play' && !dying) {
        const intensity = Math.min(1, runT / 90 + maxAlt / 120);
        Snd.setMusicIntensity(intensity);
    }
}
