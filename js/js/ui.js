const el={};
['hud','meters','coinsHud','combo','hint','menu','over','pauseScr','bestLine','walletMenu','skins',
 'overMeters','overCoins','overCombo','recordBadge','btnPlay','btnAgain','btnSame','btnMenu1','btnMenu2',
 'btnRevive','btnResume','btnRestart','btnMute','btnPause'].forEach(id=>el[id]=document.getElementById(id));
const show=e=>e.classList.remove('hidden'), hide=e=>e.classList.add('hidden');

let hudM=-1,hudC=-1,hudCombo=-1;
function hudSync(){
  if(state!=='play') return;
  const m=Math.floor(maxAlt);
  if(m!==hudM){hudM=m;el.meters.textContent=m+' м';}
  if(coinsRun!==hudC){hudC=coinsRun;el.coinsHud.textContent='◈ '+coinsRun;}
  if(combo!==hudCombo){
    hudCombo=combo;
    if(combo>=2){el.combo.textContent='СЕРИЯ ×'+combo;el.combo.classList.add('show');
      el.combo.classList.remove('pop');void el.combo.offsetWidth;el.combo.classList.add('pop');}
    else el.combo.classList.remove('show');
  }
  // подсказки онбординга (GDD §3)
  let txt='',hot=false;
  if(!dying){
    if(hero.grabs===0&&!hero.attached){
      let near=false;
      for(const a of anchors) if(a!==hero.lastAnchor&&Math.hypot(a.x-hero.x,a.y-hero.y)<=PF.grabRadius){near=true;break;}
      txt=near?'ДЕРЖИ!!!':'ДЕРЖИ ЭКРАН — ЗАЦЕПИТЬСЯ КРЮКОМ'; hot=near;
    } else if(hero.attached&&hero.grabs<=1&&hero.attachT>0.5){
      txt='ОТПУСТИ — ПОЛЁТ ПО КАСАТЕЛЬНОЙ';
    } else if(hero.grabs===2&&!hero.attached){
      txt='ЖМИ, КОГДА ТОЧКА ВСПЫХНЕТ';
    }
  }
  if(txt){el.hint.textContent=txt;el.hint.classList.add('show');el.hint.classList.toggle('hot',hot);}
  else el.hint.classList.remove('show');
}

/* ---------- скины ---------- */
function buildSkins(){
  el.skins.innerHTML='';
  SKINS.forEach(s=>{
    const d=document.createElement('div');
    d.className='skin'+(s.id===skinId?' sel':'');
    const own=owned.includes(s.id);
    d.innerHTML='<div class="sw" style="background:'+s.color+';box-shadow:0 0 14px '+s.color+'"></div>'+
      '<div class="p">'+(own?(s.id===skinId?'✓':''):('◈ '+s.price))+'</div>';
    d.addEventListener('click',()=>{
      if(owned.includes(s.id)){ skinId=s.id; store.set('skin',skinId); Snd.ui(); }
      else if(wallet>=s.price){
        wallet-=s.price; store.set('wallet',wallet);
        owned.push(s.id); store.set('owned',owned);
        skinId=s.id; store.set('skin',skinId); Snd.coin();
      } else { Snd.deny(); d.classList.remove('deny'); void d.offsetWidth; d.classList.add('deny'); return; }
      el.walletMenu.textContent=wallet; buildSkins();
    });
    el.skins.appendChild(d);
  });
}

/* ---------- потоки состояний ---------- */
function startRun(newSeed){
  lastSeed=newSeed;
  resetWorld(newSeed,false);
  state='play';
  hide(el.menu);hide(el.over);hide(el.pauseScr);show(el.hud);
  hudM=-1;hudC=-1;hudCombo=-1;
}
function toMenu(){
  resetWorld((Math.random()*2**31)|0,true);
  state='menu';
  hide(el.over);hide(el.pauseScr);hide(el.hud);show(el.menu);
  el.bestLine.textContent='Рекорд: '+bestMeters+' м';
  el.walletMenu.textContent=wallet;
  buildSkins();
}
function pauseGame(){ if(state!=='play')return; state='pause'; show(el.pauseScr); }
function resumeGame(){ if(state!=='pause')return; state='play'; hide(el.pauseScr); last=performance.now(); }

/* ---------- кнопки ---------- */
el.btnPlay.addEventListener('click',()=>{Snd.ensure();Snd.ui();startRun((Math.random()*2**31)|0);});
el.btnAgain.addEventListener('click',()=>{Snd.ui();startRun((Math.random()*2**31)|0);});
el.btnSame.addEventListener('click',()=>{Snd.ui();startRun(lastSeed);});   // реванш: тот же сид
el.btnMenu1.addEventListener('click',()=>{Snd.ui();toMenu();});
el.btnMenu2.addEventListener('click',()=>{Snd.ui();toMenu();});
el.btnRestart.addEventListener('click',()=>{Snd.ui();hide(el.pauseScr);startRun((Math.random()*2**31)|0);});
el.btnResume.addEventListener('click',()=>{Snd.ui();resumeGame();});
el.btnPause.addEventListener('click',()=>{Snd.ui();pauseGame();});
el.btnRevive.addEventListener('click',()=>{doRevive();});
el.btnMute.addEventListener('click',()=>{
  muted=!muted; store.set('mute',muted);
  el.btnMute.textContent=muted?'🔇':'🔊';
  if(!muted){Snd.ensure();Snd.ui();}
});
el.btnMute.textContent=muted?'🔇':'🔊';