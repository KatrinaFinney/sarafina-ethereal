import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/bulk-music.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports});
const {publishMusicBatch,musicFileType,musicTitle,maxMusicBytes}=exports;
const track=(key)=>({key,file:{name:key+'.mp3',type:'audio/mpeg',size:1024},title:key,note:'',preview:'',state:'ready',progress:0});
test('normalizes audio formats and derives readable editable titles',()=>{
  assert.equal(musicFileType({name:'song.M4A',type:'audio/x-m4a'}),'audio/mp4');
  assert.equal(musicFileType({name:'picture.png',type:'image/png'}),'');
  assert.equal(musicTitle('Black_Girl-Found.mp3'),'Black Girl Found');
});
test('a failed publication retains its upload and retry skips published tracks',async()=>{
  let uploads=0,publishes=0;
  const actions={change:()=>{},upload:async(row,onProgress)=>{uploads++;onProgress(50);return 'asset/'+row.key;},publish:async row=>{publishes++;if(row.key==='second')throw Error('network interrupted');return 'post/'+row.key;}};
  const first=await publishMusicBatch([track('first'),track('second'),track('third')],'free',actions);
  assert.deepEqual(Array.from(first,row=>row.state),['published','error','published']);
  assert.equal(first[1].asset,'asset/second');assert.equal(uploads,3);
  const retried=await publishMusicBatch(first,'public',{...actions,publish:async row=>{publishes++;assert.equal(row.audience,'free');return 'post/'+row.key;}});
  assert.equal(uploads,3);assert.equal(publishes,4);assert.equal(retried.every(row=>row.state==='published'),true);
});
test('failed upload does not prevent later tracks and can be retried',async()=>{
  let fail=true;
  const actions={change:()=>{},upload:async row=>{if(row.key==='first'&&fail)throw Error('upload failed');return 'asset/'+row.key;},publish:async row=>'post/'+row.key};
  const first=await publishMusicBatch([track('first'),track('second')],'members',actions);
  assert.equal(first[0].state,'error');assert.equal(first[0].asset,undefined);assert.equal(first[1].state,'published');
  fail=false;const second=await publishMusicBatch(first,'members',actions);assert.equal(second.every(row=>row.state==='published'),true);
});
test('invalid titles and oversized files never upload or publish',async()=>{
  let calls=0;const actions={change:()=>{},upload:async()=>{calls++;},publish:async()=>{calls++;}};
  const rows=[{...track('blank'),title:' '},{...track('large'),file:{...track('large').file,size:maxMusicBytes+1}}];
  const result=await publishMusicBatch(rows,'members',actions);
  assert.equal(calls,0);assert.equal(result.every(row=>row.state==='error'),true);assert.equal(result[0].audience,undefined);
});
