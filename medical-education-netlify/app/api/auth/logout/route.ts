import {SESSION_COOKIE} from '../../../../lib/session.mjs';
export async function POST(){return Response.json({ok:true},{headers:{'Set-Cookie':SESSION_COOKIE+'=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'}})}
