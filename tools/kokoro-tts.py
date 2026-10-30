#!/usr/bin/env python3
"""Explicitly provisioned, offline-first Kokoro CPU speech. Never downloads on synthesis."""
import argparse, base64, hashlib, importlib.util, json, math, os, pathlib, sys, tempfile, urllib.request, wave

FILES = {
 'kokoro-v1.0.onnx': ('7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5',325532387),
 'voices-v1.0.bin': ('bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d',28214398),
}
BASE = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/'
def digest(path):
 h=hashlib.sha256()
 with open(path,'rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
 return h.hexdigest()
def paths(args):
 root=pathlib.Path(args.model_dir or os.environ.get('STUDIO_KOKORO_DIR',pathlib.Path.home()/'.cache'/'jet-cartoon-studio'/'kokoro'))
 return root, pathlib.Path(args.model or os.environ.get('STUDIO_KOKORO_MODEL',root/'kokoro-v1.0.onnx')), pathlib.Path(args.voices or os.environ.get('STUDIO_KOKORO_VOICES',root/'voices-v1.0.bin'))
def verify(path,name):
 expected,size=FILES[name]
 if not path.is_file(): raise ValueError(f'Missing {path}. Run setup --download-models explicitly, or set STUDIO_KOKORO_MODEL and STUDIO_KOKORO_VOICES. Existing synthesized voices remain available.')
 if path.stat().st_size!=size or digest(path)!=expected: raise ValueError(f'Integrity mismatch for {path}; expected pinned model-files-v1.0 {name}. No synthesis performed.')
def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('command',choices=['status','setup','synthesize'])
 for name in ['model-dir','model','voices','request','text-file','output','voice','lang']: p.add_argument('--'+name)
 p.add_argument('--speed',type=float);p.add_argument('--download-models',action='store_true')
 a=p.parse_args();root,model,voices=paths(a)
 if a.command=='status':
  print(json.dumps({'provider':'kokoro','model':str(model),'voices':str(voices),'modelPresent':model.is_file(),'voicesPresent':voices.is_file(),'runtimePresent':importlib.util.find_spec('kokoro_onnx') is not None,'downloadsAttempted':False,'setup':'python -m pip install -r tools/kokoro-requirements.txt; python tools/kokoro-tts.py setup --download-models'}));return
 if a.command=='setup':
  if not a.download_models: raise ValueError('Setup requires explicit --download-models (about 354 MB). Dependencies are installed separately with pip; no automatic install.')
  for dest,name in [(model,'kokoro-v1.0.onnx'),(voices,'voices-v1.0.bin')]:
   if dest.exists(): verify(dest,name);continue
   dest.parent.mkdir(parents=True,exist_ok=True)
   fd,tmp=tempfile.mkstemp(prefix=name+'.',suffix='.part',dir=dest.parent);os.close(fd)
   try:
    with urllib.request.urlopen(BASE+name,timeout=120) as src,open(tmp,'wb') as out:
     while True:
      block=src.read(1024*1024)
      if not block: break
      out.write(block)
    verify(pathlib.Path(tmp),name);os.replace(tmp,dest)
   finally:
    if os.path.exists(tmp): os.unlink(tmp)
  print(json.dumps({'ready':True,'model':str(model),'voices':str(voices)}));return
 if not a.output: raise ValueError('synthesize requires --output clip.wav')
 req={}
 if a.request:
  req=json.loads(pathlib.Path(a.request).read_text(encoding='utf-8'))
  if req.get('format')!='jet-kokoro-request' or req.get('version')!=1: raise ValueError('Unsupported request format/version')
 text=pathlib.Path(a.text_file).read_text(encoding='utf-8') if a.text_file else req.get('text','')
 if not isinstance(text,str) or not text.strip() or len(text)>100000: raise ValueError('Provide non-empty text (maximum 100000 characters) via --text-file or request')
 voice=a.voice or req.get('voice','af_heart');lang=a.lang or req.get('lang','en-us');speed=a.speed if a.speed is not None else req.get('speed',1)
 if not isinstance(speed,(float,int)) or not math.isfinite(speed) or not .5<=speed<=2: raise ValueError('speed must be between 0.5 and 2')
 if lang not in ['en-us','en-gb']: raise ValueError('This tested integration supports lang en-us or en-gb; other languages require a separately validated provider configuration')
 verify(model,'kokoro-v1.0.onnx');verify(voices,'voices-v1.0.bin')
 try:
  import numpy as np
  import onnxruntime as ort
  from kokoro_onnx import Kokoro
 except ImportError as e: raise ValueError('Install dependencies: python -m pip install -r tools/kokoro-requirements.txt') from e
 ort.disable_telemetry_events()
 opts=ort.SessionOptions();opts.intra_op_num_threads=2;opts.inter_op_num_threads=1;opts.enable_mem_pattern=True
 session=ort.InferenceSession(str(model),sess_options=opts,providers=['CPUExecutionProvider'])
 engine=Kokoro.from_session(session,str(voices))
 if voice not in engine.get_voices(): raise ValueError(f'Unknown stock voice {voice}. Available: '+', '.join(engine.get_voices()))
 samples,rate=engine.create(text,voice=voice,speed=float(speed),lang=lang)
 samples=np.asarray(samples)
 if samples.size==0 or not np.all(np.isfinite(samples)): raise ValueError('Synthesis returned empty/nonfinite audio')
 pcm=(np.clip(samples,-1,1)*32767).astype('<i2').tobytes()
 output=pathlib.Path(a.output)
 if output.exists() or pathlib.Path(str(output)+'.json').exists(): raise ValueError('Output exists; choose a new filename to preserve existing takes')
 output.parent.mkdir(parents=True,exist_ok=True)
 with wave.open(str(output),'wb') as w: w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(pcm)
 duration=len(samples)/rate
 result={'format':'jet-kokoro-clip','version':1,'provider':'kokoro','voice':voice,'speed':speed,'lang':lang,'text':text,'speakerId':req.get('speakerId'),'durationSeconds':duration,'sampleRate':rate,'sampleCount':len(samples),'channels':1,'data':'data:audio/wav;base64,'+base64.b64encode(output.read_bytes()).decode(),'provenance':{'engine':'kokoro-onnx','engineVersion':__import__('importlib.metadata',fromlist=['version']).version('kokoro-onnx'),'modelRelease':'model-files-v1.0','modelSha256':FILES['kokoro-v1.0.onnx'][0],'voicesSha256':FILES['voices-v1.0.bin'][0],'audioSha256':digest(output),'timingBasis':'PCM sampleCount/sampleRate; no estimated words or wall clock'}}
 pathlib.Path(str(output)+'.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({k:v for k,v in result.items() if k not in ['data','text']}))
if __name__=='__main__':
 try: main()
 except Exception as e: print('Kokoro: '+str(e),file=sys.stderr);sys.exit(2)
