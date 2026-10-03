import 'server-only';
import {identity} from './auth';
import {database} from './database';
export {identity} from './auth';
export {database} from './database';
export const settings=()=>process.env;
export async function isOwner(){const u=await identity();return !!u&&!!process.env.OWNER_EMAIL&&u.email.toLowerCase()===process.env.OWNER_EMAIL.toLowerCase();}
export async function entitled(){if(await isOwner())return true;const u=await identity();if(!u)return false;const m=await database().prepare('SELECT status FROM members WHERE id=?').bind(u.userId).first<{status:string}>();return m?.status==='active';}
export function sameOrigin(r:Request){return r.headers.get('origin')===new URL(r.url).origin;}
