#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Explicit local-only project requests and embedded narration. Never downloads a model.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process'),K=require('./kokoro.cjs');
function verify(clip) {
 K.wavDuration(clip.data);
 const hash=clip.provenance?.audioSha256;
 if(hash!==undefined && crypto.createHash('sha256').update(Buffer.from(clip.data.split(',')[1],'base64')).digest('hex')!==hash)throw Error('Kokoro WAV SHA-256 mismatch.');
 return clip;
}
function requests(pkg) {
 return pkg.project.scenes.flatMap((s,index)=>s.voiceProvider==='kokoro'?[{index,request:K.request(s,pkg.project)}]:[]);
}
function main(argv=process.argv.slice(2)) {
 const [command,input,output,...rest]=argv;
 if(!['requests','embed','synthesize'].includes(command)||!input||!output)throw Error('Usage: node Source/kokoro-project.cjs requests project.json requests-directory | embed project.json output.json scene-index clip.wav.json | synthesize project.json output.json [python-executable]');
 const pkg=JSON.parse(fs.readFileSync(input,'utf8'));
 if(!Array.isArray(pkg.project?.scenes)||!pkg.assets)throw Error('Expected a portable JetCartoon project.');
 if(command==='requests') {
  fs.mkdirSync(output,{recursive:true});
  for(const item of requests(pkg))fs.writeFileSync(path.join(output,`scene-${item.index}.kokoro-request.json`),JSON.stringify(item.request,null,2));
  return;
 }
 if(command==='embed') {
  const [index,clip]=rest;if(!/^\d+$/.test(index||'')||!clip)throw Error('embed requires scene-index and clip JSON.');
  K.embed(pkg,Number(index),verify(JSON.parse(fs.readFileSync(clip,'utf8'))));
 } else {
  // Keep files beside destination for inspection/retries. No shell interpolation.
  const dir=path.resolve(output+'.kokoro-clips');fs.mkdirSync(dir,{recursive:true});
  for(const {index,request} of requests(pkg)) {
   const requestPath=path.join(dir,`scene-${index}.request.json`),wav=path.join(dir,`scene-${index}.wav`);
   fs.writeFileSync(requestPath,JSON.stringify(request,null,2));
   const result=spawnSync(rest[0]||'python3',[path.resolve(__dirname,'../tools/kokoro-tts.py'),'synthesize','--request',requestPath,'--output',wav],{stdio:'inherit'});
   if(result.status!==0)throw Error('Kokoro synthesis failed. Run python tools/kokoro-tts.py status, then explicit setup if needed. Output project was not written.');
   K.embed(pkg,index,verify(JSON.parse(fs.readFileSync(wav+'.json','utf8'))));
  }
 }
 if(path.resolve(input)===path.resolve(output))throw Error('Use a different output filename to preserve the original.');
 fs.writeFileSync(output,JSON.stringify(pkg,null,2));
}
if(require.main===module)try{main();}catch(e){console.error(e.message);process.exitCode=1;}
module.exports={requests,verify,main};
