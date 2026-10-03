import type { Metadata, Viewport } from 'next';
import {authSettings} from '@/lib/auth';
import AuthProvider from './auth-provider';
import './globals.css';
export const dynamic='force-dynamic';
export const viewport:Viewport={width:'device-width',initialScale:1};
export const metadata:Metadata={title:'Sarafina Ethereal — The Inner Circle',description:'Soulful, raw original music from Sarafina Ethereal. Listen free, or come closer for the full archive, intimate stories, and new offerings every week. $2.99/month.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><AuthProvider publishableKey={authSettings().NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>{children}</AuthProvider></body></html>}
