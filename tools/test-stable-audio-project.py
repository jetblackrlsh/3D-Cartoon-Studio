#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-only
"""Synthetic engineering fixtures; these tests never claim model inference."""
import importlib.util,json,pathlib,tempfile,unittest,wave
import numpy as np
spec=importlib.util.spec_from_file_location('project_adapter',pathlib.Path(__file__).with_name('stable-audio-project.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class AdapterTests(unittest.TestCase):
 def fixture(self,root):
  pkg={'project':{'scenes':[{'id':'one','duration':2,'audio':'existing-voice'}]},'assets':{'existing-voice':'preserved'}}
  job={'id':'impact','scene':'one','kind':'sfx','action':'generic fixture','prompt':'generic synthetic fixture metadata','seconds':1,'seed':23,'output':'fx.wav','at':.5}
  a=(np.sin(np.arange(24000)*2*np.pi*450/24000)*3000).astype('<i2')
  with wave.open(str(root/'fx.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(24000);w.writeframes(a.tobytes())
  receipt={**job,**m.backend.pcm_info(root/'fx.wav'),'provider':'stable-audio-3-small','sourceRevision':m.backend.SOURCE_REVISION,'modelRevision':m.backend.MODEL_REVISION,'fixtureOnly':True}
  (root/'fx.receipt.json').write_text(json.dumps(receipt));return pkg,{'jobs':[job]}
 def test_embed_preserves_voice_and_timing(self):
  with tempfile.TemporaryDirectory() as td:
   root=pathlib.Path(td);pkg,plan=self.fixture(root);out=root/'new.json';r=m.embed(pkg,plan,root,out);c=json.loads(out.read_text())
   self.assertEqual(c['assets']['existing-voice'],'preserved');self.assertNotIn('generatedAudio',pkg['project']);self.assertEqual(c['project']['generatedAudio']['ledger'][0]['cues'][0]['startSample'],24000);self.assertEqual(c['project']['generatedAudio']['ledger'][0]['cues'][0]['endSample'],72000);self.assertEqual(r['sampleRate'],48000);self.assertFalse(r['listeningVerified']);self.assertTrue(c['assets']['sfx/one'].startswith('data:audio/wav;base64,'));self.assertEqual(c['project']['scenes'][0]['sfx'][0]['at'],.25);self.assertNotIn('speechProvider',c['project']['audioProduction'])
 def test_new_music_resets_offset_only_touched_scene(self):
  with tempfile.TemporaryDirectory() as td:
   root=pathlib.Path(td);pkg,plan=self.fixture(root);pkg['project']['scenes'][0]['musicOffsetSeconds']=73;pkg['project']['scenes'].append({'id':'untouched','duration':3,'music':'old','musicOffsetSeconds':17})
   j=plan['jobs'][0];j['kind']='music';q=json.loads((root/'fx.receipt.json').read_text());q['kind']='music';(root/'fx.receipt.json').write_text(json.dumps(q))
   m.embed(pkg,plan,root,root/'new.json');c=json.loads((root/'new.json').read_text())
   self.assertEqual(c['project']['scenes'][0]['musicOffsetSeconds'],0);self.assertEqual(c['project']['scenes'][1],pkg['project']['scenes'][1])
 def test_preserves_existing_provenance(self):
  with tempfile.TemporaryDirectory() as td:
   root=pathlib.Path(td);pkg,plan=self.fixture(root);pkg['project']['generatedAudio']={'ledger':[{'kind':'existing'}],'imports':[{'jobsSha256':'old'}]};pkg['project']['audioProduction']={'speechProvider':'legacy-explicit'}
   m.embed(pkg,plan,root,root/'new.json');c=json.loads((root/'new.json').read_text())
   self.assertEqual(c['project']['generatedAudio']['ledger'][0],{'kind':'existing'});self.assertEqual(len(c['project']['generatedAudio']['imports']),2);self.assertEqual(c['project']['audioProduction']['speechProvider'],'legacy-explicit')
 def test_mismatched_hash_no_output(self):
  with tempfile.TemporaryDirectory() as td:
   root=pathlib.Path(td);pkg,plan=self.fixture(root);q=json.loads((root/'fx.receipt.json').read_text());q['sha256']='bad';(root/'fx.receipt.json').write_text(json.dumps(q))
   with self.assertRaises(ValueError):m.embed(pkg,plan,root,root/'new.json')
   self.assertFalse((root/'new.json').exists())
 def test_invalid_cues_rejected(self):
  edits=[{'at':1.5},{'output':'../escape.wav'},{'scene':'missing'},{'kind':'midi'},{'provider':'other'},{'gain':float('nan')},{'action':''},{'seed':True}]
  with tempfile.TemporaryDirectory() as td:
   root=pathlib.Path(td);pkg,plan=self.fixture(root)
   for change in edits:
    q=json.loads(json.dumps(plan));q['jobs'][0].update(change)
    with self.assertRaises(ValueError):m.validate(pkg,q,root)
 def test_duplicate_outputs_and_ids_rejected(self):
  with tempfile.TemporaryDirectory() as td:
   root=pathlib.Path(td);pkg,plan=self.fixture(root);plan['jobs'].append(dict(plan['jobs'][0]))
   with self.assertRaises(ValueError):m.validate(pkg,plan,root)
 def test_missing_source_fails_no_fallback(self):
  with tempfile.TemporaryDirectory() as td:
   root=pathlib.Path(td);pkg,plan=self.fixture(root);(root/'fx.wav').unlink()
   with self.assertRaises(ValueError):m.embed(pkg,plan,root,root/'new.json')
 def test_no_overwrite(self):
  with tempfile.TemporaryDirectory() as td:
   root=pathlib.Path(td);pkg,plan=self.fixture(root);out=root/'new.json';out.write_text('keep')
   with self.assertRaises(ValueError):m.embed(pkg,plan,root,out)
   self.assertEqual(out.read_text(),'keep')
 def test_missing_runtime_fails(self):
  with tempfile.TemporaryDirectory() as td:
   with self.assertRaises(ValueError):m.backend.check_runtime(pathlib.Path(td),{'music'})
if __name__=='__main__':unittest.main()
