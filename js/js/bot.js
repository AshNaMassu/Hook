function botThink(){
  if(dying) return;
  if(!hero.attached){
    let target=null;
    for(const a of anchors){
      if(a===hero.lastAnchor||a.y<hero.y-0.5) continue;
      if(!target||a.y<target.y) target=a;
    }
    if(target&&Math.hypot(target.x-hero.x,target.y-hero.y)<=PF.grabRadius) tryGrab();
    else {
      let fb=null;
      for(const a of anchors){
        if(a===hero.lastAnchor||a.y<camY-viewH/2) continue;
        if(Math.hypot(a.x-hero.x,a.y-hero.y)<=PF.grabRadius&&(!fb||a.y>fb.y)) fb=a;
      }
      if(fb) tryGrab();
    }
  } else {
    const v=releaseVel(); let hit=false;
    for(const a of anchors){
      if(a.idx===hero.anchor.idx+1||a.idx===hero.anchor.idx+2){
        if(flightHits(hero.x,hero.y,v.vx,v.vy,a.x,a.y)){hit=true;break;}
      }
    }
    if(hit||hero.attachT>3) doRelease();
  }
}