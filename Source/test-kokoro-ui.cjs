// SPDX-License-Identifier: GPL-3.0-only
// Actual DOM/engine integration with renderer stub; not real-browser visual QA.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),native=require('@napi-rs/canvas'),{JSDOM}=require('jsdom'),K=require('./kokoro.cjs');
process.chdir(path.resolve(__dirname,'..'));
(async()=>{
 const ctx={console,TextEncoder,TextDecoder,AbortController,setTimeout,Image:native.Image,document:{createElement:()=>native.createCanvas(1,1)}};ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('engine.bundle.js','utf8'),ctx);
 const dom=new JSDOM(fs.readFileSync('Source/shell.html','utf8'),{runScripts:'outside-only'}),w=dom.window;
 try {
 const downloads=[],blobs=new Map();let serial=0;
 w.Blob=Blob;w.URL.createObjectURL=b=>{const u='blob:test-'+serial++;blobs.set(u,b);return u;};w.URL.revokeObjectURL=()=>{};
 w.HTMLAnchorElement.prototype.click=function(){downloads.push({name:this.download,blob:blobs.get(this.href)});};
 w.CartoonStudio={...ctx.CartoonStudio,PreviewRenderer:class{mode='DOM stub';render(){}}};w.BUNDLED=JSON.parse(fs.readFileSync('Demo.jetcartoon.json'));w.requestAnimationFrame=()=>{};w.confirm=()=>true;
 Object.defineProperty(w.crypto,'subtle',{value:require('node:crypto').webcrypto.subtle});
 w.eval(fs.readFileSync('voice.bundle.js','utf8'));
 await w.eval(fs.readFileSync('Source/ui.js','utf8'));const $=id=>w.document.getElementById(id),app=w.StudioApp;
 assert.equal($('voiceProvider').value,'mespeak');assert.equal(app.getProject().scenes[0].voiceProvider,undefined);
 const before=JSON.stringify(app.getProject());w.confirm=()=>false;$('newProject').click();assert.equal(JSON.stringify(app.getProject()),before);
 w.confirm=()=>true;$('newProject').click();assert.equal($('voiceProvider').value,'kokoro');assert.equal(app.getProject().scenes[0].voiceProvider,'kokoro');
 $('kokoroCast').click();const cast=app.getProject().voiceCast;assert.equal(Object.keys(cast).length,3);assert.equal(new Set(Object.values(cast).map(v=>v.voice)).size,3);
 const actor=app.getProject().scenes[0].actors[0];$('kokoroSpeaker').value=actor.id;$('kokoroSpeaker').onchange();assert.equal($('kokoroVoice').value,cast[actor.id].voice);
 $('caption').value='A test of local embedded narration.';$('apply').click();$('generateVoice').click();await new Promise(r=>setTimeout(r,50));
 assert.match(downloads.at(-1).name,/kokoro-request/);const request=JSON.parse(await downloads.at(-1).blob.text());assert.equal(request.text,$('caption').value);assert.equal(request.speakerId,actor.id);
 // Use a real PCM WAV header; intentionally ignore a forged JSON duration.
 const b=Buffer.alloc(44+48000);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(24000,24);b.writeUInt32LE(48000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(48000,40);
 const clip={...request,format:'jet-kokoro-clip',provider:'kokoro',data:'data:audio/wav;base64,'+b.toString('base64'),durationSeconds:500,provenance:{audioSha256:require('node:crypto').createHash('sha256').update(b).digest('hex')}};
 const importClip=async c=>{const text=JSON.stringify(c);Object.defineProperty($('kokoroClip'),'files',{configurable:true,value:[{size:text.length,text:async()=>text}]});await $('kokoroClip').onchange();};
 await importClip(clip);assert.match($('status').textContent,/embedded/);let pkg=app.getPackage();assert.equal(pkg.project.scenes[0].voiceDuration,1);assert.equal(pkg.assets[pkg.project.scenes[0].audio],clip.data);
 const imported=JSON.stringify(pkg);
 await importClip({...clip,provenance:{audioSha256:'0'.repeat(64)}});assert.match($('status').textContent,/SHA-256 mismatch/);assert.equal(JSON.stringify(app.getPackage()),imported);
await importClip({...clip,text:'old text'});assert.match($('status').textContent,/rejected/);assert.equal(JSON.stringify(app.getPackage()),imported);
 // Repeated imports preserve scene identity; edits during async file read reject the stale clip.
 await importClip(clip);assert.equal(app.getProject().scenes[0].speakerId,actor.id);
 Object.defineProperty($('kokoroClip'),'files',{configurable:true,value:[{size:10,text:async()=>{ $('caption').value='New caption';$('apply').click();return JSON.stringify(clip); }}]});await $('kokoroClip').onchange();assert.match($('status').textContent,/changed during import/);assert.equal(app.getProject().scenes[0].caption,'New caption');
 $('voiceProvider').value='mespeak';$('voicePreset').value='gruff';$('apply').click();assert.equal(app.getProject().scenes[0].voiceProvider,'mespeak');assert.equal(app.getProject().scenes[0].voice,'gruff');
 $('save').click();const saved=JSON.parse(await downloads.at(-1).blob.text());assert.equal(saved.project.scenes[0].voiceProvider,'mespeak');
 const legacy=JSON.parse(fs.readFileSync('Demo.jetcartoon.json'));Object.defineProperty($('load'),'files',{configurable:true,value:[{size:1,text:async()=>JSON.stringify(legacy)}]});await $('load').onchange();assert.equal($('voiceProvider').value,'mespeak');assert.equal(app.getProject().scenes[0].voiceProvider,undefined);
 console.log('PASS Kokoro UI: legacy unchanged, canceled/new projects, cast identities, request export, verified embedded import, stale/race rejection, fallback and save');
 }finally{w.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
