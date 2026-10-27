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
 for(let i=start;i<=last;i++){
  const base=path.resolve(outDir,'scene-'+String(i).padStart(3,'0')),file=base+'.mp4',meta=JSON.parse(fs.readFileSync(base+'.render.json')),info=probe(file);
  if(reports.length&&JSON.stringify(meta.settings)!==JSON.stringify(reports[0].settings))throw Error('Scene effective settings disagree');
  reports.push(meta);
  // A common audio stream is necessary for concat when only some scenes have narration.
  const mux=base+'.film-mux.mp4',hasAudio=info.streams.some(s=>s.codec_type==='audio');
  const args=['-i',file];if(!hasAudio)args.push('-f','lavfi','-i','anullsrc=r=44100:cl=stereo');
  args.push('-map','0:v:0','-map',hasAudio?'0:a:0':'1:a:0','-c:v','copy','-c:a','aac','-ar','44100','-ac','2','-af',`apad,atrim=duration=${meta.duration}`,'-t',String(meta.duration),mux);ffmpeg(args);parts.push(mux);temp.push(mux);
 }
 const list=path.resolve(outDir,'film-scenes.txt');fs.writeFileSync(list,parts.map(p=>"file '"+p.replace(/'/g,"'\\''")+"'").join('\n')+'\n');
 const normal=path.resolve(outDir,'film-normal-speed.mp4'),fast=path.resolve(outDir,'film-2x.mp4');
 ffmpeg(['-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',normal]);
 const normalInfo=probe(normal),settings=reports[0].settings,report={settings,scenes:reports,normal:{file:normal,...normalInfo},twoSpeed:null};
 ffmpeg(['-i',normal,'-f','null','-']);
 if(options.twoSpeed){report.twoSpeed={file:fast,...derive2x(normal,fast,settings.fps)};ffmpeg(['-i',fast,'-f','null','-']);const a=Number(normalInfo.format.duration),b=Number(report.twoSpeed.format.duration);if(Math.abs(b-a/2)>Math.max(.25,2/settings.fps))throw Error('2x duration failed verification');}
 fs.writeFileSync(path.join(outDir,'film-render-report.json'),JSON.stringify(report,null,2));for(const file of temp)fs.unlinkSync(file);
 console.log('FILM',normal,settings,options.twoSpeed?fast:'');
}
if(require.main===module)try{main();}catch(error){console.error(error);process.exitCode=1;}
module.exports={main};
