import AuthForm from '@/app/auth-form';
import {authSettings} from '@/lib/auth';
export const dynamic='force-dynamic';
export default function Page(){const ready=!!authSettings().NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;return <main className="auth-page"><a className="brand" href="/">SARAFINA <span>ETHEREAL</span></a><div className="auth-layout"><div className="auth-intro"><p className="eyebrow">THE INNER CIRCLE</p><h1>{'A place for you.'}</h1><p>{'Come a little closer to the music.'}</p><a className="text-link" href="/">Back to the collection</a></div><div className="auth-card">{ready?<AuthForm mode="sign-up"/>:<p>Member sign-in is being prepared. Please check back shortly.</p>}</div></div></main>}
