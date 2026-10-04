import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {createHash} from 'node:crypto';

function route({member=null,status='active',count=1}={}) {
  const calls=[];
  const dependencies={
    'node:crypto':{createHash},
    '@/lib/store':{identity:async()=>member,sameOrigin:r=>r.headers.get('origin')===new URL(r.url).origin,database:()=>({prepare:sql=>({bind:()=>({first:async()=>({count}),run:async()=>{}}),run:async()=>{}})})},
    '@/lib/mailerlite':{ensureMailerGroups:async()=>({'Community':'community','All Access Waitlist':'waitlist','All Access Members':'paid'}),mailerRequest:async(...args)=>{calls.push(args);return {data:{status}};}}
  };
  const exports={};
  const code=ts.transpileModule(readFileSync(new URL('../app/api/newsletter/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{exports,require:key=>dependencies[key],Response,Date,console});
  return {calls,post:body=>exports.POST(new Request('https://msethereal.com/api/newsletter',{method:'POST',headers:{origin:'https://msethereal.com'},body:JSON.stringify(body)})),exports};
}
test('community consent and sign-in are required before contacting MailerLite',async()=>{
  const r=route();
  assert.equal((await r.post({kind:'community',marketing:false})).status,400);
  assert.equal((await r.post({kind:'community',marketing:true})).status,401);
  assert.equal(r.calls.length,0);
});
test('waitlist launch consent does not add a person to broader marketing or paid access',async()=>{
  const r=route();assert.equal((await r.post({kind:'waitlist',email:'listener@example.com',marketing:false})).status,200);
  assert.deepEqual(Array.from(r.calls[0][2].groups),['waitlist']);
  assert.equal('status' in r.calls[0][2],false);assert.equal('resubscribe' in r.calls[0][2],false);
});
test('separate marketing consent adds Community without replacing existing lists',async()=>{
  const r=route();await r.post({kind:'waitlist',email:'listener@example.com',marketing:true,city:'Atlanta'});
  assert.equal(r.calls[0][1],'POST');assert.deepEqual(Array.from(r.calls[0][2].groups),['waitlist','community']);assert.equal(r.calls[0][2].fields.city,'Atlanta');
});
test('community uses the verified account email instead of a supplied address',async()=>{
  const r=route({member:{email:'verified@example.com'}});await r.post({kind:'community',email:'other@example.com',marketing:true});
  assert.equal(r.calls[0][2].email,'verified@example.com');
});
test('unsubscribed addresses are not reported as subscribed',async()=>{
  const r=route({status:'unsubscribed'});assert.equal((await r.post({kind:'waitlist',email:'listener@example.com'})).status,409);
});
test('rate-limited requests never contact MailerLite',async()=>{
  const r=route({count:6});assert.equal((await r.post({kind:'waitlist',email:'listener@example.com'})).status,429);assert.equal(r.calls.length,0);
});
test('off-site submissions and invalid email never contact MailerLite',async()=>{
  const r=route();assert.equal((await r.exports.POST(new Request('https://msethereal.com/api/newsletter',{method:'POST',headers:{origin:'https://other.example'},body:'{}'}))).status,403);
  assert.equal((await r.post({kind:'waitlist',email:'invalid'})).status,400);assert.equal(r.calls.length,0);
});
