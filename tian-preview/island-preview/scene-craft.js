import * as T from 'three';
import {layoutPlan,ringPoints} from './layout-plan.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const V=(x,y,z)=>new T.Vector3(x,y,z),cache=new Map();
function material(c,soft=false){const key=c+soft;if(!cache.has(key))cache.set(key,new T.MeshStandardMaterial({color:c,roughness:.94,flatShading:!soft}));return cache.get(key);}
function mesh(g,c,x,y,z,p,soft=false){const o=new T.Mesh(g,typeof c==='string'?material(c,soft):c);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
const box=(w,h,d,c,x,y,z,p,r=.035)=>mesh(r?new RoundedBoxGeometry(w,h,d,1,Math.min(r,w/4,h/4,d/4)):new T.BoxGeometry(w,h,d),c,x,y,z,p,true);
const sphere=(r,c,x,y,z,p,scale=[1,1,1])=>{const o=mesh(new T.SphereGeometry(r,20,14),c,x,y,z,p,true);o.scale.set(...scale);return o;};
const cylinder=(a,b,h,c,x,y,z,p,n=12)=>mesh(new T.CylinderGeometry(a,b,h,n),c,x,y,z,p);
const cone=(r,h,c,x,y,z,p,n=5)=>mesh(new T.ConeGeometry(r,h,n),c,x,y,z,p);
function rod(a,b,r,c,p){const d=b.clone().sub(a),o=cylinder(r,r,d.length(),c,0,0,0,p,10);o.position.copy(a.clone().add(b).multiplyScalar(.5));o.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return o;}
function curve(points,r,c,p){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(a=>V(...a))),20,r,6,false),c,0,0,0,p,true);}
function roof(w,h,d,c,x,y,z,p){const sh=new T.Shape();sh.moveTo(-w/2,0);sh.lineTo(0,h);sh.lineTo(w/2,0);sh.closePath();const o=mesh(new T.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false}),[material(c),material(c)],x,y,z-d/2,p);return o;}
function planeImage(tex,w,h,x,y,z,p){return mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:tex,toneMapped:false,side:T.DoubleSide}),x,y,z,p);}
function label(text,w,h,bg,fg,x,y,z,p){const c=document.createElement('canvas');c.width=1536;c.height=256;const a=c.getContext('2d');a.fillStyle=bg;a.fillRect(0,0,c.width,c.height);a.fillStyle=fg;a.textAlign='center';a.textBaseline='middle';a.font='500 130px "PingFang SC",sans-serif';a.fillText(text,768,140);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return planeImage(t,w,h,x,y,z,p);}
let shadowTexture;
function contact(p,x,z,w,d,opacity=.18){if(!shadowTexture){const c=document.createElement('canvas');c.width=c.height=128;const a=c.getContext('2d'),g=a.createRadialGradient(64,64,8,64,64,64);g.addColorStop(0,'rgba(70,54,49,.55)');g.addColorStop(.55,'rgba(70,54,49,.2)');g.addColorStop(1,'rgba(70,54,49,0)');a.fillStyle=g;a.fillRect(0,0,128,128);shadowTexture=new T.CanvasTexture(c);}const o=mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,opacity,depthWrite:false}),x,.025,z,p);o.rotation.x=-Math.PI/2;o.castShadow=false;}
export function groundHeight(x,z){
 const shoulder=(cx,cz,rx,rz,h)=>h*(1-T.MathUtils.smoothstep(Math.hypot((x-cx)/rx,(z-cz)/rz),.86,1.09));
 let y=.20+shoulder(10.5,0,7.2,8.1,1.25)+shoulder(-6.5,-8,6,5.8,.65)+shoulder(-4.5,10,10.8,4.5,.50);
 return y;
}
function road(scene,points,width){const curve=new T.CatmullRomCurve3(points.map(([x,z])=>V(x,groundHeight(x,z)+.018,z))),ps=curve.getPoints(160),v=[],idx=[];for(let i=0;i<ps.length;i++){const t=curve.getTangent(i/(ps.length-1)),n=V(-t.z,0,t.x).normalize();for(const side of[-1,1]){const q=ps[i].clone().addScaledVector(n,width*side);q.y=groundHeight(q.x,q.z)+.13;v.push(q.x,q.y,q.z);}if(i<ps.length-1){const k=i*2;idx.push(k,k+2,k+1,k+1,k+2,k+3);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();const surface=mesh(g,new T.MeshStandardMaterial({color:'#eee0c8',roughness:1,side:T.DoubleSide}),0,0,0,scene);surface.userData.isIslandRoad=true;(scene.userData.islandRoadCurves??=[]).push(curve);return curve;}
export function terrain(scene){
 const count=112,bounds=[];for(let i=0;i<count;i++){const a=i/count*Math.PI*2,r=21.6*(1+.035*Math.sin(a*3+.5)+.026*Math.cos(a*5)-.13*Math.exp(-(((Math.atan2(Math.sin(a-.55),Math.cos(a-.55)))/.35)**2)));bounds.push([Math.cos(a)*r,Math.sin(a)*r*.80]);}
 const positions=[],colors=[];function triangle(a,b,c,color){positions.push(...a,...b,...c);for(let k=0;k<3;k++)colors.push(color.r,color.g,color.b);}
 for(let ring=0;ring<64;ring++){const r0=ring/64,r1=(ring+1)/64;for(let i=0;i<count;i++){const j=(i+1)%count,point=(k,r)=>{const x=bounds[k][0]*r,z=bounds[k][1]*r;return[x,groundHeight(x,z),z];};const a=point(i,r0),b=point(i,r1),c=point(j,r1),d=point(j,r0),col=new T.Color('#9eae87').offsetHSL(0,0,Math.sin(i*.13+ring*.1)*.002);triangle(a,c,b,col);if(ring)triangle(a,d,c,col);}}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true,side:T.DoubleSide}),0,0,0,scene);
 const side=[],sideColors=[];for(let i=0;i<count;i++){const j=(i+1)%count,[x,z]=bounds[i],[u,v]=bounds[j];const a=[x,groundHeight(x,z),z],b=[u,groundHeight(u,v),v],c=[u*.965,-1.35,v*.965],d=[x*.965,-1.35,z*.965];const color=new T.Color(i%3?'#b8b3a2':'#a8a997');side.push(...a,...b,...c,...a,...c,...d);for(let k=0;k<6;k++)sideColors.push(color.r,color.g,color.b);}
 const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(side,3));sg.setAttribute('color',new T.Float32BufferAttribute(sideColors,3));sg.computeVertexNormals();mesh(sg,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true,side:T.DoubleSide}),0,0,0,scene);
 const path=road(scene,ringPoints,.65);
 road(scene,[[0,.8],[-1,1.5],[-3,2]],.65);
 for(const stop of layoutPlan){if(Math.hypot(stop.stop[0]-stop.portal[0],stop.stop[1]-stop.portal[1])>.15)road(scene,[stop.portal,[(stop.portal[0]+stop.stop[0])/2,(stop.portal[1]+stop.stop[1])/2],stop.stop],.45);}
 const waves=[];
 for(const[x,z,r]of[[-18,-8,.45],[-18,8,.5],[-9,-14,.45],[9,-14,.4],[18,-5,.45],[17,10,.4],[-14,11,.5],[12,12,.4]]){const stone=mesh(new T.DodecahedronGeometry(r,0),'#c1b6a4',x,groundHeight(x,z)+r*.35,z,scene);stone.scale.set(1,.65,.8);stone.rotation.y=x;}
 const blades=new T.InstancedMesh(new T.ConeGeometry(.06,.22,3),material('#8f9b72'),145),dummy=new T.Object3D();let k=0,seed=93;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const centers=layoutPlan.map(x=>x.center);while(k<145){const x=(rand()-.5)*28,z=(rand()-.5)*20;if(Math.hypot(x,z)<7||x*x/202+z*z/123>1||centers.some(([a,b])=>Math.hypot(x-a,z-b)<2.7))continue;const ps=path.getPoints(50);if(ps.some(p=>Math.hypot(x-p.x,z-p.z)<.7))continue;dummy.position.set(x,groundHeight(x,z)+.09,z);dummy.rotation.y=rand()*6;dummy.scale.setScalar(.6+rand()*.6);dummy.updateMatrix();blades.setMatrixAt(k++,dummy.matrix);}scene.add(blades);
 return{path,waves};
}

export function cottage(p){
 p.scale.set(1.04,1.22,1.04);
 contact(p,0,0,8,6,.3);box(4.85,2.95,3.35,'#e7decb',0,1.5,0,p,.07);box(5.12,.15,3.6,'#c7b4a4',0,.11,0,p,.035);roof(5.5,1.24,3.95,'#4d8480',0,3.05,0,p);box(5.58,.15,4.02,'#7ca79b',0,3.03,0,p,.02);box(5.28,.07,3.76,'#e5d8c6',0,2.91,0,p,.015);
 box(1.55,2.33,.23,'#b2c4b1',0,1.25,1.72,p);box(1.25,2.17,.1,'#3b6762',0,1.17,1.86,p,.02);for(const x of[-.31,.31]){box(.48,1.58,.035,'#aaa5af',x,1.39,1.93,p,.01);box(.045,.3,.08,'#d8c69a',x<0?-.095:.095,1.03,1.98,p,.01);}box(2.12,.15,.82,'#d0beab',0,.13,2.13,p);box(2.55,.11,.55,'#ddcebb',0,.055,2.65,p);
 for(const x of[-1.82,1.82]){box(.77,1.24,.14,'#a8baa6',x,1.67,1.76,p,.02);box(.59,1.08,.04,'#bfc7c3',x,1.67,1.86,p,.01);box(.06,1.09,.04,'#eee4d1',x,1.67,1.89,p,.005);box(.6,.055,.04,'#eee4d1',x,1.64,1.9,p,.005);box(.85,.12,.3,'#d3c0ac',x,1.04,1.8,p);}
 box(3.2,.42,.09,'#f2e8d3',0,2.69,1.84,p,.015);label('田田的漫画画廊',3.05,.32,'#f2e8d3','#436d63',0,2.7,1.91,p);label('第一阶段 · 作品展',1.8,.23,'#65938a','#f9efde',0,3.44,1.99,p);
 box(2.5,.13,1.8,'#d5c6ae',-3.4,.12,.25,p);box(1.82,.42,.79,'#b89464',-3.4,.52,.24,p,.08);box(1.86,.69,.17,'#cca976',-3.4,.9,-.08,p,.07);for(const x of[-4.26,-2.54])box(.16,.58,.85,'#c19f6b',x,.65,.25,p,.06);for(const x of[-3.86,-2.94])box(.85,.1,.61,'#d8bd89',x,.78,.38,p,.04);for(const x of[-4.45,-2.35])box(.09,2.12,.09,'#c8b59e',x,1.15,.95,p);roof(2.65,.42,2,'#698f79',-3.4,2.2,.1,p);
}