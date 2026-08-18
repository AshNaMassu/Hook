function drawBG(){
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#0a0820'); g.addColorStop(0.5,'#070716'); g.addColorStop(1,'#04040d');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  // звёзды
  ctx.fillStyle='rgba(160,200,255,0.5)';
  for(const st of stars){
    const wy=(((st.y-camY*st.z)%24)+24)%24;
    const px=SX(st.x), py=H-wy*scale;
    if(py<-4||py>H+4) continue;
    ctx.globalAlpha=0.15+st.z*0.4;
    ctx.fillRect(px,py,st.s*dpr,st.s*dpr);
  }
  ctx.globalAlpha=1;
  // сетка
  ctx.strokeStyle='rgba(70,100,220,0.07)'; ctx.lineWidth=1;
  ctx.beginPath();
  const step=2;
  let y0=Math.floor((camY-viewH/2)/step)*step;
  for(let y=y0;y<camY+viewH/2+step;y+=step){ const py=SY(y); ctx.moveTo(0,py); ctx.lineTo(W,py); }
  for(let x=-6;x<=6;x+=step){ const px=SX(x); ctx.moveTo(px,0); ctx.lineTo(px,H); }
  ctx.stroke();
}
function drawCoin(c){
  const px=SX(c.x), py=SY(c.y);
  if(py<-40||py>H+40) return;
  const w=Math.cos(uiT*4+c.phase);
  const R=0.3*scale;
  ctx.save(); ctx.translate(px,py);
  ctx.globalCompositeOperation='lighter';
  const g=ctx.createRadialGradient(0,0,0,0,0,R*2.2);
  g.addColorStop(0,'rgba(255,194,61,0.5)'); g.addColorStop(1,'rgba(255,194,61,0)');
  ctx.fillStyle=g; ctx.fillRect(-R*2.2,-R*2.2,R*4.4,R*4.4);
  ctx.globalCompositeOperation='source-over';
  ctx.scale(Math.max(0.15,Math.abs(w)),1);
  ctx.fillStyle='#ffc23d';
  ctx.beginPath(); ctx.moveTo(0,-R); ctx.lineTo(R*0.7,0); ctx.lineTo(0,R); ctx.lineTo(-R*0.7,0); ctx.closePath(); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.moveTo(0,-R*0.45); ctx.lineTo(R*0.3,0); ctx.lineTo(0,R*0.45); ctx.lineTo(-R*0.3,0); ctx.closePath(); ctx.fill();
  ctx.restore();
}
function drawSpike(s){
  const px=SX(s.x), py=SY(s.y);
  if(py<-50||py>H+50) return;
  const R=0.45*scale, rot=s.rot+uiT*1.2;
  ctx.save(); ctx.translate(px,py); ctx.rotate(rot);
  ctx.globalCompositeOperation='lighter';
  const g=ctx.createRadialGradient(0,0,0,0,0,R*2.4);
  g.addColorStop(0,'rgba(255,46,95,0.5)'); g.addColorStop(1,'rgba(255,46,95,0)');
  ctx.fillStyle=g; ctx.fillRect(-R*2.4,-R*2.4,R*4.8,R*4.8);
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle='#ff2e5f';
  ctx.beginPath();
  for(let i=0;i<8;i++){
    const a1=i/8*TAU, a2=(i+0.5)/8*TAU;
    const r1=R, r2=R*0.42;
    if(i===0) ctx.moveTo(Math.cos(a1)*r1,Math.sin(a1)*r1);
    else ctx.lineTo(Math.cos(a1)*r1,Math.sin(a1)*r1);
    ctx.lineTo(Math.cos(a2)*r2,Math.sin(a2)*r2);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle='#ffd0dc'; ctx.beginPath(); ctx.arc(0,0,R*0.2,0,TAU); ctx.fill();
  ctx.restore();
}
function anchorVisualState(a){
  // flash: в радиусе захвата = момент максимальной силы (яркость ∝ ранний зацеп)
  let flash=0;
  if(!hero.attached&&a!==hero.lastAnchor&&!dying){
    const d=Math.hypot(a.x-hero.x,a.y-hero.y);
    if(d<=PF.grabRadius) flash=clamp(d/PF.grabRadius,0.35,1);
  }
  return flash;
}
function reachableSet(){
  const set=new Set();
  if(!hero.attached||dying) return set;
  const v=releaseVel();
  for(const a of anchors){
    if(!hero.anchor) break;
    if(a.idx===hero.anchor.idx+1||a.idx===hero.anchor.idx+2){
      if(flightHits(hero.x,hero.y,v.vx,v.vy,a.x,a.y)) set.add(a.idx);
    }
  }
  return set;
}
function drawAnchors(reach){
  for(const a of anchors){
    const px=SX(a.x), py=SY(a.y);
    if(py<-60||py>H+60) continue;
    const isCur=hero.attached&&hero.anchor===a;
    const col=isCur?'#ff4fd8':'#29e5ff';
    const flash=anchorVisualState(a);
    ctx.save(); ctx.translate(px,py);
    ctx.globalCompositeOperation='lighter';
    const haloR=(flash>0?0.9:0.55)*scale;
    const g=ctx.createRadialGradient(0,0,0,0,0,haloR);
    const ga=flash>0?0.35+flash*0.5:(isCur?0.6:0.3);
    g.addColorStop(0,(flash>0?'rgba(255,255,255,'+ga+')':hexA(col,ga)));
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.fillRect(-haloR,-haloR,haloR*2,haloR*2);
    ctx.globalCompositeOperation='source-over';
    // кольцо
    ctx.strokeStyle=flash>0?'rgba(255,255,255,0.95)':hexA(col,0.85);
    ctx.lineWidth=Math.max(1.5,(flash>0?0.06:0.045)*scale);
    ctx.beginPath(); ctx.arc(0,0,0.3*scale,0,TAU); ctx.stroke();
    // ядро
    ctx.fillStyle=flash>0?'#ffffff':col;
    ctx.beginPath(); ctx.arc(0,0,0.14*scale,0,TAU); ctx.fill();
    if(flash>0){ // расходящееся кольцо вспышки
      ctx.strokeStyle='rgba(255,255,255,'+(0.5*flash)+')';
      ctx.lineWidth=1.5*dpr;
      ctx.beginPath(); ctx.arc(0,0,(0.35+(1-flash)*0.45)*scale,0,TAU); ctx.stroke();
    }
    if(reach.has(a.idx)){ // «релиз сейчас долетит»
      const p=0.5+0.5*Math.sin(uiT*7);
      ctx.strokeStyle='rgba(255,194,61,'+(0.45+0.5*p)+')';
      ctx.lineWidth=Math.max(2,0.06*scale);
      ctx.beginPath(); ctx.arc(0,0,(0.5+0.12*p)*scale,0,TAU); ctx.stroke();
    }
    if(hero.grabs<3&&!hero.attached&&!dying){ // онбординг: пульс следующей цели
      let tgt=null;
      for(const b of anchors){ if(b!==hero.lastAnchor&&b.y>hero.y-1&&(!tgt||b.y<tgt.y)) tgt=b; }
      if(tgt===a){
        const p=0.5+0.5*Math.sin(uiT*5);
        ctx.strokeStyle='rgba(38,224,255,'+(0.25+0.4*p)+')';
        ctx.lineWidth=2*dpr;
        ctx.beginPath(); ctx.arc(0,0,(0.55+0.35*p)*scale,0,TAU); ctx.stroke();
      }
    }
    ctx.restore();
  }
}
function hexA(hex,a){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return 'rgba('+r+','+g+','+b+','+a+')';
}
function drawRope(){
  if(!hero.attached||!hero.anchor) return;
  const pw=power(), col=skinColor();
  const x1=SX(hero.x),y1=SY(hero.y),x2=SX(hero.anchor.x),y2=SY(hero.anchor.y);
  const wWorld=0.05+pw*0.0045; // толщина ∝ мощности (GDD §4.7)
  ctx.save(); ctx.globalCompositeOperation='lighter';
  ctx.strokeStyle=hexA(col,0.35); ctx.lineWidth=wWorld*scale*2.4;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=wWorld*scale;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.restore();
}
function drawTrail(){
  if(trail.length<2) return;
  const col=skinColor();
  ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
  const boost=hero.attached?0.5+Math.min(1,power()/19.5):0.8;
  for(let i=1;i<trail.length;i++){
    const t0=trail[i-1],t1=trail[i];
    const f=i/trail.length;
    ctx.strokeStyle=hexA(col,f*0.5*boost);
    ctx.lineWidth=Math.max(1,f*0.14*scale*(hero.attached?(0.6+power()/25):1));
    ctx.beginPath(); ctx.moveTo(SX(t0.x),SY(t0.y)); ctx.lineTo(SX(t1.x),SY(t1.y)); ctx.stroke();
  }
  ctx.restore();
}
function drawHero(){
  if(dying) return;
  const px=SX(hero.x),py=SY(hero.y),col=skinColor();
  ctx.save(); ctx.translate(px,py);
  ctx.globalCompositeOperation='lighter';
  const R=0.55*scale;
  const g=ctx.createRadialGradient(0,0,0,0,0,R);
  g.addColorStop(0,hexA(col,0.7)); g.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=g; ctx.fillRect(-R,-R,R*2,R*2);
  ctx.globalCompositeOperation='source-over';
  ctx.fillStyle=col; ctx.beginPath(); ctx.arc(0,0,0.19*scale,0,TAU); ctx.fill();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,0,0.1*scale,0,TAU); ctx.fill();
  if(shieldT>0){
    ctx.strokeStyle='rgba(120,240,255,'+(0.4+0.3*Math.sin(uiT*8))+')';
    ctx.lineWidth=2*dpr; ctx.setLineDash([6*dpr,5*dpr]); ctx.lineDashOffset=-uiT*40;
    ctx.beginPath(); ctx.arc(0,0,0.5*scale,0,TAU); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
}
function drawOnboarding(){
  if(state!=='play'&&state!=='menu') return;
  if(hero.grabs<3&&!hero.attached&&!dying){
    // круг радиуса захвата
    ctx.strokeStyle='rgba(38,224,255,0.22)'; ctx.lineWidth=1.5*dpr; ctx.setLineDash([5*dpr,6*dpr]);
    ctx.beginPath(); ctx.arc(SX(hero.x),SY(hero.y),PF.grabRadius*scale,0,TAU); ctx.stroke();
    ctx.setLineDash([]);
  }
  if(hero.attached&&hero.grabs<=2&&!dying){
    // полная траектория релиза — только онбординг
    const v=releaseVel();
    let px=hero.x,py=hero.y,vx=v.vx,vy=v.vy;
    ctx.fillStyle='rgba(255,255,255,0.5)';
    for(let i=0;i<46;i++){
      vy-=PF.g*0.045; px+=vx*0.045; py+=vy*0.045;
      if(i%2===0){ ctx.globalAlpha=0.55*(1-i/46); ctx.fillRect(SX(px)-dpr,SY(py)-dpr,2.4*dpr,2.4*dpr); }
    }
    ctx.globalAlpha=1;
  }
}
function drawParticles(){
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(const p of particles){
    const f=p.life/p.max;
    ctx.fillStyle=hexA(p.color[0]==='#'?p.color:'#ffffff',f*0.9);
    const r=p.sz*scale*f+0.5;
    ctx.fillRect(SX(p.x)-r,SY(p.y)-r,r*2,r*2);
  }
  ctx.restore();
}
function drawFloats(){
  ctx.textAlign='center';
  for(const f of floats){
    ctx.globalAlpha=clamp(f.life/0.5,0,1);
    ctx.font=f.size*dpr+'px "Russo One", sans-serif';
    ctx.fillStyle=f.color;
    ctx.shadowColor=f.color; ctx.shadowBlur=10*dpr;
    ctx.fillText(f.txt,SX(f.x),SY(f.y));
    ctx.shadowBlur=0;
  }
  ctx.globalAlpha=1;
}
function drawDanger(){
  if(state!=='play'||dying) return;
  const d=hero.y-(camY-viewH/2);
  if(d<3.2){
    const a=(1-d/3.2)*(0.35+0.15*Math.sin(uiT*10));
    const g=ctx.createLinearGradient(0,H,0,H*0.55);
    g.addColorStop(0,'rgba(255,46,95,'+a+')'); g.addColorStop(1,'rgba(255,46,95,0)');
    ctx.fillStyle=g; ctx.fillRect(0,H*0.55,W,H*0.45);
  }
}
function drawVignette(){
  const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.75);
  g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,10,0.55)');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  if(perfectFlash>0){
    ctx.fillStyle='rgba(255,194,61,'+(perfectFlash*0.5)+')';
    ctx.fillRect(0,0,W,H);
  }
}
function render(){
  ctx.setTransform(1,0,0,1,0,0);
  drawBG();
  ctx.save();
  if(shakeT>0){
    const a=shakeT*10*dpr;
    ctx.translate((Math.random()*2-1)*a,(Math.random()*2-1)*a);
  }
  for(const c of coins) drawCoin(c);
  for(const s of spikes) drawSpike(s);
  drawAnchors(reachableSet());
  drawOnboarding();
  drawRope();
  drawTrail();
  drawHero();
  drawParticles();
  drawFloats();
  ctx.restore();
  drawDanger();
  drawVignette();
  // трейл пополняем здесь (кадровая частота)
  if(!dying){ trail.push({x:hero.x,y:hero.y}); if(trail.length>28) trail.shift(); }
}