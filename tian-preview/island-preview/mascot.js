// Exhibition effects and a new stylized toy based on the supplied video reference.
export function buildMascot(THREE,scene){
 const root=new THREE.Group();scene.add(root);root.position.y=.45;root.rotation.y=.35;
 const material=c=>new THREE.MeshStandardMaterial({color:c,roughness:.72,flatShading:true});
 const palette={coat:material('#25243e'),lapel:material('#635174'),hair:material('#18253f'),skin:material('#d0a57c'),gold:new THREE.MeshStandardMaterial({color:'#d5ad56',metalness:.55,roughness:.35}),boot:material('#323747'),glove:material('#b2afa4')};
 function part(g,m,x,y,z,parent=root){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const box=(w,h,d,m,x,y,z,p)=>part(new THREE.BoxGeometry(w,h,d),m,x,y,z,p);
 const ball=(r,m,x,y,z,p)=>part(new THREE.IcosahedronGeometry(r,2),m,x,y,z,p);
 part(new THREE.CylinderGeometry(2.05,2.3,.5,48),material('#c8b995'),0,.05,0);
 part(new THREE.CylinderGeometry(1.85,2.05,.16,48),material('#e0d4b4'),0,.37,0);
 const legs=[],knees=[],boots=[];let walking=false,phase=0,motionDistance=0,walkWeight=0,lastPose=null,lastUpdate=0,targetYaw=0;const torso=new THREE.Group();torso.position.y=.4;root.add(torso);
 for(const side of [-1,1]){const hip=new THREE.Group();hip.position.set(side*.33,1.55,0);torso.add(hip);legs.push(hip);box(.43,.65,.5,palette.coat,0,-.325,0,hip);const knee=new THREE.Group();knee.position.y=-.65;hip.add(knee);knees.push(knee);box(.41,.55,.48,palette.coat,0,-.275,0,knee);const boot=new THREE.Group();boot.position.y=-.55;knee.add(boot);boots.push(boot);box(.52,.37,.86,palette.boot,0,0,.16,boot);box(.5,.09,.8,palette.gold,0,.13,.15,boot);}
 const body=part(new THREE.CylinderGeometry(.53,.66,1.35,7),palette.coat,0,1.87,0,torso);
 box(1.08,.13,.67,palette.gold,0,1.36,.03,torso);
 for(const side of [-1,1]){const tail=box(.44,1.15,.14,palette.lapel,side*.5,1.15,-.24,torso);tail.rotation.z=side*.18;const collar=box(.41,.84,.17,palette.lapel,side*.43,2.57,-.1,torso);collar.rotation.z=side*-.55;}
 for(const y of [1.58,1.92,2.26]){const b=part(new THREE.CylinderGeometry(.095,.095,.07,14),palette.gold,0,y,.51,torso);b.rotation.x=Math.PI/2;}
 box(.17,.55,.14,palette.gold,0,1.55,.53,torso);
 const head=new THREE.Group();head.position.set(0,3.12,.02);torso.add(head);
 part(new THREE.CylinderGeometry(.56,.38,.77,7),palette.skin,0,-.03,0,head);
 ball(.59,palette.hair,0,.26,-.09,head);
 for(let i=0;i<13;i++){const a=(i/12-.5)*Math.PI*1.35;const spike=part(new THREE.ConeGeometry(.19,.72+(i%3)*.11,4),palette.hair,Math.sin(a)*.53,.44+Math.cos(a)*.13,-.08+(i%2)*.07,head);spike.rotation.z=-a*.9;spike.rotation.x=-.25;}
 for(const side of [-1,1]){box(.22,.055,.06,palette.coat,side*.22,.08,.47,head);const brow=box(.27,.065,.07,palette.hair,side*.22,.18,.49,head);brow.rotation.z=side*.15;ball(.055,palette.gold,side*.54,-.2,0,head);}
 part(new THREE.ConeGeometry(.085,.26,4),palette.skin,0,-.03,.52,head).rotation.x=Math.PI/2;
 box(.2,.035,.035,palette.coat,0,-.27,.4,head);
 let waveUntil=0;const arms=[];
 for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.57,2.35,0);torso.add(arm);arm.rotation.z=side*.24;ball(.3,palette.boot,side*.05,-.07,0,arm);box(.14,.3,.35,palette.gold,side*.21,-.07,.02,arm);box(.29,.7,.31,palette.coat,0,-.45,0,arm);box(.34,.5,.35,palette.glove,0,-.94,.03,arm);for(let i=0;i<3;i++)box(.38,.055,.38,palette.gold,0,-.78-i*.13,.03,arm);ball(.19,palette.glove,0,-1.23,.07,arm);arms.push(arm);}
 for(let i=0;i<10;i++){const link=part(new THREE.TorusGeometry(.08,.026,4,10),palette.gold,.4-i*.065,2.46-Math.sin(i/9*Math.PI)*.3,.48,torso);link.rotation.y=i%2?1.2:0;}
 let halo=part(new THREE.TorusGeometry(2.23,.045,5,64),palette.gold,0,.55,0);halo.rotation.x=-Math.PI/2;halo.visible=false;
 if(typeof window!=='undefined'&&matchMedia('(max-width:700px), (pointer:coarse)').matches){root.traverse(n=>{if(n.isMesh)n.castShadow=false;});const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,3,32,32,31);g.addColorStop(0,'rgba(45,39,25,.22)');g.addColorStop(1,'rgba(45,39,25,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.6,1.05),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.58;root.add(shadow);}
 const soleY=.4+1.55-.65-.55-.185,groundY=.12,scale=.78;
 const face=d=>{if(Math.hypot(d.x,d.z)>.0001)targetYaw=Math.atan2(d.x,d.z);};
 return{root,face,moveTo:(p,d,moving)=>{const step=lastPose?Math.hypot(p.x-lastPose.x,p.z-lastPose.z):0;walking=!!moving;if(walking){motionDistance+=step;phase+=Math.min(step,.32)/1.18*Math.PI*2;face(d);}if(!lastPose){face(d);root.rotation.y=targetYaw;}root.position.set(p.x,groundY-soleY*scale,p.z);lastPose={x:p.x,z:p.z};},wave:()=>{waveUntil=performance.now()+2600;},update:t=>{const dt=lastUpdate?Math.min(.1,(t-lastUpdate)/1000):.016;lastUpdate=t;const turn=targetYaw-root.rotation.y;root.rotation.y+=Math.atan2(Math.sin(turn),Math.cos(turn))*(1-Math.exp(-14*dt));walkWeight+=(Number(walking)-walkWeight)*(1-Math.exp(-12*dt));const swing=Math.sin(phase)*.32*walkWeight;
 // Keep the stance foot on the ground while the hips travel forward.
 const drop=.065*walkWeight;
 for(let i=0;i<2;i++){
  const cycle=(phase/(2*Math.PI)+i*.5)%1;
  const support=cycle<.6;
  const u=support?cycle/.6:(cycle-.6)/.4;
  const travel=(support?.5-u:-.5+u*u*(3-2*u))*1.18*.6/scale*walkWeight;
  const lift=support?0:.24*Math.sin(Math.PI*u)**2*walkWeight;
  const down=1.2-drop-lift;
  const bend=Math.acos(THREE.MathUtils.clamp((travel*travel+down*down-.65**2-.55**2)/(2*.65*.55),-1,1));
  const hip=-Math.atan2(travel,down)-Math.atan2(.55*Math.sin(bend),.65+.55*Math.cos(bend));
  legs[i].rotation.x=hip;
  knees[i].rotation.x=bend;
  boots[i].rotation.x=-hip-bend;
 }
 torso.position.y=.4-drop;
 const waving=t<waveUntil;arms[0].rotation.x=-swing*.65;arms[1].rotation.x=swing*.65;arms[1].rotation.z=waving?2.2+Math.sin(t*.012)*.25:.24;torso.rotation.y=0;},getGait:()=>({phase,motionDistance,walking,walkWeight,yaw:root.rotation.y,hips:legs.map(n=>n.rotation.x),knees:knees.map(n=>n.rotation.x),position:root.position.toArray()}),reference:'Existing JOJO toy with hip-pivot, distance-synchronized walking'};
}

export function entranceMarkup(id,zone,art){
 const themes=['comic','stadium','book','data','maze','cinema','cube','space'];
 const captions=['让想象跃出画框','比赛，即将开始','翻开另一个世界','让数字开始讲故事','走进未知的路径','一场缩小后的冒险','旋转，寻找答案','轨道入口已开启'];
 let visual='';
 if(id===0)visual=`<div class="comic-panels">${[0,1,2].map(i=>`<img src="${art['family'+i]}" alt="">`).join('')}</div>`;
 if(id===1)visual='<div class="pitch-lines"><i></i><b>⚽</b></div>';
 if(id===2)visual=`<div class="turning-book"><i></i><img src="${art.story}" alt=""></div>`;
 if(id===3)visual='<div class="rising-bars">'+[1,2,3,4,5,6,7].map((n)=>`<i style="--n:${n}"></i>`).join('')+'</div>';
 if(id===4)visual='<svg class="maze-lines" viewBox="0 0 360 180"><path d="M10 150H60V30H150V100H95V150H210V30H300V100H245V155H350"/></svg>';
 if(id===5)visual=`<img class="cinema-frame" src="${art.jojo}" alt="视频原作画面"><div class="cinema-ring"></div>`;
 if(id===6)visual='<div class="spinning-cube">'+Array.from({length:9},(_,i)=>`<i style="--n:${i}"></i>`).join('')+'</div>';
 if(id===7)visual='<div class="orbit-gate"><i></i><i></i><b>✦</b></div>';
 return `<div class="entrance-scene theme-${themes[id]}">${visual}<div class="entrance-copy"><span>0${id+1} / THE CREATIVE GROUNDS</span><h2>${zone.name}</h2><p>${captions[id]}</p></div><button id="skip-entrance">跳过开场 ↗</button></div>`;
}
