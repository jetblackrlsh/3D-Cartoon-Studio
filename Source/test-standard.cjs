// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 jetblackrlsh
// Real embedded CC0 fixtures; no browser, network or vendor ZIP dependency.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'studio-standard-'));
(async()=>{try{
 require('esbuild').buildSync({stdin:{contents:"export * from './standard-rigs.js';export * from './standard-cast.js';export {presetCatalog,prepareActionProps,updateActionProps} from './flexible-rigs.js';export * as THREE from 'three';",resolveDir:__dirname},bundle:true,platform:'node',format:'cjs',outfile:path.join(tmp,'runtime.cjs')});
 const S=require(path.join(tmp,'runtime.cjs')),T=S.THREE,assets=require('./standard-assets.cjs')();
 for(const a of Object.values(assets)){assert.equal(a.license,'CC0-1.0');assert(a.source.startsWith('https://'));assert.equal(crypto.createHash('sha256').update(Buffer.from(a.data.split(',')[1],'base64')).digest('hex'),a.sha256,'asset integrity '+a.id);}
 await S.initStandardAssets(assets);
 const catalog=S.standardAssetCatalog();assert.equal(catalog.find(a=>a.id==='actionforge-human').bones.length,71);assert.equal(catalog.find(a=>a.id==='quaternius-ual').clips.length,43);
 const H={mat:(_k,c)=>new T.MeshStandardMaterial({color:c}),mesh:(p,g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;}};
 H.box=(p,w,h,d,m,x,y,z)=>H.mesh(p,new T.BoxGeometry(w,h,d),m,x,y,z);H.cyl=(p,r,h,m,x,y,z,n=8)=>H.mesh(p,new T.CylinderGeometry(r,r,h,n),m,x,y,z);H.orb=(p,r,m,x,y,z)=>H.mesh(p,new T.SphereGeometry(r,8,5),m,x,y,z);
 const rig=S.createStandardRig('actionforge-human',{},H),second=S.createStandardRig('actionforge-human',{},H);
 const finite=r=>{for(const b of r.standard.boneList){assert(b.position.toArray().every(Number.isFinite));assert(b.quaternion.toArray().every(Number.isFinite));assert(Math.abs(b.quaternion.length()-1)<1e-4);}};
 const secondRest=JSON.stringify(S.standardRigSnapshot(second));
 assert.equal(S.presetCatalog.length,58);
 for(const p of S.presetCatalog){const id=typeof p==='string'?p:p.id;for(const q of [.2,.7]){S.applyStandardPreset(rig,id,q*3,q);finite(rig);}}
 assert.equal(JSON.stringify(S.standardRigSnapshot(second)),secondRest,'pose does not mutate sibling instance');
 let sourceSkin,instanceSkin;rig.standard.asset.scene.traverse(m=>{if(m.isSkinnedMesh)sourceSkin=m});rig.standard.scene.traverse(m=>{if(m.isSkinnedMesh)instanceSkin=m});assert.notEqual(sourceSkin.skeleton.boneInverses,instanceSkin.skeleton.boneInverses);assert.notEqual(sourceSkin.skeleton.boneInverses[0],instanceSkin.skeleton.boneInverses[0]);
 let sampled=0;for(const clip of catalog.find(a=>a.id==='quaternius-ual').clips){S.applyStandardAnimation(rig,{asset:'quaternius-ual',clip:clip.name},clip.duration*.4);finite(rig);sampled++;}
 const options={asset:'quaternius-ual',clip:'Walk_Loop',grounding:'none'};S.applyStandardAnimation(rig,options,.25);const snap=JSON.stringify(S.standardRigSnapshot(rig));S.applyStandardAnimation(rig,options,4);S.applyStandardAnimation(rig,options,.25);assert.equal(JSON.stringify(S.standardRigSnapshot(rig)),snap,'native backward seek is stateless');
 S.applyStandardPreset(rig,'idle',0,0);const target=rig.standard.bones.rightHand.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,.05,.02));S.solveStandardGrip(rig,1,target.toArray());assert(rig.standard.bones.rightHand.getWorldPosition(new T.Vector3()).distanceTo(target)<1e-5);
 for(const name of ['leftHand','rightHand','head','body'])assert(S.getStandardSocket(rig,name).isObject3D);
 const named=rig.standard.boneList.filter(b=>/finger|thumb|index|middle|ring|pinky/i.test(b.name));assert(named.length>=10,'actual finger joints retained');
 assert.equal(S.standardCastCatalog.length,60);for(const p of S.standardCastCatalog){const actor=S.createStandardCastActor(p.id),text=S.serializeStandardCast(actor);assert.deepEqual(S.parseStandardCast(text).design,actor.design);S.validateStandardAppearance(actor.design);}
 for(const genre of ['everyday','fantasy','scifi','western','superhero']){assert.equal(S.searchStandardCast('',genre).length,12);assert.deepEqual(S.selectStandardCast(4,{genre,seed:8}),S.selectStandardCast(4,{genre,seed:8}));}
 const actor=S.createStandardCastActor(S.standardCastCatalog[0].id),styled=S.createStandardRig('actionforge-human',actor.design,H),one=S.applyStandardAppearance(styled,actor.design),two=S.applyStandardAppearance(styled,actor.design);assert.deepEqual(one,two,'repeat styling idempotent');finite(styled);assert.equal(JSON.stringify(S.standardRigSnapshot(second)),secondRest);
 assert.throws(()=>S.mapStandardBones(rig.standard.scene,{hips:'missing'}),/Mapped bone not found/);assert.throws(()=>S.validateStandardActor({kind:'standard-humanoid',design:{standardAsset:'missing'}}),/Missing/);await assert.rejects(()=>S.loadStandardAsset('bad',{asset:{version:'2.0'},buffers:[{uri:'https://invalid.example/not-offline.bin'}]}),/External/);
 console.log('PASS standard real assets: 5 checksums; 71-joint rig; 58 authored poses; '+sampled+' native clips; 60 style serialization cases; finite joints; isolated clones; backward seek; finger joints; actual grip and sockets; input rejection.');
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1});
