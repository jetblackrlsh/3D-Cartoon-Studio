#!/usr/bin/env node
// SPDX-License-Identifier: GPL-3.0-only
// Offline helper: no shell interpolation; source video is read-only.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
function run(cmd,args){const r=spawnSync(cmd,args,{maxBuffer:50*1024*1024});if(r.error)throw r.error;if(r.status!==0)throw Error(r.stderr.toString()||cmd+' failed');return r.stdout;}
function hash(file){return new Promise((resolve,reject)=>{const h=crypto.createHash('sha256'),s=fs.createReadStream(file);s.on('data',b=>h.update(b));s.on('error',reject);s.on('end',()=>resolve(h.digest('hex')));});}
async function extract(video,time,options={}){
  const meta=JSON.parse(run('ffprobe',['-v','error','-show_streams','-show_format','-of','json',video])),stream=meta.streams.find(x=>x.codec_type==='video'),duration=Number(stream?.duration||meta.format.duration);
  if(!stream||!Number.isFinite(duration)||!Number.isFinite(time)||time<0||time>=duration)throw Error('Time must be within a decodable video (before its end).');
  let filters=[],crop=options.crop;
  if(crop){if(![crop.x,crop.y,crop.width,crop.height].every(Number.isInteger)||crop.x<0||crop.y<0||crop.width<1||crop.height<1||crop.x+crop.width>stream.width||crop.y+crop.height>stream.height)throw Error('Crop must be an integer rectangle inside the source video.');filters.push(`crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`);}
  filters.push('scale=w=min(1920\\,iw):h=min(1920\\,ih):force_original_aspect_ratio=decrease');
  const bytes=run('ffmpeg',['-v','error','-i',video,'-ss',String(time),'-frames:v','1','-vf',filters.join(','),'-f','image2pipe','-vcodec','png','pipe:1']);
  if(!bytes.length)throw Error('No frame decoded.');
  return {dataUrl:'data:image/png;base64,'+bytes.toString('base64'),provenance:{kind:'animation-frame',sourceName:path.basename(video),sourceSha256:await hash(video),sourceBytes:fs.statSync(video).size,timeSeconds:time,sourceDurationSeconds:duration,sourceWidth:stream.width,sourceHeight:stream.height,sourceFrameRate:stream.avg_frame_rate,method:'ffmpeg-output-seek',timeSemantics:'requested output seek time; decoded frame follows source timestamps, not exact frame-index selection',...(crop?{crop}:{})}};
}
module.exports={extract};
if(require.main===module)(async()=>{const [video,t,output,optionsFile]=process.argv.slice(2);if(!video||!output)throw Error('Usage: node Source/extract-comic-frame.cjs video.mp4 seconds frame.asset.json [options.json]');if(fs.existsSync(output))throw Error('Refusing to overwrite existing image asset.');const a=await extract(video,Number(t),optionsFile?JSON.parse(fs.readFileSync(optionsFile)):{});fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(a));console.log(JSON.stringify({output,provenance:a.provenance}));})().catch(e=>{console.error(e.message);process.exitCode=1});
