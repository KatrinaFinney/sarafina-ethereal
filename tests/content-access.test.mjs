import test from 'node:test';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path,dependencies={}){
 const exports={};
 const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{exports,require:name=>{if(name==='node:crypto')return {createHash};if(!(name in dependencies))throw Error('Unexpected dependency '+name);return dependencies[name];},Response,console,crypto});
 return exports;
}
const access=load('../lib/access.ts');
for(const audience of ['public','free','members','unknown'])for(const session of ['guest','free','paid'])test(`${session} access to ${audience} content`,async()=>{
 const signedIn=session!=='guest',paid=session==='paid';
 const allowed=audience==='public'||audience==='free'&&signedIn||audience==='members'&&paid;
 let streams=0;
 const post={id:'track',audience,body:'PROTECTED BODY',asset:'PRIVATE FILE',preview:'PUBLIC TEASER'};
 const route=load('../app/api/[...path]/route.ts',{'@/lib/access':access,'@/lib/store':{database:()=>({prepare:()=>({bind:()=>({first:async()=>post})})}),identity:async()=>signedIn?{userId:'listener'}:null,entitled:async()=>paid},'@/lib/media':{streamFile:()=>{streams++;return new Response('AUDIO');}},'@/lib/payments':{}});
 const request=new Request('https://example.com/api/posts/track');
 const response=await route.GET(request,{params:Promise.resolve({path:['posts','track']})});
 assert.equal(response.status,allowed?200:403);
 const payload=await response.json();
 assert.equal(payload.asset,undefined,'never expose a storage path');
 assert.equal(payload.body,allowed?'PROTECTED BODY':undefined,'protected text must stay private');
 const media=await route.GET(new Request('https://example.com/api/media/track'),{params:Promise.resolve({path:['media','track']})});
 assert.equal(media.status,allowed?200:403);
 assert.equal(streams,allowed?1:0,'reject media before storage access');
});


test('repeating a publication for the same uploaded asset cannot create duplicate songs',async()=>{
 const ids=new Set();let writes=0;
 const db={prepare:sql=>({bind:(...args)=>({first:async()=>({owner:'creator'}),run:async()=>{if(sql.includes('INSERT INTO posts')){assert.match(sql,/ON CONFLICT\(id\) DO NOTHING/);if(!ids.has(args[0])){ids.add(args[0]);writes++;}}}})})};
 const route=load('../app/api/[...path]/route.ts',{'@/lib/access':access,'@/lib/store':{database:()=>db,identity:async()=>({userId:'creator'}),isOwner:async()=>true,sameOrigin:()=>true},'@/lib/media':{validPath:()=>true,allowedMedia:['audio/mpeg'],privateFile:async()=>({size:1024,contentType:'audio/mpeg'})},'@/lib/payments':{}});
 const publish=async()=>{const form=new FormData();for(const [key,value] of Object.entries({title:'My song',body:'My note',kind:'music',audience:'free',asset:'offerings/same-upload/song.mp3'}))form.set(key,value);const response=await route.POST(new Request('https://example.com/api/publish',{method:'POST',body:form}),{params:Promise.resolve({path:['publish']})});assert.equal(response.status,201);return response.json();};
 const first=await publish(),second=await publish();assert.equal(first.id,second.id);assert.equal(writes,1);
});
