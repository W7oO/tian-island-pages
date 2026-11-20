import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
let detailRoot;
export function getDetailMetrics(){return detailRoot?{...detailRoot.userData.metrics,bounds:detailRoot.userData.getBounds()}:null;}
const palette={ivory:'#eee6ce',teal:'#446e66',gold:'#be965b',clay:'#b98b67',sage:'#879b79',dark:'#394a46'};
// Small edge-of-exhibit props; no new work entries, navigation or per-frame animation.
export function buildLandscapeDetails(scene,ground){
 const root=new T.Group();root.name='landscape-details';scene.add(root);const mats=new Map(),metrics=[];
 const mat=c=>{c=palette[c]||c;if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.88}));return mats.get(c)};
 function mesh(g,c,x,y,z,p){const m=new T.Mesh(g,mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;}
 const box=(w,h,d,c,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z,p);
 function group(name,x,z,raise=0){const g=new T.Group();g.name=name;g.position.set(x,ground(x,z)+raise,z);root.add(g);metrics.push(g);return g;}
 function ball(p,x,z,r=.28){mesh(new T.SphereGeometry(r,16,12),'ivory',x,r,z,p);for(const[a,b]of[[0,0],[1.2,.4],[2.5,-.3],[4.1,.6]]){const patch=mesh(new T.CircleGeometry(r*.28,5),'dark',x+Math.sin(a)*Math.cos(b)*r,r+Math.sin(b)*r,z+Math.cos(a)*Math.cos(b)*r,p);patch.lookAt(new T.Vector3(x,r,z).add(patch.position.clone().sub(new T.Vector3(x,r,z)).multiplyScalar(2)));}}
 const sports=group('sports-ball-and-bag',-11.8,-6.8);ball(sports,0,0);ball(sports,.55,.35,.21);box(.95,.42,.52,'teal',-1,.24,.25,sports);const handle=mesh(new T.TorusGeometry(.18,.035,6,16,Math.PI),'gold',-1,.5,.25,sports);box(.12,.35,.54,'gold',-1.28,.25,.25,sports);
 // Four posed players on the existing pitch: still geometry, no added animation loop.
 const match=group('football-players',-7,-8.5);match.position.y=ground(-7,-8.5)+.28;
 function footballer(x,z,kit,heading,kick=false){const g=new T.Group();match.add(g);g.position.set(x,0,z);g.rotation.y=heading;
  box(.28,.33,.18,kit,0,.58,0,g);box(.25,.12,.18,'dark',0,.36,0,g);mesh(new T.SphereGeometry(.105,12,8),'#c6a889',0,.86,0,g);mesh(new T.SphereGeometry(.108,12,6),'dark',0,.92,-.018,g).scale.set(1,.45,1);
  const limb=(a,b,r,c)=>{const aa=new T.Vector3(...a),bb=new T.Vector3(...b),dd=bb.clone().sub(aa),m=mesh(new T.CylinderGeometry(r,r,dd.length(),7),c,...aa.clone().add(bb).multiplyScalar(.5).toArray(),g);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dd.normalize());};
  limb([-.09,.35,0],[-.11,.06,.07],.045,'ivory');limb([.09,.35,0],[.12,kick?.20:.06,kick?.34:-.07],.045,'ivory');box(.13,.07,.22,'dark',-.11,.04,.11,g);box(.13,.07,.22,'dark',.12,kick?.18:.04,kick?.4:-.03,g);
  limb([-.17,.7,0],[-.25,.47,.1],.04,kit);limb([.17,.7,0],[.26,.5,-.1],.04,kit);
 }
 footballer(-1.45,.7,'teal',.5,true);footballer(.5,-.7,'clay',-1);footballer(1.8,1,'teal',-1.8);footballer(-.7,-1.2,'clay',.3);ball(match,-1.05,1.2,.13);
 // Batch the static match by material, keeping mobile draw calls bounded.
 match.updateMatrixWorld(true);const inverse=match.matrixWorld.clone().invert(),batches=new Map();match.traverse(o=>{if(o.isMesh){const g=o.geometry.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g);}});match.clear();for(const[m,gs]of batches){const merged=new T.Mesh(mergeGeometries(gs),m);merged.castShadow=true;merged.receiveShadow=true;match.add(merged);gs.forEach(g=>g.dispose());}

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
