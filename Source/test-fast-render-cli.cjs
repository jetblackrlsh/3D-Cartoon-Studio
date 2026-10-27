// SPDX-License-Identifier: GPL-3.0-only
const assert=require('assert'),fs=require('fs'),path=require('path');
const {parseArgs,resolveSettings}=require('./render-options.cjs');
assert.deepEqual(resolveSettings({}),{mode:'fast',fps:6,width:640,height:360,aspect:16/9});
assert.deepEqual(resolveSettings({schema:'JetCartoonProject',version:1}),{mode:'standard',fps:12,width:1280,height:720,aspect:16/9});
assert.deepEqual(resolveSettings({schema:'JetCartoonProject',version:1,createdWith:'1.3.1'}),{mode:'fast',fps:6,width:640,height:360,aspect:16/9});
assert.deepEqual(resolveSettings({}, {mode:'fast'}),{mode:'fast',fps:6,width:640,height:360,aspect:16/9});
assert.equal(parseArgs(['a.json','out','0','2','18']).options.fps,18);
assert.equal(parseArgs(['a.json','out','--mode','fast','--two-speed']).options.twoSpeed,true);
assert.equal(parseArgs(['a.json','out','--fps=8']).options.fps,8);assert.equal(resolveSettings({}, {fps:60}).fps,60);assert.equal(parseArgs(['a.json','out','0','1','60']).options.fps,30);
assert.throws(()=>parseArgs(['a.json','--bogus']));assert.throws(()=>parseArgs(['a.json','--fps']));
assert.throws(()=>resolveSettings({}, {width:641}));assert.throws(()=>resolveSettings({}, {fps:0}));assert.throws(()=>resolveSettings({}, {mode:'turbo'}));
let called;resolveSettings({}, {mode:'fast'},{renderSettings(p,o){called=o;return {mode:'fast',fps:6,width:640,height:360};}});assert.equal(called.mode,'fast');
const renderer=fs.readFileSync(path.join(__dirname,'../Source/render.cjs'),'utf8');
assert(renderer.includes('native.createCanvas(width,height)'));assert(renderer.includes('`${width}x${height}`'));assert(renderer.includes('S.stage(s,settings)'));assert(renderer.includes('settingsSignature'));
const film=fs.readFileSync(path.join(__dirname,'../Source/render-film.cjs'),'utf8');assert.equal((film.match(/spawnSync\(process.execPath/g)||[]).length,1);assert(film.includes('derive2x(normal,fast,settings.fps)'));
console.log('PASS fast render CLI: default/override settings, range, errors, matching canvas/ffmpeg dimensions, stage settings, cached setting guards, master reuse contract');
