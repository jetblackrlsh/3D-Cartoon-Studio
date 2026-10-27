// SPDX-License-Identifier: GPL-3.0-only
// Build/test helper: verify the original CC0 GLBs, then embed them for offline use.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports=function(){const manifest=require('./standard-assets.json'),out={};for(const [key,value]of Object.entries(manifest)){const {file,...metadata}=value;const data=fs.readFileSync(path.resolve(__dirname,'..',file));if(crypto.createHash('sha256').update(data).digest('hex')!==metadata.sha256)throw Error('Standard asset checksum mismatch: '+file);out[key]={...metadata,data:'data:model/gltf-binary;base64,'+data.toString('base64')};}return out;};
