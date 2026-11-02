// SPDX-License-Identifier: GPL-3.0-only
// Actual editor DOM and engine contracts. Preview rendering is stubbed, not WebGL certification.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),native=require('@napi-rs/canvas'),{JSDOM}=require('jsdom');
process.chdir(path.resolve(__dirname,'..'));
(async()=>{
 const ctx={console,TextEncoder,TextDecoder,AbortController,setTimeout,Image:native.Image,document:{createElement:()=>native.createCanvas(1,1)}};ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('engine.bundle.js','utf8'),ctx);
 const S=ctx.CartoonStudio,dom=new JSDOM(fs.readFileSync('Source/shell.html','utf8'),{runScripts:'outside-only'}),w=dom.window;
 try{
 w.CartoonStudio={...S,PreviewRenderer:class{mode='test stub';render(){}}};w.BUNDLED=JSON.parse(fs.readFileSync('Demo.jetcartoon.json'));w.requestAnimationFrame=()=>{};w.confirm=()=>true;
 w.eval(fs.readFileSync('Source/ui.js','utf8'));for(let i=0;i<200&&!w.StudioApp;i++)await new Promise(r=>setTimeout(r,10));assert(w.StudioApp,'UI initialized');
 const $=id=>w.document.getElementById(id),project=()=>w.StudioApp.getProject(),snapshot=()=>JSON.stringify(project()),change=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new w.Event('change'));};
 assert.equal($('miniHeadwear').options.length,5);assert.equal($('miniFace').options.length,4);
 const original=snapshot();$('applyMinifigure').click();assert.equal(snapshot(),original);assert.match($('status').textContent,/Select a minifigure/);
 change('miniHeadwear','helmet');change('miniFace','angry');change('miniTorsoPrint','spacesuit');change('miniHandAccessory','wand');change('miniTop','#19aabb');change('miniHeight','2.4');
 const before=project().scenes[0].actors;$('addMinifigure').click();let actors=project().scenes[0].actors,a=actors.at(-1);assert.equal(a.kind,'minifigure');assert.equal(a.design.headwear,'helmet');assert.equal(a.design.face,'angry');assert.equal(a.design.torsoPrint,'spacesuit');assert.equal(a.design.handAccessory,'wand');assert.equal(a.design.top,'#19aabb');assert.equal(a.design.height,2.4);assert.equal(JSON.stringify(actors.slice(0,-1)),JSON.stringify(before));assert.equal(+$('presetActor').value,actors.length-1);
 change('presetName','wave');change('presetDuration','2');$('applyPreset').click();a=project().scenes[0].actors.at(-1);assert.equal(a.action,'wave');assert.equal(a.beats[0].action,'wave');const motion=JSON.stringify({id:a.id,from:a.from,to:a.to,action:a.action,beats:a.beats,presetOptions:a.presetOptions});
 change('miniHeadwear','bob');change('miniFace','smile');change('miniHandAccessory','mug');change('miniSkin','#925e40');$('applyMinifigure').click();a=project().scenes[0].actors.at(-1);assert.equal(a.design.headwear,'bob');assert.equal(a.design.handAccessory,'mug');assert.equal(a.design.skin,'#925e40');assert.equal(JSON.stringify({id:a.id,from:a.from,to:a.to,action:a.action,beats:a.beats,presetOptions:a.presetOptions}),motion);
 const good=snapshot();change('miniHeight','99');$('applyMinifigure').click();assert.equal(snapshot(),good);assert.match($('status').textContent,/height/);change('miniHeight','2.4');
 // Generic appearance controls retain the selected toy rig and its customized features.
 change('styleTop','#cc3311');$('restyle').click();a=project().scenes[0].actors.at(-1);assert.equal(a.kind,'minifigure');assert.equal(a.design.top,'#cc3311');assert.equal(a.design.headwear,'bob');assert.equal(a.action,'wave');
 const packageCopy=w.StudioApp.getPackage();assert.equal(packageCopy.project.scenes[0].actors.at(-1).kind,'minifigure');S.validate(JSON.parse(JSON.stringify(packageCopy.project)));
 // Switching actor cannot accidentally apply the minifigure controls to the normal cast.
 change('presetActor','0');const normalBefore=snapshot();$('applyMinifigure').click();assert.equal(snapshot(),normalBefore);
 // An explicit imported-rig conversion removes incompatible clips and reports it.
 w.StudioApp.standardPutActor({id:'native-convert',kind:'standard-humanoid',from:[1,0,0],action:'idle',design:{standardAsset:'actionforge-human'},standardAnimation:{asset:'quaternius-ual',clip:'Walk_Loop',rootMotion:'in-place'},beats:[{at:0,action:'wave',standardAnimation:{asset:'quaternius-ual',clip:'Walk_Loop',rootMotion:'in-place'}}]});
 change('presetActor',String(project().scenes[0].actors.length-1));change('rigKind','minifigure');$('restyle').click();a=project().scenes[0].actors.at(-1);assert.equal(a.kind,'minifigure');assert(!a.standardAnimation);assert(!a.beats[0].standardAnimation);assert.equal(a.beats[0].action,'wave');assert.equal(a.id,'native-convert');assert.match($('status').textContent,/imported clips were removed/);
 // Repeated addition respects capacity and creates unique actor IDs.
 for(let i=0;i<20;i++)$('addMinifigure').click();actors=project().scenes[0].actors;assert.equal(actors.length,16);assert.equal(new Set(actors.map(x=>x.id)).size,16);const full=snapshot();$('addMinifigure').click();assert.equal(snapshot(),full);assert.match($('status').textContent,/limit/);
 w.confirm=()=>false;$('newProject').click();assert.equal(snapshot(),full);w.confirm=()=>true;$('newProject').click();assert(project().scenes[0].actors.every(x=>x.kind==='blank-human'));assert.equal($('miniHeadwear').value,S.normalizeMinifigureDesign({}).headwear);
 console.log('PASS minifigure DOM: customization, add/apply, unchanged normal cast, motion preservation, invalid height, restyle, serialized package, capacity, unique IDs, cancel/new');
 }finally{w.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
