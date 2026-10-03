import Stripe from 'stripe';
import {settings,database} from './store';
export function stripe(){const key=settings().STRIPE_SECRET_KEY;if(!key)throw Error('Membership is not open yet.');return new Stripe(key,{httpClient:Stripe.createFetchHttpClient()});}
export async function syncCustomer(customer:string){const s=stripe();const subs=await s.subscriptions.list({customer,status:'all',limit:100});const ours=subs.data.filter(x=>x.items.data.some(i=>i.price.id===settings().STRIPE_PRICE_ID));const sub=ours.find(x=>x.status==='active')||ours[0];const status=sub?.status||'inactive';await database().prepare('UPDATE members SET subscription=?,status=?,updated=? WHERE customer=?').bind(sub?.id||null,status,Math.floor(Date.now()/1000),customer).run();}
