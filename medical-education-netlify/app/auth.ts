import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';
import {SESSION_COOKIE,verifySession} from '../lib/session.mjs';
export async function getChatGPTUser(){const value=(await cookies()).get(SESSION_COOKIE)?.value;const owner=process.env.OWNER_USER_ID||'';if(!verifySession(value,owner,process.env.SESSION_SECRET||''))return null;return {userId:owner,email:process.env.ADMIN_EMAIL||'',displayName:process.env.ADMIN_EMAIL||'ადმინისტრატორი',fullName:null}}
export async function requireChatGPTUser(_returnTo:string){const user=await getChatGPTUser();if(!user)redirect('/login');return user}
