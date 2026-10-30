// SPDX-License-Identifier: GPL-3.0-only
// Portable Kokoro contract shared by browser authoring and headless project tools.
const voices = {
 af_heart: 'Heart · American female', af_bella: 'Bella · American female',
 af_nicole: 'Nicole · American female', af_sarah: 'Sarah · American female',
 af_sky: 'Sky · American female', am_adam: 'Adam · American male',
 am_michael: 'Michael · American male', am_fenrir: 'Fenrir · American male',
 am_puck: 'Puck · American male', am_echo: 'Echo · American male'
};
const castVoices = ['af_heart','am_michael','af_bella','am_adam','af_nicole','am_fenrir','af_sarah','am_puck','af_sky','am_echo'];
function assignCast(ids, existing = {}) {
 const cast = {...existing}, used = new Set(Object.values(existing).map(v=>v.voice));
 [...new Set(ids)].forEach((id,i) => {
  if (typeof id !== 'string' || !id || ['__proto__','prototype','constructor'].includes(id)) throw Error('Invalid speaker ID');
  if (!Object.hasOwn(cast,id)) { const voice=castVoices.find(v=>!used.has(v)) || castVoices[i % castVoices.length];cast[id]={voice,speed:1};used.add(voice); }
 });
 return cast;
}
function request(scene, project = {}) {
 const speakerId = scene.speakerId || scene.speaker || 'narrator';
 if(typeof speakerId!=='string'||!speakerId.trim()||speakerId.length>200||['__proto__','prototype','constructor'].includes(speakerId))throw Error('Use a speaker ID of 1–200 characters.');
 const cast = Object.hasOwn(project.voiceCast || {},speakerId) ? project.voiceCast[speakerId] : null;
 const voice = scene.kokoroVoice || cast?.voice || 'af_heart', speed = scene.kokoroSpeed ?? cast?.speed ?? 1;
 if (typeof scene.caption !== 'string' || !scene.caption.trim() || scene.caption.length > 8000) throw Error('Kokoro text must contain 1–8000 characters.');
 if (!Object.hasOwn(voices,voice)) throw Error('Choose a supported Kokoro voice.');
 if (!Number.isFinite(speed) || speed < 0.5 || speed > 2) throw Error('Kokoro speed must be 0.5–2.');
 return {format:'jet-kokoro-request',version:1,text:scene.caption,voice,speed,lang:'en-us',speakerId};
}
function wavDuration(data) {
 if (typeof data !== 'string' || data.length > 42000000 || !/^data:audio\/wav;base64,[A-Za-z0-9+/]+={0,2}$/.test(data)) throw Error('Expected an embedded WAV under 30 MB.');
 const raw = typeof Buffer !== 'undefined' ? Buffer.from(data.split(',')[1],'base64') : Uint8Array.from(atob(data.split(',')[1]),c=>c.charCodeAt(0));
 const v = new DataView(raw.buffer,raw.byteOffset,raw.byteLength), tag = (p,n) => String.fromCharCode(...raw.subarray(p,p+n));
 if(raw.length > 30000000 || raw.length < 44 || tag(0,4)!=='RIFF' || tag(8,4)!=='WAVE') throw Error('Invalid WAV header.');
 let rate=0,size=0;
 for(let p=12;p+8<=raw.length;) { const n=v.getUint32(p+4,true); if(p+8+n>raw.length) throw Error('Truncated WAV.'); if(tag(p,4)==='fmt ') { if(n<16 || v.getUint16(p+8,true)!==1)throw Error('Use PCM WAV audio.'); const channels=v.getUint16(p+10,true),sampleRate=v.getUint32(p+12,true),bits=v.getUint16(p+22,true),align=v.getUint16(p+20,true); rate=v.getUint32(p+16,true); if(![1,2].includes(channels)||sampleRate<8000||sampleRate>192000||![8,16,24,32].includes(bits)||align!==channels*bits/8||rate!==sampleRate*align)throw Error('Invalid PCM WAV sample format.'); } if(tag(p,4)==='data')size+=n; p+=8+n+(n%2); }
 const seconds=size/rate;
 if(!Number.isFinite(seconds)||seconds<=0||seconds>180)throw Error('WAV duration must be 0–180 seconds.');
 return seconds;
}
function embed(pkg, index, clip) {
 const scene = pkg.project?.scenes?.[index];
 if(!scene)throw Error('Scene index outside project.');
 const expected=request(scene,pkg.project);
 if(clip?.format!=='jet-kokoro-clip'||clip.version!==1||clip.provider!=='kokoro')throw Error('Expected jet-kokoro-clip version 1.');
 for(const k of ['text','voice','speed','lang']) if(clip[k]!==expected[k])throw Error('Kokoro clip '+k+' differs from the current scene. Regenerate its request.');
 if(clip.speakerId!=null&&clip.speakerId!==expected.speakerId)throw Error('Kokoro clip speaker differs from current scene.');
 const duration=wavDuration(clip.data);
 if(duration+0.8>180)throw Error('Speech leaves no scene end padding; split this scene.');
 const key='voice/kokoro-'+index+'-'+expected.speakerId.replace(/[^a-zA-Z0-9_-]/g,'_');
 pkg.assets ||= {};pkg.assets[key]=clip.data;
 scene.audio=key;scene.voiceProvider='kokoro';scene.kokoroVoice=clip.voice;scene.kokoroSpeed=clip.speed;scene.speakerId=expected.speakerId;
 scene.voiceDuration=duration;scene.duration=Math.max(scene.duration||0,duration+0.8);delete scene.captions;
 scene.voiceProvenance={provider:'kokoro',voice:clip.voice,speed:clip.speed,lang:clip.lang,text:clip.text};
 if(clip.provenance && typeof clip.provenance === 'object')scene.voiceProvenance.source=JSON.parse(JSON.stringify(clip.provenance));
 return scene;
}
async function verifyHash(clip, cryptoImpl = globalThis.crypto) {
 const expected=clip?.provenance?.audioSha256;
 if(expected===undefined)return;
 if(!/^[a-f0-9]{64}$/.test(expected))throw Error('Invalid Kokoro audio SHA-256.');
 if(!cryptoImpl?.subtle)throw Error('This browser cannot verify clip SHA-256. Use a current browser or the headless project embed command.');
 const raw=typeof Buffer!=='undefined'?Buffer.from(clip.data.split(',')[1],'base64'):Uint8Array.from(atob(clip.data.split(',')[1]),c=>c.charCodeAt(0));
 const digest=await cryptoImpl.subtle.digest('SHA-256',raw),actual=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
 if(actual!==expected)throw Error('Kokoro WAV SHA-256 mismatch. Reimport the original generated clip.');
}
module.exports={verifyHash,voices,castVoices,assignCast,request,wavDuration,embed};
