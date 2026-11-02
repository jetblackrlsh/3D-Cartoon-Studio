// SPDX-License-Identifier: GPL-3.0-only
// Original procedural toy actors. No LEGO/LDraw geometry, logos or branded prints.
import * as THREE from 'three';
export const minifigureOptions=Object.freeze({headwear:['none','short-hair','bob','spiky','helmet'],face:['smile','neutral','angry','surprised'],torsoPrint:['plain','zipper','spacesuit','knight'],handAccessory:['none','sword','wand','mug']});
const defaults={skin:'#f4c34c',top:'#258cc8',legs:'#263e72',shoes:'#263e72',hair:'#422d26',helmet:'#e7eef4',headwear:'short-hair',face:'smile',torsoPrint:'zipper',handAccessory:'none',height:2.2};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function normalizeMinifigureDesign(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Minifigure design must be an object');
 const d={...defaults};for(const key of Object.keys(defaults)){if(input[key]===undefined)continue;const v=input[key];if(minifigureOptions[key]){if(!minifigureOptions[key].includes(v))throw Error('Invalid minifigure '+key);}
 else if(key==='height'){if(!Number.isFinite(v)||v<.8||v>3.5)throw Error('Invalid minifigure height');}
 else if(typeof v!=='string'||!/^#[0-9a-f]{6}$/i.test(v))throw Error('Invalid minifigure color '+key);d[key]=v;}
 return d;
}
export function createMinifigureActor(design={},options={}){return {id:'minifigure',from:[0,0,0],action:'idle',...options,kind:'minifigure',design:normalizeMinifigureDesign(design)};}
export function createMinifigureRig(input,H){
 const d=normalizeMinifigureDesign(input),{mat,mesh,box,cyl,orb}=H;
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 const plastic=c=>{const m=mat('cloth',c);m.roughness=.32;return m;};
 const skin=plastic(d.skin),shirt=plastic(d.top),pants=plastic(d.legs),shoe=plastic(d.shoes),ink=plastic('#192738'),light=plastic('#edf4f8');
 // Trapezoid torso: wide shoulders, narrow waist. Coordinates in scene meters.
 const shape=new THREE.Shape();shape.moveTo(-.30,.84);shape.lineTo(.30,.84);shape.lineTo(.43,1.53);shape.lineTo(-.43,1.53);shape.closePath();
 const geo=new THREE.ExtrudeGeometry(shape,{depth:.38,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.025,bevelThickness:.025});geo.translate(0,0,-.19);
 const torso=mesh(body,geo,shirt);box(body,.63,.18,.40,pants,0,.80,0);cyl(body,.12,.12,skin,0,1.59,0,12);
 const head=new THREE.Group();head.position.y=1.85;body.add(head);cyl(head,.29,.46,skin,0,0,0,16);cyl(head,.12,.09,skin,0,.275,0,12);
 const face={};for(const [i,key] of ['L','R'].entries()){const x=i===0?-.105:.105;face['eye'+key]=orb(head,.029,ink,x,.035,.274);face['brow'+key]=box(head,.09,.018,.015,ink,x,.12,.274);face['brow'+key].rotation.z=d.face==='angry'?(i===0?-.35:.35):0;}
 const mouth=mesh(head,d.face==='surprised'?new THREE.TorusGeometry(.046,.012,5,12):new THREE.TorusGeometry(.079,.012,5,16,Math.PI),ink,0,-.045,.28);if(d.face!=='surprised')mouth.rotation.z=Math.PI;if(d.face==='neutral'){mouth.visible=false;box(head,.12,.015,.012,ink,0,-.07,.28);}face.mouth=mouth;
 const hair=plastic(d.hair),helmet=plastic(d.helmet);
 if(d.headwear==='short-hair'||d.headwear==='bob'){mesh(head,new THREE.SphereGeometry(.305,16,8,0,Math.PI*2,0,Math.PI*.52),hair,0,.16,0);box(head,.57,.12,.10,hair,0,.17,.23);if(d.headwear==='bob'){box(head,.10,.38,.44,hair,-.27,-.02,-.04);box(head,.10,.38,.44,hair,.27,-.02,-.04);box(head,.5,.33,.10,hair,0,-.03,-.27);}}
 if(d.headwear==='spiky'){mesh(head,new THREE.SphereGeometry(.30,12,6,0,Math.PI*2,0,Math.PI*.5),hair,0,.16,0);for(let i=-2;i<=2;i++){const spike=mesh(head,new THREE.ConeGeometry(.11,.25,4),hair,i*.10,.40,0);spike.rotation.z=-i*.14;}}
 if(d.headwear==='helmet'){mesh(head,new THREE.SphereGeometry(.34,16,8,0,Math.PI*2,0,Math.PI*.62),helmet,0,.12,0);box(head,.69,.06,.20,helmet,0,.14,.24);box(head,.08,.25,.36,helmet,-.30,-.08,-.02);box(head,.08,.25,.36,helmet,.30,-.08,-.02);}
 if(d.torsoPrint==='zipper'){box(body,.027,.48,.018,light,0,1.18,.225);for(const x of [-.19,.19])box(body,.16,.018,.018,light,x,1.07,.23);}
 if(d.torsoPrint==='spacesuit'){box(body,.39,.28,.018,light,0,1.26,.23);for(let i=0;i<3;i++)box(body,.055,.06,.025,plastic(['#e85e5e','#f4c34c','#37bfa3'][i]),-.10+i*.1,1.28,.25);box(body,.5,.08,.02,ink,0,.94,.23);}
 if(d.torsoPrint==='knight'){const p=mesh(body,new THREE.CylinderGeometry(.21,.21,.025,5),light,0,1.22,.24);p.rotation.x=Math.PI/2;box(body,.04,.31,.025,ink,0,1.22,.27);box(body,.22,.04,.025,ink,0,1.24,.27);}
 const arms=[],forearms=[],hands=[],legs=[],shins=[],shoes=[];
 for(const side of [-1,1]){const shoulder=new THREE.Group();shoulder.position.set(side*.49,1.46,0);body.add(shoulder);const arm=cyl(shoulder,.115,.53,shirt,0,-.265,0,10);arm.rotation.z=side*.10;const elbow=new THREE.Group();elbow.position.set(0,-.53,0);shoulder.add(elbow);const hand=new THREE.Group();hand.position.set(0,-.06,0);elbow.add(hand);const claw=mesh(hand,new THREE.TorusGeometry(.095,.035,6,14,Math.PI*1.55),skin,0,-.035,0);claw.rotation.y=Math.PI/2;claw.rotation.z=-Math.PI*.275;
 const hip=new THREE.Group();hip.position.set(side*.17,.74,0);body.add(hip);box(hip,.29,.57,.30,pants,0,-.285,0);const knee=new THREE.Group();hip.add(knee);const foot=box(knee,.30,.16,.43,shoe,0,-.66,.065);arms.push(shoulder);forearms.push(elbow);hands.push(hand);legs.push(hip);shins.push(knee);shoes.push(foot);}
 const accessory=new THREE.Group();hands[1].add(accessory);const metal=plastic('#b7cad6');
 if(['sword','wand'].includes(d.handAccessory))accessory.rotation.x=Math.PI;
 if(d.handAccessory==='sword'){box(accessory,.045,.22,.045,plastic('#644431'),0,0,0);box(accessory,.24,.04,.08,metal,0,.12,0);mesh(accessory,new THREE.ConeGeometry(.06,.62,4),metal,0,.45,0);}
 if(d.handAccessory==='wand'){cyl(accessory,.025,.65,plastic('#674190'),0,.22,0,8);orb(accessory,.07,plastic('#76e4e0'),0,.57,0);}
 if(d.handAccessory==='mug'){cyl(accessory,.12,.24,light,0,.08,.16,12);const handle=mesh(accessory,new THREE.TorusGeometry(.085,.022,5,12),light,0,.08,.015);handle.rotation.y=Math.PI/2;}
 const paper=new THREE.Group(),trapeze=new THREE.Group();root.add(paper,trapeze);paper.visible=trapeze.visible=false;
 return {root,body,head,torso,face,arms,forearms,hands,legs,shins,shoes,paper,trapeze,kind:'minifigure',minifigure:true,height:2.2,baseScale:d.height/2.2,style:d,design:d,accessory,rigidJoints:true};
}
// Consume the SAME authored preset curves, adapting intent to rigid toy joints.
export function applyMinifigurePreset(r,name,t,q,c,options={}){
 const rad=Math.PI/180,A=k=>(c[k]?.rotation||0)*rad,unit=2.2/260;
 r.body.position.set((c.root?.x||0)*unit,0,0);r.body.rotation.set(0,0,0);r.body.scale.set(1,1,1);r.head.rotation.set(0,0,0);
 for(const list of [r.arms,r.forearms,r.hands,r.legs,r.shins])for(const x of list)x.rotation.set(0,0,0);
 const gait=['walk','run'].includes(name),fold=['sit','stand-up','crouch','kneel'].includes(name),forward=['point','reach','carry','push','punch-jab','punch-cross','punch-uppercut','shoot-pistol','shoot-rifle','cast-projectile','heal'].includes(name);
 const mirror=!!options.mirror,main=mirror?0:1,intensity=clamp(options.intensity??1,.25,1.5);
 r.root.userData.toySideKick=false;
 r.body.rotation.x=clamp(A('torso')+A('pelvis'),-.45,.45);
 r.head.rotation.z=clamp(-A('neck'),-.22,.22);if(['nod','bow','sad','crying','tired','embarrassed'].includes(name)){r.head.rotation.x=r.head.rotation.z;r.head.rotation.z=0;}
 for(let i=0;i<2;i++){const side=i===0?'L':'R',sign=i===0?-1:1;
  const shoulder=A('shoulder'+side),elbow=A('elbow'+side);
  r.arms[i].rotation.x=clamp(forward?-Math.abs(shoulder)-Math.abs(elbow)*.55:shoulder,-2.8,2.8);
  if(!forward&&!gait){r.arms[i].rotation.z=clamp(-shoulder,-.18,.18);r.arms[i].rotation.x=-Math.abs(shoulder)-Math.abs(elbow)*.35;}
  r.hands[i].rotation.y=clamp(A('wrist'+side),-1.4,1.4);
  r.legs[i].rotation.x=clamp(fold?-Math.abs(A('hip'+side)):A('hip'+side),-1.65,1.1);
 }
 if(gait){const speed=name==='run'?8:5,amp=name==='run'?.65:.38;for(let i=0;i<2;i++){const swing=Math.sin(t*speed+i*Math.PI);r.legs[i].rotation.x=swing*amp;r.arms[i].rotation.x=-swing*amp;}r.body.rotation.x=name==='run'?.12:0;}
 if(name==='wave'){r.arms[main].rotation.x=-2.5+.18*Math.sin(t*7);r.hands[main].rotation.y=.6*Math.sin(t*7);}
 if(['celebrate','happy','laugh'].includes(name)){r.arms.forEach((a,i)=>a.rotation.x=-2.35+.2*Math.sin(t*6+i));}
 if(name==='talk'){r.arms[main].rotation.x=-.65-.2*Math.sin(t*5);r.head.rotation.y=.08*Math.sin(t*3);}
 if(['sit','stand-up'].includes(name)){const amount=name==='sit'?Math.min(1,q*4):1-Math.min(1,q*2);r.legs.forEach(l=>l.rotation.x=-Math.PI/2*amount);r.body.rotation.x=0;}
 if(['crouch','kneel'].includes(name)){r.legs[main].rotation.x=-.7*Math.sin(Math.PI*q);r.body.rotation.x=.25*Math.sin(Math.PI*q);}
 if(name==='kick-front'){r.legs[main].rotation.x=-1.3*Math.sin(Math.PI*q);r.legs[1-main].rotation.x=0;}
 if(name==='kick-side'){r.root.userData.toySideKick=true;r.legs[main].rotation.x=-1.1*Math.sin(Math.PI*q);r.body.rotation.y=(mirror?-1:1)*.5*Math.sin(Math.PI*q);}
 if(['weapon-slash','weapon-overhead'].includes(name)){r.arms[main].rotation.x=-2.4+2.6*q;r.body.rotation.y=(mirror?-1:1)*.35*Math.sin(2*Math.PI*q);}
 if(name==='bow')r.body.rotation.x=.5*Math.sin(Math.PI*q);
 if(name==='punch-cross')r.body.rotation.y=(mirror?-1:1)*.35*Math.sin(Math.PI*q);
 // Specialized toy performance overrides also honor the preset intensity control.
 if(['walk','run','wave','celebrate','happy','laugh','talk','sit','stand-up','crouch','kneel','kick-front','kick-side','weapon-slash','weapon-overhead','bow','punch-cross'].includes(name)){for(const j of [...r.arms,...r.legs,r.head,r.body]){j.rotation.x=clamp(j.rotation.x*intensity,-2.9,2.9);j.rotation.y*=intensity;j.rotation.z*=intensity;} }
 // Each pose is absolute and safe for backward seeking. No elbow/knee bending or squash.
 r.root.updateMatrixWorld(true);const inv=r.root.matrixWorld.clone().invert();let low=Infinity;
 for(const foot of r.shoes){foot.geometry.computeBoundingBox();low=Math.min(low,foot.geometry.boundingBox.clone().applyMatrix4(inv.clone().multiply(foot.matrixWorld)).min.y);}
 const lift=name==='jump'?Math.sin(Math.PI*clamp(q,0,1))*.65*intensity:Math.max(0,-(c.root?.y||0)*unit);
 if(Number.isFinite(low))r.body.position.y+=lift-low;
 // Printed expressions remain designed; blink is a scale-only eye closure.
 for(const key of ['eyeL','eyeR'])r.face[key].scale.y=name==='blink'?Math.max(.1,1-Math.sin(Math.PI*q)):1;
 r.preset=name;r.root.updateMatrixWorld(true);return true;
}
