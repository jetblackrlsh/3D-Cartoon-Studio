#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""Explicit offline Stable Audio jobs -> measured 48k scene assets. No downloads."""
import argparse,base64,hashlib,importlib.util,json,math,pathlib,re,subprocess,sys,tempfile,wave
import numpy as np
RATE=48000
HERE=pathlib.Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('pinned_sa',HERE/'stable-audio-generate.py');backend=importlib.util.module_from_spec(spec);spec.loader.exec_module(backend)
def need(ok,msg):
 if not ok:raise ValueError(msg)
def sha(p):return hashlib.sha256(pathlib.Path(p).read_bytes()).hexdigest()
def number(v,lo,hi):return not isinstance(v,bool) and isinstance(v,(int,float)) and math.isfinite(v) and lo<=v<=hi
def local(root,name):
 need(isinstance(name,str) and name and not pathlib.Path(name).is_absolute(),'Asset path must be relative')
 p=(root/name).resolve();need(p.is_relative_to(root.resolve()) and p.suffix.lower()=='.wav','WAV path must stay inside jobs directory');return p
def validate(pkg,plan,root):
 scenes=pkg.get('project',{}).get('scenes',[]);need(bool(scenes),'Missing scenes')
 ids=[s.get('id') for s in scenes];need(all(isinstance(x,str) and re.fullmatch(r'[A-Za-z0-9_-]+',x) for x in ids) and len(ids)==len(set(ids)),'Scene IDs must be unique safe strings')
 scene_map={s['id']:s for s in scenes};jobs=plan.get('jobs');need(isinstance(jobs,list) and jobs,'Nonempty jobs required');seen=set();outputs=set()
 for j in jobs:
  need(isinstance(j,dict),'Job must be object');ident=j.get('id');need(isinstance(ident,str) and re.fullmatch(r'[A-Za-z0-9_-]+',ident) and ident not in seen,'Unsafe/duplicate job ID');seen.add(ident)
  need(j.get('scene') in scene_map,'Unknown scene');kind=j.get('kind');need(kind in ['music','sfx'],'Unsupported kind; no fallback')
  need(j.get('provider','stable-audio-3-small')=='stable-audio-3-small','Unsupported provider')
  need(isinstance(j.get('prompt'),str) and 0<len(j['prompt'].strip())<=5000,'Prompt required')
  need(number(j.get('seconds'),.1,120),'Generation seconds must be .1..120')
  need(isinstance(j.get('seed'),int) and not isinstance(j['seed'],bool) and 0<=j['seed']<2**32,'Invalid seed')
  at=j.get('at',0);duration=scene_map[j['scene']].get('duration');need(number(duration,1,180) and number(at,0,duration),'Invalid scene duration or cue offset')
  need(at+j['seconds']<=duration+1/RATE,'Cue exceeds scene; author trims/arrangement before import')
  need(number(j.get('gain',1),0,2),'Invalid cue gain')
  need(number(j.get('targetRms',.18 if kind=='music' else .30),.01,.4),'Invalid normalization target')
  need(kind!='sfx' or isinstance(j.get('action'),str) and j['action'].strip(),'SFX action description required')
  target=local(root,j.get('output'));need(target not in outputs,'Duplicate output');outputs.add(target)
 return scene_map,jobs

def decode(p):
 b=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-vn','-ar',str(RATE),'-ac','2','-f','f32le','-'])
 a=np.frombuffer(b,dtype='<f4').reshape(-1,2).copy();need(len(a)>0 and np.isfinite(a).all(),'Invalid decoded PCM');return a

def receipt_for(root,j):
 p=local(root,j['output']);need(p.is_file(),'Missing generated WAV; no fallback')
 info=backend.pcm_info(p);q=json.loads(p.with_suffix('.receipt.json').read_text())
 for k in ['id','kind','prompt','seconds','seed','output']:need(q.get(k)==j.get(k),'Generation receipt differs from job: '+k)
 need(q.get('provider')=='stable-audio-3-small' and q.get('sourceRevision')==backend.SOURCE_REVISION and q.get('modelRevision')==backend.MODEL_REVISION,'Unverified model/provider receipt')
 need(q.get('sha256')==info['sha256'],'Generated source hash mismatch')
 need(abs(info['duration']-j['seconds'])<=1/info['sampleRate'],'Generated duration mismatch')
 return p,q

def embed(pkg,plan,root,output):
 output=pathlib.Path(output);need(not output.exists(),'Refusing to overwrite output project')
 scene_map,jobs=validate(pkg,plan,root);prepared=[]
 # Check every source before composing or writing output.
 for j in jobs:prepared.append((j,*receipt_for(root,j)))
 result=json.loads(json.dumps(pkg));dst={s['id']:s for s in result['project']['scenes']};assets=result.setdefault('assets',{});ledger=[]
 with tempfile.TemporaryDirectory() as tmp:
  for scene_id in dict.fromkeys(j['scene'] for j,_,_ in prepared):
   scene=dst[scene_id];n=round(scene['duration']*RATE)
   for kind in ['music','sfx']:
    cues=[x for x in prepared if x[0]['scene']==scene_id and x[0]['kind']==kind]
    if not cues:continue
    stem=np.zeros((n,2),dtype=np.float32);cue_rows=[]
    for j,p,q in cues:
     a=decode(p);start=round(j.get('at',0)*RATE);end=start+len(a)
     need(end<=n,'Resampled cue exceeds scene; no silent clamp')
     peak=float(np.max(np.abs(a)));active=np.max(np.abs(a),axis=1)>peak*.01
     source_rms=float(np.sqrt(np.mean(a[active]**2))) if np.any(active) else 0
     need(source_rms>0,'Silent source')
     target=float(j.get('targetRms',.18 if kind=='music' else .30))
     normalization=min(target/source_rms,.9/peak)
     stem[start:end]+=a*normalization*float(j.get('gain',1))
     cue_rows.append({'id':j['id'],'action':j.get('action'),'startSample':start,'endSample':end,'sourceSha256':q['sha256'],'sourceActiveRms':source_rms,'targetRms':target,'normalizationGain':normalization,'prompt':j['prompt'],'seed':j['seed'],'generationReceipt':q})
    peak=float(np.max(np.abs(stem)));need(peak>0,'Silent composed stem')
    headroom=min(1,.9/peak);stem*=headroom
    p=pathlib.Path(tmp)/(scene_id+'-'+kind+'.wav')
    with wave.open(str(p),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(np.round(stem*32767).astype('<i2').tobytes())
    key=('music/generated-'+scene_id) if kind=='music' else ('sfx/'+scene_id)
    need(key not in assets,'Generated asset key already exists; use a new project/take')
    assets[key]='data:audio/wav;base64,'+base64.b64encode(p.read_bytes()).decode()
    row={'scene':scene_id,'kind':kind,'asset':key,'sampleRate':RATE,'samples':n,'sha256':sha(p),'peak':float(np.max(np.abs(stem))),'rms':float(np.sqrt(np.mean(stem**2))),'headroomGain':headroom,'cues':cue_rows,'listeningVerified':False};ledger.append(row)
    if kind=='music':scene['music']='generated-'+scene_id;scene['musicOffsetSeconds']=0;scene['musicSource']={'provider':'stable-audio-3-small','sha256':row['sha256']}
    else:scene['sfx']=[{'id':x['id'],'type':'generated','at':x['startSample']/(RATE*scene['duration']),'action':x['action']} for x in cue_rows];scene['sfxSource']={'provider':'stable-audio-3-small','sha256':row['sha256']}
 result['project'].setdefault('audioProduction',{}).update(profile='local-generative-v1',preferredSpeechProvider='kokoro',musicProvider='stable-audio-3-small',effectsProvider='stable-audio-3-small',libraryRole='secondary',listeningVerified=False)
 previous=result['project'].get('generatedAudio',{})
 need(isinstance(previous,dict) and isinstance(previous.get('ledger',[]),list) and isinstance(previous.get('imports',[]),list),'Invalid existing generation ledger')
 import_info={'modelRevision':backend.MODEL_REVISION,'sourceRevision':backend.SOURCE_REVISION,'jobsSha256':hashlib.sha256(json.dumps(plan,sort_keys=True).encode()).hexdigest()}
 result['project']['generatedAudio']={**previous,**import_info,'imports':previous.get('imports',[])+[import_info],'ledger':previous.get('ledger',[])+ledger,'listeningVerified':False}
 output.parent.mkdir(parents=True,exist_ok=True)
 with output.open('x') as f:json.dump(result,f,indent=2,allow_nan=False)
 return {'output':str(output),'sha256':sha(output),'sceneStems':len(ledger),'sampleRate':RATE,'listeningVerified':False}

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=['validate','generate','import']);p.add_argument('project');p.add_argument('jobs');p.add_argument('output',nargs='?');p.add_argument('--runtime-root');p.add_argument('--python');p.add_argument('--timeout',type=float,default=1200);a=p.parse_args()
 source=pathlib.Path(a.jobs).resolve();pkg=json.loads(pathlib.Path(a.project).read_text());plan=json.loads(source.read_text());validate(pkg,plan,source.parent)
 if a.command=='validate':print(json.dumps({'valid':True,'jobs':len(plan['jobs']),'generated':False}));return
 need(a.output and not pathlib.Path(a.output).exists(),'New output project path required')
 if a.command=='generate':
  need(a.runtime_root and a.python,'Existing runtime root and Python required; no downloads/fallback')
  subprocess.run([sys.executable,str(HERE/'stable-audio-generate.py'),str(source),'--runtime-root',a.runtime_root,'--python',a.python,'--timeout',str(a.timeout)],check=True)
 print(json.dumps(embed(pkg,plan,source.parent,a.output),indent=2))
if __name__=='__main__':
 try:main()
 except (ValueError,FileNotFoundError,FileExistsError,subprocess.CalledProcessError) as e:raise SystemExit(str(e))
