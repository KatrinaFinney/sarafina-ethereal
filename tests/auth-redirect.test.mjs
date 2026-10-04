import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const jsx=(type,props)=>({type,props});
function load(path,dependencies={}) {
  const exports={};
  const code=ts.transpileModule(readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  vm.runInNewContext(code,{exports,require:name=>{
    if(name==='react/jsx-runtime')return {jsx,jsxs:jsx};
    if(!(name in dependencies))throw Error('Unexpected dependency '+name);
    return dependencies[name];
  }});
  return exports;
}
const redirects=load('../lib/auth-redirect.ts');
test('creator login retains studio destination while external redirects are rejected',()=>{
  assert.equal(redirects.authRedirect('/studio'),'/studio');
  assert.equal(redirects.authRedirect('/#membership'),'/#membership');
  for(const destination of [undefined,['/studio'],'https://other.example','//other.example','/\\other.example','/%2f%2fother.example','/studio\n','/unknown'])assert.equal(redirects.authRedirect(destination),'/');
});
for(const destination of ['/studio','/'])test(`signed-in visitors go directly to ${destination}`,async()=>{
  const page=load('../app/sign-in/[[...sign-in]]/page.tsx',{
    '@/app/auth-form':()=>{},
    '@/lib/auth':{authSettings:()=>({NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:'configured'}),identity:async()=>({userId:'creator'})},
    '@/lib/auth-redirect':redirects,
    'next/navigation':{redirect:url=>{throw new Error('redirect:'+url);}},
  });
  await assert.rejects(page.default({searchParams:Promise.resolve({redirect_url:destination})}),{message:'redirect:'+destination});
});
test('Clerk sign-in explicitly returns a newly signed-in creator to the studio',()=>{
  const SignIn=()=>{};
  const form=load('../app/auth-form.tsx',{'@clerk/nextjs':{SignIn,SignUp:()=>{}}});
  const result=form.default({mode:'sign-in',redirectTo:'/studio'});
  assert.equal(result.type,SignIn);
  assert.equal(result.props.forceRedirectUrl,'/studio');
  assert.equal(result.props.fallbackRedirectUrl,'/studio');
  assert.equal(form.default({mode:'sign-in'}).props.forceRedirectUrl,'/');
});
