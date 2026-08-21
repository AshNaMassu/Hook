function stepWorld(dt){
    if (state === 'pause') return;
    if (state === 'play' && runT === 0) lavaY = LAVA.startY;
  uiT+=dt;
  if(bot) botThink();
  runT+=dt;
  // герой
  if(!dying){
    if(hero.attached){
      hero.omega=Math.min(PF.wMax,hero.omega+PF.spinAccel*dt);
      hero.theta+=hero.spinDir*hero.omega*dt;
      const a=hero.anchor;
      hero.x=a.x+Math.cos(hero.theta)*hero.r;
      hero.y=a.y+Math.sin(hero.theta)*hero.r;
        hero.attachT += dt;
        if (hero.comboTimer > 0) {
            hero.comboTimer -= dt;
            if (hero.comboTimer <= 0) {
                combo = 0;
                // Опционально: визуальная индикация потери комбо
                addFloat(hero.x, hero.y + 0.5, 'медленно...', '#ff2e5f', 16);
            }
        }
    } else {
      hero.vy-=PF.g*dt; hero.x+=hero.vx*dt; hero.y+=hero.vy*dt;
    }
  } else {
    hero.vy-=PF.g*dt; hero.x+=hero.vx*dt; hero.y+=hero.vy*dt;
  }
    if (shieldT > 0) shieldT -= dt;

    if (state === 'play' && !dying) {
        maxAlt = Math.max(maxAlt, hero.y);
    }

    if (!dying) {
        const camXTgt = clamp(hero.x * 0.3, -ANCH_CLAMP * 0.3, ANCH_CLAMP * 0.3);
        camX += (camXTgt - camX) * Math.min(1, 2 * dt);
    }

    // Камера = окно: плавно следует за героем, умеет опускаться
    if (camFreeze > 0) {
        camFreeze -= dt;
    } else {
        const tgt = hero.y + PF.lookahead;
        if (!dying) {
            if (tgt > camY) {
                camY += (tgt - camY) * Math.min(1, 6 * dt);
            } else if (tgt < camY - 2) {
                // Камера умеет опускаться, если герой упал
                camY += (tgt - camY) * Math.min(1, 4 * dt);
            }
        }
    }

    // Лава = палач: поднимается с rubber-band
    const diff = Math.min(1, runT / 180);
    let lavaSpeed = LAVA.baseSpeed + LAVA.speedRamp * diff;
    const distToLava = hero.y - lavaY;

    // Rubber-band: отстал >18 юнитов → ×1.5, подошла ближе ~4 → ×0.75
    if (distToLava > 18) {
        lavaSpeed *= 1.5;
    } else if (distToLava < 4) {
        lavaSpeed *= 0.75;
    }

    lavaY += lavaSpeed * dt;

    // Обновление кулдауна точек для повторного зацепа
    for (const a of anchors) {
        if (a.cooldownT > 0) a.cooldownT -= dt;
    }
  // монеты
    if (!dying) for (const c of coins) {
        if (c.taken) continue;
        if (Math.hypot(c.x - hero.x, c.y - hero.y) < 0.6) {
            c.taken = true;
            const baseVal = 1;
            const val = Math.round(baseVal * getComboMult());

            // Бонус за дальний прыжок (если собрали монету из длинной секции)
            const bonus = 0; // пока что 0, потом можно добавить

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
  // шипы
  if(!dying&&shieldT<=0) for(const s of spikes){
    if(Math.hypot(s.x-hero.x,s.y-hero.y)<0.5){ die(); break; }
  }
    // смерть: лава
    if (!dying && hero.y < lavaY - LAVA.killMargin) die();
  if(dying){ deathT-=dt; if(deathT<=0) finishDeath(); }
  // генерация и чистка
  spawnAhead();
  const cutA=camY-viewH/2-25, cutO=camY-viewH/2-15;
  for(let i=anchors.length-1;i>=0;i--){
    const a=anchors[i];
    if(a.y<cutA&&a!==hero.anchor&&a!==hero.lastAnchor) anchors.splice(i,1);
  }
    for (let i = coins.length - 1; i >= 0; i--) {
        if (coins[i].taken || coins[i].y < cutO) {
            coins.splice(i, 1);
        }
    }
  for(let i=spikes.length-1;i>=0;i--) if(spikes[i].y<cutO) spikes.splice(i,1);
  // частицы / тексты
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i]; p.life-=dt;
    if(p.life<=0){particles.splice(i,1);continue;}
    p.vy-=6*dt; p.x+=p.vx*dt; p.y+=p.vy*dt;
  }
  for(let i=floats.length-1;i>=0;i--){
    const f=floats[i]; f.life-=dt; f.y+=1.2*dt;
    if(f.life<=0) floats.splice(i,1);
  }
  if(perfectFlash>0) perfectFlash-=dt;
    if (shakeT > 0) shakeT -= dt;

    for (const p of bgParticles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < camY - viewH / 2 - 5) {
            p.y = camY + viewH / 2 + 5;
            p.x = (Math.random() * 2 - 1) * 8;
        }
    }

    if (state === 'play' && !dying) {
        // растёт с первых метров: время + высота
        const intensity = Math.min(1, runT / 90 + maxAlt / 120);
        Snd.setMusicIntensity(intensity);
    }
}