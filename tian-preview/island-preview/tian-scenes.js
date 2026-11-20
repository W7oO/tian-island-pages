import * as T from 'three';
import {dataSculpture,desktopCompanion} from './exhibit-proposals.js';
import {layoutPlan} from './layout-plan.js';
import {groundHeight,cottage} from './scene-craft.js?rev=ally-brand-preview-20261119';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const C={stone:'#d0c7b1',trim:'#ede7d7',wood:'#9f784c',woodLight:'#c5a273',metal:'#405b58',roof:'#647976',glass:'#a9c8c4',dark:'#34423f',floor:'#d1c5ad',green:'#72856a',gold:'#bf9c61'};
const materials=new Map(),textures=new T.TextureLoader(),rotators=[],mazeEffects=[],installedProposals=[];
export function updateExhibitMotion(dt,enabled=true){if(!enabled)return;for(const m of installedProposals){m.time+=Math.min(dt,1);m.model.update(m.time,true);}for(const r of rotators)r.object.rotation.y+=Math.min(dt,1)*r.speed;for(const e of mazeEffects){e.time+=Math.min(dt,1);e.dot.position.copy(e.path.getPointAt((e.time*.12)%1));e.exit.material.emissiveIntensity=.55+Math.sin(e.time*2.3)*.25;}}
export function getInstalledProposalStats(){return installedProposals.map(m=>({work:m.work,...m.model.stats()}));}
function installProposal(p,work,build){const model=build();p.add(model.root);installedProposals.push({work,model,time:0});}
export function getMazeEffectStats(){return mazeEffects.map(e=>({time:e.time,position:e.dot.position.toArray(),pulse:e.exit.material.emissiveIntensity,visibleMeshes:e.root.children.filter(x=>x.isMesh).length}));}
export function getExhibitMotionStats(){return rotators.map(r=>({work:r.work,angle:r.object.rotation.y,speed:r.speed,visibleMeshes:(()=>{let n=0;r.object.traverse(o=>{if(o.isMesh)n++});return n})()}));}
function rotating(object,work,speed){object.userData.dynamicExhibit=true;object.traverse(o=>{if(o.isMesh)o.castShadow=false});rotators.push({object,work,speed});}
function material(key){if(materials.has(key))return materials.get(key);const color=C[key]||key,m=new T.MeshStandardMaterial({color,roughness:key==='metal'?.45:.84,metalness:key==='metal'?.48:0});if(key==='glass'){m.transparent=true;m.opacity=.25;m.depthWrite=false;m.roughness=.22;m.metalness=.14;}if(key==='window'){m.color.set('#efc68b');m.emissive.set('#e2a75f');m.emissiveIntensity=.1;m.name='campus-window';}materials.set(key,m);return m;}
function mesh(g,key,x,y,z,parent){const a=new T.Mesh(g,typeof key==='string'?material(key):key);a.position.set(x,y,z);a.castShadow=key!=='glass';a.receiveShadow=true;parent.add(a);return a;}
const box=(w,h,d,c,x,y,z,p,r=.025)=>mesh(r?new RoundedBoxGeometry(w,h,d,1,Math.min(r,w/4,h/4,d/4)):new T.BoxGeometry(w,h,d),c,x,y,z,p);
const cylinder=(r,h,c,x,y,z,p,n=32)=>mesh(new T.CylinderGeometry(r,r,h,n),c,x,y,z,p);
function beam(a,b,r,c,p){const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av),o=mesh(new T.CylinderGeometry(r,r,delta.length(),8),c,...av.clone().add(bv).multiplyScalar(.5).toArray(),p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;}
function sign(text,p,x,y,z,w=4.5){
 // Keep the whole plaque above terraces; a low baseline used to bury half the text.
 const canvas=document.createElement('canvas');canvas.width=1152;canvas.height=192;
 const a=canvas.getContext('2d');a.fillStyle='#eee7d4';a.fillRect(0,0,1152,192);
 a.fillStyle='#263f36';let size=132;a.font=`600 ${size}px PingFang SC,Microsoft YaHei,sans-serif`;
 while(a.measureText(text).width>1024&&size>64){size-=2;a.font=`600 ${size}px PingFang SC,Microsoft YaHei,sans-serif`;}
 a.textAlign='center';a.textBaseline='middle';a.fillText(text,576,100);
 const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;
 const label=mesh(new T.PlaneGeometry(w,w/6),new T.MeshBasicMaterial({map:t,toneMapped:false,side:T.DoubleSide}),x,Math.max(y,.68),z,p);
 label.visible=false;label.castShadow=false;label.receiveShadow=false;label.userData.exhibitSign={text,fontSize:size,bottom:Math.max(y,.68)-w/12};return label;
}
function image(url,p,x,y,z,w,h){const m=new T.MeshBasicMaterial({color:'#e8e0cd',side:T.DoubleSide,toneMapped:false});const screen=mesh(new T.PlaneGeometry(w,h),m,x,y,z,p);screen.castShadow=false;screen.userData.artworkPreview=true;textures.load(url,t=>{t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;const aspect=t.image.width/t.image.height;const ww=Math.min(w,h*aspect),hh=ww/aspect;screen.scale.set(ww/w,hh/h,1);m.map=t;m.color.set('#ffffff');m.needsUpdate=true});return screen;}
function stairs(p,w,z,n=5){const end=groundHeight(p.position.x,p.position.z+z+(n-1)*.33)-p.position.y;for(let i=0;i<n;i++){const t=i/Math.max(1,n-1),zz=z+i*.33,ground=groundHeight(p.position.x,p.position.z+zz)-p.position.y,top=.22*(1-t)+(end+.025)*t,base=Math.min(ground-.07,top-.08);box(w,top-base,.4,'stone',0,(top+base)/2,zz,p,.02);}}
function planter(p,x,z,w=1.5){box(w,.42,.68,'stone',x,.22,z,p);for(let j=0;j<3;j++){const leaf=mesh(new T.SphereGeometry(.38,8,6),'green',x+(j-1)*w*.28,.62,z,p);leaf.scale.set(1,.7,.9);}}
function foundation(p,w,d){box(w,.16,d,'stone',0,.08,0,p);box(w-.15,.04,d-.15,'floor',0,.18,0,p);}
function flatRoof(p,w,d,h){box(w,.18,d,'roof',0,h,0,p);box(w+.12,.08,d+.12,'metal',0,h-.13,0,p);}
function glazing(p,w,h,d,{back=true}={}){const z=d/2;box(w,h,d,'glass',0,h/2+.2,0,p,0);for(const x of[-w/2,w/2])box(.1,h,.1,'metal',x,h/2+.2,z+.015,p);for(const y of[.22,h+.2])box(w,.08,.1,'metal',0,y,z+.05,p);if(back)box(w,.08,.1,'metal',0,h+.2,-z,p);box(w-.3,.06,.1,'window',0,h+.05,z-.16,p);}
function fins(p,w,h,z,y=.2){for(let x=-w/2;x<w/2;x+=.25)box(.115,h,.19,'wood',x,h/2+y,z,p,.01);}
function curvedRoof(p,w,d,h,arch=.8){const shape=new T.Shape(),N=28,yy=t=>h+arch*Math.sin(t*Math.PI)+.2*t;shape.moveTo(-w/2,yy(0));for(let i=1;i<=N;i++){const t=i/N;shape.lineTo((t-.5)*w,yy(t))}for(let i=N;i>=0;i--){const t=i/N;shape.lineTo((t-.5)*w,yy(t)-.16)}shape.closePath();mesh(new T.ExtrudeGeometry(shape,{depth:d,steps:1,bevelEnabled:false}),'roof',0,0,-d/2,p);for(let k=0;k<=12;k++){const t=k/12;box(.05,.12,d-.12,'woodLight',(t-.5)*w,yy(t)-.2,0,p,.01)}}
function rail(p,x,z,w,y=1){for(let i=0;i<=Math.ceil(w);i++)box(.04,y,.04,'metal',x-w/2+i*w/Math.ceil(w),y/2,z,p,.005);box(w,.04,.055,'metal',x,y,z,p,.005);box(w,.025,.04,'metal',x,y*.55,z,p,.005);}
function gallery(p,w){
 // Use Ally's actual cottage geometry and proportions. Only Tian's label/palette and artwork differ.
 cottage(p);
 image(w.images[0][0],p,0,1.5,1.97,1.18,1.7);
 p.userData.modelSource='Ally scene-craft.cottage';
}
function football(p,w){foundation(p,7.3,5.4);box(6.5,.05,4.4,'#6e8e6d',0,.23,0,p);const line=new T.MeshBasicMaterial({color:'#e7e8d9'});for(const x of[-3,3])box(.035,.012,3.7,line,x,.27,0,p,0);for(const z of[-1.85,1.85])box(6,.012,.035,line,0,.27,z,p,0);box(.035,.012,3.7,line,0,.27,0,p,0);const ring=mesh(new T.RingGeometry(.62,.65,48),line,0,.279,0,p);ring.rotation.x=-Math.PI/2;for(const x of[-3,3]){beam([x,.3,-.55],[x,1.1,-.55],.035,'trim',p);beam([x,.3,.55],[x,1.1,.55],.035,'trim',p);beam([x,1.1,-.55],[x,1.1,.55],.035,'trim',p)}for(let row=0;row<3;row++){box(6.6,.26,.6,'stone',0,.45+row*.29,-1.7-row*.5,p);for(let j=0;j<10;j++)box(.44,.12,.37,row%2?'wood':'woodLight',j*.6-2.7,.63+row*.29,-1.7-row*.5,p)}for(const x of[-3.4,3.4])box(.1,3.1,.1,'metal',x,1.7,-2.8,p);const canopy=box(7.3,.13,2.1,'roof',0,3.4,-2.2,p);canopy.rotation.x=.1;sign('足球看台',p,0,.55,2.6,3.6);mesh(new T.SphereGeometry(.25,16,12),'trim',2.2,2.2,-2.65,p);for(const x of[-3,3]){box(.08,4.2,.08,'metal',x,2.3,-1.8,p);box(.8,.26,.14,'window',x,4.25,-1.8,p)}}
function library(p,w){foundation(p,6.4,4.9);glazing(p,5.8,2.6,4);for(const x of[-2.6,2.6])box(.2,2.9,4.15,'stone',x,1.65,0,p);for(const side of[-1,1]){const roof=new T.Group();roof.position.x=side*1.52;p.add(roof);curvedRoof(roof,3.3,4.6,2.9,.7);roof.rotation.z=side*.11;for(let k=0;k<4;k++)box(3.25,.035,4.55,'trim',0,2.9+k*.055,0,roof,0)}for(const x of[-2.25,2.25]){for(const y of[.5,1.25,2])box(.6,.09,3.5,'woodLight',x,y,-.15,p);for(let j=0;j<12;j++)box(.16,.52,.24,j%3?'wood':'metal',x,1.56,j*.24-1.5,p)}image(w.preview,p,0,1.6,-1.7,1.45,2.1);sign('钢铁少年 · 故事书屋',p,0,.6,2.5,4.4);stairs(p,3.3,2.4,3,.1)}
function cinema(p,w){
 cylinder(2.75,.12,'stone',0,.08,0,p,48);
 const screen=box(4.7,2.65,.22,'dark',0,1.9,-1.25,p,.09);
 image(w.poster,p,0,1.92,-1.1,4.25,2.35);
 for(let row=0;row<2;row++){const n=row?7:5;for(let i=0;i<n;i++){const a=(i/(n-1)-.5)*1.5,x=Math.sin(a)*(1.7+row*.7),z=Math.cos(a)*(1.7+row*.7)-.55;const seat=box(.58,.3,.48,'wood',x,.39,z,p,.07);seat.rotation.y=-a;const back=box(.58,.32,.1,'woodLight',x,.65,z+.2,p,.05);back.rotation.y=-a;}}
 sign('JOJO · 露天放映',p,0,.4,2.52,4.1);
}
function cubeObject(p,x,y,z,size){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=.35;p.add(g);const cols=['#c6ad7a','#8eaaa2','#a87562','#e1dac5','#718f96','#a4ad88'];for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++)box(size*.305,size*.305,size*.305,cols[(a*2+b+c)%6],(a-1)*size*.325,(b-1)*size*.325,(c-1)*size*.325,g,.025);return g;}
function cubeStudio(p){
 cylinder(2.25,.1,'stone',0,.06,0,p,48);
 const rim=mesh(new T.TorusGeometry(2.12,.035,7,64),'gold',0,.13,0,p);rim.rotation.x=-Math.PI/2;
 cylinder(.9,.2,'trim',0,.23,0,p);const cube=cubeObject(p,0,1.55,0,2.05);cube.rotation.z=-.18;cube.rotation.x=.08;
 for(const x of[-1.75,1.75])box(.55,.14,1.15,'woodLight',x,.2,0,p,.07);
 sign('魔方训练站',p,0,.35,2.22,3.6);
}
function maze(p){foundation(p,5.8,4.6);for(const [x,z,len,rotation]of[[-2,0,3.6,0],[-.7,-.6,2.3,0],[.6,.5,2.4,0],[2,0,3.6,0],[0,-1.7,4.2,1],[.6,1.1,1.5,1],[-1.3,.5,1.3,1]]){const a=box(.48,1.2,len,'green',x,.82,z,p,.12);if(rotation)a.rotation.y=Math.PI/2;}const arch=new T.Group();arch.position.set(0,0,2.1);p.add(arch);for(const x of[-.65,.65])box(.22,1.7,.3,'stone',x,1,0,arch);const a=mesh(new T.TorusGeometry(.65,.14,8,32,Math.PI),'stone',0,1.85,0,arch);sign('迷宫花园',p,0,.38,2.42,3.3)}
function dataLab(p,w){
 cylinder(2.55,.1,'stone',0,.06,0,p,48);
 const consoleTop=mesh(new T.CylinderGeometry(2.15,2.15,.15,48,1,false,-1.05,2.1),'woodLight',0,.97,-.65,p);
 for(const x of[-1.5,1.5])box(.42,.76,.8,'stone',x,.51,.45,p,.08);
 const panelMat=new T.MeshBasicMaterial({color:'#344943',side:T.DoubleSide,toneMapped:false});
 const panel=mesh(new T.CylinderGeometry(2.3,2.3,1.7,48,1,true,-.9,1.8),panelMat,0,2,-.8,p);
 textures.load(w.preview,t=>{t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;panel.scale.y=(4.14/(t.image.width/t.image.height))/1.7;panelMat.map=t;panelMat.color.set('#ffffff');panelMat.needsUpdate=true});
 for(let i=0;i<3;i++)box(.28,.28+i*.18,.28,['#bfa26d','#7c9b90','#97aaa0'][i],i*.43-.45,.35+i*.09,1.4,p,.03);
 sign('足球数据实验室',p,0,.35,2.52,4.1);
}
function observatory(p){cylinder(3.2,.3,'stone',0,.15,0,p,48);cylinder(2.75,1.65,'glass',0,1.12,0,p,48);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;box(.09,1.65,.09,'metal',Math.cos(a)*2.75,1.12,Math.sin(a)*2.75,p)}cylinder(3.05,.2,'trim',0,2.05,0,p,48);const shell=new T.Group();shell.rotation.y=Math.PI;p.add(shell);const dome=mesh(new T.SphereGeometry(2.72,40,18,.15,Math.PI*1.38,0,Math.PI/2),'metal',0,2.12,0,shell);dome.material.side=T.DoubleSide;for(let i=0;i<5;i++){const a=i/4*Math.PI*1.38+.15,pts=[];for(let k=0;k<=18;k++){const b=k/18*Math.PI/2;pts.push(new T.Vector3(Math.sin(b)*2.76*Math.cos(a),2.12+Math.cos(b)*2.76,Math.sin(b)*2.76*Math.sin(a)))}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),18,.025,5,false),'trim',0,0,0,shell)}const relic=mesh(new T.SphereGeometry(.95,20,14,0,Math.PI*1.67),'#647370',0,3,0,p);relic.material.side=T.DoubleSide;const ring=mesh(new T.TorusGeometry(1.4,.055,8,56),'gold',0,3,0,p);ring.rotation.x=1.1;ring.rotation.y=-.2;rail(p,0,2.88,4.3,2.1);stairs(p,3.6,2.65,6,.13);sign('死星遗迹 · 天文馆',p,0,1.45,2.9,4.3)}
function workshop(p,w){
 foundation(p,5.1,3.5);
 box(4.25,.18,1.9,'woodLight',0,1.06,0,p,.12);
 for(const x of[-1.65,1.65])box(.42,.8,1.45,'stone',x,.59,0,p,.08);
 cubeObject(p,-1.03,1.62,.03,.91);
 box(2.2,1.47,.12,'dark',.72,2.03,-.3,p,.08);
 image(w.preview,p,.72,2.03,-.22,1.99,1.27);
 box(.18,.38,.18,'metal',.72,1.27,-.3,p,.04);box(.9,.07,.43,'metal',.72,1.13,-.15,p,.05);
 box(1.15,.04,.42,'metal',.72,1.17,.62,p,.06);
 box(1.65,.34,.55,'wood',0,.39,1.18,p,.1);
 sign('田田桌面搭子',p,0,.38,1.76,4.15);
}
function vision(p){
 cylinder(2.2,.1,'stone',0,.06,0,p,48);
 const arc=mesh(new T.TorusGeometry(1.2,.085,10,64,Math.PI*1.45),'metal',0,1.55,-.15,p);arc.rotation.z=-.2;
 box(.9,1.1,.65,'stone',0,.7,0,p,.08);box(.85,.5,.65,'metal',0,1.42,.05,p,.09);
 const lens=mesh(new T.CylinderGeometry(.2,.23,.34,24),'dark',0,1.42,.47,p);lens.rotation.x=Math.PI/2;
 sign('素材待补充',p,0,.64,1.62,2.4);sign('球员手势识别',p,0,.27,2.16,3.7);
}
function sceneMetrics(p){let slimVerticals=0,meshes=0,artworkPreviews=0,visibleExhibitSigns=0,hiddenExhibitSigns=0;p.traverse(o=>{if(!o.isMesh)return;meshes++;if(o.userData.exhibitSign){if(o.visible)visibleExhibitSigns++;else hiddenExhibitSigns++;}if(o.userData.artworkPreview)artworkPreviews++;o.geometry.computeBoundingBox();const d=o.geometry.boundingBox.getSize(new T.Vector3());if(d.y>1.2&&d.x<.25&&d.z<.3)slimVerticals++});return{slimVerticals,meshes,artworkPreviews,visibleExhibitSigns,hiddenExhibitSigns};}
// Deliberately low-detail masses. Art direction is deferred until spacing is approved.
function figure3d(p,x,z,height,coat){const g=new T.Group();g.position.set(x,.2,z);g.scale.setScalar(height/1.8);p.add(g);for(const side of[-1,1]){box(.18,.6,.22,'dark',side*.15,.3,0,g);box(.2,.12,.32,'dark',side*.15,.06,.07,g);const arm=box(.16,.55,.2,coat,side*.34,1.05,0,g);arm.rotation.z=side*.12;}box(.52,.65,.3,coat,0,.95,0,g,.06);mesh(new T.SphereGeometry(.23,14,10),'#c6a889',0,1.58,0,g);const hair=mesh(new T.SphereGeometry(.24,14,8),'dark',0,1.72,-.04,g);hair.scale.set(1,.55,1);return g;}
function puzzleSolid(p,x,y,z,type){const radius=type==='tetrahedral'?.6:.46,geo=type==='tetrahedral'?new T.TetrahedronGeometry(radius,0):new T.DodecahedronGeometry(radius,0),g=geo.index?geo.toNonIndexed():geo,colors=[],palette=type==='tetrahedral'?['#d9926a','#6f9b9d','#bb8bb0','#dec079']:['#8c84ad','#72a5a5','#d49c79','#95ac80','#d4bd7f','#c58c96'];for(let i=0;i<g.attributes.position.count;i++){const c=new T.Color(palette[Math.floor(i/(type==='tetrahedral'?3:9))%palette.length]);colors.push(c.r,c.g,c.b);}g.setAttribute('color',new T.Float32BufferAttribute(colors,3));if(type==='tetrahedral'){const normal=new T.Vector3().fromBufferAttribute(g.attributes.normal,0).normalize();g.applyQuaternion(new T.Quaternion().setFromUnitVectors(normal,new T.Vector3(0,-1,0)));}const root=new T.Group();root.position.set(x,type==='tetrahedral'?y-.2:y,z);root.rotation.y=type==='tetrahedral'?.4:-.25;p.add(root);mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.78,flatShading:true}),0,0,0,root);root.add(new T.LineSegments(new T.EdgesGeometry(g,12),new T.LineBasicMaterial({color:'#465a58'})));if(type==='tetrahedral'){const ps=g.attributes.position,lines=[];for(let i=0;i<ps.count;i+=3){const v=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(ps,i+k));for(let j=0;j<3;j++)for(const t of[1/3,2/3])lines.push(...v[j].clone().lerp(v[(j+1)%3],t).multiplyScalar(1.005).toArray(),...v[j].clone().lerp(v[(j+2)%3],t).multiplyScalar(1.005).toArray());}const lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(lines,3));root.add(new T.LineSegments(lg,new T.LineBasicMaterial({color:'#526563'})));}else{const ps=g.attributes.position,lines=[];for(let f=0;f<12;f++){const vs=[];for(let k=f*9;k<(f+1)*9;k++){const v=new T.Vector3().fromBufferAttribute(ps,k);if(!vs.some(w=>w.distanceTo(v)<.0001))vs.push(v);}const center=vs.reduce((v,w)=>v.add(w),new T.Vector3()).multiplyScalar(1/vs.length),normal=center.clone().normalize(),u=vs[0].clone().sub(center).normalize(),v=new T.Vector3().crossVectors(normal,u);vs.sort((a,b)=>Math.atan2(a.clone().sub(center).dot(v),a.clone().sub(center).dot(u))-Math.atan2(b.clone().sub(center).dot(v),b.clone().sub(center).dot(u)));for(let j=0;j<vs.length;j++){const inner=center.clone().lerp(vs[j],.56).multiplyScalar(1.005),next=center.clone().lerp(vs[(j+1)%vs.length],.56).multiplyScalar(1.005);lines.push(...inner.toArray(),...next.toArray(),...inner.toArray(),...vs[j].clone().multiplyScalar(1.005).toArray());}}const lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(lines,3));root.add(new T.LineSegments(lg,new T.LineBasicMaterial({color:'#526563'})));}p.userData.puzzleShapes??=[];p.userData.puzzleShapes.push(type);}
function mazeEffect(p){const root=new T.Group();root.userData.dynamicExhibit=true;p.add(root);const path=new T.CurvePath(),pts=[[-1.5,1.9],[-1.5,.9],[-.3,.9],[-.3,-1.05],[1.25,-1.05],[1.25,1.85]].map(([x,z])=>new T.Vector3(x,.35,z));for(let i=1;i<pts.length;i++)path.add(new T.LineCurve3(pts[i-1],pts[i]));const glow=new T.MeshStandardMaterial({color:'#e3ad5b',emissive:'#e4ab55',emissiveIntensity:.8,roughness:.5});const dot=mesh(new T.SphereGeometry(.13,12,8),glow,0,.35,0,root);dot.castShadow=false;dot.position.copy(pts[0]);const exit=mesh(new T.TorusGeometry(.28,.055,6,20),glow.clone(),1.25,.35,1.85,root);exit.rotation.x=-Math.PI/2;exit.castShadow=false;for(let i=0;i<7;i++){const pos=path.getPointAt(i/7);cylinder(.045,.025,'gold',pos.x,.24,pos.z,p,8);}mazeEffects.push({root,dot,exit,path,time:0});}
// Sculptural exhibits: curved surfaces share restrained stone/teal materials.
function ribbon(p,w,h,depth,y,z,key){const g=new T.PlaneGeometry(w,h,40,1),v=g.attributes.position;for(let i=0;i<v.count;i++){const x=v.getX(i);v.setZ(i,depth*(x*x/(w*w/4)));}g.computeVertexNormals();const m=material(key).clone();m.side=T.DoubleSide;return mesh(g,m,0,y,z,p);}
function terrace(p,w,d){box(w,.22,d,'stone',0,.03,0,p,.3);box(w-.15,.06,d-.15,'trim',0,.17,0,p,.2);for(let i=0;i<2;i++)box(w*.62,.09,.35,'stone',0,.04-i*.065,d/2+.15+i*.28,p,.04);}
function comicPage(parent,x,side){
 const canvas=document.createElement('canvas');
 canvas.width=420;
 canvas.height=500;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#f2dfb6';
 ctx.fillRect(0,0,420,500);
 ctx.strokeStyle='#344c47';
 ctx.lineWidth=7;
 const panels=side<0
  ? [[22,22,376,178,'#9bb8a7'],[22,218,172,260,'#e0af79'],[212,218,186,260,'#bdc6a2']]
  : [[22,22,172,258,'#dcb286'],[212,22,186,258,'#9bb8a7'],[22,298,376,180,'#b7c5a6']];
 for(const [left,top,width,height,color] of panels){
  ctx.fillStyle=color;
  ctx.fillRect(left,top,width,height);
  ctx.strokeRect(left,top,width,height);
 }
 const [bubbleX,bubbleY]=side<0?[223,103]:[202,383];
 ctx.fillStyle='#fff0d0';
 ctx.beginPath();
 ctx.ellipse(bubbleX,bubbleY,100,47,-.08,0,Math.PI*2);
 ctx.fill();
 ctx.stroke();
 ctx.beginPath();
 ctx.moveTo(bubbleX-64,bubbleY+34);
 ctx.lineTo(bubbleX-88,bubbleY+62);
 ctx.lineTo(bubbleX-40,bubbleY+43);
 ctx.fill();
 ctx.stroke();
 ctx.fillStyle='#344c47';
 for(const offset of [-23,0,23]){
  ctx.beginPath();
  ctx.arc(bubbleX+offset,bubbleY,5,0,Math.PI*2);
  ctx.fill();
 }
 for(const [starX,starY,radius] of side<0?[[106,334,42],[305,373,22]]:[[109,165,39],[303,138,24]]){
  ctx.fillStyle='#fff0d0';
  ctx.beginPath();
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4;
   const r=i%2?radius*.28:radius;
   ctx.lineTo(starX+Math.cos(angle)*r,starY+Math.sin(angle)*r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
 }
 const texture=new T.CanvasTexture(canvas);
 texture.colorSpace=T.SRGBColorSpace;
 texture.anisotropy=8;
 const page=mesh(new T.PlaneGeometry(2.1,2.50),new T.MeshStandardMaterial({map:texture}),x,1.38,.153,parent);
 page.castShadow=false;
}
function layoutMass(p,id,w){
 if(id===1){
  terrace(p,6,2.6);
  const book=new T.Group();
  book.position.set(0,.22,-.24);
  book.rotation.x=-.07;
  p.add(book);
  box(.24,2.72,.33,'#244b4c',0,1.36,0,book,.08);
  for(const side of [-1,1]){
   const leaf=new T.Group();
   leaf.rotation.y=side*.22;
   book.add(leaf);
   const x=side*1.12;
   box(2.24,2.72,.14,'#244b4c',x,1.36,-.09,leaf,.045);
   box(2.14,2.57,.17,'#e8cfa3',x,1.36,.045,leaf,.035);
   box(2.12,2.53,.036,'#f2dfb6',x,1.38,.132,leaf,.008);
   comicPage(leaf,x,side);
  }
 }else if(id===3){
  // Open book with layered rising pages; no roof or enclosing walls.
  for(const side of[-1,1]){const cover=box(2.48,.18,3.28,'#2e5256',side*1.12,.28,0,p,.07);cover.rotation.z=side*.10;
   for(let j=0;j<5;j++){const g=new T.PlaneGeometry(2.2,2.85,18,1);g.rotateX(-Math.PI/2);const v=g.attributes.position;for(let k=0;k<v.count;k++){const u=(v.getX(k)+1.1)/2.2;v.setX(k,side*u*2.2);v.setY(k,.4+Math.sin(u*Math.PI/2)*(.22+j*.24));}g.computeVertexNormals();const m=material(j%2?'#e7d5ad':'#dac49a').clone();m.side=T.DoubleSide;mesh(g,m,0,0,0,p);}}
  const quill=new T.Group();quill.position.set(.7,.7,0);quill.rotation.z=-.35;p.add(quill);beam([0,0,0],[0,1.5,0],.025,'gold',quill);const feather=mesh(new T.SphereGeometry(.38,16,12),'trim',.12,1.05,0,quill);feather.scale.set(.5,1.7,.12);box(.18,.04,1.7,'gold',-.4,.58,.3,p,.01);for(const side of[-1,1])for(let j=0;j<4;j++){const pts=[];for(let k=0;k<=8;k++){const x=.65+k*.12;pts.push(new T.Vector3(side*x,.4+Math.sin(x/2.2*Math.PI/2)*1.18+.018,j*.34-.58));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),16,.009,3,false),'#9a895f',0,0,0,p);}
 }else if(id===4){
  terrace(p,5,3.8);box(2.5,1.45,1.2,'metal',0,1.4,0,p,.12);
  for(const x of[-.72,.72]){const reel=mesh(new T.CylinderGeometry(.62,.62,.25,32),'gold',x,2.5,0,p);reel.rotation.x=Math.PI/2;for(let i=0;i<5;i++){const angle=i/5*Math.PI*2;mesh(new T.SphereGeometry(.12,10,7),'dark',x+Math.sin(angle)*.35,2.5+Math.cos(angle)*.35,.15,p);}}
  const lens=mesh(new T.CylinderGeometry(.45,.32,.9,24),'trim',1.55,1.4,0,p);lens.rotation.z=Math.PI/2;beam([-.5,.5,0],[0,1,0],.09,'gold',p);beam([.5,.5,0],[0,1,0],.09,'gold',p);
  for(let i=0;i<2;i++)box(3.8,.14,.55,'woodLight',0,.28+i*.13,1+i*.5,p,.04);
 }else if(id===5){
  cylinder(1.45,.18,'stone',0,.15,0,p);const g=new T.Group();g.position.set(0,1.65,0);g.rotation.set(.12,.28,-.38);p.add(g);cubeObject(g,0,0,0,2.15);rotating(g,5,.45);
 }else if(id===6){
  terrace(p,5.6,4);for(const[x,z,len,r]of[[-2.1,0,3,0],[-.9,-.5,2,0],[.4,.4,2.2,0],[2,0,3,0],[0,-1.45,4.3,1],[.3,1.45,1.1,1]]){const hedge=box(.45,.85,len,'green',x,.64,z,p,.14);if(r)hedge.rotation.y=Math.PI/2;}mazeEffect(p);
 }else if(id===7){
  installProposal(p,7,dataSculpture);
 }else if(id===8){
  for(let i=0;i<3;i++)cylinder(2.15-i*.22,.16,'stone',0,.08+i*.16,0,p,56);
  beam([0,.5,0],[0,2.2,0],.09,'gold',p);const orbit=new T.Group();orbit.position.y=3.15;p.add(orbit);mesh(new T.SphereGeometry(1.18,28,20),'metal',0,0,0,orbit);
  for(let i=0;i<2;i++){const a=mesh(new T.TorusGeometry(2.15+i*.28,.065,8,80),'gold',0,0,0,orbit);a.rotation.set(.4+i*.75,.25+i*.6,.4);}
  mesh(new T.SphereGeometry(.23,14,10),'gold',2.2,1.05,0,orbit);rotating(orbit,8,.28);
 }else if(id===9){
  installProposal(p,9,desktopCompanion);
 }else{
  // Honest empty frame for missing work: no invented video or assessment.
  const curve=new T.CatmullRomCurve3([new T.Vector3(-1,0,0),new T.Vector3(-1,2.15,0),new T.Vector3(1,2.15,0),new T.Vector3(1,0,0)]);mesh(new T.TubeGeometry(curve,40,.085,8,false),'trim',0,.2,0,p);sign('素材待补充',p,0,.35,.13,2.2);
 }
 sign(w.name,p,0,.24,id===6?2.25:id===1?1.75:2.25,Math.min(4.1,id===10?3.5:4.1));
}
export function station(p,id,w){
 p.userData.architecture=layoutPlan[id-1].kind;p.userData.work=id;
 if(id===2)football(p,w);else layoutMass(p,id,w);
 p.userData.sceneMetrics={...sceneMetrics(p),puzzleShapes:p.userData.puzzleShapes||[]};
}
