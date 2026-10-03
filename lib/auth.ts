import 'server-only';
import {cache} from 'react';
import {currentUser} from '@clerk/nextjs/server';
import {redirect} from 'next/navigation';
export type MemberIdentity={userId:string;email:string;fullName:string|null};
export const authSettings=()=>process.env;
export const identity=cache(async():Promise<MemberIdentity|null>=>{if(!process.env.CLERK_SECRET_KEY||!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)return null;const user=await currentUser();if(!user)return null;const email=user.emailAddresses.find(e=>e.id===user.primaryEmailAddressId&&e.verification?.status==='verified');if(!email)return null;return {userId:user.id,email:email.emailAddress,fullName:[user.firstName,user.lastName].filter(Boolean).join(' ')||null};});
export async function requireMember(returnTo:string){const user=await identity();if(user)return user;const safe=returnTo.startsWith('/')&&!returnTo.startsWith('//')?returnTo:'/';redirect('/sign-in?redirect_url='+encodeURIComponent(safe));}
