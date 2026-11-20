import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const palette={cream:'#e9dfc6',teal:'#355c57',mint:'#89b7ac',gold:'#c79c53',ink:'#213e39'};
const mat=(c,extra={})=>new T.MeshStandardMaterial({color:palette[c]||c,roughness:.55,...extra});
function shape(g,m,x,y,z,p){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
function block(w,h,d,c,x,y,z,p,r=.12){return shape(new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)),typeof c==='string'?mat(c):c,x,y,z,p);}
function disk(r,h,c,x,y,z,p){return shape(new T.CylinderGeometry(r,r,h,48),mat(c),x,y,z,p);}
function line(points,p,color='gold',radius=.018){return shape(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a))),32,radius,6,false),mat(color,{metalness:.45}),0,0,0,p);}
function football(p,x,y,z,r){const g=new T.Group();g.position.set(x,y,z);p.add(g);shape(new T.SphereGeometry(r,24,16),mat('cream'),0,0,0,g);for(const[a,b]of[[0,0],[1.25,.45],[2.5,-.3],[3.7,.6],[5,-.4],[0,1.25]]){const n=new T.Vector3(Math.sin(a)*Math.cos(b),Math.sin(b),Math.cos(a)*Math.cos(b)),patch=shape(new T.CircleGeometry(r*.27,5),mat('ink'),...n.clone().multiplyScalar(r*1.003).toArray(),g);patch.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),n);}return g;}
export function dataSculpture(){const root=new T.Group(),bars=[];block(5,.35,3.5,'teal',0,.22,0,root,.16);block(4.72,.07,3.22,'cream',0,.42,0,root,.025);
 const heights=[.85,1.25,1.75,1.42,.95],positions=[];
 for(let i=0;i<5;i++){const a=(i-2)*.49,x=Math.sin(a)*2,z=-Math.cos(a)*1.06+.2,h=heights[i];const m=mat(i%2?'#a6c5b7':'#639c93',{transparent:true,opacity:.76,metalness:.1,roughness:.22});const b=block(.56,h,.56,m,x,.48+h/2,z,root,.09);b.userData.dynamicExhibit=true;b.castShadow=false;bars.push({mesh:b,height:h,phase:i*.8});disk(.35,.05,'gold',x,.48,z,root);positions.push([x,.52,z]);}
 line(positions,root);disk(.65,.12,'teal',0,.52,.6,root);const ball=football(root,0,1.12,.6,.52);
 // A small field motif keeps the data sculpture tied to football rather than a generic chart.
 line([[-1.8,.48,.95],[-1.8,.48,1.35],[1.8,.48,1.35],[1.8,.48,.95]],root,'gold',.012);
 return{root,update(t,on=true){for(const b of bars){const s=on?1+Math.sin(t*.65+b.phase)*.07:1;b.mesh.scale.y=s;b.mesh.position.y=.48+b.height*s/2;}},stats(){return{bars:bars.length,maxPulse:.07,ball:!!ball,scales:bars.map(b=>b.mesh.scale.y),visibleBars:bars.filter(b=>b.mesh.visible).length}}};}
export function desktopCompanion(){const root=new T.Group();block(4.5,.25,2.8,'teal',0,.18,0,root,.12);block(4.2,.08,2.5,'cream',0,.35,0,root,.035);
 block(2.5,2.25,1.25,'cream',-.4,1.54,-.1,root,.23);block(2.13,1.6,.12,'teal',-.4,1.72,.56,root,.14);block(1.89,1.36,.045,'ink',-.4,1.73,.635,root,.12);
 const cube=new T.Group();cube.position.set(1.3,.56,-.12);cube.rotation.set(0,.28,0);root.add(cube);const geo=new T.TetrahedronGeometry(.48,0),normal=new T.Vector3().fromBufferAttribute(geo.attributes.normal,0).normalize();geo.applyQuaternion(new T.Quaternion().setFromUnitVectors(normal,new T.Vector3(0,-1,0)));
 const colors=[],faceColors=['#d9926a','#6f9b9d','#bb8bb0','#dec079'];for(let i=0;i<geo.attributes.position.count;i++){const c=new T.Color(faceColors[Math.floor(i/3)%4]);colors.push(c.r,c.g,c.b);}geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));shape(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:.78,flatShading:true}),0,0,0,cube);
 cube.add(new T.LineSegments(new T.EdgesGeometry(geo),new T.LineBasicMaterial({color:'#465a58'})));
 const ps=geo.attributes.position,lines=[];for(let i=0;i<ps.count;i+=3){const vs=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(ps,i+k));for(let j=0;j<3;j++)for(const t of[1/3,2/3])lines.push(...vs[j].clone().lerp(vs[(j+1)%3],t).multiplyScalar(1.005).toArray(),...vs[j].clone().lerp(vs[(j+2)%3],t).multiplyScalar(1.005).toArray());}const lg=new T.BufferGeometry();lg.setAttribute('position',new T.Float32BufferAttribute(lines,3));cube.add(new T.LineSegments(lg,new T.LineBasicMaterial({color:'#526563'})));cube.traverse(o=>{if(o.isMesh)o.castShadow=false});
 const expression=new T.Group();expression.userData.dynamicExhibit=true;root.add(expression);const pixels=mat('mint',{emissive:'#4f8a78',emissiveIntensity:.2}),eyes=[];
 for(const x of[-.78,-.02]){const eye=block(.16,.25,.025,pixels,x,1.84,.672,expression,.005);eye.castShadow=false;eyes.push(eye);}
 for(const[x,y]of[[-.65,1.49],[-.49,1.43],[-.33,1.43],[-.17,1.49]]){const pixel=block(.14,.07,.025,pixels,x,y,.672,expression,.004);pixel.castShadow=false;}
 block(2.7,.19,1.07,'cream',-.4,.52,.87,root,.085);for(let i=0;i<5;i++)block(.29,.025,.12,'teal',-.98+i*.29,.63,.95,root,.014);disk(.055,.03,'gold',.5,.72,.62,root);
 // One analogue timer replaces the pair of unrelated puzzle ornaments.
 const timer=new T.Group();timer.position.set(1.35,.72,.98);timer.scale.setScalar(.62);root.add(timer);const body=shape(new T.CylinderGeometry(.5,.5,.28,40),mat('gold'),0,0,0,timer);body.rotation.x=Math.PI/2;const face=shape(new T.CircleGeometry(.42,40),mat('cream'),0,0,.15,timer);line([[0,0,.17],[0,.27,.17]],timer,'teal',.02);line([[0,0,.17],[.19,-.1,.17]],timer,'teal',.02);for(let i=0;i<12;i++){const a=i*Math.PI/6;block(.025,.065,.015,'teal',Math.sin(a)*.35,Math.cos(a)*.35,.17,timer,.004);}disk(.12,.09,'teal',0,.55,0,timer);
 return{root,update(t,on=true){const phase=t%4.6,blink=on&&phase>4.32&&phase<4.52;for(const eye of eyes)eye.scale.y=blink?.13:1;},stats(){return{computer:1,screenCharacter:'pixel-face',puzzleShape:'tetrahedral',timer:1,loosePuzzles:1,puzzlePosition:cube.position.toArray(),puzzleDepthScale:cube.scale.z,eyeScale:eyes[0].scale.y,visibleCharacterMeshes:expression.children.filter(o=>o.isMesh&&o.visible).length}}};}
