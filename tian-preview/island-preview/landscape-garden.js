import * as T from 'three';
import {buildLandscapeDetails} from './landscape-details.js';
const material=c=>new T.MeshStandardMaterial({color:c,roughness:.95});
export function buildLandscapeGarden(scene,ground){
 buildLandscapeDetails(scene,ground);
 const stone=material('#c7b99d'),paving=material('#e4d7bc');
 // Low, irregular shared terraces group works without a podium under each object.
 function terrace(cx,cz,rx,rz){const n=64,vs=[],ix=[];for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,r=1;const x=cx+Math.cos(a)*rx*r,z=cz+Math.sin(a)*rz*r;vs.push(x,ground(x,z)+.12,z,x,.16,z);}for(let i=0;i<n;i++){let k=i*2;ix.push(k,k+1,k+2,k+1,k+3,k+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vs,3));g.setIndex(ix);g.computeVertexNormals();const wall=new T.Mesh(g,stone);wall.castShadow=true;wall.receiveShadow=true;scene.add(wall);
 const pv=[],px=[];for(let j=0;j<=24;j++)for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,x=cx+Math.cos(a)*rx*j/24,z=cz+Math.sin(a)*rz*j/24;pv.push(x,ground(x,z)+.15,z);if(j<24&&i<n){const k=j*(n+1)+i;px.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);}}const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(pv,3));pg.setIndex(px);pg.computeVertexNormals();const top=new T.Mesh(pg,paving);top.receiveShadow=true;scene.add(top);}
 terrace(10.5,0,6.7,7.6);terrace(-4.5,10,10,3.8);
 // Organic planted drifts. Instancing keeps foliage independent of draw-call count.
 const beds=[[-17,-8,2.1,1.2],[-10,-12,3,1.1],[1,-11,2.4,1.3],[13,-9,2,1.4],[17,3,1.1,2.7],[11,10,2.2,1.2],[3,13,3,1.1],[-11,12,2.4,1.2],[-17,4,1.3,2.1],[-2,-2,2.4,1.1],[3,1,1.2,1.5],[-4,4,1.7,.65]];
 const grass=new T.InstancedMesh(new T.ConeGeometry(.045,.55,3),material('#a8a06e'),beds.length*42),flowers=new T.InstancedMesh(new T.IcosahedronGeometry(.065,0),material('#eee7c8'),beds.length*12);grass.castShadow=false;flowers.castShadow=false;const d=new T.Object3D();let gi=0,fi=0,seed=417;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 for(const[cx,cz,rx,rz]of beds){for(let i=0;i<42;i++){const a=rand()*6.28,r=Math.sqrt(rand()),x=cx+Math.cos(a)*r*rx,z=cz+Math.sin(a)*r*rz,h=.45+rand()*.7;d.position.set(x,ground(x,z)+h*.24,z);d.rotation.set((rand()-.5)*.4,a,(rand()-.5)*.4);d.scale.set(.7,h,.7);d.updateMatrix();grass.setMatrixAt(gi,d.matrix);grass.setColorAt(gi++,new T.Color(i%3?'#a9a273':'#7c8e65'));}for(let i=0;i<12;i++){const a=rand()*6.28,r=rand(),x=cx+Math.cos(a)*r*rx,z=cz+Math.sin(a)*r*rz;d.position.set(x,ground(x,z)+.25+rand()*.18,z);d.rotation.set(0,0,0);d.scale.setScalar(1+rand()*.5);d.updateMatrix();flowers.setMatrixAt(fi,d.matrix);flowers.setColorAt(fi++,new T.Color(i%3?'#e8dcad':'#c29549'));}}
 scene.add(grass,flowers);
 // Small planted junction with curved seating, rather than an empty circular plaza.
 const points=[];for(let i=0;i<=28;i++){const a=.1+i/28*1.9;const x=1.2+Math.cos(a)*2,z=.8+Math.sin(a)*2;points.push(new T.Vector3(x,ground(x,z)+.38,z));}const bench=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),28,.15,6,false),material('#b89966'));bench.castShadow=true;scene.add(bench);
}
