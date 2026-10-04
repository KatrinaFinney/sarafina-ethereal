import {createHash} from 'node:crypto';
import {database,identity,sameOrigin} from '@/lib/store';
import {ensureMailerGroups,mailerRequest} from '@/lib/mailerlite';

export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});

// This check exposes no credentials or subscriber information.
export async function GET() {
  try {
    const result=await mailerRequest('groups?limit=1000');
    return json({connected:true,groupsReady:['Community','All Access Waitlist','All Access Members'].every(name=>result.data.some((g:{name:string})=>g.name===name))});
  } catch {return json({connected:false},503);}
}

export async function POST(request:Request) {
  if(!sameOrigin(request)) return json({error:'Please submit this form from the website.'},403);
  const raw=await request.text();
  if(raw.length>4096) return json({error:'Please keep your details short.'},413);
  let body;
  try {body=JSON.parse(raw);} catch {return json({error:'Please check your details.'},400);}
  if(!body||typeof body!=='object'||!['community','waitlist'].includes(body.kind)) return json({error:'Choose a valid email list.'},400);
  if(body.website) return json({error:'Please try again.'},400);
  if(body.kind==='community'&&body.marketing!==true) return json({error:'Select the email opt-in to subscribe. Your account works without it.'},400);
  try {
    const member=body.kind==='community'?await identity():null;
    if(body.kind==='community'&&!member) return json({error:'Sign in to update your community email preferences.'},401);
    const email=(member?.email||(typeof body.email==='string'?body.email:'')).trim().toLowerCase();
    if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)) return json({error:'Enter a valid email address.'},400);
    const fields:Record<string,string>={};
    for(const key of ['name','city','state','country']) {
      if(body[key]!==undefined&&typeof body[key]!=='string') return json({error:'Please check your optional details.'},400);
      const value=(body[key]||'').trim();
      if(value.length>100) return json({error:'Keep each optional detail under 100 characters.'},400);
      if(value) fields[key]=value;
    }
    const db=database();
    await db.prepare('CREATE TABLE IF NOT EXISTS email_rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL)').run();
    const now=Math.floor(Date.now()/1000), window=Math.floor(now/600);
    const address=request.headers.get('x-forwarded-for')?.split(',')[0].trim()||'unknown';
    for(const key of ['ip:'+address,'email:'+email]) {
      const hash=createHash('sha256').update(key+':'+window).digest('hex');
      const rate=await db.prepare('INSERT INTO email_rate_limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(hash,now+1200).first<{count:number}>();
      if((rate?.count||0)>5) return json({error:'Please wait a few minutes before trying again.'},429);
    }
    await db.prepare('DELETE FROM email_rate_limits WHERE expires<?').bind(now).run();
    const groups=await ensureMailerGroups();
    const kinds=body.kind==='waitlist'?['All Access Waitlist']:['Community'];
    if(body.kind==='waitlist'&&body.marketing===true) kinds.push('Community');
    await db.prepare('CREATE TABLE IF NOT EXISTS email_consents (email TEXT NOT NULL, list TEXT NOT NULL, version TEXT NOT NULL, requested_at INTEGER NOT NULL, synced INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(email,list))').run();
    for(const list of kinds) await db.prepare('INSERT INTO email_consents(email,list,version,requested_at,synced) VALUES(?,?,?,?,0) ON CONFLICT(email,list) DO UPDATE SET version=excluded.version,requested_at=excluded.requested_at,synced=0').bind(email,list,'2026-10-04',now).run();
    // Omit status/resubscribe: never override an unsubscribe, bounce or complaint.
    const result=await mailerRequest('subscribers','POST',{email,fields,groups:kinds.map(name=>groups[name]),opted_in_at:new Date(now*1000).toISOString().slice(0,19).replace('T',' ')});
    if(['unsubscribed','bounced','junk'].includes(result.data.status)) return json({error:'This address is not accepting emails. Please use another email or contact me to rejoin.'},409);
    for(const list of kinds) await db.prepare('UPDATE email_consents SET synced=1 WHERE email=? AND list=?').bind(email,list).run();
    return json({success:true,message:result.data.status==='unconfirmed'?'Check your inbox to confirm your email.':body.kind==='waitlist'?'You’re on the waitlist. I’ll email you when All Access opens.':'You’re on the list. Music, moments, and updates are coming your way.'});
  } catch(error) {
    console.error('Email signup failed',error instanceof Error?error.message:'Unknown error');
    return json({error:'Your email signup could not be saved. Please try again shortly.'},503);
  }
}
