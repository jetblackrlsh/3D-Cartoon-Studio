"""No-network setup/status/validation tests. Optional real synthesis tested separately."""
import importlib.util, pathlib, tempfile, unittest, unittest.mock as mock, sys, json
spec=importlib.util.spec_from_file_location('adapter',pathlib.Path(__file__).with_name('kokoro-tts.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class AdapterTest(unittest.TestCase):
 def call(self,*args):
  with mock.patch.object(sys,'argv',['kokoro-tts.py',*args]):m.main()
 def test_status_never_network(self):
  with mock.patch.object(m.urllib.request,'urlopen',side_effect=AssertionError('network')):
   self.call('status','--model-dir','/nonexistent/unused-kokoro')
 def test_setup_requires_explicit_download(self):
  with mock.patch.object(m.urllib.request,'urlopen',side_effect=AssertionError('network')):
   with self.assertRaisesRegex(ValueError,'explicit'):self.call('setup')
 def test_missing_model_does_not_download(self):
  with tempfile.TemporaryDirectory() as d:
   p=pathlib.Path(d);(p/'text').write_text('Hello world')
   with mock.patch.object(m.urllib.request,'urlopen',side_effect=AssertionError('network')):
    with self.assertRaisesRegex(ValueError,'Missing'):self.call('synthesize','--text-file',str(p/'text'),'--output',str(p/'clip.wav'),'--model-dir',d)
   self.assertFalse((p/'clip.wav').exists())
 def test_bad_download_removed_and_never_accepted(self):
  import io
  with tempfile.TemporaryDirectory() as d:
   with mock.patch.object(m.urllib.request,'urlopen',return_value=io.BytesIO(b'corrupt')):
    with self.assertRaisesRegex(ValueError,'Integrity mismatch'):self.call('setup','--download-models','--model-dir',d)
   self.assertEqual(list(pathlib.Path(d).iterdir()),[])
 def test_existing_mismatch_preserved(self):
  with tempfile.TemporaryDirectory() as d:
   p=pathlib.Path(d)/'kokoro-v1.0.onnx';p.write_bytes(b'old')
   with mock.patch.object(m.urllib.request,'urlopen',side_effect=AssertionError('network')):
    with self.assertRaisesRegex(ValueError,'Integrity mismatch'):self.call('setup','--download-models','--model-dir',d)
   self.assertEqual(p.read_bytes(),b'old')
if __name__=='__main__':unittest.main()
