// SPDX-License-Identifier: GPL-3.0-only
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process'),native=require('@napi-rs/canvas'),{JSDOM}=require('jsdom');
process.chdir(path.resolve(__dirname,'..'));
(async()=>{
 const manifest=JSON.parse(fs.readFileSync('music/manifest.json')),pkg=JSON.parse(fs.readFileSync('Demo.jetcartoon.json')),expected=['Tranquility','Suspense','Determination','Playfulness','Anger','Fear','Nostalgia','Excitement','Sorrow','Joy'];
 assert.deepEqual(manifest.tracks.map(t=>t.name),expected);assert.equal(new Set(expected).size,10);
 for(const t of manifest.tracks){const file='music/'+t.file,b=fs.readFileSync(file);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),t.sha256);assert.equal(t.mime,'audio/mpeg');assert(Buffer.from(pkg.assets['music/'+t.name].split(',')[1],'base64').equals(b),'embedded exact bytes '+t.name);const probe=spawnSync('ffprobe',['-v','error','-select_streams','a:0','-show_entries','format=format_name:stream=codec_name,sample_rate,channels','-of','json',file],{encoding:'utf8'});assert.equal(probe.status,0);const info=JSON.parse(probe.stdout);assert.equal(info.format.format_name,'mp3');assert.equal(info.streams[0].codec_name,'mp3');assert.equal(info.streams[0].sample_rate,'48000');assert.equal(info.streams[0].channels,2);const decode=spawnSync('ffmpeg',['-v','error','-i',file,'-f','null','-'],{encoding:'utf8'});assert.equal(decode.status,0,decode.stderr);}
 const ctx={console,TextEncoder,TextDecoder,AbortController,setTimeout,Image:native.Image,document:{createElement:()=>native.createCanvas(1,1)}};ctx.window=ctx;ctx.self=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('engine.bundle.js','utf8'),ctx);
 const dom=new JSDOM(fs.readFileSync('Source/shell.html','utf8'),{runScripts:'outside-only'}),w=dom.window;
 try{const blobs=new Map(),downloads=[];let serial=0;w.Blob=Blob;w.URL.createObjectURL=b=>{const u='blob:'+serial++;blobs.set(u,b);return u;};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){downloads.push(blobs.get(this.href));};w.CartoonStudio={...ctx.CartoonStudio,PreviewRenderer:class{mode='DOM stub';render(){}}};w.BUNDLED=pkg;let nextFrame;w.requestAnimationFrame=fn=>{nextFrame=fn;};const played=[];w.Audio=class { constructor(src){this.src=src;this.paused=true;this.currentTime=0;} pause(){this.paused=true;} play(){this.paused=false;played.push(this);return Promise.resolve();} };w.confirm=()=>true;await w.eval(fs.readFileSync('Source/ui.js','utf8'));const $=id=>w.document.getElementById(id),app=w.StudioApp;
 assert.deepEqual(Array.from($('musicTrack').options,o=>o.value),[...expected,'']);
 for(const name of expected){$('musicTrack').value=name;$('apply').click();assert.equal(app.getProject().scenes[0].music,name);assert.equal(app.getPackage().assets['music/'+name],pkg.assets['music/'+name]);}
 $('save').click();const saved=JSON.parse(await downloads.at(-1).text());assert.equal(saved.project.scenes[0].music,'Joy');
 const legacy=structuredClone(pkg);for(const name of expected.slice(4))delete legacy.assets['music/'+name];legacy.project.scenes[0].music='Tranquility';const initial=legacy.assets['music/Tranquility'];
 Object.defineProperty($('load'),'files',{configurable:true,value:[{size:1,text:async()=>JSON.stringify(legacy)}]});await $('load').onchange();assert.equal(app.getProject().scenes[0].music,'Tranquility');assert.equal(app.getPackage().assets['music/Tranquility'],initial);assert.equal(app.getPackage().assets['music/Joy'],undefined);
 $('musicTrack').value='Joy';$('apply').click();assert.equal(app.getProject().scenes[0].music,'Joy');assert.equal(app.getPackage().assets['music/Joy'],pkg.assets['music/Joy']);assert.equal(app.getPackage().assets['music/Tranquility'],initial);
 $('musicTrack').value='';$('apply').click();assert.equal(app.getProject().scenes[0].music,'');
 const generated=structuredClone(pkg);generated.assets['music/generated-score']=generated.assets['music/Tranquility'];generated.project.scenes[0].music='generated-score';
 Object.defineProperty($('load'),'files',{configurable:true,value:[{size:1,text:async()=>JSON.stringify(generated)}]});await $('load').onchange();
 assert.equal($('musicTrack').value,'generated-score');$('apply').click();assert.equal(app.getProject().scenes[0].music,'generated-score');
 $('save').click();assert.equal(JSON.parse(await downloads.at(-1).text()).project.scenes[0].music,'generated-score');
 console.log('PASS generated/imported score ID survives load, edit and save');
 const shared=structuredClone(generated);shared.project.audioProduction={profile:'local-generative-v1'};shared.project.renderSettings={...(shared.project.renderSettings||{}),mode:'fast'};
 shared.project.scenes=shared.project.scenes.slice(0,2);for(const scene of shared.project.scenes){scene.duration=1;scene.music='generated-score';}shared.project.scenes[0].musicOffsetSeconds=1;shared.project.scenes[1].musicOffsetSeconds=3;
 Object.defineProperty($('load'),'files',{configurable:true,value:[{size:1,text:async()=>JSON.stringify(shared)}]});await $('load').onchange();
 $('play').click();const before=played.filter(a=>a.loop).length;let now=w.performance.now();for(let i=1;i<=8;i++)nextFrame(now+i*150);
 const scores=played.filter(a=>a.loop);assert.equal(scores.length,before+1,'same-key next scene restarts at its own offset');assert(scores.at(-1).currentTime>=3 && scores.at(-1).currentTime<3.4);
 app.setTime(1.25);$('play').click();assert.equal(played.filter(a=>a.loop).at(-1).currentTime,3.25);app.pause();
 console.log('PASS scene-local shared score resets on scene transition and seek');
console.log('PASS music: 10 exact-hash embedded MP3s, full decode/48k stereo; all UI selections/save, silence, legacy IDs/bytes preserved and explicit added-track hydration');
 }finally{w.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
