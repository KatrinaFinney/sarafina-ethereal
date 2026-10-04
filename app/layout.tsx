import type { Metadata, Viewport } from 'next';
import {authSettings} from '@/lib/auth';
import AuthProvider from './auth-provider';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import './globals.css';
export const dynamic='force-dynamic';
export const viewport:Viewport={width:'device-width',initialScale:1};
export const metadata:Metadata={title:'Sarafina Ethereal — Your All Access Pass',description:'Soulful, raw original music from Sarafina Ethereal. Listen free, or get your all access pass to the full music archive, intimate stories, and new releases every week. $2.99/month.',icons:{icon:{url:'/sarafina.jpg',type:'image/jpeg'},apple:'/sarafina.jpg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><AuthProvider publishableKey={authSettings().NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>{children}</AuthProvider></body></html>}
