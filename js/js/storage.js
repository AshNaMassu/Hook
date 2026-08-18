const store={
  get(k,d){try{const v=localStorage.getItem('nh_'+k);return v===null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem('nh_'+k,JSON.stringify(v));}catch(e){}}
};
let bestMeters=store.get('best',0);
let wallet=store.get('wallet',0);
let owned=store.get('owned',['cyan']);
let skinId=store.get('skin','cyan');
let muted = store.get('mute', false);
let musicVol = store.get('musicVol', 0.8);  // 0-1
let sfxVol = store.get('sfxVol', 1.0);

const SKINS=[
  {id:'cyan', name:'Импульс',  color:'#26e0ff', price:0},
  {id:'mag',  name:'Неон-Роза',color:'#ff3fd4', price:50},
  {id:'lime', name:'Кислота',  color:'#9dff3d', price:120},
  {id:'gold', name:'Плазма',   color:'#ffc23d', price:250},
];
const skinColor=()=> (SKINS.find(s=>s.id===skinId)||SKINS[0]).color;