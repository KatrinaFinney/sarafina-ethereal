"use client";
import {SignIn,SignUp} from '@clerk/nextjs';
export default function AuthForm({mode,redirectTo='/' }:{mode:'sign-in'|'sign-up';redirectTo?:string}){return mode==='sign-in'?<SignIn routing="hash" signUpUrl="/sign-up" forceRedirectUrl={redirectTo} fallbackRedirectUrl={redirectTo}/>:<SignUp routing="hash" signInUrl="/sign-in" forceRedirectUrl="/?community=1" fallbackRedirectUrl="/?community=1"/>;}

