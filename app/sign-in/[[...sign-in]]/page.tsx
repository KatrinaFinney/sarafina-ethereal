import AuthForm from '@/app/auth-form';
import {authSettings,identity} from '@/lib/auth';
import {redirect} from 'next/navigation';
import {authRedirect} from '@/lib/auth-redirect';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<{redirect_url?:string|string[]}>}){const redirectTo=authRedirect((await searchParams).redirect_url);if(await identity())redirect(redirectTo);const ready=!!authSettings().NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;return <main className="auth-page"><a className="brand" href="/">SARAFINA <span>ETHEREAL</span></a><div className="auth-layout"><div className="auth-intro"><p className="eyebrow">THE INNER CIRCLE</p><h1>{'Welcome back.'}</h1><p>{'Come back to the songs, the stories, and whatever they stir in you.'}</p><a className="text-link" href="/">Back to the collection</a></div><div className="auth-card">{ready?<AuthForm mode="sign-in" redirectTo={redirectTo}/>:<p>Member sign-in is being prepared. Please check back shortly.</p>}</div></div></main>}
