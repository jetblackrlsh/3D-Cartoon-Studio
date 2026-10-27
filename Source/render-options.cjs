// SPDX-License-Identifier: GPL-3.0-only
/* Shared CLI/export contract. No rendering or subprocess is started on import. */
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
function parseArgs(argv){
 const positional=[],options={};
 for(let i=0;i<argv.length;i++){const arg=argv[i];if(!arg.startsWith('--')){positional.push(arg);continue;}const [key,inline]=arg.slice(2).split('=');if(key==='two-speed'){options.twoSpeed=true;continue;}if(!['mode','fps','width','height'].includes(key))throw Error('Unknown option --'+key);const value=inline??argv[++i];if(!value||value.startsWith('--'))throw Error('Missing --'+key+' value');options[key]=key==='mode'?value:Number(value);}
 if(positional.length>5)throw Error('Too many positional arguments');
 const [pkgPath,outDir='rendered',first='0',last='999',legacyFPS]=positional;
 if(legacyFPS!==undefined&&options.fps===undefined)options.fps=Math.max(6,Math.min(30,Number(legacyFPS)));
 const start=Number(first),end=Number(last);if(!Number.isInteger(start)||start<0||!Number.isInteger(end)||end<start)throw Error('Scene range must contain nonnegative integer indexes');
 return {pkgPath,outDir,start,end,options};
}
function resolveSettings(project,overrides={},S){
 const {twoSpeed,...settings}=overrides;
 const v=String(project.createdWith||'').match(/^(\d+)\.(\d+)\.(\d+)/),modern=v&&(+v[1]>1||+v[1]===1&&(+v[2]>3||+v[2]===3&&+v[3]>=1));
 const mode=settings.mode||project.renderSettings?.mode||project.defaultRenderMode||(project.schema==='JetCartoonProject'&&project.version===1&&!modern?'standard':'fast'),defaults=mode==='fast'?{mode,fps:6,width:640,height:360}:{mode,fps:12,width:1280,height:720};
 const result=S?.renderSettings?S.renderSettings(project,settings):{...defaults,...project.renderSettings,...settings};
 if(!['fast','standard'].includes(result.mode))throw Error('mode must be fast or standard');
 if(!Number.isFinite(result.fps)||result.fps<6||result.fps>60)throw Error('fps must be 6–60');
 for(const key of ['width','height'])if(!Number.isInteger(result[key])||result[key]<160||result[key]>3840||result[key]%2)throw Error(key+' must be an even integer from 160 to 3840');
 return {...result,aspect:result.width/result.height};
}
function ffmpeg(args){const r=spawnSync('ffmpeg',['-v','error','-y','-threads','1',...args.slice(0,-1),'-threads','1',args.at(-1)],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||'ffmpeg failed');return r;}
function probe(file){const r=spawnSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||'ffprobe failed');return JSON.parse(r.stdout);}
function derive2x(master,output,fps){const info=probe(master),hasAudio=info.streams.some(x=>x.codec_type==='audio');const args=['-i',master,'-map','0:v:0','-vf','setpts=0.5*PTS','-r',String(fps*2),'-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p'];if(hasAudio)args.push('-map','0:a:0','-af','atempo=2.0','-c:a','aac','-b:a','128k');else args.push('-an');args.push('-movflags','+faststart',output);ffmpeg(args);return {source:path.basename(master),method:'Same approved master; setpts=0.5*PTS; atempo=2.0 when audio exists; no 3D re-render',fps:fps*2,...probe(output)};}
module.exports={parseArgs,resolveSettings,ffmpeg,probe,derive2x};
