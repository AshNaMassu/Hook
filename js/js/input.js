let pointerId=null, holding=false;
cv.addEventListener('pointerdown',e=>{
  e.preventDefault(); Snd.ensure();
  if(pointerId!==null) return;
  pointerId=e.pointerId; holding=true;
  pressAction();
});
function pointerUp(e){
  if(e.pointerId!==pointerId) return;
  pointerId=null; holding=false;
  releaseAction();
}
cv.addEventListener('pointerup',pointerUp);
cv.addEventListener('pointercancel',pointerUp);
cv.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('keydown',e=>{
  if(e.repeat) return;
  if(e.code==='Space'||e.code==='ArrowUp'){
    e.preventDefault(); Snd.ensure();
    if(state==='play'){holding=true;pressAction();}
    else if(state==='menu') startRun((Math.random()*2**31)|0);
    else if(state==='over') startRun((Math.random()*2**31)|0);
  }
  if(e.code==='Escape'||e.code==='KeyP'){
    if(state==='play') pauseGame(); else if(state==='pause') resumeGame();
  }
});
window.addEventListener('keyup',e=>{
  if(e.code==='Space'||e.code==='ArrowUp'){holding=false;releaseAction();}
});
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&state==='play') pauseGame(); });