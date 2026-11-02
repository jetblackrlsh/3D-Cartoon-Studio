#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Pinned, offline Stable Audio CPU adapter. Never downloads or installs models."""
import argparse, hashlib, importlib.metadata, json, math, os, pathlib, re, subprocess, sys, time, wave
SOURCE_REVISION = '5f5e6ac21ae9ff78a6e8847eb7a1dcbe969ffb84'
MODEL_REVISION = '30cb2644da54bfa63275d1bc7f1fa67fc718680f'
WEIGHTS = {
 'sa3-sm-music/dit_w8a8.tflite': '1d8ef99bf10f51cc52b68f7b527d3773828e700758b253edd8a8e088a906e241',
 'sa3-sm-sfx/dit_w8a8.tflite': 'd3f99409f446eff9a625768ba2ee09a2347ea90c4897c1662fbcd8837fae3045',
 'same-s/dec_w8a8.tflite': '2fc31cdc42a54342233fb8c6da636565b1191d97002665e21812e981490434a6',
 't5gemma/encoder_fp16.tflite': '8530d0b3e6b9b9dcf1239145c2a853fb749708eaddbb472ff8f0802b50059372'}
SOURCE_HASHES = {'models/__init__.py': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'models/defs/__init__.py': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'models/defs/tflite_pipeline.py': '229f34424d8ace818e416a8a3e50b92b859a074af44f4d5ed29eddc845b30e64', 'models/tokenizer.model': '61a7b147390c64585d6c3543dd6fc636906c9af3865a5548f27f31aee1d4c8e2', 'requirements.txt': '4f0a6bdfde92238996b6bd09bc067d3ae777dced99872ce16fe26b028aa85244', 'scripts/examples.py': '9a8d376357b3fcf5c79c38f43bbf5e565999f09c8b08bccd4b7d3a2979b6479d', 'scripts/rung_decoder.py': 'c2e82c53e3189e0fc3a1f948c19d84b5016e90e9eddac6e27c9e2daa20c612e7', 'scripts/rung_dit.py': '229531d9a6298094427def0aa2715814c0324ba0bde819cd77f7f8797168f061', 'scripts/rung_encoder.py': 'cbfa3ca9693f67fa3216f5d8143db82e7b963d54eeac0e99b2ebfb1d8570419a', 'scripts/sa3_tflite.py': '6e7a993346d17740d6a43c9d9a061b0bc30ad37eed4a191e5fe16fdcdeb8b0e7', 'scripts/weights.py': '24c783e2fc06aa34285120ad98eebd9ccb2ecce9f39ca776ca55eb028c772e33'}

def sha(path):
 h=hashlib.sha256()
 with pathlib.Path(path).open('rb') as f:
  for b in iter(lambda:f.read(4*1024*1024),b''):h.update(b)
 return h.hexdigest()

def number(value, name, minimum=0, maximum=None):
 if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or value<minimum or (maximum is not None and value>maximum):raise ValueError('Invalid '+name)
 return value

def output_path(root, value):
 if not isinstance(value,str) or not value:raise ValueError('Missing output path')
 
 if pathlib.Path(value).is_absolute():raise ValueError('Output path must be relative')
 p=(root/value).resolve()
 if not p.is_relative_to(root.resolve()) or p.suffix.lower()!='.wav':raise ValueError('Output must be a WAV within the project directory')
 if p.exists() or p.with_suffix('.receipt.json').exists():raise FileExistsError('Preserve existing output: '+str(p))
 return p

def pcm_info(path):
 import array
 with wave.open(str(path),'rb') as w:
  sr,channels,n,width=w.getframerate(),w.getnchannels(),w.getnframes(),w.getsampwidth();raw=w.readframes(n)
 if width!=2 or sr<=0 or channels not in (1,2) or n<=0 or len(raw)!=n*channels*width:raise ValueError('Invalid or non-PCM16 audio: '+str(path))
 a=array.array('h');a.frombytes(raw)
 if sys.byteorder!='little':a.byteswap()
 peak=max(abs(x) for x in a)
 if peak==0 or peak>=32767:raise ValueError('Silent or clipped audio: '+str(path))
 return dict(sampleRate=sr,channels=channels,samples=n,duration=n/sr,peakPCM=peak/32768,sha256=sha(path))

def save_new(path,data):
 p=pathlib.Path(path);p.parent.mkdir(parents=True,exist_ok=True)
 with p.open('x') as f:json.dump(data,f,indent=2,allow_nan=False)

def check_runtime(root,kinds):
 root=pathlib.Path(root).resolve();verified={}
 for rel,digest in SOURCE_HASHES.items():
  p=root/rel
  if not p.is_file() or sha(p)!=digest:raise ValueError('Pinned runtime integrity mismatch: '+str(p))
  verified[rel]=digest
 needed=['same-s/dec_w8a8.tflite','t5gemma/encoder_fp16.tflite']+['sa3-sm-'+x+'/dit_w8a8.tflite' for x in sorted(kinds)]
 for rel in needed:
  p=root/'models/tflite'/rel
  if not p.is_file() or sha(p)!=WEIGHTS[rel]:raise ValueError('Missing or changed pinned model: '+str(p))
  verified['models/tflite/'+rel]=WEIGHTS[rel]
 return verified

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('plan');ap.add_argument('--runtime-root',required=True,help='Directory containing scripts/ and models/');ap.add_argument('--python',required=True,help='Existing verified LiteRT venv Python');ap.add_argument('--validate-only',action='store_true');ap.add_argument('--receipt');ap.add_argument('--only',nargs='+');ap.add_argument('--timeout',type=float,default=1200);a=ap.parse_args()
 source=pathlib.Path(a.plan).resolve();plan_hash=sha(source);plan=json.loads(source.read_text());jobs=plan.get('jobs')
 if not isinstance(jobs,list) or not jobs:raise ValueError('jobs must be a nonempty list')
 ids=set();outputs=set();prepared=[]
 for j in jobs:
  if not isinstance(j,dict):raise ValueError('Each job must be an object')
  id=j.get('id');kind=j.get('kind');prompt=j.get('prompt')
  if not isinstance(id,str) or not re.fullmatch(r'[A-Za-z0-9_-]+',id) or id in ids:raise ValueError('Missing/duplicate/unsafe job id')
  ids.add(id)
  if kind not in ('music','sfx'):raise ValueError('Unsupported provider/job kind; no fallback')
  if j.get('provider','stable-audio-3-small')!='stable-audio-3-small':raise ValueError('Unsupported provider')
  if not isinstance(prompt,str) or not prompt.strip() or len(prompt)>5000:raise ValueError('Invalid prompt')
  number(j.get('seconds'),'seconds',.1,120)
  if isinstance(j.get('seed'),bool) or not isinstance(j.get('seed'),int) or not 0<=j['seed']<2**32:raise ValueError('Invalid seed')
  dest=output_path(source.parent,j.get('output'))
  if dest in outputs:raise ValueError('Duplicate output')
  outputs.add(dest);prepared.append((j,dest))
 if a.only:
  if not set(a.only)<=ids:raise ValueError('Unknown --only id')
  prepared=[x for x in prepared if x[0]['id'] in a.only]
 number(a.timeout,'timeout',1,3600)
 py=pathlib.Path(a.python).absolute()
 if not py.is_file():raise FileNotFoundError('Missing Python runtime')
 runtime=pathlib.Path(a.runtime_root).resolve();verified=check_runtime(runtime,{j['kind'] for j,_ in prepared})
 version_code="import importlib.metadata,json;print(json.dumps({x:importlib.metadata.version(x) for x in ['ai_edge_litert','numpy','sentencepiece','soundfile']}))"
 versions=json.loads(subprocess.check_output([str(py),'-c',version_code],text=True,timeout=30))
 if versions['ai_edge_litert']!='2.2.0':raise ValueError('Unverified LiteRT version; expected2.2.0')
 report={'provider':'stable-audio-3-small','sourceRevision':SOURCE_REVISION,'modelRevision':MODEL_REVISION,'verifiedFiles':verified,'versions':versions,'planSha256':plan_hash,'validateOnly':a.validate_only,'jobs':[],'listeningPerformed':False}
 if a.receipt and pathlib.Path(a.receipt).exists():raise FileExistsError(a.receipt)
 if not a.validate_only:
  env=os.environ.copy();env.update(HF_HUB_OFFLINE='1',HF_HUB_DISABLE_IMPLICIT_TOKEN='1',OMP_NUM_THREADS='4',OPENBLAS_NUM_THREADS='1',MKL_NUM_THREADS='1')
  for j,dest in prepared:
   if sha(source)!=plan_hash:raise ValueError('Plan changed during generation')
   dest.parent.mkdir(parents=True,exist_ok=True)
   cmd=[str(py),str(runtime/'scripts/sa3_tflite.py'),'--prompt',j['prompt'],'--dit','sm-'+j['kind'],'--decoder','same-s','--dit-precision','w8a8','--decoder-precision','w8a8','--seconds',str(j['seconds']),'--steps','8','--seed',str(j['seed']),'--cfg','1','--threads','4','--out',str(dest)]
   start=time.monotonic()
   logpath=dest.with_suffix('.generation.log')
   if logpath.exists():raise FileExistsError(logpath)
   run=subprocess.run(cmd,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=a.timeout)
   cleanlog=run.stdout.replace(str(runtime.parent),'<runtime-install>').replace(str(py.parent.parent),'<python-install>').replace(str(source.parent),'<project-root>')
   with logpath.open('x') as log:log.write(cleanlog)
   if run.returncode:raise RuntimeError('Generation failed; inspect sanitized generation log')
   if re.search(r'\b(?:nan|inf|infinity)\b',run.stdout,re.I):raise ValueError('Nonfinite value reported by generation runtime')
   info=pcm_info(dest)
   if abs(info['duration']-j['seconds'])>1/info['sampleRate']:raise ValueError('Generated duration mismatch')
   receipt={**j,**info,'provider':'stable-audio-3-small','sourceRevision':SOURCE_REVISION,'modelRevision':MODEL_REVISION,'versions':versions,'planSha256':plan_hash,'elapsedSeconds':time.monotonic()-start,'command':['<configured-python>','<runtime-root>/scripts/sa3_tflite.py',*cmd[2:-1],j['output']],'listeningPerformed':False}
   save_new(dest.with_suffix('.receipt.json'),receipt);report['jobs'].append(receipt)
 if a.receipt:save_new(a.receipt,report)
 print(json.dumps(report,indent=2))
if __name__=='__main__':main()
