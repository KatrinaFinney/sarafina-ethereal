import {requireMember} from '@/lib/auth';
import {entitled} from '@/lib/store';
export const dynamic='force-dynamic';
export default async function Page(){await requireMember('/welcome');const active=await entitled();return <main className="studio"><p className="eyebrow">THE INNER CIRCLE</p><h1>{active?'You’re in.':'Your place is being confirmed.'}</h1><p>{active?'Welcome to the world of Sarafina Ethereal. Your collection is waiting.':'Your payment confirmation is on its way. Refresh this page in a moment; access opens once Stripe confirms your membership.'}</p><a className="button" href={active?'/#library':'/welcome'}>{active?'Explore the collection':'Check membership'}</a></main>}
