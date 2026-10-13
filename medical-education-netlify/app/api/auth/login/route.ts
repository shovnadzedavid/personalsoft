import {getPool} from '../../../../db';
import {createHmac} from 'node:crypto';
import {SESSION_COOKIE,signSession,verifyPassword} from '../../../../lib/session.mjs';
export const runtime='nodejs';
export async function POST(req:Request){
 try{
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'მოთხოვნა არ არის დაშვებული'},{status:403});
 const secret=process.env.SESSION_SECRET||'',owner=process.env.OWNER_USER_ID||'',hash=process.env.ADMIN_PASSWORD_HASH||'';if(secret.length<32||!owner||!hash)return Response.json({error:'ადმინისტრატორის შესვლა ჯერ არ არის გამართული'},{status:503});
 const ip=req.headers.get('x-nf-client-connection-ip')||'unknown';const key=createHmac('sha256',secret).update(ip).digest('hex');const now=Date.now();
 const attempt=await getPool().query('INSERT INTO auth_attempts (key,window_start,count) VALUES ($1,$2,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN auth_attempts.window_start<$3 THEN 1 ELSE auth_attempts.count+1 END,window_start=CASE WHEN auth_attempts.window_start<$3 THEN $2 ELSE auth_attempts.window_start END RETURNING count',[key,now,now-15*60000]);
 if(attempt.rows[0].count>10)return Response.json({error:'ბევრი მცდელობა — სცადე 15 წუთში'},{status:429,headers:{'Retry-After':'900'}});
 const b=await req.json();if(typeof b.email!=='string'||b.email.toLowerCase()!==(process.env.ADMIN_EMAIL||'').toLowerCase()||!verifyPassword(b.password,hash))return Response.json({error:'ელფოსტა ან პაროლი არასწორია'},{status:401});
 await getPool().query('DELETE FROM auth_attempts WHERE key=$1',[key]);const response=Response.json({ok:true});response.headers.set('Set-Cookie',SESSION_COOKIE+'='+signSession(owner,secret)+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800');return response;
 }catch{return Response.json({error:'შესვლა ვერ დასრულდა — გადაამოწმე მონაცემთა ბაზის გამართვა'},{status:503})}
}
