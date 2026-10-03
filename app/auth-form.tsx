"use client";
import {SignIn,SignUp} from '@clerk/nextjs';
export default function AuthForm({mode}:{mode:'sign-in'|'sign-up'}){return mode==='sign-in'?<SignIn routing="hash" signUpUrl="/sign-up" fallbackRedirectUrl="/"/>:<SignUp routing="hash" signInUrl="/sign-in" fallbackRedirectUrl="/"/>;}
