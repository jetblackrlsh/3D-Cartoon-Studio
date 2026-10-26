// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
// Cast library integration, modified 2026-10-26.
import * as THREE from 'three';
// Every garment is original procedural geometry, textured on all faces and attached to a named rig joint.
export function dressCast(r,d,H){
 if(!d.body)return;
 const {mat,mesh,box,cyl,orb}=H,D=r.dimensions,R=D.headR,W=D.torsoR,Y=(D.hip+D.shoulder)/2;
 const cloth=mat('cloth',r.style.top),pants=mat('cloth',r.style.legs),trim=mat('cloth',d.accent||'#c3a45c'),metal=mat('metal',d.accent||'#aab7c2'),dark=mat('cloth','#263442'),hair=mat('fur',r.style.hair),skin=mat('cloth',r.style.skin),shoe=mat('cloth',r.style.shoes);
 const B=(p,w,h,z,m,x,y,zz)=>box(p,w,h,z,m,x,y,zz);
 const ell=(p,x,y,z,sx,sy,sz,m)=>{const o=orb(p,1,m,x,y,z);o.scale.set(sx,sy,sz);return o;};
 const tube=(p,rad,h,m,x,y,z)=>cyl(p,rad,h,m,x,y,z,12);
 const cone=(p,top,bottom,h,m,x,y,z)=>mesh(p,new THREE.CylinderGeometry(top,bottom,h,12),m,x,y,z);
 const band=(y,h,m=trim)=>tube(r.body,W*1.055,h,m,0,y,0);
 let panelLayer=0;const panel=(w,h,m=trim,x=0,y=Y,z=W*1.20)=>B(r.body,w,h,.035,m,x,y,Math.max(z,W*1.20)+(panelLayer++)*.0015);
 const vest=(m=cloth)=>{r.torso.visible=false;cone(r.body,W*1.06,W*1.08,D.torsoH*.81,m,0,Y,0);panel(W*.14,D.torsoH*.8,trim,0,Y,W*1.085);};
 const sleeves=(m=cloth,full=true)=>{for(let i=0;i<2;i++){r.arms[i].children[0].visible=false;if(full)r.forearms[i].children[0].visible=false;tube(r.arms[i],D.limbR*1.10,D.arm*.92,m,0,-D.arm*.49,0);if(full)tube(r.forearms[i],D.limbR*.87,D.fore*.9,m,0,-D.fore*.49,0);}};
 const boots=(tall=.55)=>{for(let i=0;i<2;i++){const base=r.shins[i].children[0];base.scale.y=1-tall;base.position.y=-D.shin*(1-tall)/2;tube(r.shins[i],D.limbR*1.04,D.shin*tall,shoe,0,-D.shin*(1-tall/2),0);B(r.shins[i],D.limbR*1.1,.06,.04,trim,0,-D.shin*.9,D.limbR);}};
 const pockets=(count=2)=>{for(let n=0;n<count;n++)panel(W*.36,D.torsoH*.18,pants,(n%2?1:-1)*W*.49,Y+(n>1?.19:-.16),W*.96);};
 const straps=()=>{for(let s of [-1,1])panel(W*.17,D.torsoH*.9,trim,s*W*.50,Y,W);};
 const tails=(m=cloth)=>{for(let s of [-1,1]){const leg=r.legs[s===-1?0:1],base=leg.children[0];base.scale.y=.28;base.position.y=-D.thigh*.86;const o=B(leg,D.limbR*2.12,D.thigh*.72,D.limbR*2.05,m,0,-D.thigh*.30,0);o.userData.castGarment=true;}};
 const badge=(shape='star')=>{const o=mesh(r.body,shape==='star'?new THREE.OctahedronGeometry(W*.23):new THREE.TorusGeometry(W*.22,W*.05,4,12),metal,-W*.40,Y+.15,W*1.10);o.scale.z=.25;};
 const cape=()=>{B(r.body,W*1.9,D.torsoH*.84,.055,trim,0,Y-.02,-W*1.12);};
 const outfit=d.outfit;
 switch(outfit){
 case 'hoodie':vest();sleeves();ell(r.body,0,D.shoulder-.05,-W*.35,W*.84,.21,.16,cloth);pockets();for(let s of [-1,1])panel(.025,.23,trim,s*.07,D.shoulder-.18,W*1.09);break;
 case 'apron':sleeves(cloth,false);panel(W*1.25,D.torsoH*.85,trim,0,Y-.05,W*1.05);straps();pockets();band(D.hip+.13,.07);break;
 case 'scrubs':sleeves(cloth,false);panel(.07,.19,trim,0,D.shoulder-.17);pockets(1);B(r.body,.08,.13,.03,mat('paper','#e2e4d7'),W*.45,Y+.10,W);break;
 case 'coveralls':vest();sleeves();band(D.hip+.11,.10,dark);pockets(4);boots(.32);break;
 case 'cardigan':vest();sleeves();for(let j=0;j<4;j++)ell(r.body,0,Y-.23+j*.14,W*1.12,.025,.025,.018,metal);pockets();break;
 case 'raincoat':vest();sleeves();tails();panel(W*1.2,.12,trim,0,D.shoulder-.15);boots(.7);break;
 case 'plate':vest(metal);sleeves(dark);for(let i=0;i<2;i++){ell(r.arms[i],0,-.10,0,D.limbR*1.3,.17,D.limbR*1.3,metal);tube(r.forearms[i],D.limbR*.93,D.fore*.65,metal,0,-D.fore*.6,0);tube(r.shins[i],D.limbR*1.09,D.shin*.7,metal,0,-D.shin*.57,0);}badge();band(D.hip+.1,.09,dark);break;
 case 'ranger':vest();sleeves(cloth,false);straps();boots(.68);cape();band(D.hip+.12,.08,dark);break;
 case 'patchwork':vest(mat('fur',r.style.top));panel(W*.6,.25,pants,-W*.3,Y+.13);panel(W*.48,.20,trim,W*.3,Y-.20);for(let s of [-1,1])panel(.025,.3,dark,s*W*.5,Y);boots(.24);break;
 case 'smith':sleeves(cloth,false);panel(W*1.5,D.torsoH*.93,mat('wood',r.style.legs),0,Y-.04,W*1.05);straps();pockets();band(D.hip+.12,.12,dark);boots(.5);break;
 case 'robe':vest();sleeves();tails();straps();band(D.hip+.12,.09,metal);for(let s of [-1,1])tube(r.forearms[s===-1?0:1],D.limbR*1.0,.1,trim,0,-D.fore*.88,0);break;
 case 'waistcoat':vest(pants);sleeves(cloth);pockets();for(let j=0;j<3;j++)panel(.03,.035,metal,0,Y+j*.13);band(D.hip+.1,.07);break;
 case 'spacesuit':vest(mat('cloth','#e2e5dc'));sleeves(mat('cloth','#e2e5dc'));for(let i=0;i<2;i++){tube(r.forearms[i],D.limbR*.95,.12,trim,0,-D.fore*.75,0);tube(r.legs[i],D.limbR*1.18,.12,trim,0,-D.thigh*.65,0);}panel(W,.24,dark,0,Y+.05,W*1.10);for(let j=0;j<3;j++)panel(.045,.04,trim,(j-1)*.08,Y+.05,W*1.17);B(r.body,W*1.5,D.torsoH*.7,.25,dark,0,Y,-W-.10);boots(.65);break;
 case 'flight-jacket':vest(mat('wood',r.style.top));sleeves();panel(W*1.6,.16,mat('fur','#d7c69f'),0,D.shoulder-.12);pockets();band(D.hip+.1,.14);boots(.4);break;
 case 'utility':vest();sleeves();straps();pockets(4);band(D.hip+.10,.12,dark);boots(.7);badge('ring');break;
 case 'labcoat':vest(mat('cloth','#e2e0d5'));sleeves(mat('cloth','#e2e0d5'));tails(mat('cloth','#e2e0d5'));pockets();panel(.09,.20,trim,0,D.shoulder-.18,W*1.1);break;
 case 'segmented':vest(metal);for(let i=0;i<2;i++){r.arms[i].children[0].visible=false;r.forearms[i].children[0].visible=false;tube(r.arms[i],D.limbR*1.07,D.arm*.7,metal,0,-D.arm*.5,0);tube(r.forearms[i],D.limbR*.83,D.fore*.7,metal,0,-D.fore*.5,0);}for(let j=0;j<4;j++)band(Y-.23+j*.15,.035,dark);badge('ring');boots(.75);break;
 case 'pressure-vest':vest(dark);straps();pockets(4);sleeves();panel(W,.12,metal,0,Y+.21,W*1.14);boots(.65);break;
 case 'denim':vest(mat('cloth',r.style.legs));sleeves();for(let s of [-1,1])panel(W*.55,.15,trim,s*W*.5,D.shoulder-.13);pockets();band(D.hip+.12,.11,mat('wood','#72503d'));boots(.7);break;
 case 'duster':vest(mat('wood',r.style.top));sleeves();tails(mat('wood',r.style.top));badge();panel(W*.2,.3,trim,0,D.shoulder-.2);boots(.7);break;
 case 'suspenders':sleeves(cloth,false);straps();band(D.hip+.10,.10,dark);pockets();boots(.6);break;
 case 'uniform':vest();sleeves();panel(W*1.9,.09,trim,0,D.shoulder-.09);for(let s of [-1,1])for(let j=0;j<3;j++)panel(.035,.035,metal,s*W*.3,Y-.1+j*.15);badge('ring');break;
 case 'frock':vest();sleeves();tails();panel(W*.8,.25,mat('cloth','#d7d4c4'),0,D.shoulder-.17);panel(.05,.25,dark,0,D.shoulder-.17,W*1.12);pockets();break;
 case 'embroidered':vest();sleeves();for(let s of [-1,1])for(let j=0;j<4;j++){const o=panel(.07,.07,metal,s*W*.6,Y-.2+j*.15);o.rotation.z=.7;}band(D.hip+.1,.12);boots(.6);break;
 case 'hero-armor':vest(metal);sleeves();badge();for(let i=0;i<2;i++){ell(r.arms[i],0,-.13,0,D.limbR*1.25,.16,D.limbR*1.25,metal);tube(r.forearms[i],D.limbR*.9,D.fore*.6,metal,0,-D.fore*.65,0);}boots(.8);break;
 case 'speed-suit':sleeves();straps();for(let i=0;i<2;i++){B(r.forearms[i],.04,D.fore*.7,.03,trim,0,-D.fore*.5,D.limbR*.8);B(r.shins[i],.04,D.shin*.8,.03,trim,0,-D.shin*.5,D.limbR);}badge('ring');break;
 case 'leaf-armor':vest();sleeves();for(let s of [-1,1])for(let j=0;j<3;j++){const o=ell(r.body,s*W*.35,Y-.2+j*.19,W,W*.3,.17,.08,trim);o.rotation.z=s*.5;}boots(.7);break;
 case 'mantle':vest();sleeves();cape();panel(W*1.3,.24,metal,0,Y+.16,W*1.1);badge('ring');boots(.7);break;
 case 'exo-suit':vest(metal);for(let i=0;i<2;i++){r.arms[i].children[0].visible=false;r.forearms[i].children[0].visible=false;B(r.arms[i],D.limbR*2.35,D.arm*.75,D.limbR*2.25,metal,0,-D.arm*.5,0);B(r.forearms[i],D.limbR*1.9,D.fore*.7,D.limbR*1.9,metal,0,-D.fore*.5,0);}straps();boots(.85);break;
 case 'rescue-suit':vest();sleeves();pockets(4);straps();band(D.hip+.12,.12,dark);panel(W*1.7,.08,trim,0,Y+.05,W*1.12);boots(.65);break;
 }
 if(['exo-suit','segmented'].includes(outfit))for(let i=0;i<2;i++){orb(r.arms[i],D.limbR*.82,dark,0,0,0);orb(r.forearms[i],D.limbR*.70,dark,0,0,0);orb(r.hands[i],D.limbR*.55,dark,0,0,0);}
 // Variant construction: one has rolled cuffs and a diagonal utility strap, the other raised collar and hip pouches.
 if(d.variant===0){let o=panel(W*.13,D.torsoH*.8,trim,0,Y,W*1.16);o.rotation.z=.32;for(let i=0;i<2;i++)tube(r.arms[i],D.limbR*1.12,.06,trim,0,-D.arm*.87,0);}
 else{band(D.shoulder-.015,.09,trim);for(let s of [-1,1])B(r.legs[s===-1?0:1],D.limbR*.9,.16,.10,pants,s*D.limbR,-.12,D.limbR);}
 // Hair components are anchored to the head, never to the world or a hand.
 const style=d.hairVisible===false?'bald':d.hairStyle;
 const cap=()=>mesh(r.head,new THREE.SphereGeometry(R*1.045,16,10,0,Math.PI*2,0,Math.PI*.47),hair,0,.035,0);
 if(style!=='bald')cap();
 if(['short','buzz','swept','bob','long','beard'].includes(style)){if(style==='swept')for(let j=0;j<5;j++){const o=ell(r.head,(j-2)*R*.24,R*.79,R*.3,R*.25,R*.20,R*.48,hair);o.rotation.z=-.25;}if(['bob','long'].includes(style)){for(let s of [-1,1])ell(r.head,s*R*.88,-R*.13,-R*.08,R*.24,R*(style==='long'?1.25:.55),R*.7,hair);ell(r.head,0,-R*.25,-R*.76,R*.8,R*(style==='long'?1.05:.5),R*.27,hair);}}
 if(['curly','afro'].includes(style))for(let i=0;i<17;i++){const angle=i*2.4,rad=R*(style==='afro'?1.04:.88);ell(r.head,Math.cos(angle)*rad,R*.35+Math.sin(i*1.9)*R*.48,-R*.18+Math.sin(angle)*rad*.5,R*.39,R*.4,R*.4,hair);}
 if(['bun','ponytail'].includes(style)){ell(r.head,0,R*.45,-R*.97,R*.5,R*.48,R*.5,hair);if(style==='ponytail')ell(r.head,0,-R*.25,-R*1.04,R*.24,R*.85,R*.24,hair);}
 if(['braids','locs'].includes(style))for(let i=0;i<(style==='braids'?4:9);i++){const a=Math.PI*.18+i*Math.PI*.64/((style==='braids'?4:9)-1),x=Math.cos(a)*R*.92;for(let j=0;j<6;j++)ell(r.head,x,R*.55-j*R*.29,-R*.35-Math.sin(a)*R*.28,R*.13,R*.19,R*.14,hair);}
 if(['mohawk','crest'].includes(style))for(let j=0;j<5;j++)ell(r.head,0,R*.93,-R*.65+j*R*.32,R*.16,R*.38,R*.21,style==='crest'?metal:hair);
 if(style==='beard'||d.accessory==='braided-beard'){ell(r.head,0,-R*.68,R*.51,R*.65,R*.52,R*.43,hair);if(d.accessory==='braided-beard')for(let j=0;j<4;j++)ell(r.head,0,-R*(.9+j*.24),R*.5,R*(.24-j*.035),R*.19,R*.18,hair);}
 if(d.species==='elf')for(let s of [-1,1]){const ear=mesh(r.head,new THREE.ConeGeometry(R*.17,R*.9,6),skin,s*R*1.05,.07,0);ear.rotation.z=-s*.95;}
 if(d.species==='ogre'){ell(r.head,0,-R*.48,R*.17,R*.85,R*.48,R*.78,skin);for(let s of [-1,1])mesh(r.head,new THREE.ConeGeometry(R*.12,R*.37,6),mat('cloth','#e7dbc1'),s*R*.48,-R*.37,R*.83);}
 const a=d.accessory;
 if(['glasses','goggles','visor','mask'].includes(a)){if(a==='mask'||a==='visor')B(r.head,R*1.62,R*.34,.055,a==='mask'?cloth:metal,0,R*.13,R*.92);else for(let s of [-1,1]){const rim=mesh(r.head,new THREE.TorusGeometry(R*.19,R*.035,5,16),a==='goggles'?metal:dark,s*R*.35,R*.14,R*.98);B(r.head,R*.24,.025,.04,dark,0,R*.14,R*1.0);if(a==='goggles')ell(r.head,s*R*.35,R*.14,R*.99,R*.15,R*.12,.025,mat('metal','#87b9ce'));}for(let s of [-1,1])B(r.head,.025,.04,R*1.1,dark,s*R*.72,R*.15,R*.35);}
 if(['cowboy-hat','marshal-hat','bolero-hat','work-hat','rail-cap','cap','beanie','wizard-hat','helmet','space-helmet'].includes(a)){
 const m=a==='helmet'?metal:a==='space-helmet'?mat('cloth','#e6e6dc'):cloth;
 if(a==='space-helmet'){// Open face ring, readable face and no transparent-material renderer mismatch.
 mesh(r.head,new THREE.TorusGeometry(R*1.18,R*.13,8,24),m,0,.02,R*.35);ell(r.head,0,0,-R*.42,R*1.18,R*1.16,R*.80,m);for(let s of [-1,1])tube(r.head,R*.21,R*.14,metal,s*R*1.18,0,0).rotation.z=Math.PI/2;
 }else if(a==='wizard-hat'){cone(r.head,0,R*1.05,R*2,cloth,0,R*1.75,0);tube(r.head,R*1.45,.06,trim,0,R*.79,0);}
 else {mesh(r.head,new THREE.SphereGeometry(R*1.10,16,10,0,Math.PI*2,0,Math.PI*.46),m,0,.04,0);if(['cowboy-hat','marshal-hat','bolero-hat','work-hat'].includes(a)){tube(r.head,R*(a==='bolero-hat'?1.7:1.5),.055,m,0,R*.68,0);cone(r.head,R*.64,R*.89,R*.60,m,0,R*.98,0);tube(r.head,R*.90,.07,trim,0,R*.79,0);}if(['rail-cap','cap'].includes(a))B(r.head,R*1.45,.05,R*.8,dark,0,R*.56,R*.7);if(a==='helmet')B(r.head,R*1.7,.07,.07,metal,0,R*.28,R*.93);}
 }
 if(a==='circlet')mesh(r.head,new THREE.TorusGeometry(R*1.01,.025,5,20),metal,0,R*.39,0).rotation.x=Math.PI/2;
 if(['headset','antenna','earrings'].includes(a))for(let s of [-1,1]){ell(r.head,s*R*1.01,0,0,R*.13,R*.22,R*.14,metal);if(a==='antenna'){tube(r.head,.018,R*.8,metal,s*R*.9,R*.65,0);ell(r.head,s*R*.9,R*1.08,0,.05,.05,.05,trim);}if(a==='earrings')mesh(r.head,new THREE.TorusGeometry(R*.14,.025,5,14),metal,s*R*1.04,-R*.4,0);}
 if(['backpack','quiver','scanner'].includes(a)){B(r.body,W*1.6,D.torsoH*.72,.24,pants,0,Y,-W-.12);straps();if(a==='quiver')for(let s of [-1,1]){tube(r.body,.025,.8,mat('wood','#b89f71'),s*.08,D.shoulder-.05,-W-.26);ell(r.body,s*.08,D.shoulder+.34,-W-.26,.05,.12,.03,trim);}if(a==='scanner')B(r.forearms[0],.17,.22,.08,metal,0,-D.fore*.4,D.limbR);}
 if(a==='scarf'||a==='headscarf'){band(D.shoulder+.02,.13);B(r.body,.13,.31,.04,trim,W*.35,D.shoulder-.2,W*1.05);if(a==='headscarf')mesh(r.head,new THREE.SphereGeometry(R*1.065,14,8,0,Math.PI*2,0,Math.PI*.50),trim,0,.03,0);}
 r.castDesign={...d};r.root.userData.castProfile=d.body;
}
