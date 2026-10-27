// SPDX-License-Identifier: GPL-3.0-only
import * as THREE from 'three';
// Export quality is independent of character identity. Standard remains the old path.
export function defaultRenderMode(project={}){const v=String(project.createdWith||'').match(/^(\d+)\.(\d+)\.(\d+)/),modern=v&&(+v[1]>1||+v[1]===1&&(+v[2]>3||+v[2]===3&&+v[3]>=1));return project.renderSettings?.mode??project.defaultRenderMode??(project.schema==='JetCartoonProject'&&project.version===1&&!modern?'standard':'fast');}
export function createProject({title='New cartoon',scenes=[],mode='fast'}={}){if(!['fast','standard'].includes(mode))throw Error('Project mode must be fast or standard');return {schema:'JetCartoonProject',version:1,createdWith:'1.3.1',title,renderSettings:{mode},scenes};}
export function renderSettings(project={},overrides={}){
 const saved=project.renderSettings||{},mode=overrides.mode??defaultRenderMode(project);
 if(!['standard','fast'].includes(mode))throw Error('Render mode must be standard or fast');
 const base=mode==='fast'?{fps:6,width:640,height:360}:{fps:12,width:1280,height:720};
 const result={mode,...base,...saved,...overrides};result.mode=mode;
 for(const key of ['width','height'])if(!Number.isInteger(result[key])||result[key]<160||result[key]>3840||result[key]%2)throw Error('Render dimensions must be even integers between 160 and 3840');
 if(!Number.isFinite(result.fps)||result.fps<6||result.fps>60)throw Error('Render FPS must be between 6 and 60');
 return result;
}
export function backgroundExtraEligible(a,s={}){
 if(a.renderRole!=='background-extra'||a.nonInteracting!==true||a.renderRepresentation==='full')return false;
 if(['speaking','active','interacting','plotRelevant','combat','handlesObjects'].some(k=>a[k]))return false;
 if(['hero','lead','speaker','speaking','active','combatant','plot-relevant'].includes(a.role)||['hero','lead','plot-relevant'].includes(a.narrativeRole))return false;
 if(a.dialogue||a.speech||a.prop||a.grips?.length||a.standardAnimation||a.lookAt)return false;
 if(s.speaker&&[a.id,a.name].filter(Boolean).some(n=>String(n).toLowerCase()===String(s.speaker).toLowerCase()))return false;
 if((s.props||[]).some(p=>p.owner===a.id||p.aimActor===a.id||(p.owners||[]).some(o=>o.actor===a.id)))return false;
 if((s.effects||[]).some(e=>e.actor===a.id||e.targetActor===a.id||e.owner===a.id))return false;
 const quiet=new Set(['idle','observe','stand','breathe','']);
 if(!quiet.has(a.action||''))return false;
 if((a.beats||[]).some(b=>!quiet.has(b.action||'')||b.standardAnimation||b.position||b.rotation!==undefined))return false;
 if(a.keys?.length||a.to&&JSON.stringify(a.to)!==JSON.stringify(a.from))return false;
 // Graphic extras are for distant crowd staging, not close-ups or top-down reveals.
 const position=a.from||[0,0,0],height=(a.design?.height||2.3)*(a.scale||1),cameras=[s.camera||[6,4.1,10],...(s.shots||[]).flatMap(sh=>[sh.camera,sh.to].filter(Boolean))];
 for(const camera of cameras){const horizontal=Math.hypot(camera[0]-position[0],camera[2]-position[2]);if(horizontal<height*1.25||Math.abs(camera[1]-(position[1]+height*.5))>horizontal)return false;}
 return true;
}
// Deliberately simplified graphic crowd, never a substitute for an active cast member.
// Each part lies in one upright plane. The whole plane faces the camera in update().
export function createBackgroundCutout(a,design={}){
 const root=new THREE.Group();root.userData.fastBackgroundExtra=true;
 const skin=design.skin||design.skinColor||'#a77858',top=design.top||design.shirt||design.color||'#53788e',pants=design.legs||design.pants||'#303d57',hair=design.hair||design.hairColor||'#302829';
 let layer=0;const material=color=>new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide});
 function part(geometry,color,x,y,rotation=0){const m=new THREE.Mesh(geometry,material(color));m.position.set(x,y,(layer++)*.0002);m.rotation.z=rotation;root.add(m);return m;}
 const rectangle=(w,h,c,x,y,r=0)=>part(new THREE.PlaneGeometry(w,h),c,x,y,r);
 const hash=[...a.id||'extra'].reduce((n,c)=>n+c.charCodeAt(0),0),pose=a.cutoutPose||['relaxed','hands-hips','wave'][hash%3];
 const profile=design.body||design.bodyType||'average',width=['stocky','sturdy','dwarf'].includes(profile)?1.22:profile==='slender'?.84:1;
 rectangle(.22,.94,pants,-.15,.48,.045);rectangle(.22,.94,pants,.15,.48,-.045);
 rectangle(.31,.1,'#222637',-.16,.05);rectangle(.31,.1,'#222637',.16,.05);
 rectangle(.66*width,.81,top,0,1.32);
 const outfit=design.outfit||'';if(/robe|skirt|dress|mantle/.test(outfit)){
  const shape=new THREE.Shape();shape.moveTo(-.33*width,1.3);shape.lineTo(.33*width,1.3);shape.lineTo(.49*width,.18);shape.lineTo(-.49*width,.18);shape.closePath();part(new THREE.ShapeGeometry(shape),top,0,0);
 }
 rectangle(.16,.62,top,-.40*width,pose==='hands-hips'?1.26:1.19,pose==='hands-hips'?.55:.12);
 rectangle(.16,.62,top,.40*width,pose==='wave'?1.66:1.19,pose==='wave'?-.3:-.12);
 part(new THREE.CircleGeometry(.095,8),skin,-.44*width,pose==='hands-hips'?1.0:.88);
 part(new THREE.CircleGeometry(.095,8),skin,.44*width,pose==='wave'?1.98:.88);
 rectangle(.14,.20,skin,0,1.78);part(new THREE.CircleGeometry(.255,12),skin,0,2.04);
 const hs=design.hairStyle||'short';if(hs!=='bald'){
  part(new THREE.CircleGeometry(hs==='afro'?.31:.264,12,0,Math.PI),hair,0,2.055);
  if(['long','braids','locs','bob'].includes(hs)){rectangle(.10,.42,hair,-.23,1.97);rectangle(.10,.42,hair,.23,1.97);}
  if(hs==='bun')part(new THREE.CircleGeometry(.13,8),hair,.18,2.28);
 }
 const targetHeight=design.height||2.3;root.scale.setScalar(targetHeight/2.3*(a.scale||1));
 return {root,fastExtra:true,baseScale:targetHeight/2.3,cutoutPose:pose};
}
export function renderBudget(scene){const full=(scene.actors||[]).filter(a=>!backgroundExtraEligible(a,scene));return {fullActors:full.length,recommendedMaxFullActors:2,warning:full.length>2?'Fast Mode works best with 1–2 full actors per shot. Keep every story-relevant actor; split shots deliberately, never delete plot.':null,retainedStandardActors:full.filter(a=>a.kind==='standard-humanoid').length};}
