import * as T from 'three';
let detailRoot,footballPlay;
export function advanceFootball(dt){footballPlay?.advance(dt);}
export function getFootballStats(){return footballPlay?.stats();}
export function getDetailMetrics(){return detailRoot?{...detailRoot.userData.metrics,bounds:detailRoot.userData.getBounds()}:null;}
const palette={ivory:'#eee6ce',teal:'#446e66',gold:'#be965b',clay:'#b98b67',sage:'#879b79',dark:'#394a46'};
// Small edge-of-exhibit props and the existing football match.
export function buildLandscapeDetails(scene,ground){
 const root=new T.Group();root.name='landscape-details';scene.add(root);const mats=new Map(),metrics=[];
 const mat=c=>{c=palette[c]||c;if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.88}));return mats.get(c)};
 function mesh(g,c,x,y,z,p){const m=new T.Mesh(g,mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;}
 const box=(w,h,d,c,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);
 function group(name,x,z,raise=0){const g=new T.Group();g.name=name;g.position.set(x,ground(x,z)+raise,z);root.add(g);metrics.push(g);return g;}
 function ball(p,x,z,r=.28){mesh(new T.SphereGeometry(r,16,12),'ivory',x,r,z,p);for(const[a,b]of[[0,0],[1.2,.4],[2.5,-.3],[4.1,.6]]){const patch=mesh(new T.CircleGeometry(r*.28,5),'dark',x+Math.sin(a)*Math.cos(b)*r,r+Math.sin(b)*r,z+Math.cos(a)*Math.cos(b)*r,p);patch.lookAt(new T.Vector3(x,r,z).add(patch.position.clone().sub(new T.Vector3(x,r,z)).multiplyScalar(2)));}}
 const sports=group('sports-ball-and-bag',-11.8,-6.8);ball(sports,0,0);ball(sports,.55,.35,.21);box(.95,.42,.52,'teal',-1,.24,.25,sports);const handle=mesh(new T.TorusGeometry(.18,.035,6,16,Math.PI),'gold',-1,.5,.25,sports);box(.12,.35,.54,'gold',-1.28,.25,.25,sports);
 const match=group('football-players',-7,-8.5,.28);
 match.userData.dynamicExhibit=true;
 function footballer(kit){
  const body=new T.Group();
  match.add(body);
  box(.28,.33,.18,kit,0,.58,0,body);
  box(.25,.12,.18,'dark',0,.36,0,body);
  mesh(new T.SphereGeometry(.105,12,8),'#c6a889',0,.86,0,body);
  mesh(new T.SphereGeometry(.108,12,6),'dark',0,.92,-.018,body).scale.set(1,.45,1);
  const legs=[],arms=[];
  for(const side of [-1,1]){
   const leg=new T.Group(),arm=new T.Group();
   leg.position.set(side*.09,.35,0);
   box(.085,.29,.085,'ivory',0,-.145,0,leg);
   box(.13,.07,.22,'dark',0,-.31,.045,leg);
   body.add(leg);
   legs.push(leg);
   arm.position.set(side*.18,.71,0);
   box(.074,.25,.078,kit,side*.02,-.125,0,arm);
   arm.rotation.z=side*.24;
   body.add(arm);
   arms.push(arm);
  }
  return {body,legs,arms};
 }
 const players=['teal','teal','clay','clay'].map(footballer);
 const matchBall=new T.Group();
 match.add(matchBall);
 const radius=.13;
 ball(matchBall,0,0,radius);
 matchBall.children.forEach(mesh=>{mesh.position.y-=radius;});
 match.traverse(object=>{if(object.isMesh)object.castShadow=false;});
 footballPlay=createFootballPlay(players,matchBall,radius);

 function books(p,x,z){for(let i=0;i<3;i++){const b=box(.68-i*.05,.11,.48,i%2?'teal':'clay',x,.12+i*.12,z,p);b.rotation.y=(i-1)*.12;box(.58-i*.05,.065,.43,'ivory',x,.13+i*.12,z+.02,p);}}
 const reading=group('reading-cushions-books',4.7,2.3,.16);books(reading,0,0);for(const[x,z,c]of[[-.85,.35,'sage'],[-.3,1,'gold']]){const cushion=mesh(new T.CylinderGeometry(.36,.38,.13,16),c,x,.1,z,reading);cushion.rotation.y=.2;}
 const cinema=group('cinema-bench-books',14.5,-1.6,.16);box(1.6,.13,.52,'gold',0,.48,0,cinema);for(const x of[-.55,.55])box(.14,.39,.4,'teal',x,.23,0,cinema);books(cinema,.95,.25);
 const tools=group('maker-toolbox',-3,11.35,.16);box(.7,.32,.44,'teal',0,.19,0,tools);box(.76,.07,.49,'gold',0,.39,0,tools);box(.25,.08,.12,'dark',0,.46,0,tools);for(let i=0;i<3;i++){const tool=box(.045,.04,.42,i%2?'gold':'ivory',.65+i*.12,.04,0,tools);tool.rotation.y=.25;}
 const cubes=group('maker-small-cubes',-9.5,10.4,.16);for(let q=0;q<2;q++){const size=q?.21:.28;for(let i=0;i<8;i++)box(size*.93,size*.93,size*.93,['ivory','sage','gold','clay'][(i+q)%4],q*.85+(i%2)*size,(Math.floor(i/4)+.5)*size,(Math.floor(i/2)%2)*size,cubes);}
 function sign(name,x,z,rotation,labels){const g=group(name,x,z);g.rotation.y=rotation;box(.075,1.12,.075,'teal',0,.56,0,g);labels.forEach((text,i)=>{const c=document.createElement('canvas');c.width=512;c.height=128;const a=c.getContext('2d');a.fillStyle='#e9dfc5';a.fillRect(0,0,512,128);a.fillStyle='#44675d';a.font='500 66px PingFang SC,sans-serif';a.textAlign='center';a.textBaseline='middle';a.fillText(text,256,68);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(1.3,.32),new T.MeshBasicMaterial({map:t,side:T.DoubleSide,toneMapped:false}));m.position.set(i?.12:-.12,1-i*.37,.05);g.add(m);});}
 sign('story-maker-wayfinding',-1.2,5.2,0,['故事区 →','← 创作区']);sign('sports-wayfinding',-8.8,-2.9,.05,['运动区 ↑']);
 // A few low flower-and-stone pockets frame paths, leaving the center untouched.
 const flowers=new T.InstancedMesh(new T.IcosahedronGeometry(.09,0),mat('ivory'),48),stones=new T.InstancedMesh(new T.DodecahedronGeometry(.22,0),mat('#b9b3a0'),12),d=new T.Object3D();flowers.castShadow=false;let k=0,j=0;
 for(const[x,z]of[[-15,6],[-8,12.6],[7,11.5],[15,7.8],[3,-8],[-16,-4]]){for(let i=0;i<8;i++){const a=i*2.4,r=.22+(i%3)*.15,xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r;d.position.set(xx,ground(xx,zz)+.18+(i%2)*.05,zz);d.rotation.set(0,a,0);d.scale.setScalar(.8+(i%3)*.2);d.updateMatrix();flowers.setMatrixAt(k,d.matrix);flowers.setColorAt(k++,new T.Color(i%3?'#e9dec0':'#c9a359'));}for(let i=0;i<2;i++){const xx=x+.6+i*.3,zz=z+.4;d.position.set(xx,ground(xx,zz)+.10,zz);d.scale.set(1,.6,.8);d.rotation.set(.1,i,0);d.updateMatrix();stones.setMatrixAt(j++,d.matrix);}}
 root.add(flowers,stones);
 root.userData.metrics={groups:metrics.length,flowerInstances:48,stoneInstances:12,maxPropHeight:1.2,footballPlayers:4,matchBalls:1};
 root.userData.getBounds=()=>metrics.map(g=>{const b=new T.Box3().setFromObject(g);return{name:g.name,min:b.min.toArray(),max:b.max.toArray()}});
 detailRoot=root;return root;
}

// Coordinates are local to the pitch. Each ball release coincides with a foot strike.
function createFootballPlay(players,ball,radius){
 const cycle=14;
 const path=[
  [0,-1.7,1.05],[.75,-1.7,1.05],[1.65,-1.18,.95],[2.5,-1.18,.95],
  [3.4,-.65,.84],[4.05,-.65,.84],[5.35,1.02,.57],[6.48,1.02,.57],
  [7.55,3.11,.06],[9.9,3.11,.06],[12,-1.7,1.05],[14,-1.7,1.05],
 ];
 const runPaths=[
  [[0,-2.02,1.11],[.75,-2.02,1.11],[2.5,-1.50,1.01],[4.05,-.97,.89],[6.1,-.12,1.48],[10,-1.38,1.55],[14,-2.02,1.11]],
  [[0,.12,-1.13],[1.7,.52,-.53],[4.4,.72,.64],[6.75,.72,.64],[8.8,1.7,1.04],[11,.65,1.25],[14,.12,-1.13]],
  [[0,-.56,-.72],[3.1,.18,-1.37],[6.5,1.8,-1.33],[9.3,2.26,-.66],[11.5,.62,-.73],[14,-.56,-.72]],
  [[0,2.65,-.52],[5.5,2.65,-.52],[7.45,2.66,.17],[8.7,2.81,.22],[10,3.10,-.28],[11.8,2.49,-.44],[14,2.65,-.52]],
 ];
 const strikes=[[.75,2.5,4.05],[6.48],[],[9.9]];
 const axis=new T.Vector3(),rollStep=new T.Quaternion();
 ball.position.set(path[0][1],radius,path[0][2]);
 const lerp=T.MathUtils.lerp;
 let time=0;
 function segment(keys,t){
  const end=keys.findIndex(([at])=>at>t);
  const i=end<0?keys.length-2:Math.max(0,end-1);
  const a=keys[i],b=keys[i+1];
  return {a,b,i,u:T.MathUtils.clamp((t-a[0])/(b[0]-a[0]),0,1)};
 }
 function pose(){
  const {a,b,i,u}=segment(path,time);
  const roll=1-(1-u)**1.35;
  const x=lerp(a[1],b[1],roll),z=lerp(a[2],b[2],roll);
  const dx=x-ball.position.x,dz=z-ball.position.z,distance=Math.hypot(dx,dz);
  if(distance){
   axis.set(dz/distance,0,-dx/distance);
   ball.quaternion.premultiply(rollStep.setFromAxisAngle(axis,distance/radius));
  }
  ball.position.set(x,radius+(i===7?Math.sin(Math.PI*u)*.10:0),z);
  players.forEach(({body,legs,arms},n)=>{
   const {a,b,u}=segment(runPaths[n],time);
   let x=lerp(a[1],b[1],u),z=lerp(a[2],b[2],u);
   const speed=Math.hypot(b[1]-a[1],b[2]-a[2])/(b[0]-a[0]);
   const strike=strikes[n].find(at=>Math.abs(time-at)<.32);
   const trap=n===1&&Math.abs(time-5.35)<.28;
   let swing=Math.sin(time*13+n)*Math.min(speed*2, .68);
   let kick=0;
   let heading=Math.atan2(b[1]-a[1],b[2]-a[2]);
   if(strike!==undefined||trap){
    const at=trap?5.35:strike;
    const point=path.find(([t])=>t===at);
    const next=path[path.indexOf(point)+(trap?-1:1)];
    const aim=Math.atan2(next[1]-point[1],next[2]-point[2]);
    const blend=1-Math.min(1,Math.abs(time-at)/(trap?.28:.32));
    const reach=trap?.32:.36;
    const turn=aim-heading;
    heading+=Math.atan2(Math.sin(turn),Math.cos(turn))*blend;
    x=lerp(x,point[1]-Math.sin(aim)*reach,blend);
    z=lerp(z,point[2]-Math.cos(aim)*reach,blend);
    kick=blend*(trap?-.42:-.79);
    swing*=1-blend;
   }
   if(n===1&&time>=5.35+.28&&time<=6.48-.32)heading=Math.atan2(3.11-1.02,.06-.57);
   body.position.set(x,Math.abs(swing)*.035,z);
   body.rotation.y=heading;
   legs[0].rotation.x=swing;
   legs[1].rotation.x=-swing+kick;
   arms[0].rotation.x=-swing*.68;
   arms[1].rotation.x=swing*.68;
  });
 }
 pose();
 return {
  advance(dt){time=(time+Math.min(dt,.1))%cycle;pose();},
  stats(){return {time,ball:ball.position.toArray(),players:players.map(({body,legs})=>({position:body.position.toArray(),foot:legs[1].rotation.x}))};},
 };
}
