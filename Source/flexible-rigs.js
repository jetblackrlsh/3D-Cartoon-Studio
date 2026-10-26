// SPDX-License-Identifier: GPL-3.0-only
// Cast profile and wardrobe integration, modified 2026-10-26.
import {proportionDimensions} from './cast-library.js';
import {dressCast} from './cast-wardrobe.js';
import * as THREE from 'three';
import curves from './preset-curves.json';
export const presetCatalog=Object.entries(curves).map(([name,v])=>({name,...v.info}));
const RAD=Math.PI/180,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function createFlexibleRig(kind,design={},H){
 const {mat,mesh,box,cyl,orb}=H,skate=kind!=='blank-human';
 const defaults=kind==='skater'?{skin:'#ba805d',top:'#7753c7',legs:'#25304c',shoes:'#e4edf5',hair:'#342434',helmet:'#9ce9ff'}:{skin:'#c6cdd7',top:'#a9b5c5',legs:'#8391a6',shoes:'#58657b',hair:'#3d4055',helmet:'#9baac0'};
 design={...design,top:design.top||design.shirt,legs:design.legs||design.pants};const style={...defaults};for(const k of Object.keys(defaults))if(/^#[0-9a-fA-F]{6}$/.test(design[k]||''))style[k]=design[k];
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);let height=skate?1.72:2.62;
 const base=skate?{hip:.85,hipW:.11,thigh:.4,shin:.38,shoulder:1.32,shoulderW:.22,arm:.28,fore:.26,head:1.55,headR:.13,torsoR:.145,torsoH:.4,limbR:.065}:{hip:1,hipW:.16,thigh:.47,shin:.44,shoulder:1.84,shoulderW:.39,arm:.47,fore:.43,head:2.25,headR:.34,torsoR:.31,torsoH:.78,limbR:.12};
 const d=skate?base:proportionDimensions(base,design);if(design.body&&!skate)height=d.head+d.headR+.08;
 const skin=mat('cloth',style.skin),shirt=mat('cloth',style.top),pants=mat('cloth',style.legs),shoe=mat('cloth',style.shoes);
 const torso=cyl(body,d.torsoR,d.torsoH,shirt,0,(d.hip+d.shoulder)/2,0,skate?10:8);box(body,d.hipW*2.7,.13,d.torsoR*1.3,pants,0,d.hip,0);cyl(body,skate?.05:.1,.2,skin,0,d.head-d.headR,0);
 const head=new THREE.Group();head.position.y=d.head;body.add(head);orb(head,d.headR,skin,0,0,0);
 const face={};const eyeMat=mat('cloth',design.eye||'#172437');
 for(const [i,side] of ['L','R'].entries()){let sign=i===0?-1:1;face['eye'+side]=orb(head,d.headR*.105,eyeMat,sign*d.headR*.35,d.headR*.14,d.headR*.90);face['brow'+side]=box(head,d.headR*.32,d.headR*.045,d.headR*.06,eyeMat,sign*d.headR*.35,d.headR*.37,d.headR*.89);}
 face.mouth=orb(head,d.headR*.1,eyeMat,0,-d.headR*.35,d.headR*.94);face.mouth.scale.set(1.5,.4,.25);
 if(design.hairVisible&&!design.body){const cap=mesh(head,new THREE.SphereGeometry(d.headR*1.04,12,8,0,Math.PI*2,0,Math.PI*.55),mat('cloth',style.hair),0,.02,0);cap.rotation.x=-.2;}
 if(skate&&design.helmetVisible!==false){mesh(head,new THREE.SphereGeometry(d.headR*1.07,12,8,0,Math.PI*2,0,Math.PI*.52),mat('cloth',style.helmet),0,0,0);}
 const arms=[],forearms=[],legs=[],shins=[],hands=[],shoes=[],handVariants=[];
 for(const side of [-1,1]){
  const shoulder=new THREE.Group();shoulder.position.set(side*d.shoulderW,d.shoulder,0);body.add(shoulder);cyl(shoulder,d.limbR,d.arm,shirt,0,-d.arm/2,0);const elbow=new THREE.Group();elbow.position.y=-d.arm;shoulder.add(elbow);cyl(elbow,d.limbR*.74,d.fore,skin,0,-d.fore/2,0);
  const hand=new THREE.Group();hand.position.y=-d.fore;elbow.add(hand);const variants={};const size=skate?.07:.17;
  for(const name of ['open','fist','point']){const g=new THREE.Group();hand.add(g);variants[name]=g;box(g,size,size*.9,size*.65,skin,0,-size*.35,0);if(name!=='fist'){for(let f=0;f<(name==='point'?1:4);f++)box(g,size*.16,size*(name==='point'?.95:.7),size*.25,skin,(f-1.5)*size*.2,-size*(name==='point'?1.1:.95),0);}g.visible=name==='open';}
  const hip=new THREE.Group();hip.position.set(side*d.hipW,d.hip,0);body.add(hip);cyl(hip,d.limbR*1.15,d.thigh,pants,0,-d.thigh/2,0);const knee=new THREE.Group();knee.position.y=-d.thigh;hip.add(knee);cyl(knee,d.limbR*.95,d.shin,pants,0,-d.shin/2,0);const foot=box(knee,skate?.12:.24,skate?.09:.16,skate?.24:.4,shoe,0,-d.shin,skate?.045:.06);
  arms.push(shoulder);forearms.push(elbow);hands.push(hand);handVariants.push(variants);legs.push(hip);shins.push(knee);shoes.push(foot);
 }
 const paper=new THREE.Group(),trapeze=new THREE.Group();root.add(paper,trapeze);paper.visible=false;trapeze.visible=false;
 const h=Number(design.height);const baseScale=Number.isFinite(h)?clamp(h,.8,3.5)/height:1;
 const r={root,body,head,torso,arms,forearms,legs,shins,hands,shoes,handVariants,face,paper,trapeze,kind,style,helmetVisible:design.helmetVisible,dimensions:d,height,baseScale,flexible:true};if(!skate)dressCast(r,design,H);return r;
}
export function samplePreset(name,q,options={}){
 const c=curves[name];if(!c)throw Error('Unknown 3D preset '+name);const frames=c.frames;const at=clamp(q,0,1)*(frames.length-1),i=Math.floor(at),f=at-i,a=frames[i].channels,b=frames[Math.min(i+1,frames.length-1)].channels;const out={},intensity=clamp(options.intensity??1,.25,1.5);
 for(const key of new Set([...Object.keys(a),...Object.keys(b)])){const target=options.mirror?key.replace(/L|R/g,x=>x==='L'?'R':'L'):key;const o={};for(const prop of new Set([...Object.keys(a[key]||{}),...Object.keys(b[key]||{})])){let base=['scaleX','scaleY','opacity'].includes(prop)?1:0;if(prop==='opacity'&&/hand.*(Fist|Point)/.test(key))base=0;let v=(a[key]?.[prop]??base)*(1-f)+(b[key]?.[prop]??base)*f;if(prop!=='opacity')v=base+(v-base)*intensity;if(options.mirror&&['rotation','x'].includes(prop))v=-v;o[prop]=v;}out[target]=o;}
 return out;
}
export function applyPreset(r,name,t,q,options={}){
 if(!curves[name]||!r.arms||r.arms.length!==2||!r.shins||r.quad)return false;
 const phase=['idle','breathe','walk','run'].includes(name)?(((t%3)+3)%3)/3:q;const c=samplePreset(name,phase,options),angle=k=>(c[k]?.rotation||0)*RAD,unit=(r.height||2.62)/260;
 r.body.position.set((c.root?.x||0)*unit,-(c.root?.y||0)*unit,0);r.body.rotation.set(0,0,0);r.body.scale.y=c.torso?.scaleY??1;r.head.rotation.set(0,0,0);r.arms.forEach(x=>x.rotation.set(0,0,0));r.forearms.forEach(x=>x.rotation.set(0,0,0));r.legs.forEach(x=>x.rotation.set(0,0,0));r.shins.forEach(x=>x.rotation.set(0,0,0));r.hands.forEach(x=>x.rotation.set(0,0,0));
 const locomotion=['walk','run'].includes(name),fold=['sit','stand-up','crouch','kneel'].includes(name),forward=['punch-jab','punch-cross','punch-uppercut','kick-front','shoot-pistol','shoot-rifle','carry','push','reach','point','cast-projectile','heal'].includes(name);
 r.body.position.y-=(c.pelvis?.y||0)*unit;r.body.rotation.x=angle('torso')+angle('pelvis');r.head.rotation.x=['nod','bow','sad','crying','tired','embarrassed'].includes(name)?angle('neck'):0;r.head.rotation.z=['nod','bow','sad','crying','tired','embarrassed'].includes(name)?0:-angle('neck');
 for(const [i,side] of ['L','R'].entries()){const sign=i===0?1:-1;
  if(locomotion){r.arms[i].rotation.x=angle('shoulder'+side);r.forearms[i].rotation.x=-Math.abs(angle('elbow'+side));r.legs[i].rotation.x=angle('hip'+side);r.shins[i].rotation.x=Math.abs(angle('knee'+side));}
  else{r.arms[i].rotation[forward?'x':'z']=-sign*angle('shoulder'+side);if(!forward)r.arms[i].rotation.z=-angle('shoulder'+side);r.forearms[i].rotation[forward?'x':'z']=forward?-Math.abs(angle('elbow'+side)):-angle('elbow'+side);r.legs[i].rotation[fold||name==='kick-front'?'x':'z']=fold?-Math.abs(angle('hip'+side)):-angle('hip'+side);r.shins[i].rotation[fold||name==='kick-front'?'x':'z']=fold?Math.abs(angle('knee'+side)):-angle('knee'+side);}
  r.hands[i].rotation.z=-angle('wrist'+side);
  if(r.handVariants){const vals=['open','fist','point'].map(n=>[n,c['hand'+side+n[0].toUpperCase()+n.slice(1)]?.opacity??(n==='open'?1:0)]).sort((a,b)=>b[1]-a[1]);for(const [n,g]of Object.entries(r.handVariants[i]))g.visible=n===vals[0][0];}
 }
 if(name==='punch-cross')r.body.rotation.y=-Math.sin(Math.PI*q)*.45;
 if(name==='weapon-slash')r.body.rotation.y=Math.sin(2*Math.PI*q)*.35;
 if(name==='kick-front'){const active=Math.abs(angle('hipR'))>=Math.abs(angle('hipL'))?1:0;r.legs[active].rotation.x=-Math.abs(angle(active?'hipR':'hipL'));r.shins[active].rotation.x=Math.abs(angle(active?'kneeR':'kneeL'));}
 if(['shoot-pistol','shoot-rifle'].includes(name)){
  r.body.position.z=-Math.abs(c.root?.x||0)*unit;r.body.position.x=0;const main=options.mirror?0:1,other=1-main,sign=main===1?1:-1,len=-r.forearms[main].position.y-r.hands[main].position.y,sy=r.arms[main].position.y,u=(r.height||2.62)/2.62;
  const weight=clamp(Math.max(Math.abs(angle('shoulderR')),name==='shoot-rifle'?Math.abs(angle('shoulderL')):0)/(Math.PI/2),0,1);
  r.root.updateMatrixWorld(true);
  const target=new THREE.Vector3((name==='shoot-rifle'?-.06:.12)*len*sign,sy-.3*u,.55*len);
  const blend=(i,target)=>{const current=r.body.worldToLocal(r.hands[i].getWorldPosition(new THREE.Vector3()));solveHand(r,i,current.lerp(target,weight),new THREE.Vector3((i===0?-1:1)*len,sy-.6*u,.1));};
  blend(main,target);if(name==='shoot-rifle')blend(other,new THREE.Vector3(target.x,target.y,.82*len));
 }
 if(r.face)for(const [k,o]of Object.entries(r.face)){const p=c[k]||{};o.rotation.z=-(p.rotation||0)*RAD;o.scale.x=p.scaleX??(k==='mouth'?1.5:1);o.scale.y=p.scaleY??(k==='mouth'?.4:1);}
 if(r.shoes?.length){r.root.updateMatrixWorld(true);const inverse=r.root.matrixWorld.clone().invert();let low=Infinity;for(const shoe of r.shoes){shoe.geometry.computeBoundingBox();const box=shoe.geometry.boundingBox.clone().applyMatrix4(inverse.clone().multiply(shoe.matrixWorld));low=Math.min(low,box.min.y);}const lift=Math.max(0,-(c.root?.y||0)*unit);if(Number.isFinite(low))r.body.position.y+=lift-low;r.root.updateMatrixWorld(true);}
 r.preset=name;return true;
}
export function exportPreset(name,duration=3,options={}){if(!curves[name]||!Number.isFinite(duration)||duration<=0||duration>30)throw Error('Invalid preset or duration');return {format:'jetmotion3d',version:1,name,duration,options:{intensity:clamp(options.intensity??1,.25,1.5),mirror:!!options.mirror},source:'Mapped from the verified 2D articulated preset catalog; authored 3D axis adaptation'};}

export function prepareActionProps(r,H){if(!r.hands||r.hands.length!==2)return;const {mat,mesh,box,cyl,orb}=H;r.actionProps={};for(const kind of ['sword','pistol','rifle','shield','energy-orb','barrier','aura']){const g=new THREE.Group();(kind==='aura'?r.body:r.hands[1]).add(g);g.visible=false;r.actionProps[kind]=g;const m=mat(kind==='energy-orb'||kind==='aura'||kind==='barrier'?'stars':'metal',kind==='energy-orb'||kind==='aura'||kind==='barrier'?'#ad8ce8':'#9bafc1');const u=(r.height||2.62)/2.62;g.scale.setScalar(u);
if(kind==='sword'){box(g,.06,.22,.06,mat('wood','#694d39'),0,-.03,0);box(g,.3,.04,.08,m,0,.08,0);const blade=mesh(g,new THREE.ConeGeometry(.075,.75,4),m,0,.47,0);blade.scale.z=.35;}
else if(kind==='pistol'||kind==='rifle'){box(g,.08,.09,kind==='rifle'?.65:.27,m,0,0,.14);box(g,.07,.17,.07,mat('wood','#5f4c40'),0,-.08,0);if(kind==='rifle')box(g,.09,.13,.2,mat('wood','#5f4c40'),0,-.02,-.22);const flash=mesh(g,new THREE.OctahedronGeometry(.09),mat('stars','#ffd470'),0,0,kind==='rifle'?.49:.30);g.userData.flash=flash;}
else if(kind==='shield'){const shield=mesh(g,new THREE.CylinderGeometry(.3,.3,.04,12),m,0,0,.1);shield.rotation.x=Math.PI/2;}
else if(kind==='energy-orb'){orb(g,.16,m,0,0,.12);}
else if(kind==='barrier'){mesh(g,new THREE.TorusGeometry(.42,.035,6,24),m,0,.15,.2);}
else if(kind==='aura'){mesh(g,new THREE.TorusGeometry(.8,.025,6,24),m,0,1.2,0);}
}}
export function updateActionProps(r,name,q,options={}){if(!r.actionProps)return;for(const g of Object.values(r.actionProps))g.visible=false;const info=curves[name]?.info;if(!options.accessory||!info?.prop||!r.actionProps[info.prop])return;const g=r.actionProps[info.prop];const parent=info.prop==='aura'?r.body:r.hands[options.mirror?0:1];if(g.parent!==parent)parent.add(g);g.visible=q>.02&&q<.98;if(g.userData.flash)g.userData.flash.visible=Math.abs(q-(info.peak||.4))<.045;if(['aura','barrier','energy-orb'].includes(info.prop)){const u=(r.height||2.62)/2.62;g.scale.setScalar(u*(.8+Math.sin(Math.PI*q)*.2));}}

function solveHand(r,i,target,pole){const a=r.arms[i],b=r.forearms[i],hand=r.hands[i],start=a.position.clone(),la=-b.position.y,lb=-hand.position.y;const dir=target.clone().sub(start),length=clamp(dir.length(),Math.abs(la-lb)+.00001,la+lb-.00001);dir.normalize();const along=(la*la+length*length-lb*lb)/(2*length),height=Math.sqrt(Math.max(0,la*la-along*along));let bend=pole.clone().sub(start);bend.addScaledVector(dir,-bend.dot(dir));if(bend.lengthSq()<1e-8)bend.set(i===0?-1:1,0,0);bend.normalize();const elbow=start.clone().addScaledVector(dir,along).addScaledVector(bend,height),end=start.clone().addScaledVector(dir,length),down=new THREE.Vector3(0,-1,0);a.quaternion.setFromUnitVectors(down,elbow.clone().sub(start).normalize());b.quaternion.setFromUnitVectors(down,end.clone().sub(elbow).normalize().applyQuaternion(a.quaternion.clone().invert()));hand.quaternion.copy(a.quaternion).multiply(b.quaternion).invert();}
