function releaseVel(){
  const rP=PF.normalizePower?PF.rNorm:hero.r;
  const sp=hero.spinDir*hero.omega*rP;
  return {vx:-Math.sin(hero.theta)*sp, vy:Math.cos(hero.theta)*sp+PF.upAssist, sp:Math.abs(sp)};
}
function power(){ return hero.attached?hero.omega*hero.r:0; }

function tryGrab(){
  let best=null, bd=PF.grabRadius;
  for(const a of anchors){
    if(a===hero.lastAnchor) continue;
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
  revivePoint={x:best.x,y:best.y};
  burst(hero.x,hero.y,10,skinColor(),3);
  if(state==='play') Snd.grab();
}
function doRelease(){
  if(!hero.attached) return;
  hero.attached=false; hero.lastAnchor=hero.anchor;
  const v=releaseVel();
  hero.vx=v.vx; hero.vy=v.vy;
  // perfect: релиз сейчас долетает до следующей(-их) точки
  let hit=false;
  if(hero.lastAnchor) for(const a of anchors){
    if(a.idx===hero.lastAnchor.idx+1||a.idx===hero.lastAnchor.idx+2){
      if(flightHits(hero.x,hero.y,v.vx,v.vy,a.x,a.y)){hit=true;break;}
    }
  }
  if(hit){
    combo++; maxCombo=Math.max(maxCombo,combo); perfectFlash=0.35;
    addFloat(hero.x,hero.y+0.6, combo>1?('ПЕРФЕКТ ×'+combo):'ПЕРФЕКТ!', '#ffc23d', combo>1?24:20);
    burst(hero.x,hero.y,14,'#ffc23d',4);
    if(state==='play') Snd.perfect();
  } else combo=0;
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