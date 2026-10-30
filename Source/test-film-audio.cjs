// SPDX-License-Identifier: GPL-3.0-only
// Regression: a dozen AAC scene boundaries must not accumulate encoder-padding drift.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process'),assert=require('node:assert/strict');
const {ffmpeg,probe}=require('./render-options.cjs');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'studio-film-audio-'));
try {
 const settings={mode:'fast',fps:6,width:160,height:160,aspect:1},pkg=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../Starter.jetcartoon.json'))),base=pkg.project.scenes[0];
 pkg.project.renderSettings={mode:'fast'};pkg.project.createdWith='1.3.1';pkg.project.scenes=Array.from({length:12},(_,i)=>({...base,id:'pulse-'+i,title:'Pulse '+i,caption:'Audio alignment test.',duration:1,environment:'void',actors:[{id:'actor',kind:'blank-human',from:[0,0,0]}],props:[],effects:[],music:''}));
 const first=path.join(dir,'source.mp4');
 ffmpeg(['-f','lavfi','-i','color=c=black:s=160x160:r=6:d=1','-f','lavfi','-i',"sine=frequency=880:sample_rate=48000:duration=1",'-af',"volume=enable='not(between(t,0.2,0.3))':volume=0",'-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-ac','2','-t','1',first]);
 const mixed=path.join(dir,'mixed44100.mp4'),silent=path.join(dir,'silent.mp4');
 ffmpeg(['-i',first,'-c:v','copy','-c:a','aac','-ar','44100','-ac','1',mixed]);
 ffmpeg(['-i',first,'-an','-c:v','copy',silent]);
 for(let i=0;i<12;i++){const base=path.join(dir,'scene-'+String(i).padStart(3,'0'));fs.copyFileSync([first,mixed,silent][i%3],base+'.mp4');fs.writeFileSync(base+'.render.json',JSON.stringify({scene:i,settings,settingsSignature:JSON.stringify(settings),duration:1,frames:6}));}
 const input=path.join(dir,'project.json');fs.writeFileSync(input,JSON.stringify(pkg));
 const run=spawnSync(process.execPath,[path.join(__dirname,'render-film.cjs'),input,dir,'0','11','--mode','fast','--width','160','--height','160','--fps','6'],{encoding:'utf8'});assert.equal(run.status,0,run.stderr+'\n'+run.stdout);
 const output=path.join(dir,'film-normal-speed.mp4'),info=probe(output),audio=info.streams.find(s=>s.codec_type==='audio');assert.equal(audio.sample_rate,'48000');assert.equal(audio.channels,2);assert(Math.abs(Number(info.format.duration)-12)<.04);
 const decoded=spawnSync('ffmpeg',['-v','error','-i',output,'-f','f32le','-ac','1','-ar','48000','-'],{maxBuffer:8e6});assert.equal(decoded.status,0);const pcm=decoded.stdout;
 function energy(start,end){let sum=0,n=0;for(let i=Math.floor(start*48000);i<Math.floor(end*48000);i++){const v=pcm.readFloatLE(i*4);sum+=v*v;n++;}return Math.sqrt(sum/n);}
 for(let i=0;i<12;i++){
  if(i%3===2)assert(energy(i+.1,i+.8)<.002,'silent scene preserved '+i);
  else assert(energy(i+.23,i+.27)>.02,'speech marker remains aligned at scene '+i);
  assert(energy(i+.5,i+.65)<.002,'no accumulated drift at scene '+i);
 }
 console.log('PASS film audio: 12 mixed-rate/stereo/mono/silent scene boundaries, continuous PCM/single AAC encode, aligned markers, no growing priming drift, 48k stereo');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
