import { requireMember } from '@/lib/auth';
import {isOwner,settings,database} from '@/lib/store';
import Studio from './studio';
import StudioHeader from './studio-header';
export const dynamic='force-dynamic';
export default async function Page(){await requireMember('/studio');if(!await isOwner())return <main className="studio"><StudioHeader/><h1>Creator studio</h1><p>{settings().OWNER_EMAIL?'This space is reserved for Sarafina.':'The creator account needs to be connected before publishing.'}</p><a className="text-link" href="/">Back to the collection</a></main>;let posts:any[]=[];try{posts=(await database().prepare('SELECT id,title,audience,kind FROM posts ORDER BY published DESC').all()).results;}catch{return <main className="studio"><StudioHeader/><h1>The studio is unavailable.</h1><p>Please try again shortly.</p></main>;}return <Studio posts={posts}/>;}
