// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
// Cast library integration, modified 2026-10-26.
import catalog from './cast-catalog.json';
export const castCatalog=catalog;
const copy=x=>JSON.parse(JSON.stringify(x));
export const bodyProfiles={average:[1,1,1,1],slender:[.82,.88,1.06,.92],tall:[.9,.96,1.17,.96],sturdy:[1.18,1.18,.94,1.04],stocky:[1.32,1.25,.84,1.05],athletic:[1.13,1.12,1.05,.93],curvy:[1.10,1.27,.96,1],petite:[.91,.96,.88,1.07],dwarf:[1.4,1.4,.65,1.03],ogre:[1.5,1.5,1.13,.87],elf:[.78,.83,1.17,.97]};
export const hairStyles=['bald','short','buzz','swept','curly','afro','bob','bun','long','braids','ponytail','locs','mohawk','beard','crest'];
export const outfitStyles=[...new Set(catalog.map(x=>x.design.outfit))];
export const accessoryStyles=[...new Set(catalog.map(x=>x.design.accessory))];
export function castDesign(id,overrides={}){const p=catalog.find(p=>p.id===id);if(!p)throw Error('Unknown cast preset: '+id);return {...copy(p.design),...copy(overrides)};}
export function createCastActor(id,options={}){const {design={},...rest}=copy(options);return {...rest,id:rest.id||id,kind:'blank-human',cast:id,action:rest.action||'idle',from:rest.from||[0,0,0],design:castDesign(id,design)};}
export function searchCast(query='',genre='all'){const terms=query.toLowerCase().trim().split(/\s+/).filter(Boolean);return catalog.filter(p=>(genre==='all'||p.genre===genre)&&terms.every(t=>[p.name,p.description,...p.tags].join(' ').toLowerCase().includes(t)));}
// Families reflect garment construction, never narrative role, skin tone or sex.
const outfitFamily=outfit=>({hoodie:'casual',cardigan:'casual',apron:'service',scrubs:'service',labcoat:'service',coveralls:'workwear',smith:'workwear',utility:'workwear',suspenders:'workwear',raincoat:'outerwear','flight-jacket':'outerwear','pressure-vest':'outerwear',denim:'outerwear',duster:'outerwear',frock:'outerwear',plate:'armor','hero-armor':'armor','leaf-armor':'armor','exo-suit':'armor',ranger:'tunic',patchwork:'tunic',waistcoat:'tunic',robe:'robe',mantle:'robe',spacesuit:'technical-suit',segmented:'technical-suit','speed-suit':'technical-suit','rescue-suit':'technical-suit',uniform:'uniform',embroidered:'performance'}[outfit]||outfit);
// Greedy marginal diversity: reuse only after unused presets/archetypes are exhausted.
// Seed affects equal-ranked choices only; existing actors are observations, never rewritten.
export function diverseCast(count,{genre='everyday',seed=0,used=[],existing=[]}={}){
 if(!Number.isInteger(count)||count<1||count>16)throw Error('Cast count must be 1–16');
 if(!Number.isSafeInteger(seed)||seed<0)throw Error('Seed must be a nonnegative safe integer');
 if(!Array.isArray(used)||!Array.isArray(existing))throw Error('Existing cast must be arrays');
 if(existing.length+count>16)throw Error('Actor limit reached');
 const pool=searchCast('',genre);if(!pool.length)throw Error('Unknown cast genre');
 const observed=[];
 for(const a of existing){const p=catalog.find(p=>p.id===a.cast);observed.push({id:a.cast,archetype:p?.archetype,presentation:a.presentation||p?.presentation,design:{...p?.design,...a.design}});}
 const represented=new Set(existing.map(a=>a.cast));
 for(const id of used)if(!represented.has(id)){const p=catalog.find(p=>p.id===id);if(p)observed.push(p);else if(typeof id==='string')observed.push({id,design:{}});}
 const matches=(key,value)=>value===undefined?0:observed.filter(p=>key(p)===value).length;
 const usedPreset=p=>matches(x=>x.id,p.id),usedArchetype=p=>matches(x=>x.archetype,p.archetype);
 const tie=(id,round)=>{let h=(seed>>>0)^Math.floor(seed/4294967296)^Math.imul(round+1,0x9e3779b1);for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;return h>>>0;};
 const result=[];
 for(let round=0;round<count;round++){
  const male=matches(x=>x.presentation,'masculine'),female=matches(x=>x.presentation,'feminine');
  const rank=p=>[usedPreset(p),usedArchetype(p),Math.abs(male+(p.presentation==='masculine'?1:0)-female-(p.presentation==='feminine'?1:0)),
   8*matches(x=>x.design?.body,p.design.body)+4*matches(x=>x.design?.hairStyle,p.design.hairStyle)+3*matches(x=>outfitFamily(x.design?.outfit),outfitFamily(p.design.outfit))+matches(x=>x.design?.outfit,p.design.outfit),tie(p.id,round)];
  const ranked=pool.map(p=>({p,rank:rank(p)})).sort((a,b)=>{for(let i=0;i<a.rank.length;i++)if(a.rank[i]!==b.rank[i])return a.rank[i]-b.rank[i];return a.p.id.localeCompare(b.p.id);});
  const chosen=ranked[0].p;observed.push(chosen);let id='cast-'+(round+1);while(existing.some(a=>a.id===id)||result.some(a=>a.id===id))id+='-copy';result.push(createCastActor(chosen.id,{id,from:[(round-(count-1)/2)*1.7,0,0]}));
 }
 return result;
}
export function validateCastActor(a){if(a.cast!==undefined){if(a.kind!=='blank-human')throw Error('Cast presets require blank-human rig');castDesign(a.cast);}const d=a.design||{};if(!d.body&&!a.cast)return;if(a.action?.startsWith('skate-')||(a.beats||[]).some(b=>b.action?.startsWith('skate-')))throw Error('Captured skating requires a skater rig; cast profiles support authored humanoid actions');for(const [key,values]of Object.entries({body:Object.keys(bodyProfiles),hairStyle:hairStyles,outfit:outfitStyles,accessory:accessoryStyles,species:['human','elf','dwarf','ogre','android']}))if(d[key]!==undefined&&!values.includes(d[key]))throw Error('Unknown cast '+key);for(const key of ['skin','top','legs','shoes','hair','accent','eye'])if(d[key]!==undefined&&!/^#[0-9a-f]{6}$/i.test(d[key]))throw Error('Invalid cast color '+key);if(d.variant!==undefined&&![0,1].includes(d.variant))throw Error('Invalid cast variant');}
export function proportionDimensions(base,design){if(!design.body)return base;const p=bodyProfiles[design.body];if(!p)throw Error('Unknown body profile');const [w,hip,l,h]=p,d={...base};d.thigh*=l;d.shin*=l;d.hip=d.thigh+d.shin+.12;d.torsoR*=w;d.torsoH*=design.body==='dwarf'?.9:1;d.hipW*=hip;d.limbR*=Math.sqrt(w);d.shoulder=d.hip+d.torsoH+.06;d.shoulderW=Math.max(d.torsoR+d.limbR*1.12,.39*w);d.arm*=Math.sqrt(l);d.fore*=Math.sqrt(l);d.headR*=h;d.head=d.shoulder+.10+d.headR;return d;}
