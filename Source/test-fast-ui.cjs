// SPDX-License-Identifier: GPL-3.0-only
// Actual DOM + engine integration; preview renderer stubbed, not real-browser visual QA.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),native=require('@napi-rs/canvas'),{JSDOM}=require('jsdom');
process.chdir(path.resolve(__dirname,'..'));
(async()=>{
 const ctx={console,TextEncoder,TextDecoder,AbortController,setTimeout,Image:native.Image,document:{createElement:()=>native.createCanvas(1,1)}};ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('engine.bundle.js','utf8'),ctx);
 const S=ctx.CartoonStudio,dom=new JSDOM(fs.readFileSync('Source/shell.html','utf8'),{runScripts:'outside-only'}),w=dom.window;
 try {
 const downloads=[],blobs=new Map();let serial=0;
 w.Blob=Blob;w.URL.createObjectURL=b=>{const u='blob:test-'+serial++;blobs.set(u,b);return u;};w.URL.revokeObjectURL=()=>{};
 w.HTMLAnchorElement.prototype.click=function(){downloads.push({name:this.download,blob:blobs.get(this.href)});};
 w.CartoonStudio={...S,PreviewRenderer:class{mode='DOM renderer stub';render(){}}};w.BUNDLED=JSON.parse(fs.readFileSync('Demo.jetcartoon.json'));w.requestAnimationFrame=()=>{};w.confirm=()=>true;
 await w.eval(fs.readFileSync('Source/ui.js','utf8'));assert(w.StudioApp,'UI initialized');
 const $=id=>w.document.getElementById(id),app=w.StudioApp,snapshot=()=>JSON.stringify(app.getProject()),mode=value=>{$('renderMode').value=value;$('renderMode').dispatchEvent(new w.Event('change'));};
 const load=async data=>{const source=JSON.stringify(data);Object.defineProperty($('load'),'files',{configurable:true,value:[{size:source.length,text:async()=>source}]});await $('load').onchange();assert(!/rejected/i.test($('status').textContent),$('status').textContent);};
 assert.equal(app.effectiveSettings().mode,'fast');assert.equal(app.effectiveSettings().fps,6);assert.equal($('preview').width,640);assert.equal($('preview').height,360);
 const initialActors=JSON.stringify(app.getProject().scenes[0].actors);mode('standard');assert.equal(app.effectiveSettings().mode,'standard');assert.equal(app.effectiveSettings().fps,24);assert.equal($('preview').width,1280);assert.equal(JSON.stringify(app.getProject().scenes[0].actors),initialActors);mode('fast');
 w.confirm=()=>false;const before=snapshot();$('newProject').click();assert.equal(snapshot(),before);w.confirm=()=>true;$('newProject').click();let p=app.getProject();assert.equal(p.renderSettings.mode,'fast');assert.equal(p.scenes[0].actors.length,2);assert(p.scenes[0].actors.every(a=>a.kind==='blank-human'));assert.notEqual(p.scenes[0].actors[0].cast,p.scenes[0].actors[1].cast);
 // Role edits require an explicit non-interaction confirmation and keep identity intact.
 $('actorRenderRole').value='background-extra';$('actorNonInteracting').checked=false;const roleBefore=snapshot();$('applyActorRole').click();assert.equal(snapshot(),roleBefore);assert.match($('status').textContent,/Confirm/);
 $('actorNonInteracting').checked=true;$('applyActorRole').click();let actor=app.getProject().scenes[0].actors[0];assert.equal(actor.renderRole,'background-extra');assert.equal(actor.nonInteracting,true);assert.equal(actor.cast,p.scenes[0].actors[0].cast);
 $('actorRepresentation').value='full';$('applyActorRole').click();actor=app.getProject().scenes[0].actors[0];assert.equal(actor.renderRepresentation,'full');assert.equal(S.backgroundExtraEligible(actor,app.getProject().scenes[0]),false);
 const scene={camera:[8,3,10],props:[],effects:[]},extra={...actor,renderRepresentation:'auto',action:'idle',from:[0,0,-3]};assert.equal(S.backgroundExtraEligible(extra,scene),true);
 for(const field of ['speaking','handlesObjects','combat','plotRelevant'])assert.equal(S.backgroundExtraEligible({...extra,[field]:true},scene),false,field+' protects full actor');
 assert.equal(S.backgroundExtraEligible(extra,{...scene,speaker:extra.id}),false);assert.equal(S.backgroundExtraEligible(extra,{...scene,props:[{owner:extra.id}]}),false);
 $('save').click();assert.equal(downloads.at(-1).name,'Jet-Cartoon-Project.json');const saved=JSON.parse(await downloads.at(-1).blob.text());assert.equal(saved.project.renderSettings.mode,'fast');assert.equal(saved.project.scenes[0].actors[0].renderRepresentation,'full');await load(saved);assert.equal(snapshot(),JSON.stringify(saved.project));assert.equal(app.effectiveSettings().fps,6);
 // Legacy no-mode imports retain their old mode, exact actors and unspecified settings.
 const legacy=JSON.parse(JSON.stringify(saved));delete legacy.project.renderSettings;delete legacy.project.createdWith;const legacyActors=JSON.stringify(legacy.project.scenes[0].actors);await load(legacy);assert.equal(app.effectiveSettings().mode,'standard');assert.equal(app.effectiveSettings().fps,24);assert.equal($('preview').width,1280);assert.equal(JSON.stringify(app.getProject().scenes[0].actors),legacyActors);assert.equal(app.getProject().renderSettings,undefined);
 $('newProject').click();assert.equal(app.getProject().renderSettings.mode,'fast');assert.equal(app.getProject().scenes[0].actors.length,2);
 // Explicit Standard remains honored for this project and subsequent new projects.
 mode('standard');$('newProject').click();p=app.getProject();assert.equal(p.renderSettings.mode,'standard');assert.equal(app.effectiveSettings().fps,24);assert.equal(p.scenes[0].actors.length,1);assert.equal(p.scenes[0].actors[0].kind,'standard-humanoid');
 const standard=app.getPackage();mode('fast');await load(standard);assert.equal(app.effectiveSettings().mode,'standard');assert.equal(JSON.stringify(app.getProject()),JSON.stringify(standard.project));$('newProject').click();assert.equal(app.getProject().renderSettings.mode,'fast');
 for(let i=0;i<2;i++){const actors=JSON.stringify(app.getProject().scenes[0].actors);mode('standard');assert.equal($('preview').width,1280);mode('fast');assert.equal($('preview').width,640);assert.equal(JSON.stringify(app.getProject().scenes[0].actors),actors);}
 assert.equal(typeof app.pause,'function');assert.equal(typeof app.getFrame,'function');S.validate(app.getProject());console.log('PASS Fast UI DOM: fresh defaults, protected roles, cancel, mode switches, portable save/import, legacy and explicit Standard compatibility');
 }finally{w.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
