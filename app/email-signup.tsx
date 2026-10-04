"use client";
import {useState,type FormEvent} from 'react';

export default function EmailSignup({kind}:{kind:'community'|'waitlist'}) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[done,setDone]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setMessage('');
    const form=new FormData(event.currentTarget);
    try {
      const response=await fetch('/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...Object.fromEntries(form),kind,marketing:form.get('marketing')==='on'})});
      const result=await response.json();
      if(!response.ok) throw Error(result.error||'Please try again.');
      setMessage(result.message);setDone(true);
    } catch(error) {setMessage(error instanceof Error?error.message:'Please try again.');}
    finally {setBusy(false);}
  }
  if(done) return <p role="status">{message}</p>;
  return <form className="email-signup" onSubmit={submit}>
    {kind==='waitlist'&&<label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required/></label>}
    {kind==='waitlist'&&<p className="email-note">Join to receive All Access launch updates by email. Unsubscribe anytime.</p>}
    <label className="email-consent"><input name="marketing" type="checkbox" required={kind==='community'}/><span>Send me show announcements, personal updates, exclusive gifts, and special offers from Sarafina Ethereal. Unsubscribe anytime.</span></label>
    <details><summary>Personalize my emails (optional)</summary><div className="email-fields">
      <label>First name<input name="name" autoComplete="given-name" maxLength={100}/></label>
      <label>City<input name="city" autoComplete="address-level2" maxLength={100}/></label>
      <label>State / region<input name="state" autoComplete="address-level1" maxLength={100}/></label>
      <label>Country<input name="country" autoComplete="country-name" maxLength={100}/></label>
    </div><p className="email-note">Share your location so I can let you know about nearby shows.</p></details>
    <div className="email-honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    {message&&<p role="alert">{message}</p>}
    <button className="button" disabled={busy} type="submit">{busy?'Saving…':kind==='waitlist'?'Join the waitlist':'Keep me in the loop'}</button>
    {kind==='community'&&<p className="email-note">Email updates are optional. Your free account is already ready to explore.</p>}
  </form>;
}
