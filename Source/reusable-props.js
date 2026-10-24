// SPDX-License-Identifier: GPL-3.0-only
/* Volumetric, original low-poly counterparts of the pinned 2D prop catalog.
 * Units: metres. Handheld origin is the grip. Scenery origin is floor contact.
 * +Y is shaft/blade up; guns and cameras point +Z. No functional weapon internals. */
import * as T from 'three';
import catalog from './props-catalog.json';
export const propCatalog=catalog;
function normalizeUV(geo){const uv=geo.attributes.uv;let min=[Infinity,Infinity],max=[-Infinity,-Infinity];for(let i=0;i<uv.count;i++){min[0]=Math.min(min[0],uv.getX(i));min[1]=Math.min(min[1],uv.getY(i));max[0]=Math.max(max[0],uv.getX(i));max[1]=Math.max(max[1],uv.getY(i));}for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)-min[0])/(max[0]-min[0]||1),(uv.getY(i)-min[1])/(max[1]-min[1]||1));return geo;}
const colors={wood:'#926348',metal:'#c4d8df',dark:'#33465c',gold:'#e9ba55',accent:'#62c7e0',cloth:'#936aa5',paper:'#eee0bb',glass:'#a5d8dc',food:'#d7a665'};
export function validateLibraryProp(p){if(p.library!=='2d-props')return false;if(!catalog.some(x=>x.id===p.kind))throw Error('Unknown library prop');if(p.scale!==undefined&&(!Number.isFinite(p.scale)||p.scale<.05||p.scale>10))throw Error('Prop scale must be 0.05–10');for(const k of ['from','heldOffset','rotation3d'])if(p[k]&&(!Array.isArray(p[k])||p[k].length!==3||!p[k].every(x=>Number.isFinite(x)&&Math.abs(x)<100)))throw Error('Invalid prop '+k);for(const v of Object.values(p.colors||{}))if(!/^#[\da-f]{6}$/i.test(v))throw Error('Invalid prop palette');if(p.alignment&&!['socket','actor-forward'].includes(p.alignment))throw Error('Invalid prop alignment');if(p.hand!==undefined&&![0,1].includes(p.hand))throw Error('Prop hand must be 0 or 1');if(p.socket&&!['hand','head','body'].includes(p.socket))throw Error('Unknown prop socket');return true;}
export function makeLibraryProp(p,H){if(!validateLibraryProp(p))throw Error('Set library to 2d-props');const g=new T.Group(),C={...colors,...({apple:{cloth:'#d95b61',accent:'#5c9563'},'medical-kit':{cloth:'#cf6a6a'},torch:{accent:'#ee8b45'},candle:{accent:'#ee8b45'}}[p.kind]||{}),...p.colors},M={};for(const [k,v]of Object.entries(C))M[k]=H.mat(k==='wood'?'wood':k==='metal'||k==='gold'?'metal':'cloth',v);const mesh=(geo,m='wood',x=0,y=0,z=0,parent=g)=>H.mesh(parent,geo,typeof m==='string'?M[m]:m,x,y,z),box=(w,h,d,m='wood',x=0,y=0,z=0,parent=g)=>mesh(new T.BoxGeometry(w,h,d,Math.min(8,Math.max(1,Math.ceil(w/.08))),Math.min(8,Math.max(1,Math.ceil(h/.08))),Math.min(8,Math.max(1,Math.ceil(d/.08)))),m,x,y,z,parent),sphere=(rx,ry,rz,m='wood',x=0,y=0,z=0)=>{let o=mesh(new T.SphereGeometry(1,12,8),m,x,y,z);o.scale.set(rx,ry,rz);return o},cyl=(r,h,m='wood',x=0,y=0,z=0,rt=r)=>mesh(new T.CylinderGeometry(rt,r,h,12),m,x,y,z),cone=(r,h,m='metal',x=0,y=0,z=0)=>mesh(new T.ConeGeometry(r,h,8),m,x,y,z),ring=(r,t,m='gold',x=0,y=0,z=0)=>mesh(new T.TorusGeometry(r,t,6,24),m,x,y,z),rod=(a,b,r=.018,m='metal')=>{let v=new T.Vector3(...b).sub(new T.Vector3(...a)),o=cyl(r,v.length(),m,...a);o.position.addScaledVector(v,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o},curve=(pts,r=.02,m='wood')=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(x=>new T.Vector3(...x))),24,r,6,false),m),poly=(pts,depth=.04,m='metal',z=0)=>{const s=new T.Shape();pts.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();return mesh(normalizeUV(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false})),m,0,0,z-depth/2)},lathe=(pts,m='metal')=>mesh(new T.LatheGeometry(pts.map(x=>new T.Vector2(...x)),24),m),panel=(w,h,m,x,y,z)=>box(w,h,.012,m,x,y,z);
const handle=(len=.25)=>{cyl(.035,len,'wood',0,0,0);box(.3,.04,.08,'gold',0,len/2,0);sphere(.045,.045,.045,'gold',0,-len/2,0)},blade=(len=.8,w=.06)=>poly([[-w,.14],[-w,len-.1],[0,len],[w,len-.1],[w,.14]],.035),straps=(w,h,d)=>{for(let x of [-w*.28,w*.28])box(.035,h+.015,d+.015,'gold',x,0,0)},handleLoop=(w=.2,y=.3)=>curve([[-w/2,y,0],[-w/2,y+.1,0],[w/2,y+.1,0],[w/2,y,0]],.02,'dark'),flame=(y)=>{sphere(.07,.14,.07,'accent',0,y,0);cone(.07,.22,'gold',0,y+.1,0)},caseBox=(w,h,d,m='wood')=>box(w,h,d,m),screen=(w,h,x,y,z)=>panel(w,h,'accent',x,y,z),legs=(w,d,h)=>{for(let x of [-w/2,w/2])for(let z of [-d/2,d/2])box(.055,h,.055,'wood',x,h/2,z)};
switch(p.kind){
case 'longsword':handle();blade();break;
case 'greatsword':handle(.38);blade(1.25,.085);break;
case 'dagger':handle(.2);blade(.46,.06);break;
case 'rapier':handle(.22);blade(1,.018);ring(.09,.015,'gold',-.03,.05,0);break;
case 'katana':handle(.3);poly([[-.03,.16],[-.04,.65],[.02,1.05],[.09,1.23],[.055,.98],[.025,.63],[.03,.16]],.028);break;
case 'scimitar':handle();poly([[-.035,.14],[-.08,.55],[.03,.84],[.18,1.02],[.08,.7],[.12,.4],[.035,.14]],.035);break;
case 'energy-sword':cyl(.045,.3,'dark');cyl(.028,1,'accent',0,.65,0);sphere(.028,.028,.028,'accent',0,1.15,0);break;
case 'battleaxe':case 'double-axe':case 'halberd':{const pole=p.kind==='halberd';cyl(.03,pole?2:.95,'wood',0,pole?.2:.25,0);poly([[.02,.5],[.36,.43],[.4,.82],[.15,.73],[.02,.77]],.075);if(p.kind==='double-axe')poly([[-.02,.5],[-.36,.43],[-.4,.82],[-.15,.73],[-.02,.77]],.075);if(pole)cone(.09,.35,'metal',0,1.28,0);break;}
case 'warhammer':cyl(.035,1,'wood',0,.25,0);box(.5,.22,.2,'metal',0,.7,0);box(.1,.26,.24,'gold',0,.7,0);break;
case 'mace':cyl(.03,.75,'wood',0,.2,0);sphere(.12,.17,.12,'metal',0,.68,0);for(let a=0;a<6;a++){let o=box(.04,.25,.32,'metal',0,.68,0);o.rotation.y=a*Math.PI/6;}break;
case 'wood-club':cyl(.04,.5,'wood',0,.1,0);sphere(.12,.34,.12,'wood',0,.48,0);break;
case 'wood-spear':cyl(.025,2,'wood',0,.15,0);cone(.08,.33,'metal',0,1.31,0);break;
case 'wizard-staff':cyl(.03,1.8,'wood',0,.2,0);mesh(new T.OctahedronGeometry(.18),'cloth',0,1.19,0);ring(.22,.018,'gold',0,1.19,0);break;
case 'wand':cyl(.02,.55,'wood',0,.16,0);mesh(new T.OctahedronGeometry(.09),'gold',0,.49,0);break;
case 'longbow':curve([[0,-.7,0],[.22,-.35,0],[.3,0,0],[.22,.35,0],[0,.7,0]],.035);rod([0,-.7,0],[0,.7,0],.005,'paper');cyl(.045,.2,'dark',.3,0,0);g.children.forEach(o=>o.position.x-=.3);break;
case 'crossbow':box(.08,.1,.72,'wood',0,0,.15);curve([[-.4,.03,.4],[0,.03,.2],[.4,.03,.4]],.027);rod([-.4,.03,.4],[0,.03,-.08],.005,'paper');rod([.4,.03,.4],[0,.03,-.08],.005,'paper');rod([0,.08,-.05],[0,.08,.58],.01);box(.06,.18,.08,'wood',0,-.1,0);break;
case 'round-shield':case 'buckler':{let r=p.kind==='buckler'?.24:.4;let o=cyl(r,.055,p.kind==='buckler'?'metal':'wood',0,0,0);o.rotation.x=Math.PI/2;ring(r,.025,'metal');sphere(.09,.09,.07,'metal',0,0,.05);curve([[-.08,0,-.05],[0,0,-.13],[.08,0,-.05]],.025,'dark');break;}
case 'kite-shield':poly([[-.32,.38],[.32,.38],[.26,-.15],[0,-.6],[-.26,-.15]],.07,'accent');panel(.04,.7,'gold',0,0,.045);panel(.5,.04,'gold',0,.18,.045);curve([[-.1,0,-.05],[0,0,-.14],[.1,0,-.05]],.025,'dark');break;
case 'revolver':case 'handgun':case 'scifi-blaster':{const sci=p.kind==='scifi-blaster';box(.075,.19,.09,'dark',0,-.035,0);box(.09,.09,sci?.35:.28,sci?'metal':'dark',0,.09,.1);let o=cyl(.025,.18,sci?'accent':'metal',0,.09,.29);o.rotation.x=Math.PI/2;if(p.kind==='revolver'){o=cyl(.06,.1,'metal',0,.08,.06);o.rotation.x=Math.PI/2;}if(sci)ring(.045,.012,'accent',0,.09,.39);break;}
case 'shotgun':case 'scifi-rifle':{let sci=p.kind==='scifi-rifle';box(.075,.13,.35,'wood',0,.02,-.28);box(.1,.12,.45,sci?'metal':'dark',0,.04,.08);box(.06,.2,.1,'dark',0,-.08,0);let o=cyl(.025,.5,sci?'accent':'metal',0,.06,.49);o.rotation.x=Math.PI/2;box(.12,.1,.2,'wood',0,.015,.25);if(sci)box(.06,.15,.13,'gold',.08,0,.08);break;}
case 'scanner':case 'phone':box(.16,.31,.04,'dark');screen(.13,.21,0,.02,.028);sphere(.015,.015,.012,'gold',0,-.12,.027);if(p.kind==='scanner')cyl(.02,.08,'accent',0,.19,0);break;
case 'holo-projector':cyl(.24,.08,'dark',0,.04,0);{let m=M.glass.clone();m.transparent=true;m.opacity=.2;m.depthWrite=false;mesh(new T.CylinderGeometry(.3,.13,.55,16,1,true),m,0,.34,0);mesh(new T.OctahedronGeometry(.12),'accent',0,.4,0);}break;
case 'mug':lathe([[0,-.12],[.13,-.12],[.15,-.1],[.15,.17],[.13,.17],[.13,-.095],[0,-.095]],'paper');ring(.1,.025,'paper',.18,.015,0);cyl(.128,.008,'wood',0,.12,0);break;
case 'water-bottle':cyl(.09,.34,'accent');cyl(.06,.06,'dark',0,.2,0);ring(.092,.006,'paper',0,.08,0).rotation.x=Math.PI/2;break;
case 'plate':lathe([[0,0],[.2,0],[.31,.035],[.33,.055],[.3,.07],[.2,.025],[0,.025]],'paper');break;
case 'apple':sphere(.12,.14,.12,'cloth',-.05,0,0);sphere(.12,.14,.12,'cloth',.05,0,0);rod([0,.1,0],[.015,.22,0],.015,'wood');sphere(.07,.015,.03,'accent',.06,.18,0).rotation.z=.3;break;
case 'bread':sphere(.31,.14,.14,'food');for(let x of [-.17,0,.17])rod([x-.03,.135,-.04],[x+.03,.135,.04],.012,'paper');break;
case 'bowl':lathe([[0,0],[.12,0],[.22,.12],[.26,.24],[.24,.25],[.2,.13],[.1,.025],[0,.025]],'accent');break;
case 'book':box(.32,.42,.075,'paper');for(let z of [-.045,.045])panel(.35,.45,'cloth',0,0,z);box(.025,.45,.1,'cloth',-.17,0,0);break;
case 'open-book':{for(let side of [-1,1]){let o=box(.25,.36,.04,'paper',side*.12,0,0);o.rotation.y=side*.18;for(let y of [-.1,-.04,.02,.08])panel(.17,.006,'wood',side*.13,y,.05);}box(.02,.36,.05,'wood');break;}
case 'scroll':panel(.4,.5,'paper',0,0,0);for(let x of [-.22,.22])cyl(.04,.54,'paper',x,0,0);for(let y of [-.12,-.04,.04,.12])panel(.27,.008,'wood',0,y,.012);break;
case 'map':for(let i=0;i<3;i++){let o=panel(.2,.4,'paper',(i-1)*.19,0,i%2*.025);o.rotation.y=(i%2?1:-1)*.12;}curve([[-.24,-.1,.05],[-.1,.09,.05],[.08,-.03,.05],[.22,.1,.05]],.008,'accent');break;
case 'quill':rod([0,-.2,0],[.03,.2,0],.008,'wood');sphere(.065,.16,.015,'paper',.015,.1,0).rotation.z=-.22;break;
case 'laptop':box(.55,.025,.37,'metal',0,0,.05);box(.55,.35,.025,'dark',0,.18,-.13);screen(.49,.29,0,.19,-.11);for(let x=-.2;x<=.2;x+=.05)for(let z=0;z<.11;z+=.04)box(.035,.007,.025,'dark',x,.018,z);box(.13,.005,.07,'dark',0,.017,.16);break;
case 'camera':box(.32,.2,.1,'dark');let lens=cyl(.08,.14,'metal',0,0,.1);lens.rotation.x=Math.PI/2;let glass=cyl(.061,.008,'accent',0,0,.175);glass.rotation.x=Math.PI/2;box(.1,.035,.06,'dark',-.08,.12,0);break;
case 'microphone':cyl(.025,.24,'dark',0,-.05,0);sphere(.065,.085,.065,'metal',0,.13,0);for(let y of [.1,.13,.16])ring(.06,.004,'dark',0,y,0).rotation.x=Math.PI/2;break;
case 'key':ring(.08,.022,'gold',0,.1,0);cyl(.02,.25,'gold',0,-.06,0);for(let y of [-.13,-.18])box(.07,.025,.025,'gold',.025,y,0);break;
case 'coin-pouch':sphere(.16,.18,.12,'wood',0,-.04,0);cyl(.07,.07,'cloth',0,.13,0);ring(.075,.012,'gold',0,.12,0).rotation.x=Math.PI/2;break;
case 'gem':mesh(new T.OctahedronGeometry(.19),'cloth');break;
case 'backpack':box(.4,.55,.22,'cloth',0,.275,0);box(.3,.2,.07,'wood',0,.15,.14);for(let x of [-.13,.13])curve([[x,.48,-.1],[x,.35,-.2],[x,.08,-.1]],.025,'dark');handleLoop(.17,.55);break;
case 'suitcase':box(.56,.4,.18,'wood',0,-.23,0);handleLoop(.18,-.04);for(let x of [-.18,.18])box(.03,.41,.19,'gold',x,-.23,0);break;
case 'torch':cyl(.03,.6,'wood',0,-.12,0);cyl(.055,.12,'dark',0,.2,0);flame(.34);break;
case 'flashlight':cyl(.045,.3,'dark');cyl(.045,.12,'metal',0,.21,0,.085);cyl(.08,.01,'gold',0,.275,0);break;
case 'shovel':cyl(.025,.9,'wood',0,.1,0);ring(.09,.02,'wood',0,-.42,0);poly([[-.13,.52],[.13,.52],[.11,.76],[0,.86],[-.11,.76]],.025);break;
case 'pickaxe':cyl(.03,.9,'wood',0,.2,0);poly([[-.42,.65],[-.23,.78],[.23,.78],[.42,.65],[.2,.71],[-.2,.71]],.07);break;
case 'wrench':box(.055,.38,.035,'metal');poly([[-.025,.15],[-.11,.22],[-.1,.34],[-.055,.38],[-.055,.27],[.055,.27],[.055,.38],[.1,.34],[.11,.22],[.025,.15]],.04);break;
case 'tool-hammer':cyl(.025,.48,'wood',0,.08,0);box(.2,.08,.09,'metal',-.04,.32,0);poly([[.05,.36],[.16,.35],[.2,.28],[.12,.3],[.05,.3]],.07);break;
case 'broom':cyl(.022,1.3,'wood',0,.25,0);mesh(new T.CylinderGeometry(.07,.23,.32,10),'food',0,-.55,0).scale.z=.4;for(let x=-.18;x<=.18;x+=.03)rod([x,-.7,-.04],[x*.4,-.4,-.04],.004,'wood');break;
case 'umbrella':{cyl(.012,1,'dark',0,.2,0);curve([[0,-.3,0],[0,-.44,0],[.09,-.44,0],[.1,-.36,0]],.015,'dark');let o=mesh(new T.SphereGeometry(.6,16,8,0,Math.PI*2,0,Math.PI/2),'cloth',0,.62,0);o.scale.y=.45;for(let i=0;i<8;i++){let a=i*Math.PI/4;rod([0,.89,0],[Math.cos(a)*.6,.62,Math.sin(a)*.6],.007,'metal');}break;}
case 'medical-kit':{const bag=box(.45,.3,.17,'paper',0,-.19,0);handleLoop(.15,-.04);const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.drawImage(M.paper.map.userData.canvas,0,0,128,128);x.fillStyle=C.cloth;x.fillRect(55,28,18,72);x.fillRect(30,53,68,22);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.userData.canvas=c;const m=M.paper.clone();m.map=t;bag.material=[M.paper,M.paper,M.paper,M.paper,m,M.paper];break;}
case 'toolbox':box(.5,.26,.22,'wood',0,-.17,0);box(.53,.04,.25,'dark',0,-.02,0);handleLoop(.17,0);panel(.05,.09,'gold',0,-.06,.13);break;
case 'crate':box(.75,.75,.75,'wood',0,.375,0);for(let side of [-1,1]){rod([-.32,.06,side*.385],[.32,.69,side*.385],.035,'food');rod([.32,.06,side*.385],[-.32,.69,side*.385],.035,'food');}break;
case 'barrel':lathe([[0,0],[.27,0],[.34,.15],[.37,.4],[.34,.65],[.27,.8],[0,.8]],'wood');for(let y of [.16,.64])ring(.344,.025,'dark',0,y,0).rotation.x=Math.PI/2;break;
case 'chair':legs(.43,.43,.46);box(.55,.06,.55,'wood',0,.49,0);for(let x of [-.22,.22])box(.05,.6,.05,'wood',x,.78,-.23);box(.48,.35,.05,'wood',0,.89,-.23);break;
case 'table':legs(1.1,.65,.74);box(1.3,.07,.85,'wood',0,.775,0);break;
case 'treasure-chest':{box(.8,.42,.5,'wood',0,.21,0);for(let x of [-.25,.25])box(.045,.43,.52,'gold',x,.21,0);let lid=new T.Group();lid.position.set(0,.42,-.25);g.add(lid);let arch=new T.Shape();arch.moveTo(.25,0);arch.absarc(0,0,.25,0,Math.PI,false);arch.closePath();let top=new T.Mesh(normalizeUV(new T.ExtrudeGeometry(arch,{depth:.8,bevelEnabled:false})),M.wood);top.rotation.y=Math.PI/2;top.position.set(-.4,0,.25);lid.add(top);box(.8,.035,.5,'wood',0,0,.25,lid);g.userData.lid=lid;panel(.1,.13,'gold',0,.4,.26);break;}
case 'signpost':box(.08,1.3,.08,'wood',0,.65,0);poly([[-.45,.9],[.3,.9],[.48,1.05],[.3,1.2],[-.45,1.2]],.06,'food');break;
case 'rope-coil':for(let i=0;i<5;i++)ring(.18+i*.018,.014,'wood',0,0,i*.015);curve([[.25,-.05,0],[.34,-.2,0],[.25,-.35,0]],.014,'wood');break;
case 'telescope':for(let i=0;i<3;i++)cyl(.04+i*.015,.18,'gold',0,(i-1)*.16,0);cyl(.07,.025,'dark',0,.26,0);cyl(.06,.008,'accent',0,.278,0);break;
case 'candle':cyl(.16,.03,'gold',0,0,0);cyl(.055,.25,'paper',0,.14,0);rod([0,.26,0],[0,.29,0],.006,'dark');flame(.35);break;
case 'potion':M.glass.transparent=true;M.glass.opacity=.42;M.glass.depthWrite=false;sphere(.14,.16,.14,'glass',0,-.04,0);cyl(.05,.15,'glass',0,.13,0);cyl(.055,.04,'wood',0,.225,0);sphere(.125,.1,.125,'cloth',0,-.08,0);break;
case 'crystal-ball':cyl(.22,.07,'gold',0,.035,0);cone(.19,.15,'gold',0,.12,0);sphere(.23,.23,.23,'cloth',0,.33,0);sphere(.04,.07,.018,'paper',-.08,.42,.195);break;
case 'soccer-ball':sphere(.22,.22,.22,'paper');for(let i=0;i<12;i++){let a=i*2.39996,y=1-2*(i+.5)/12,r=Math.sqrt(1-y*y),v=new T.Vector3(Math.cos(a)*r,y,Math.sin(a)*r),o=mesh(new T.CircleGeometry(.065,5),'dark',...v.clone().multiplyScalar(.221).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),v);}break;
case 'gift-box':box(.4,.4,.4,'cloth');box(.06,.405,.405,'gold');box(.409,.06,.409,'gold');for(let x of [-.075,.075]){let o=ring(.07,.014,'gold',x,.24,0);o.scale.y=.5;}break;
case 'guitar':sphere(.18,.23,.065,'wood',0,-.23,0);sphere(.13,.16,.06,'wood',0,.02,0);box(.06,.6,.04,'dark',0,.34,0);box(.09,.14,.05,'wood',0,.7,0);mesh(new T.CircleGeometry(.06,20),'dark',0,-.05,.064);for(let x of [-.012,-.004,.004,.012])rod([x,-.3,.07],[x,.74,.03],.002,'metal');for(let y of [.2,.3,.4,.5])panel(.055,.004,'metal',0,y,.025);break;
default:throw Error('Missing 3D builder: '+p.kind);
}
g.userData.libraryProp=p.kind;g.name='prop:'+p.kind;g.position.fromArray(p.from||[0,0,0]);g.scale.setScalar(p.scale||1);g.rotation.set(...(p.rotation3d||[0,0,0]));return g;}
