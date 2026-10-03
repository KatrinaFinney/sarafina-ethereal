import Home from './home';
import {identity,entitled,isOwner,settings,database} from '@/lib/store';
export const dynamic='force-dynamic';
export default async function Page(){const user=await identity();let posts:any[]=[];let active=false;let unavailable=false;try {posts=(await database().prepare('SELECT id,title,kind,audience,published,preview,mime FROM posts ORDER BY published DESC').all()).results;active=await entitled();}catch{unavailable=true;}return <Home signedIn={!!user} active={active} owner={await isOwner()} authReady={!!settings().NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY&&!!settings().CLERK_SECRET_KEY} ready={!!settings().STRIPE_SECRET_KEY&&!!settings().STRIPE_PRICE_ID&&!!settings().STRIPE_WEBHOOK_SECRET} posts={posts} unavailable={unavailable}/>;}
