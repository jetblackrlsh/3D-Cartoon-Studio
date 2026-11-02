// SPDX-License-Identifier: GPL-3.0-only
// Policy for explicitly NEW productions. Never rewrites an accepted project's assets.
const NAME='local-generative-v1';
const DEFAULTS=Object.freeze({speech:0.95,music:0.30,effects:0.65,musicDuringSpeech:0.65});
function active(project){return project?.audioProduction?.profile===NAME;}
function gains(project,scene={}){
 if(!active(project))return {speech:.95,music:.075,effects:.24};
 const c={...DEFAULTS,...scene.audioMix};
 for(const k of Object.keys(DEFAULTS))if(!Number.isFinite(c[k])||c[k]<0||c[k]>1)throw Error('Invalid audioMix '+k);
 if(c.speech<=c.music||c.effects<=c.music)throw Error('New-production voice/effects gains must exceed music; normalize source levels before mixing.');
 if(c.musicDuringSpeech<.5)throw Error('Avoid deep music suppression; minimum speech multiplier .5.');
 return {speech:c.speech,music:c.music*(scene.audio?c.musicDuringSpeech:1),effects:c.effects};
}
function musicOffset(project,scene,start=0){
 if(!active(project))return start%80;
 const offset=scene.musicOffsetSeconds??0;
 if(!Number.isFinite(offset)||offset<0)throw Error('Invalid musicOffsetSeconds');
 return offset;
}
function prepareNew(pkg){
 const out=JSON.parse(JSON.stringify(pkg));
 out.project.audioProduction={profile:NAME,speechProvider:'kokoro',musicProvider:'stable-audio',effectsProvider:'stable-audio',libraryRole:'secondary',listeningVerified:false};
 for(const s of out.project.scenes){s.voiceProvider='kokoro';s.audioMix={...DEFAULTS,...s.audioMix};}
 return out;
}
function assertAssets(project,scene,assets){
 if(!active(project))return;
 if(scene.sfx?.length&&!assets['sfx/'+scene.id])throw Error('Local-generative production needs actual generated SFX; procedural fallback disabled.');
 if(scene.music&&!assets['music/'+scene.music])throw Error('Missing selected score asset; do not silently export without music.');
 if(!scene.music&&!scene.musicSilenceReason)throw Error('Generate/import a scene score, or record musicSilenceReason for an intentional unscored scene.');
 if((!scene.audio||!assets[scene.audio])&&!scene.voiceSilenceReason)throw Error('Generate/import measured speaker clips, or record voiceSilenceReason for intentional nonverbal action.');
 gains(project,scene);
}
module.exports={NAME,DEFAULTS,active,gains,musicOffset,prepareNew,assertAssets};
if(require.main===module){const fs=require('fs');let [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: node Source/audio-profile.cjs input.json NEW-output.json');if(fs.existsSync(output))throw Error('Refusing overwrite');fs.writeFileSync(output,JSON.stringify(prepareNew(JSON.parse(fs.readFileSync(input))),null,2));}
