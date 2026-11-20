import {routeOnRoads} from './road-navigation.js';
import {updateExhibitMotion,getExhibitMotionStats,getMazeEffectStats,getInstalledProposalStats,station} from './tian-scenes.js';
import {layoutPlan} from './layout-plan.js';
import {buildCampusEnvironment} from './campus-environment.js';
let campusEnvironment;let exhibitMotionEnabled=!matchMedia('(prefers-reduced-motion:reduce)').matches,exhibitMotionOverride=false;
import {buildMascot} from './mascot.js';
let tianMascot;
import * as T from 'three';
import * as Craft from './scene-craft.js?rev=ally-brand-preview-20261119';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
const gallery=document.getElementById('gallery-dialog'),host=document.getElementById('explore-world'),overview=document.getElementById('gallery-overview'),labels=document.getElementById('explore-labels');
const initialWork=Number(new URLSearchParams(location.search).get('work'));
const returnScene=Number(new URLSearchParams(location.search).get('scene'));
const names=window.aliyWorkNames;
const centers=layoutPlan.map(x=>x.center);
const portals=Object.fromEntries(layoutPlan.map(x=>[x.id,x.portal]));
let labelWork=0;let tourPaused=false;let guideWork=0,navigation=null,tourStopIndex=0,tourPause=0,guideLabel,guideHeight=2.7;
let mobileFollow=false,mobileCameraSized=false,mobilePanMode=false,resetFeedbackTimer;const roadTargets=[];
const stops=layoutPlan.map(x=>x.stop);
let renderer,composer,aoPass,familyDisplay,activeWork=0,scene,camera,controls,ready=false,initializing=false,car,tornado,tour=false,tourElapsed=0,approach=null,mobileIndex=0,homePos,homeTarget,homeZoom;
const groups=[],markers=[],anchors=[],targets=[],waves=[],trees=[];const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:700px), (pointer:coarse)');
const ray=new T.Raycaster(),pointer=new T.Vector2();const V=(x,y,z)=>new T.Vector3(x,y,z);
const mat=(color)=>new T.MeshStandardMaterial({color,roughness:1,flatShading:true});const materials=new Map();function M(c){if(!materials.has(c))materials.set(c,mat(c));return materials.get(c);}
function add(g,m,x=0,y=0,z=0,parent=scene){const a=new T.Mesh(g,typeof m==='string'?M(m):m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;parent.add(a);return a;}
const box=(w,h,d,c,x,y,z,p)=>add(new T.BoxGeometry(w,h,d),c,x,y,z,p);
const ball=(r,c,x,y,z,p,detail=1)=>add(new T.IcosahedronGeometry(r,detail),c,x,y,z,p);
const cyl=(top,bottom,h,c,x,y,z,p,n=10)=>add(new T.CylinderGeometry(top,bottom,h,n),c,x,y,z,p);
function zone(id){const g=new T.Group();g.position.set(centers[id-1][0],Craft.groundHeight(...centers[id-1]),centers[id-1][1]);scene.add(g);groups.push(g);return g;}
function roof(w,h,d,c,x,y,z,p){const sh=new T.Shape();sh.moveTo(-w/2,0);sh.lineTo(0,h);sh.lineTo(w/2,0);sh.closePath();const o=add(new T.ExtrudeGeometry(sh,{depth:d,bevelEnabled:false}),c,x,y,z-d/2,p);return o;}
function limb(a,b,r,c,p){const delta=b.clone().sub(a),o=cyl(r,r,delta.length(),c,0,0,0,p,8);o.position.copy(a.clone().add(b).multiplyScalar(.5));o.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize());return o;}
function panel(texture,w,h,x,y,z,p){const o=add(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:texture,toneMapped:false,side:T.DoubleSide}),x,y,z,p);return o;}
function fence(x,z,length,p,rotation=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rotation;p.add(g);const count=Math.ceil(length/.75);for(let i=0;i<=count;i++)box(.13,.8,.16,'#b7a184',i*length/count-length/2,.4,0,g);for(const y of[.3,.65])box(length,.12,.13,'#dbc49e',0,y,0,g);}
function terrain(){const built=Craft.terrain(scene);window.exploreTourPath=built.path;waves.push(...built.waves);}
function cottage(){Craft.cottage(zone(1));}
function cat(){tornado=Craft.cat(zone(2));}
function book(){Craft.book(zone(3));}
function street(){Craft.street(zone(4));}
function dog(){Craft.dog(zone(5));}
function hero(){Craft.hero(zone(6));}
function normalize(source,height){const child=source.clone(true),wrap=new T.Group();wrap.add(child);wrap.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(wrap),size=bounds.getSize(V(0,0,0)),center=bounds.getCenter(V(0,0,0));child.position.x-=center.x;child.position.y-=bounds.min.y;child.position.z-=center.z;wrap.scale.setScalar(height/Math.max(.001,size.y));wrap.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;const array=Array.isArray(n.material);const ms=(array?n.material:[n.material]).map(m=>{const a=m.clone();a.roughness=1;a.metalness=0;a.flatShading=true;return a;});n.material=array?ms:ms[0];}});return wrap;}
function makeGuide(){
 tianMascot=buildMascot(T,scene);car=tianMascot.root;car.name='jojo-guide';car.children[0].visible=false;car.children[1].visible=false;car.scale.setScalar(.55);car.position.set(0,Craft.groundHeight(0,.8),.8);
 guideLabel=document.createElement('span');guideLabel.className='guide-label';guideLabel.textContent='JOJO向导';labels.appendChild(guideLabel);guideHeight=new T.Box3().setFromObject(car).max.y-car.position.y+.12;
}

function guideDestination(id){const[x,z]=stops[id-1];return V(x,Craft.groundHeight(x,z)+.035,z);}
function parkGuide(id,snap=true){if(!car||!id)return;navigation=null;guideWork=id;labelWork=id;mobileIndex=id-1;if(snap)car.position.copy(guideDestination(id));car.rotation.y=-.3;updateGuideCopy();if(gallery.dataset.view==='overview'&&!approach){updateMobile();}}
function updateGuideCopy(){const button=document.getElementById('explore-tour');button.textContent=tour?(tourPaused?'继续逛逛':'暂停逛逛'):'JOJO带我逛逛';button.disabled=false;document.querySelector('.explore-help').textContent=navigation?.kind==='road'?'JOJO正在沿着小路散步':navigation?'JOJO正在前往「'+names[guideWork-1]+'」':mobile.matches?(mobilePanMode?'单指移动画面 · 双指缩放':'单指旋转小岛 · 双指缩放'):guideWork?'JOJO在「'+names[guideWork-1]+'」前等你 · 点击场景看作品':'让JOJO陪你逛逛，或点击场景看作品。';}
function updateTouchMode(){
 if(!controls)return;
 const was=mobilePanMode,ratio=camera.zoom/(homeZoom||.82);
 mobilePanMode=mobile.matches&&(mobilePanMode?ratio>1.08:ratio>1.16);
 controls.enablePan=mobile.matches;controls.screenSpacePanning=!mobile.matches;
 controls.touches.ONE=mobilePanMode?T.TOUCH.PAN:T.TOUCH.ROTATE;
 controls.touches.TWO=T.TOUCH.DOLLY_PAN;
 if(ready&&was!==mobilePanMode)updateGuideCopy();
}
function walkGuide(id){
 if(!car)return;labelWork=0;projectMarkers();tourPaused=false;const previous=guideWork;guideWork=id;updateGuideCopy();const destination=guideDestination(id);
 if(reduced.matches){parkGuide(id);return;}
 const path=window.exploreTourPath,from=car.position.clone(),samples=160;
 const nearest=point=>{let at=0,best=Infinity;for(let i=0;i<samples;i++){const d=path.getPoint(i/samples).distanceToSquared(point);if(d<best){best=d;at=i;}}return at;};
 const toPortal=portals[id]?V(portals[id][0],.2,portals[id][1]):destination,fromPortal=portals[previous]?V(portals[previous][0],.2,portals[previous][1]):from;const start=nearest(fromPortal),end=nearest(toPortal),forward=(end-start+samples)%samples,backward=(start-end+samples)%samples,direction=forward<=backward?1:-1,count=Math.min(forward,backward),points=[from];if(from.distanceTo(fromPortal)>.3)points.push(fromPortal);
 for(let j=0;j<=count;j+=Math.max(1,Math.floor(count/18))){const p=path.getPoint(((start+direction*j+samples)%samples)/samples);p.y=Craft.groundHeight(p.x,p.z)-.315;if(p.distanceTo(points.at(-1))>.15)points.push(p);}
 if(toPortal.distanceTo(points.at(-1))>.15)points.push(toPortal);if(destination.distanceTo(points.at(-1))>.05)points.push(destination);if(points.length<2){parkGuide(id);return;}
 const curve=new T.CatmullRomCurve3(points,false,'centripetal');navigation={id,kind:'work',curve,time:0,duration:Math.max(.9,Math.min(6,curve.getLength()/4.5))};updateMobile();if(mobile.matches){mobileFollow=true;controls.enabled=true;}updateGuideCopy();
}
function nearbyWork(point){let id=0,best=3;stops.forEach(([x,z],i)=>{const distance=Math.min(Math.hypot(point.x-x,point.z-z),Math.hypot(point.x-centers[i][0],point.z-centers[i][1]));if(distance<best){best=distance;id=i+1;}});return id;}
function chooseWork(id){if(labelWork===id&&!navigation){select(id);return;}tour=false;tourPaused=false;walkGuide(id);}
function walkRoad(point){
 const curve=routeOnRoads(scene,car.position,point);if(!curve)return;
 labelWork=0;updateMobile();tour=false;tourPaused=false;guideWork=0;mobileFollow=true;controls.enabled=true;
 navigation={id:nearbyWork(point),kind:'road',curve,time:0,duration:Math.max(.8,Math.min(3.2,curve.getLength()/7))};updateMobile();updateGuideCopy();
}
function batchStaticZones(){
 for(const root of(mobile.matches?[...groups,...trees]:groups)){root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),batches=new Map();root.traverse(o=>{if(!o.isMesh||!o.visible||o.isSkinnedMesh)return;let material=o.material;if(Array.isArray(material)){if(!mobile.matches||!material.every(m=>m===material[0]))return;material=material[0];}if(material.transparent)return;let parent=o;while(parent&&parent!==root){if(parent===tornado||parent.userData.dynamicExhibit)return;parent=parent.parent;}const key=mobile.matches?JSON.stringify(Object.fromEntries(Object.entries(material.toJSON()).filter(([k])=>!['uuid','name','metadata','userData'].includes(k)))):material.uuid;if(!batches.has(key))batches.set(key,[]);batches.get(key).push(o);});
 for(const list of batches.values()){if(list.length<3)continue;const geometries=list.map(o=>{let g=o.geometry.clone();g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));if(g.index)g=g.toNonIndexed();return g;});const merged=mergeGeometries(geometries,false);if(!merged)continue;const firstMaterial=Array.isArray(list[0].material)?list[0].material[0]:list[0].material;const object=new T.Mesh(merged,firstMaterial);object.castShadow=true;object.receiveShadow=true;root.add(object);list.forEach(o=>{o.visible=false;});}
 }
}
function labelsInit(){centers.forEach(([x,z],i)=>{const b=document.createElement('button');b.type='button';b.className='scene-marker';b.dataset.work=String(i+1);b.setAttribute('aria-label','查看作品：'+names[i]);b.innerHTML='<span>'+String(i+1).padStart(2,'0')+'</span>'+names[i];b.addEventListener('pointerdown',()=>{if(labelWork===i+1&&!navigation){tourPaused=true;tourPause=0;mobileFollow=false;}});b.addEventListener('click',()=>select(i+1));labels.appendChild(b);markers.push(b);const bounds=new T.Box3().setFromObject(groups[i]);anchors.push(V(x,bounds.max.y+.45,z));groups[i].traverse(o=>{if(o.isMesh&&o.visible){o.userData.work=i+1;targets.push(o);}});});}
function projectMarkers(){
 camera.updateMatrixWorld(true);const w=host.clientWidth,h=host.clientHeight;
 anchors.forEach((a,i)=>{const p=a.clone().project(camera),b=markers[i],width=Math.min(w-32,b.offsetWidth||180),x=(p.x*.5+.5)*w,y=(-p.y*.5+.5)*h;
 const top=mobile.matches?(h<420?40:150):110,bottom=h-(mobile.matches?(h<420?120:150):75);
 b.style.left=Math.max(width/2+16,Math.min(w-width/2-16,x))+'px';b.style.top=Math.max(top,Math.min(bottom,y))+'px';
 const visible=labelWork===i+1&&!navigation&&gallery.dataset.view==='overview'&&p.z>=-1&&p.z<=1;
 b.classList.toggle('is-visible',visible);b.inert=!visible;b.tabIndex=visible?0:-1;b.setAttribute('aria-hidden',String(!visible));
 });
 if(guideLabel&&car){const p=car.position.clone().add(V(0,guideHeight,0)).project(camera);guideLabel.style.left=((p.x*.5+.5)*w)+'px';guideLabel.style.top=((-p.y*.5+.5)*h-12)+'px';guideLabel.hidden=p.z< -1||p.z>1;}
}
function highlightWork(id){tour=false;tourPaused=false;navigation=null;mobileFollow=false;labelWork=id;mobileIndex=id-1;updateGuideCopy();updateMobile();}

function overviewHalf(width,height){
 const aspect=width/height;
 return mobile.matches?Math.max(23/aspect,width>height?16:0):Math.max(16,24/aspect);
}
function resize(){
 if(!renderer)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
 renderer.setSize(w,h);if(composer){composer.setSize(w,h);aoPass.enabled=!mobile.matches;}
 const aspect=w/h,half=overviewHalf(w,h);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.clearViewOffset();camera.updateProjectionMatrix();
 if(activeWork===1&&familyDisplay){showFamilyDisplay();return;}
 homePos=mobile.matches?V(7,35,43):V(7,32,40);homeTarget=V(0,.5,.5);homeZoom=mobile.matches ? .98 : 1.02;
 if(!approach&&(!mobile.matches||!mobileCameraSized)){if(familyDisplay)familyDisplay.visible=false;camera.position.copy(homePos);controls.target.copy(homeTarget);camera.zoom=homeZoom;controls.update();}
 if(mobile.matches)mobileCameraSized=true;if(ready)projectMarkers();
}
function reset({announce=false}={}){
 if(!ready)return;labelWork=0;
 if(mobile.matches){
  mobileFollow=false;
  // Cancel the current walk as well as camera following. Keep Shiro where he is.
  if(navigation)guideWork=0;
  navigation=null;tourPause=0;tourStopIndex=0;
 }
 restoreFamilyContext();camera.clearViewOffset();if(familyDisplay)familyDisplay.visible=false;
 const aspect=host.clientWidth/host.clientHeight,half=overviewHalf(host.clientWidth,host.clientHeight);
 camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;
 approach=null;tour=false;tourPaused=false;tourElapsed=0;controls.enabled=true;
 // Drain any remaining orbit/zoom damping before restoring the whole-island pose.
 const previousDamping=controls.enableDamping;controls.enableDamping=false;controls.update();
 document.getElementById('explore-tour').disabled=false;updateGuideCopy();
 camera.position.copy(homePos);controls.target.copy(homeTarget);camera.zoom=homeZoom;
 camera.updateProjectionMatrix();controls.update();controls.enableDamping=previousDamping;
 camera.updateMatrixWorld(true);drawScene();updateMobile();projectMarkers();
 const button=document.getElementById('explore-reset');clearTimeout(resetFeedbackTimer);
 button.textContent='重置视角';
 if(announce&&mobile.matches){
  button.textContent='已恢复全岛视角';
  const help=document.querySelector('.explore-help');help.setAttribute('role','status');
  help.textContent='已恢复全岛视角，可拖动旋转或双指缩放。';
  resetFeedbackTimer=setTimeout(()=>{button.textContent='重置视角';updateGuideCopy();},2200);
 }
}
const familyHidden=[];let familyDecor;
function restoreFamilyContext(){if(familyDecor)familyDecor.visible=false;for(const object of familyHidden)object.visible=true;familyHidden.length=0;}
function showFamilyDisplay(){
 for(const object of [...groups,...trees,car])if(object?.visible){object.visible=false;familyHidden.push(object);}
 if(!familyDisplay)return;familyDisplay.visible=false;
 if(!familyDecor){familyDecor=new T.Group();scene.add(familyDecor);const house=groups[0].clone(true);house.visible=true;house.scale.set(.25,.29,.25);house.rotation.y=-.22;house.position.set(-3.1,.15,1.7);familyDecor.add(house);for(const [i,x,z,scale]of [[0,-4.4,1.2,.38],[1,3.2,2.1,.43],[0,4,1.1,.3]]){const tree=trees[i].clone(true);tree.visible=true;tree.scale.multiplyScalar(scale);tree.position.set(x,.1,z);familyDecor.add(tree);}familyDecor.position.set(familyDisplay.position.x,0,familyDisplay.position.z);}
 familyDecor.visible=true;familyDecor.scale.setScalar(mobile.matches?.38:1);familyDecor.position.y=mobile.matches?.28:0;const target=familyDisplay.position.clone().add(V(0,mobile.matches?3.3:2.6,0));controls.enabled=false;controls.target.copy(target);camera.position.copy(target.clone().add(V(1.15,.6,14)));camera.zoom=1;
 const w=host.clientWidth,h=host.clientHeight,aspect=w/h,half=mobile.matches?3.8:3;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;if(!mobile.matches)camera.setViewOffset(w,h,-w*.1,0,w,h);else camera.clearViewOffset();camera.updateProjectionMatrix();camera.lookAt(target);camera.updateMatrixWorld(true);drawScene();
}
function select(id){if(labelWork===id&&!navigation){tour=false;tourPaused=false;approach=null;mobileFollow=false;updateGuideCopy();window.showIslandWork(id);return;}if(!ready){window.showIslandWork(id);return;}mobileIndex=id-1;updateMobile();if(mobile.matches){tour=false;window.showIslandWork(id);return;}if(reduced.matches){window.showIslandWork(id);return;}tour=false;walkGuide(id);controls.enabled=false;const [x,z]=centers[id-1],to=V(x,1.6,z);approach={id,time:0,fromPos:camera.position.clone(),fromTarget:controls.target.clone(),fromZoom:camera.zoom,toTarget:to,toPos:to.clone().add(V(0,15,21)),toZoom:mobile.matches?2.8:1.65,duration:navigation?.duration||.9};}
function focusMobile(){if(!ready||!mobile.matches)return;const[x,z]=centers[mobileIndex],target=V(x,1,z);controls.target.copy(target);camera.position.copy(target.clone().add(V(0,25,34)));camera.zoom=2.8;camera.updateProjectionMatrix();controls.update();}
function updateMobile(){
 overview.dataset.workSelected=String(!!labelWork);
 const open=document.getElementById('explore-mobile-open');open.disabled=false;open.textContent=labelWork?names[labelWork-1]+' · 查看作品 ↗':'选择作品';open.setAttribute('aria-label',labelWork?'查看作品：'+names[labelWork-1]:'打开全部作品，选择一件作品');
 const progress=document.querySelector('.mobile-progress');if(progress)progress.textContent='正在浏览 '+String(mobileIndex+1).padStart(2,'0')+' / '+names.length;
 if(ready)projectMarkers();
}
function drawScene(){if(navigation)renderer.shadowMap.needsUpdate=true;renderer.info.reset();if(composer&&!mobile.matches)composer.render();else renderer.render(scene,camera);}
function render(now){requestAnimationFrame(render);if(mobile.matches&&now-(render.last||0)<32)return;const elapsed=Math.max(0,(now-(render.last||now))/1000),delta=Math.min(mobile.matches ? .25 : .05,elapsed);render.last=now;if(!gallery.open||gallery.dataset.view!=='overview'||gallery.dataset.catalog==='true'||document.hidden||!ready)return;
 if(navigation&&!tourPaused){navigation.time+=elapsed;const t=Math.min(1,navigation.time/navigation.duration),p=navigation.curve.getPoint(t),direction=navigation.curve.getTangent(t);tianMascot.moveTo(p,direction,true);car.position.y=Craft.groundHeight(p.x,p.z)-.31;car.rotation.y=Math.atan2(direction.x,direction.z);if(t>=1){const id=navigation.id;if(navigation.kind==='road'){navigation=null;if(id)parkGuide(id,false);else{updateMobile();updateGuideCopy();}}else parkGuide(id);}}
 if(approach){approach.time+=delta;const t=Math.min(1,approach.time/approach.duration),e=t*t*(3-2*t);camera.position.lerpVectors(approach.fromPos,approach.toPos,e);controls.target.lerpVectors(approach.fromTarget,approach.toTarget,e);camera.zoom=T.MathUtils.lerp(approach.fromZoom,approach.toZoom,e);camera.updateProjectionMatrix();camera.lookAt(controls.target);if(t>=1){const id=approach.id;approach=null;window.showIslandWork(id);}}
 else if(mobile.matches&&mobileFollow){const ease=1-Math.exp(-delta*4.5),target=car.position.clone().add(V(0,.8,0));controls.target.lerp(target,ease);camera.position.lerp(target.clone().add(V(0,25,34)),ease);camera.zoom=T.MathUtils.lerp(camera.zoom,1.75,ease);camera.updateProjectionMatrix();camera.lookAt(controls.target);}
 else controls.update();
 updateTouchMode();
 if(tour&&!tourPaused&&!navigation){tourPause+=elapsed;if(tourPause>2.8){tourPause=0;tourStopIndex++;if(tourStopIndex<names.length)walkGuide(tourStopIndex+1);else{tour=false;updateGuideCopy();}}}
 if(!reduced.matches){if(tornado)tornado.rotation.y=now*.00025;waves.forEach((wave,i)=>wave.position.y=.6+Math.sin(now*.001+i)*.018);}
 updateExhibitMotion(elapsed,exhibitMotionEnabled);
 if(campusEnvironment)campusEnvironment.update(now);
 if(tianMascot){if(!navigation)tianMascot.moveTo(car.position.clone(),V(0,0,1),false);tianMascot.update(now);car.position.y=Craft.groundHeight(car.position.x,car.position.z)-.31;}
 drawScene();projectMarkers();
}
async function init(){if(initializing)return;initializing=true;try{
 renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,mobile.matches?1.5:1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1;host.appendChild(renderer.domElement);scene=new T.Scene();scene.background=new T.Color('#e8ede7');camera=new T.OrthographicCamera(-20,20,15,-15,.1,180);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minZoom=.7;controls.maxZoom=3.5;controls.minPolarAngle=.55;controls.maxPolarAngle=1.2;controls.target.set(0,1.4,0);controls.addEventListener('change',updateTouchMode);updateTouchMode();
 scene.add(new T.HemisphereLight('#fff9f1','#c5bac9',1.8));const sun=new T.DirectionalLight('#fff4e4',2.2);sun.position.set(-12,20,10);sun.castShadow=true;sun.shadow.mapSize.set(mobile.matches?512:1024,mobile.matches?512:1024);sun.shadow.radius=4;sun.shadow.blurSamples=8;Object.assign(sun.shadow.camera,{left:-24,right:24,top:23,bottom:-22,near:1,far:80});sun.shadow.bias=-.0002;sun.shadow.normalBias=.035;scene.add(sun);scene.add(new T.AmbientLight('#e9e0ef',.25));terrain();scene.traverse(o=>{if(o.isMesh&&o.userData.isIslandRoad)roadTargets.push(o);});controls.addEventListener('start',()=>{if(mobile.matches){mobileFollow=false;tour=false;updateGuideCopy();}});
 window.aliyWorks.forEach((w,i)=>station(zone(i+1),i+1,w));

 campusEnvironment=buildCampusEnvironment(scene,{sun,camera,renderer,getGround:Craft.groundHeight});trees.push(...campusEnvironment.trees);
 makeGuide();batchStaticZones();updateGuideCopy();const renderTarget=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:4});composer=new EffectComposer(renderer,renderTarget);renderer.info.autoReset=false;composer.addPass(new RenderPass(scene,camera));aoPass=new GTAOPass(scene,camera,1,1,undefined,{radius:.5,thickness:.2,samples:16},{radius:6});aoPass.blendIntensity=.18;const originalVisibility=aoPass._overrideVisibility.bind(aoPass);aoPass._overrideVisibility=()=>{originalVisibility();scene.traverse(o=>{if((o.isMesh||o.isSprite)&&o.visible&&(o.material?.transparent||o.userData.excludeFromAO)){o.visible=false;aoPass._visibilityCache.push(o);}});};composer.addPass(aoPass);composer.addPass(new OutputPass());labelsInit();ready=true;overview.dataset.exploreReady='true';document.getElementById('explore-loading').hidden=true;resize();requestAnimationFrame(render);if(returnScene>=1&&returnScene<=names.length)parkGuide(returnScene);updateMobile();const requested=initialWork;if(requested>=1&&requested<=names.length)requestAnimationFrame(()=>window.showIslandWork(requested));
 const down={x:0,y:0},touchPoints=new Map();let gestureMoved=false;
 renderer.domElement.addEventListener('pointerdown',e=>{down.x=e.clientX;down.y=e.clientY;if(mobile.matches){touchPoints.set(e.pointerId,[e.clientX,e.clientY]);if(touchPoints.size>1)gestureMoved=true;}if(tour&&!navigation&&labelWork){tourPaused=true;tourPause=0;mobileFollow=false;updateGuideCopy();}});
 renderer.domElement.addEventListener('pointermove',e=>{const start=touchPoints.get(e.pointerId);if(start&&Math.hypot(e.clientX-start[0],e.clientY-start[1])>7)gestureMoved=true;});
 renderer.domElement.addEventListener('pointercancel',e=>{touchPoints.delete(e.pointerId);if(!touchPoints.size)gestureMoved=false;});
 renderer.domElement.addEventListener('pointerup',e=>{let moved=Math.hypot(e.clientX-down.x,e.clientY-down.y)>7;if(mobile.matches){moved=moved||gestureMoved;touchPoints.delete(e.pointerId);if(!touchPoints.size)gestureMoved=false;}if(moved||approach)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(targets,false)[0];if(hit&&hit.object.userData.work===labelWork&&!navigation){chooseWork(labelWork);return;}if(mobile.matches){const road=ray.intersectObjects(roadTargets,false)[0];if(road&&(!hit||road.distance+.01<hit.distance))walkRoad(road.point);else if(hit)chooseWork(hit.object.userData.work);}else if(hit)chooseWork(hit.object.userData.work);});renderer.domElement.style.cursor='grab';renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fail('WebGL context lost');});
 window.exploreSceneSnapshot=(overview=false)=>{
 if(!overview){drawScene();return renderer.domElement.toDataURL('image/webp',.8);}
 const savedBackground=scene.background;scene.background=new T.Color('#f5f0e7');const saved=camera.clone(),size=renderer.getSize(new T.Vector2()),pixelRatio=renderer.getPixelRatio(),objects=[...groups,...trees,car,familyDecor,familyDisplay].filter(Boolean),visibility=objects.map(o=>o.visible);
 try{groups.forEach(o=>o.visible=true);trees.forEach(o=>o.visible=true);if(car)car.visible=true;if(familyDecor)familyDecor.visible=false;if(familyDisplay)familyDisplay.visible=false;
 renderer.setPixelRatio(1);renderer.setSize(1200,850,false);if(composer){composer.setPixelRatio(1);composer.setSize(1200,850);}const aspect=1200/850;camera.clearViewOffset();camera.left=-15*aspect;camera.right=15*aspect;camera.top=15;camera.bottom=-15;camera.position.copy(homePos);camera.zoom=1.02;camera.lookAt(homeTarget);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);drawScene();return renderer.domElement.toDataURL('image/webp',.8);
 }finally{scene.background=savedBackground;objects.forEach((o,i)=>o.visible=visibility[i]);renderer.setSize(size.x,size.y,false);renderer.setPixelRatio(pixelRatio);if(composer){composer.setSize(size.x,size.y);composer.setPixelRatio(pixelRatio);}camera.copy(saved);camera.updateMatrixWorld(true);drawScene();}
 };
 // Poster capture uses the existing 3D scene and restores all view/visibility state.
 window.exploreShareScene=(id=0)=>{
  if(!ready)throw new Error('Island scene not ready');
  const savedBackground=scene.background;scene.background=new T.Color('#f5f0e7');const saved=camera.clone(),size=renderer.getSize(new T.Vector2()),pixelRatio=renderer.getPixelRatio();
  const objects=[...groups,...trees,car,familyDecor,familyDisplay].filter(Boolean),visibility=objects.map(o=>o.visible);
  try{
   groups.forEach((o,i)=>o.visible=!id||i===id-1);trees.forEach(o=>o.visible=true);if(car)car.visible=!id;if(familyDecor)familyDecor.visible=false;if(familyDisplay)familyDisplay.visible=false;
   const w=1280,h=720;renderer.setPixelRatio(1);renderer.setSize(w,h,false);if(composer){composer.setPixelRatio(1);composer.setSize(w,h);}
   const aspect=w/h;camera.clearViewOffset();camera.left=-15*aspect;camera.right=15*aspect;camera.top=15;camera.bottom=-15;camera.zoom=1.02;
   if(!id){camera.position.set(0,23.5,35.5);camera.lookAt(0,.2,1.5);}
   else{const bounds=new T.Box3().setFromObject(groups[id-1]),center=bounds.getCenter(V(0,0,0));camera.position.copy(center.clone().add(V(11,15,22)));camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);let extent=0;for(const x of[bounds.min.x,bounds.max.x])for(const y of[bounds.min.y,bounds.max.y])for(const z of[bounds.min.z,bounds.max.z]){const p=V(x,y,z).project(camera);extent=Math.max(extent,Math.abs(p.x),Math.abs(p.y));}camera.zoom=Math.min(6,Math.max(1.1,.83/Math.max(.01,extent)*camera.zoom));}
   camera.updateProjectionMatrix();camera.updateMatrixWorld(true);drawScene();const markers=centers.map(([x,z],i)=>{const p=V(x,1.2,z).project(camera);return{id:i+1,x:(p.x*.5+.5)*w,y:(-p.y*.5+.5)*h}});
   return{image:renderer.domElement.toDataURL('image/webp',.9),width:w,height:h,markers};
  }finally{scene.background=savedBackground;objects.forEach((o,i)=>o.visible=visibility[i]);renderer.setSize(size.x,size.y,false);renderer.setPixelRatio(pixelRatio);if(composer){composer.setSize(size.x,size.y);composer.setPixelRatio(pixelRatio);}camera.copy(saved);camera.updateMatrixWorld(true);drawScene();}
 };
 // Dedicated still capture: clone all scene changes; interactive island stays intact.
 window.explorePosterSnapshot=()=>{
  if(!ready)throw Error('Scene not ready');const still=scene.clone(true),size=renderer.getSize(new T.Vector2()),ratio=renderer.getPixelRatio(),tone=renderer.toneMapping,exposure=renderer.toneMappingExposure;
  still.background=new T.Color('#f5f0e7');still.traverse(o=>{if(o.isHemisphereLight)o.intensity=.65;if(o.isAmbientLight)o.intensity=.13;if(o.isDirectionalLight){o.intensity=3.1;o.position.set(-24,30,22);o.shadow.mapSize.set(2048,2048);o.shadow.radius=3;}if(o.isMesh){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;if(b.min.y<-.7&&b.max.x-b.min.x>35&&b.max.z-b.min.z>25){o.geometry=o.geometry.clone();const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++)if(a.getY(i)<0)a.setY(i,a.getY(i)*2.6);a.needsUpdate=true;o.geometry.computeVertexNormals();}if(o.geometry.type==='PlaneGeometry'&&o.geometry.parameters.width>1000){o.position.y=o.material.isShadowMaterial?-2.025:-2.03;o.material=o.material.clone();if(o.material.isShadowMaterial)o.material.opacity=.27;else o.material.color.set('#f5f0e7');}}});
  const rim=new T.DirectionalLight('#dce9ff',.8);rim.position.set(20,15,-20);still.add(rim);const view=new T.PerspectiveCamera(37,1.6,.1,180);view.position.set(24,23,43);view.lookAt(0,.5,1.5);view.updateProjectionMatrix();
  try{renderer.setPixelRatio(1);renderer.setSize(1600,1000,false);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.render(still,view);return{image:renderer.domElement.toDataURL('image/webp',.95),width:1600,height:1000,source:'Existing island scene; cloned perspective, lights and side-depth for poster only'}}finally{renderer.toneMapping=tone;renderer.toneMappingExposure=exposure;renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);drawScene();}
 };
 window.exploreDebug={getGuideLabelMetrics:()=>{const r=guideLabel.getBoundingClientRect(),h=host.getBoundingClientRect(),p=car.position.clone().add(V(0,guideHeight-.12,0)).project(camera);const top=h.top+(-p.y*.5+.5)*h.height;return{labelBottom:r.bottom,guideTop:top,gap:top-r.bottom}},getProjectedLayout:()=>{camera.updateMatrixWorld(true);const r=host.getBoundingClientRect();return groups.map((g,i)=>{const b=new T.Box3().setFromObject(g),points=[];for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z]){const p=V(x,y,z).project(camera);points.push([(p.x*.5+.5)*r.width+r.left,(-p.y*.5+.5)*r.height+r.top]);}return{id:i+1,center:centers[i],bounds:{min:b.min.toArray(),max:b.max.toArray()},screen:{left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))}}})},getStats:()=>({mazeEffects:getMazeEffectStats(),installedProposals:getInstalledProposalStats(),exhibitMotionEnabled,exhibitMotion:getExhibitMotionStats(),ready,labelWork,visibleLabels:markers.filter(b=>b.classList.contains('is-visible')).map(b=>Number(b.dataset.work)),camera:camera.position.toArray(),target:controls.target.toArray(),gesture:mobile.matches?(mobilePanMode?'pan':'rotate'):'desktop',panEnabled:controls.enablePan,zoom:camera.zoom,triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,tour,tourPaused,car:car.position.toArray(),guide:'jojo',guideWork,moving:!!navigation,stop:guideWork?guideDestination(guideWork).toArray():null,approaching:approach?.id||null,following:mobileFollow,roadWalking:navigation?.kind==='road',navigationTarget:navigation?.id,nearbyWorkAtStop:guideWork||null,navigationTime:navigation?.time,navigationDuration:navigation?.duration,lastRender:render.last,pixelRatio:renderer.getPixelRatio(),renderProfile:mobile.matches?'mobile-single-pass':'desktop-composer',environment:campusEnvironment?.getStats(),architecture:groups.map((g,i)=>({id:i+1,form:g.userData.architecture,...g.userData.sceneMetrics}))}),projectRoad:(t=.2,roadIndex=0)=>{camera.updateMatrixWorld(true);const p=(scene.userData.islandRoadCurves[roadIndex]||window.exploreTourPath).getPoint(t).project(camera),r=host.getBoundingClientRect();return{x:r.left+(p.x*.5+.5)*r.width,y:r.top+(-p.y*.5+.5)*r.height};},projectZone:id=>{camera.updateMatrixWorld(true);const[x,z]=centers[id-1],p=V(x,1.5,z).project(camera),rect=host.getBoundingClientRect();return{x:rect.left+(p.x*.5+.5)*rect.width,y:rect.top+(-p.y*.5+.5)*rect.height};}};
 }catch(error){fail(error);}}
function fail(error){ready=false;overview.dataset.exploreFailed='true';document.getElementById('explore-loading').textContent='三维场景暂不可用，可从作品目录继续浏览。';document.getElementById('overview-grid').dataset.open='true';console.error(error);window.exploreFailure=String(error);}
function sync(){if(gallery.open&&gallery.dataset.view==='overview'&&gallery.dataset.catalog!=='true'){init();requestAnimationFrame(()=>{resize();if(ready&&!tour&&!navigation&&!approach&&gallery.dataset.view==='overview')reset();});}}
new MutationObserver(sync).observe(gallery,{attributes:true,attributeFilter:['open','data-view','data-catalog']});window.addEventListener('resize',resize);new ResizeObserver(()=>{if(gallery.open&&gallery.dataset.view==='overview')resize();}).observe(host);window.addEventListener('galleryviewchange',event=>{const id=event.detail.id;activeWork=id;if(ready){if(id)parkGuide(id);restoreFamilyContext();camera.clearViewOffset();if(familyDisplay)familyDisplay.visible=false;if(id){const aspect=host.clientWidth/host.clientHeight,half=mobile.matches?16.8/aspect:15;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;approach=null;tour=false;controls.enabled=false;const[x,z]=centers[id-1],target=V(x,1,z);controls.target.copy(target);camera.position.copy(target.clone().add(V(0,22,30)));camera.zoom=mobile.matches?2.4:1.75;camera.updateProjectionMatrix();camera.lookAt(target);renderer.render(scene,camera);}else reset();document.getElementById('overview-grid').dataset.open='false';document.getElementById('explore-list').setAttribute('aria-expanded','false');}});
document.getElementById('explore-tour').addEventListener('click',()=>{if(!ready)return;if(tour){tourPaused=!tourPaused;mobileFollow=!tourPaused;updateGuideCopy();return;}reset();tour=true;tourStopIndex=0;tourPause=0;walkGuide(1);updateGuideCopy();});document.getElementById('explore-reset').addEventListener('click',()=>reset({announce:true}));
document.getElementById('explore-list').addEventListener('click',e=>{const grid=document.getElementById('overview-grid'),open=grid.dataset.open!=='true';grid.dataset.open=String(open);e.currentTarget.setAttribute('aria-expanded',String(open));});
document.getElementById('explore-prev').addEventListener('click',()=>{mobileIndex=(mobileIndex+names.length-1)%names.length;walkGuide(mobileIndex+1);updateMobile();});document.getElementById('explore-next').addEventListener('click',()=>{mobileIndex=(mobileIndex+1)%names.length;walkGuide(mobileIndex+1);updateMobile();});document.getElementById('explore-mobile-open').addEventListener('click',()=>{if(labelWork)select(labelWork);else document.getElementById('close-gallery').click();});

if(new URLSearchParams(location.search).has("work")||new URLSearchParams(location.search).get("view")!=="welcome")window.openIslandGallery();
// The adapted shell opens before module evaluation; initialize its existing open view too.
sync();

document.getElementById('time-of-day').addEventListener('click',()=>{campusEnvironment?.toggle();drawScene();});

const motionButton=document.createElement('button');motionButton.id='exhibit-motion-toggle';motionButton.type='button';document.querySelector('.explore-controls').append(motionButton);function syncMotionButton(){motionButton.textContent='展品动态：'+(exhibitMotionEnabled?'开':'关');motionButton.setAttribute('aria-pressed',String(exhibitMotionEnabled));motionButton.title=exhibitMotionEnabled?'暂停魔方与星球自转':'启动魔方与星球自转';}motionButton.onclick=()=>{exhibitMotionOverride=true;exhibitMotionEnabled=!exhibitMotionEnabled;syncMotionButton()};reduced.addEventListener('change',()=>{if(!exhibitMotionOverride){exhibitMotionEnabled=!reduced.matches;syncMotionButton()}});syncMotionButton();
