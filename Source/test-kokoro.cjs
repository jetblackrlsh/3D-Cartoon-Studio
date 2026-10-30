// SPDX-License-Identifier: GPL-3.0-only
const assert=require('node:assert/strict'),K=require('./kokoro.cjs'),{requests}=require('./kokoro-project.cjs'),{assertConcatStreams}=require('./render-film.cjs');
function wav(seconds=1){const b=Buffer.alloc(44+24000*2*seconds);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(24000,24);b.writeUInt32LE(48000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(b.length-44,40);return 'data:audio/wav;base64,'+b.toString('base64');}
const pkg={project:{scenes:[{caption:'A fresh voice.',duration:1,voice:'gruff',voiceProvider:'kokoro',speakerId:'hero'},{caption:'Legacy unchanged.',voice:'robot'}],voiceCast:K.assignCast(['narrator','hero','friend'])},assets:{}};
assert.equal(new Set(Object.values(pkg.project.voiceCast).map(v=>v.voice)).size,3);
assert.equal(new Set(Object.values(K.assignCast(['one','two','three'],{one:{voice:'af_bella',speed:1}})).map(v=>v.voice)).size,3);
const req=K.request(pkg.project.scenes[0],pkg.project);assert.equal(req.voice,pkg.project.voiceCast.hero.voice);assert.equal(req.speakerId,'hero');assert.equal(requests(pkg).length,1);
const clip={...req,format:'jet-kokoro-clip',provider:'kokoro',data:wav(2),durationSeconds:999};
assert.equal(K.wavDuration(clip.data),2);const legacy=JSON.stringify(pkg.project.scenes[1]);K.embed(pkg,0,clip);assert.equal(pkg.project.scenes[0].duration,2.8);assert.equal(pkg.project.scenes[0].voiceDuration,2);assert.equal(pkg.project.scenes[0].voice,'gruff');assert.equal(JSON.stringify(pkg.project.scenes[1]),legacy);assert.equal(pkg.assets[pkg.project.scenes[0].audio],clip.data);
for(const change of [{text:'stale'},{voice:'af_bella'},{speed:1.2},{lang:'en-gb'},{data:'https://example.com/voice.wav'},{speakerId:'stranger'}]){const before=JSON.stringify(pkg);assert.throws(()=>K.embed(pkg,0,{...clip,...change}));assert.equal(JSON.stringify(pkg),before);}
assert.throws(()=>K.request({caption:'',kokoroVoice:'af_heart'}));assert.throws(()=>K.request({caption:'x',speakerId:3}));assert.throws(()=>K.request({caption:'x',kokoroSpeed:0}));assert.throws(()=>K.request({caption:'x',kokoroVoice:'remote'}));assert.throws(()=>K.wavDuration('data:audio/wav;base64,AAAA'));
const info={streams:[{codec_type:'video',codec_name:'h264',width:640,height:360,pix_fmt:'yuv420p',time_base:'1/12288',r_frame_rate:'6/1'},{codec_type:'audio',codec_name:'aac',sample_rate:'48000',channels:2,channel_layout:'stereo',time_base:'1/48000'}]};
assert.equal(assertConcatStreams([info,JSON.parse(JSON.stringify(info))]),true);
for(const change of [{sample_rate:'44100'},{channels:1},{codec_name:'mp3'}]){const mixed=structuredClone(info);Object.assign(mixed.streams[1],change);assert.throws(()=>assertConcatStreams([info,mixed]),/stream mismatch/);}
const withHash={...clip,provenance:{audioSha256:require('node:crypto').createHash('sha256').update(Buffer.from(clip.data.split(',')[1],'base64')).digest('hex')}};
assert.doesNotThrow(()=>require('./kokoro-project.cjs').verify(withHash));
assert.throws(()=>require('./kokoro-project.cjs').verify({...withHash,provenance:{audioSha256:'0'.repeat(64)}}),/SHA-256 mismatch/);
(async()=>{await K.verifyHash(withHash,require('node:crypto').webcrypto);await assert.rejects(K.verifyHash({...withHash,provenance:{audioSha256:'0'.repeat(64)}},require('node:crypto').webcrypto),/SHA-256 mismatch/);})().catch(e=>{console.error(e);process.exitCode=1;});
console.log('PASS Kokoro requests, cast identity, embedded WAV, stale/malformed rejection, legacy preservation and concat stream preflight');
module.exports={wav};
