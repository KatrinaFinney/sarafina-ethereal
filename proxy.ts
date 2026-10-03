import {clerkMiddleware} from '@clerk/nextjs/server';
import {NextResponse,type NextRequest,type NextFetchEvent} from 'next/server';
const middleware=clerkMiddleware();
export default function proxy(request:NextRequest,event:NextFetchEvent){if(!process.env.CLERK_SECRET_KEY||!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY||request.nextUrl.pathname==='/api/webhook')return NextResponse.next();return middleware(request,event);}
export const config={matcher:['/','/api/:path*','/studio/:path*','/welcome','/sign-in/:path*','/sign-up/:path*']};
