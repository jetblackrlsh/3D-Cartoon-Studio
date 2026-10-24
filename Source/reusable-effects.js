// SPDX-License-Identifier: GPL-3.0-only
import * as T from 'three';import catalog from './effects-catalog.json';
export const visualEffectCatalog=catalog;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),rand=(i,k)=>{const x=Math.sin((i+1)*127.1+k*311.7)*43758.5453;return x-Math.floor(x)};
export function validateVisualEffect(e,sceneDuration){if(!catalog.some(x=>x.id===e.kind))return false;const start=e.start??(e.at||0)*sceneDuration,duration=e.duration??((e.until??1)-(e.at||0))*sceneDuration;if(!Number.isFinite(start)||!Number.isFinite(duration)||start<0||duration<.1||duration>30||start+duration>sceneDuration+.001)throw Error('Visual effect must fit the scene and last 0.1–30 seconds');if(e.color&&!/^#[\da-f]{6}$/i.test(e.color))throw Error('Invalid effect color');for(const [key,min,max] of [['scale',.1,4],['intensity',.25,2]])if(e[key]!==undefined&&(!Number.isFinite(e[key])||e[key]<min||e[key]>max))throw Error('Invalid effect '+key);for(const key of ['position','rotation'])if(e[key]&&(!Array.isArray(e[key])||e[key].length!==3||!e[key].every(Number.isFinite)))throw Error('Invalid effect '+key);return true;}
export function makeVisualEffect(e,H){const item=catalog.find(x=>x.id===e.kind);if(!item)return null;const {mat,mesh}=H,g=new T.Group(),objects=[],color=e.color||item.color,count=Math.round((/snow|rain|confetti|leaves/.test(e.kind)?32:e.kind==='electric-arcs'?24:18)*(e.intensity||1));
const material=(col=color,alpha=1)=>{const m=mat('stars',col).clone();m.transparent=alpha<1;m.opacity=alpha;m.depthWrite=alpha===1;return m;};
const add=(geo,m=material())=>{const o=mesh(g,geo,m,0,0,0);objects.push(o);return o};
for(let i=0;i<count;i++){
 let o;if(['shockwave','portal-swirl','wind-gust','rising-bubbles'].includes(e.kind)){o=add(new T.TorusGeometry(e.kind==='rising-bubbles'?.11:.5,e.kind==='rising-bubbles'?.012:.025,4,16,['portal-swirl','wind-gust'].includes(e.kind)?Math.PI*1.5:Math.PI*2),material(color,e.kind==='rising-bubbles'?.55:.8));}
 else if(e.kind==='electric-arcs'||e.kind==='rain-streaks'||e.kind==='energy-beam'||e.kind==='speed-lines'){o=add(new T.CylinderGeometry(e.kind==='energy-beam'?.04:.012,e.kind==='energy-beam'?.04:.012,1,5),material(color,.85));}
 else if(e.kind==='impact-star'){o=add(new T.ConeGeometry(.06,.7,4));}
 else if(e.kind==='floating-hearts'){o=new T.Group();g.add(o);for(const x of [-.045,.045])mesh(o,new T.SphereGeometry(.06,6,4),material(),x,.035,0);const tip=mesh(o,new T.ConeGeometry(.083,.13,4),material(),0,-.04,0);tip.rotation.z=Math.PI;objects.push(o);}
 else if(e.kind==='confetti'||e.kind==='falling-leaves'||e.kind==='debris-burst'){o=add(new T.BoxGeometry(e.kind==='debris-burst'?.1:.055,e.kind==='falling-leaves'?.12:.025,.02),material(e.kind==='confetti'?['#e47dab','#e3c75a','#69bec3','#a18dde'][i%4]:color));}
 else if(e.kind==='fire-flames'){o=add(new T.ConeGeometry(.12,.55,6),material(i%2?'#ffd173':color,.85));}
 else {const alpha=/smoke|fog|dust/.test(e.kind)?.23:e.kind==='fireball-burst'?.7:1;o=add(new T.SphereGeometry(/smoke|fog|dust|fireball/.test(e.kind)?.22:.035,6,4),material(color,alpha));}
 o.userData.index=i;
}
g.userData.visualEffect={kind:e.kind,objects,count};return g;}
export function updateVisualEffect(g,e,time,st){const start=e.start??(e.at||0)*st.s.duration,duration=e.duration??((e.until??1)-(e.at||0))*st.s.duration,u=(time-start)/duration;g.visible=u>=0&&u<1;if(!g.visible)return;let position=e.position||[0,1,0];if(e.actor){const i=st.s.actors.findIndex(a=>a.id===e.actor),r=st.rigs[i];if(r){const node=e.socket==='hand'?r.hands[1]:e.socket==='head'?(r.recording?r.recorded.head:r.head):r.root;position=node.getWorldPosition(new T.Vector3()).toArray();}}
g.position.fromArray(position);g.rotation.set(...(e.rotation||[0,0,0]));g.scale.setScalar(e.scale||1);const {objects,count}=g.userData.visualEffect,k=e.kind,age=time-start,fade=Math.min(1,u*8,(1-u)*8);
objects.forEach((o,i)=>{const a=rand(i,0)*Math.PI*2,b=rand(i,1)*Math.PI*2,r=rand(i,2),phase=(age*(.35+rand(i,3)*.3)+i/count)%1;o.rotation.set(0,0,0);o.scale.setScalar(1);o.visible=true;
 if(k==='smoke-plume'){o.position.set(Math.sin(a+phase)*(.1+phase*.4),phase*2,Math.cos(b+phase)*(.1+phase*.35));o.scale.setScalar(.4+phase*2);}
 else if(k==='ground-fog'){o.position.set((r-.5)*4+Math.sin(age*.4+i)*.5,.05+rand(i,4)*.15,(rand(i,5)-.5)*3);o.scale.set(2.8,.55,1.7);}
 else if(k==='fire-flames'){o.position.set(Math.sin(a)*.3,phase*.55+.2,Math.cos(a)*.3);o.scale.set(.5+(1-phase)*.7,.7+Math.sin(age*9+i)*.25,1);o.rotation.z=Math.sin(age*5+i)*.16;}
 else if(k==='fireball-burst'){o.position.set(Math.sin(a)*Math.sin(b)*u*1.8,Math.cos(b)*u*1.8,Math.cos(a)*Math.sin(b)*u*1.8);o.scale.setScalar(.5+Math.sin(Math.PI*u)*2);}
 else if(k==='debris-burst'){o.position.set(Math.sin(a)*u*2,(.6+r)*u*3-3*u*u,Math.cos(a)*u*2);o.rotation.set(age*(i+1),age*(i+2),age);o.scale.setScalar(.5+r);}
 else if(k==='electric-arcs'){const chain=Math.floor(i/6),part=i%6,angle=chain*Math.PI*2/Math.ceil(count/6);const p=new T.Vector3(Math.cos(angle)*part*.15,Math.sin(angle)*part*.15,Math.sin(age*20+part+chain)*.12);const q=new T.Vector3(Math.cos(angle)*(part+1)*.15,Math.sin(angle)*(part+1)*.15,Math.sin(age*20+part+1+chain)*.12);const d=q.clone().sub(p);o.position.copy(p).add(q).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());o.scale.y=d.length();}
 else if(k==='magic-particles'){o.position.set(Math.cos(a+age)*(.3+r),Math.sin(b+age*.6)*.8,Math.sin(a+age)*(.3+r));o.scale.setScalar(.6+.4*Math.sin(age*5+i));}
 else if(k==='falling-snow'){o.position.set((r-.5)*4+Math.sin(age+i)*.15,2.5-phase*3,(rand(i,5)-.5)*3);}
 else if(k==='rain-streaks'){o.position.set((r-.5)*4,2.5-((age*1.7+i/count)%1)*3,(rand(i,5)-.5)*3);o.scale.y=.25;o.rotation.z=.12;}
 else if(k==='wind-gust'){o.position.set(phase*4-2,Math.sin(a)*.6,Math.cos(a)*.4);o.rotation.set(Math.PI/2,0,age*.8+i);o.scale.setScalar(.3+r*.5);o.visible=i<Math.max(4,count/3);}
 else if(k==='dust-cloud'){o.position.set(Math.cos(a)*u*(1+r),.1+Math.sin(b)*.15,Math.sin(a)*u*(1+r));o.scale.setScalar(.4+u*2);}
 else if(k==='water-splash'){o.position.set(Math.sin(a)*u*1.4,u*(2+r)-u*u*2.8,Math.cos(a)*u*1.4);o.scale.set(.7,2,.7);}
 else if(k==='rising-bubbles'){o.position.set((r-.5)*1.5+Math.sin(age+i)*.1,phase*2,(rand(i,5)-.5));o.scale.setScalar(.4+r);o.lookAt(st.camera.position);}
 else if(k==='speed-lines'){o.position.set(Math.sin(a)*(.8+r),Math.cos(a)*(.8+r),phase*3-1.5);o.rotation.x=Math.PI/2;o.scale.y=.3+r;}
 else if(k==='impact-star'){const radius=.2+Math.sin(Math.PI*u)*.5;o.position.set(Math.sin(a)*radius,Math.cos(a)*radius,(rand(i,4)-.5)*.1);o.rotation.z=-a;o.scale.setScalar(Math.sin(Math.PI*u));}
 else if(k==='shockwave'){o.rotation.x=Math.PI/2;o.scale.setScalar(.1+u*4);o.position.y=.015+i*.002;o.visible=i<2;}
 else if(k==='confetti'||k==='falling-leaves'){o.position.set((r-.5)*3+Math.sin(age+i)*.3,2.5-phase*3,(rand(i,5)-.5)*2);o.rotation.set(age*(i%3+1),age*.8+i,age*1.2+i);}
 else if(k==='floating-hearts'){o.position.set((r-.5)*1.5,phase*2,Math.sin(age+i)*.15);o.scale.setScalar(.6+r);}
 else if(k==='embers'){o.position.set(Math.cos(a)*phase*.6,phase*2,Math.sin(a)*phase*.6);o.scale.setScalar(1-phase*.6);}
 else if(k==='energy-beam'){o.position.set(Math.cos(a)*.08,Math.sin(a)*.08,1);o.rotation.x=Math.PI/2;o.scale.y=2;o.visible=i<5;}
 else if(k==='portal-swirl'){o.rotation.z=age*(i%2?1:-1)+a;o.scale.setScalar(.4+i/count*.8);o.position.z=Math.sin(age+i)*.08;o.visible=i<8;}
 o.traverse(m=>{if(m.isMesh){if(m.userData.baseOpacity===undefined)m.userData.baseOpacity=m.material.opacity;m.material.opacity=m.userData.baseOpacity*fade;m.material.transparent=true;}});
});}
