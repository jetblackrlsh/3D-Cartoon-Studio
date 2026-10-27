// SPDX-License-Identifier: GPL-3.0-only
// Cast editor DOM regression, modified 2026-10-26. Rendering is tested separately.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),native=require('@napi-rs/canvas'),{JSDOM}=require('jsdom');
process.chdir(path.resolve(__dirname,'..'));
(async()=>{
 const ctx={console,TextEncoder,TextDecoder,AbortController,setTimeout,Image:native.Image,document:{createElement:()=>native.createCanvas(1,1)}};ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('engine.bundle.js','utf8'),ctx);
 const S=ctx.CartoonStudio,dom=new JSDOM(fs.readFileSync('Source/shell.html','utf8'),{runScripts:'outside-only'}),w=dom.window;
 try {
 w.CartoonStudio={...S,PreviewRenderer:class{mode='test stub';render(){}}};w.BUNDLED=JSON.parse(fs.readFileSync('Demo.jetcartoon.json'));w.requestAnimationFrame=()=>{};w.confirm=()=>true;
 w.eval(fs.readFileSync('Source/ui.js','utf8'));for(let i=0;i<200&&!w.StudioApp;i++)await new Promise(r=>setTimeout(r,10));assert(w.StudioApp,'UI initialized');
 const $=id=>w.document.getElementById(id),snapshot=()=>JSON.stringify(w.StudioApp.getProject()),change=(id,value,type='change')=>{$(id).value=value;$(id).dispatchEvent(new w.Event(type));};
 assert.equal($('castCards').querySelectorAll('button').length,60);change('castSearch','astronaut','input');assert.equal($('castSelect').options.length,2);change('castSelect','scifi-astronaut-f');$('addCast').click();assert.equal(w.StudioApp.getProject().scenes[0].actors.at(-1).cast,'scifi-astronaut-f');
 change('castSearch','no-such-character','input');const unchanged=snapshot();$('addCast').click();assert.equal(snapshot(),unchanged);change('castSearch','','input');change('castGenre','fantasy');assert.equal($('castSelect').options.length,12);
 change('castSelect','fantasy-ogre-m');change('castActor','0');const previous=JSON.parse(snapshot()).scenes[0].actors[0];$('applyCast').click();const applied=w.StudioApp.getProject().scenes[0].actors[0];assert.equal(applied.cast,'fantasy-ogre-m');for(const k of ['id','action','from','to','beats','keys'])assert.equal(JSON.stringify(applied[k]),JSON.stringify(previous[k]));
 const beforeCrowd=JSON.parse(snapshot()).scenes[0].actors;$('diverseCast').click();let actors=w.StudioApp.getProject().scenes[0].actors;assert.equal(actors.length,beforeCrowd.length+4);assert.equal(JSON.stringify(actors.slice(0,beforeCrowd.length)),JSON.stringify(beforeCrowd));
 $('addBlank').click();assert.equal(w.StudioApp.getProject().scenes[0].actors.at(-1).kind,'blank-human');
 // Repeat until full; a further click is a no-op with an explanatory status.
 for(let i=0;i<5;i++)$('diverseCast').click();assert.equal(w.StudioApp.getProject().scenes[0].actors.length,16);const full=snapshot();$('diverseCast').click();$('addCast').click();$('addBlank').click();assert.equal(snapshot(),full);assert.match($('status').textContent,/limit/);
 w.confirm=()=>false;$('newProject').click();assert.equal(snapshot(),full);w.confirm=()=>true;$('newProject').click();assert.equal(w.StudioApp.getProject().scenes[0].actors.length,2);assert.equal(w.StudioApp.getProject().renderSettings.mode,'fast');assert(w.StudioApp.getProject().scenes[0].actors.every(a=>a.kind==='blank-human'));assert.notEqual(w.StudioApp.getProject().scenes[0].actors[0].cast,w.StudioApp.getProject().scenes[0].actors[1].cast);S.validate(JSON.parse(snapshot()));
 console.log('PASS cast DOM: search/filter, add/apply, identity/motion preservation, diversity, blank, capacity, cancel/new project');
 }finally{w.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
