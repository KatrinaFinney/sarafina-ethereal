import 'server-only';

const names = ['Community', 'All Access Waitlist', 'All Access Members'] as const;
let groupsPromise: Promise<Record<string,string>> | undefined;

export async function mailerRequest(path:string, method='GET', body?:unknown) {
  const token=process.env.MAILERLITE_API_TOKEN;
  if(!token) throw Error('MailerLite token missing');
  const response=await fetch('https://connect.mailerlite.com/api/'+path, {
    method, headers:{Authorization:'Bearer '+token,Accept:'application/json','Content-Type':'application/json'},
    body:body===undefined?undefined:JSON.stringify(body), cache:'no-store', signal:AbortSignal.timeout(10000)
  });
  if(!response.ok) throw Error('MailerLite request failed: '+response.status);
  return response.json();
}

// Reuse exact names so an existing MailerLite setup is preserved.
export function ensureMailerGroups() {
  return groupsPromise ??= (async()=>{
    const result=await mailerRequest('groups?limit=1000');
    const groups:Record<string,string>={};
    for(const name of names) {
      const existing=result.data.find((group:{name:string;id:string})=>group.name===name);
      if(existing) groups[name]=existing.id;
      else {
        try { groups[name]=(await mailerRequest('groups','POST',{name})).data.id; }
        catch(error) {
          // Another server instance may have created the same group meanwhile.
          const refreshed=await mailerRequest('groups?limit=1000');
          const found=refreshed.data.find((group:{name:string;id:string})=>group.name===name);
          if(!found) throw error;
          groups[name]=found.id;
        }
      }
    }
    return groups;
  })().catch(error=>{groupsPromise=undefined;throw error;});
}
