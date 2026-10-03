import {requireMember} from '@/lib/auth';
import {entitled} from '@/lib/store';
export const dynamic='force-dynamic';
export default async function Page(){await requireMember('/welcome');const active=await entitled();return <main className="studio"><p className="eyebrow">THE INNER CIRCLE</p><h1>{active?'You’re in.':'Your place is being confirmed.'}</h1><p>{active?'Thank you for making room for this music. The songs, the stories, the raw little moments—they’re yours to sit with now.':'Your payment confirmation is on its way. Refresh this page in a moment; access opens once Stripe confirms your membership.'}</p><a className="button" href={active?'/#library':'/welcome'}>{active?'Explore the collection':'Check membership'}</a></main>}
