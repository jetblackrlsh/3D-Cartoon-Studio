// SPDX-License-Identifier: GPL-3.0-only
/* Sequential scene render, film assembly, and 2x derivative. Never renders 3D twice. */
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const {parseArgs,ffmpeg,probe,derive2x}=require('./render-options.cjs');
function main(){
 const argv=process.argv.slice(2),{pkgPath,outDir,start,end,options}=parseArgs(argv);
 if(!pkgPath)throw Error('Usage: node render-film.cjs project.json output-directory [first-scene last-scene fps] [--mode fast|standard] [--fps N] [--width W --height H] [--two-speed]');
 const pkg=JSON.parse(fs.readFileSync(pkgPath)),last=Math.min(end,pkg.project.scenes.length-1);
 if(start>last)throw Error('No scenes selected');
 const sceneArgs=argv.filter(a=>a!=='--two-speed');
 const child=spawnSync(process.execPath,['--expose-gc','--max-old-space-size=512',path.join(__dirname,'render.cjs'),...sceneArgs],{stdio:'inherit'});
 if(child.status!==0)throw Error('Scene render failed; film not assembled');
 const parts=[],temp=[],reports=[];
 const continuousPCM=path.resolve(outDir,'film-audio.s16le');fs.writeFileSync(continuousPCM,Buffer.alloc(0));temp.push(continuousPCM);
 let totalDuration=0;
 for(let i=start;i<=last;i++){
  const base=path.resolve(outDir,'scene-'+String(i).padStart(3,'0')),file=base+'.mp4',meta=JSON.parse(fs.readFileSync(base+'.render.json')),info=probe(file);
  if(reports.length&&JSON.stringify(meta.settings)!==JSON.stringify(reports[0].settings))throw Error('Scene effective settings disagree');
  reports.push(meta);totalDuration+=meta.duration;
  // Video-only parts avoid AAC packet padding influencing concat segment timestamps.
  const video=base+'.film-video.mp4';
  ffmpeg(['-i',file,'-map','0:v:0','-an','-c:v','copy','-t',String(meta.duration),video]);parts.push(video);temp.push(video);
  // Decode each source independently (honoring encoder delay), trim/pad to its exact
  // scene timeline, then append raw PCM. AAC is encoded ONCE over the whole film.
  const pcm=base+'.film-audio.s16le',hasAudio=info.streams.some(s=>s.codec_type==='audio');
  const args=hasAudio?['-i',file,'-map','0:a:0']:['-f','lavfi','-i','anullsrc=r=48000:cl=stereo'];
  args.push('-vn','-af',`apad,atrim=duration=${meta.duration}`,'-t',String(meta.duration),'-ar','48000','-ac','2','-c:a','pcm_s16le','-f','s16le',pcm);
  ffmpeg(args);fs.appendFileSync(continuousPCM,fs.readFileSync(pcm));fs.unlinkSync(pcm);
 }
 assertConcatStreams(parts.map(probe),false);
 const list=path.resolve(outDir,'film-scenes.txt');fs.writeFileSync(list,parts.map(p=>"file '"+p.replace(/'/g,"'\\''")+"'").join('\n')+'\n');
 const normal=path.resolve(outDir,'film-normal-speed.mp4'),fast=path.resolve(outDir,'film-2x.mp4');
 ffmpeg(['-f','concat','-safe','0','-i',list,'-f','s16le','-ar','48000','-ac','2','-i',continuousPCM,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-ar','48000','-ac','2','-b:a','128k','-t',String(totalDuration),'-movflags','+faststart',normal]);
 const normalInfo=probe(normal),settings=reports[0].settings,report={settings,scenes:reports,normal:{file:normal,...normalInfo},twoSpeed:null};
 ffmpeg(['-i',normal,'-f','null','-']);
 if(options.twoSpeed){report.twoSpeed={file:fast,...derive2x(normal,fast,settings.fps)};ffmpeg(['-i',fast,'-f','null','-']);const a=Number(normalInfo.format.duration),b=Number(report.twoSpeed.format.duration);if(Math.abs(b-a/2)>Math.max(.25,2/settings.fps))throw Error('2x duration failed verification');}
 fs.writeFileSync(path.join(outDir,'film-render-report.json'),JSON.stringify(report,null,2));for(const file of temp)fs.unlinkSync(file);
 console.log('FILM',normal,settings,options.twoSpeed?fast:'');
}
if(require.main===module)try{main();}catch(error){console.error(error);process.exitCode=1;}
function assertConcatStreams(infos, requireAudio=true) {
 let signature;
 for(const info of infos) {
  const video=info.streams.find(s=>s.codec_type==='video'),audio=info.streams.find(s=>s.codec_type==='audio');
  if(!video||(requireAudio&&!audio))throw Error('Film concat requires video and audio on every part. Normalize silent scenes before assembly.');
  const current=JSON.stringify({video:[video.codec_name,video.width,video.height,video.pix_fmt,video.time_base,video.r_frame_rate],audio:requireAudio?[audio.codec_name,audio.sample_rate,audio.channels,audio.channel_layout,audio.time_base]:null});
  if(signature&&current!==signature)throw Error('Film concat stream mismatch (codec, dimensions, frame rate, sample rate or channels). Normalize every part to matching H.264 video and AAC 48000 Hz stereo before stream-copy concat.');
  signature=current;
 }
 return true;
}
module.exports={main,assertConcatStreams};
