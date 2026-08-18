function burst(x,y,n,color,spd){
  for(let i=0;i<n&&particles.length<350;i++){
    const a=Math.random()*TAU, s=(0.3+Math.random())*spd;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0.5+Math.random()*0.4,max:0.9,color,sz:0.05+Math.random()*0.08});
  }
}
function addFloat(x,y,txt,color,size){
  if(floats.length>30) floats.shift();
  floats.push({x,y,txt,color,size:size||18,life:0.9});
}