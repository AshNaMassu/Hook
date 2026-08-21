function getComboMult() {
    let mult = 1.0;
    for (const m of COMBO.multipliers) {
        if (combo >= m.min) mult = m.mult;
    }
    return mult;
}
let maxReachedIdx = 0; // максимальный индекс точки, до которой долетели
function releaseVel() {
  const rP=PF.normalizePower?PF.rNorm:hero.r;
  const sp=hero.spinDir*hero.omega*rP;
  return {vx:-Math.sin(hero.theta)*sp, vy:Math.cos(hero.theta)*sp+PF.upAssist, sp:Math.abs(sp)};
}
function power(){ return hero.attached?hero.omega*hero.r:0; }

function tryGrab() {
    let best = null, bd = PF.grabRadius;
    for (const a of anchors) {
        if (a.cooldownT > 0) continue; 
    const d=Math.hypot(a.x-hero.x,a.y-hero.y);
    if(d<=bd){bd=d;best=a;}
  }
  if(!best) return;
  hero.attached=true; hero.anchor=best; hero.attachT=0;
  const dx=hero.x-best.x, dy=hero.y-best.y;
  const dist=Math.hypot(dx,dy)||1e-3;
  hero.r=clamp(dist,PF.rMin,PF.rMax);
  hero.theta=Math.atan2(dy,dx);
  const w=(dx*hero.vy-dy*hero.vx)/(hero.r*hero.r);              // угловой момент
  hero.spinDir=Math.abs(w)>PF.mom?(w>0?1:-1):(best.spinDir||1); // момент → иначе замысел маршрута
  let wm=Math.abs(w); if(wm<PF.wMin) wm=PF.wMin;
  hero.omega=clamp(wm,PF.wMin,PF.wMax);
  hero.x=best.x+Math.cos(hero.theta)*hero.r;
  hero.y=best.y+Math.sin(hero.theta)*hero.r;
    hero.grabs++;
    hero.grabTime = uiT;           
    hero.comboTimer = COMBO.window;
    // Обновляем максимальный достигнутый индекс
    if (best.idx > maxReachedIdx) {
        maxReachedIdx = best.idx;
    }
  revivePoint={x:best.x,y:best.y};
  burst(hero.x,hero.y,10,skinColor(),3);
  if(state==='play') Snd.grab();
}
function doRelease(){
  if(!hero.attached) return;
    hero.attached = false; hero.lastAnchor = hero.anchor;

    // БЫСТРО! если отпустили в первые 0.2с
    const holdTime = uiT - hero.grabTime;
    if (holdTime <= COMBO.fastThreshold) {
        addFloat(hero.x, hero.y + 0.6, 'БЫСТРО!', '#26e0ff', 22);
        if (state === 'play') Snd.perfect(); // или отдельный звук
    }

    if (hero.lastAnchor) hero.lastAnchor.cooldownT = 0.2;
  const v=releaseVel();
  hero.vx=v.vx; hero.vy=v.vy;
  // perfect: релиз сейчас долетает до следующей(-их) точки
    // Определяем куда попали
    let hitIdx = -1;
    let skipCount = 0;
    if (hero.lastAnchor) {
        for (const a of anchors) {
            if (a.idx > hero.lastAnchor.idx && a.idx <= hero.lastAnchor.idx + 5) {
                if (flightHits(hero.x, hero.y, v.vx, v.vy, a.x, a.y)) {
                    hitIdx = a.idx;
                    skipCount = (a.idx - hero.lastAnchor.idx) - 1;
                    break;
                }
            }
        }
    }

    // ОТЛАДКА: вывод в консоль
    if (hero.lastAnchor) {
        console.log('--- RELEASE ---');
        console.log('Отпустил с точки:', hero.lastAnchor.idx);
        console.log('Долетел до точки:', hitIdx);
        console.log('Пропущено точек:', skipCount);
        console.log('Порог ДАЛЬНИЙ:', COMBO.longJump.skipPoints);
        console.log('Условие (skipCount >= threshold):', skipCount >= COMBO.longJump.skipPoints);
        console.log('---');
    }

    // Логика комбо: отпустили в окно → комбо растёт, иначе сброс
    if (hero.comboTimer > 0) {
        if (hitIdx > hero.lastAnchor.idx && hitIdx > maxReachedIdx) {
            combo++;
            maxCombo = Math.max(maxCombo, combo);

            // Реакции на крутые действия
            if (skipCount >= COMBO.longJump.skipPoints) {
                addFloat(hero.x, hero.y + 1.0, 'ДАЛЬНИЙ!', '#ff4fd8', 26);
                if (state === 'play') Snd.perfect();
                burst(hero.x, hero.y, 14, '#ff4fd8', 5);
            }

            perfectFlash = 0.35;
            addFloat(hero.x, hero.y + 0.4, 'ПЕРФЕКТ ×' + combo, '#ffc23d', combo > 1 ? 24 : 20);
            burst(hero.x, hero.y, 14, '#ffc23d', 4);
            if (state === 'play') Snd.perfect();
        } else {
            // Не попали ни в одну точку — сброс комбо
            combo = 0;
        }
    } else {
        // Отпустили после окна комбо — сброс
        combo = 0;
    }

  burst(hero.x,hero.y,6,skinColor(),2.5);
  if(state==='play') Snd.release();
}
function pressAction(){
  if(state!=='play'||dying) return;
  if(hero.attached) return;
  tryGrab();
}
function releaseAction(){
  if(state!=='play') return;
  if(hero.attached) doRelease();
}