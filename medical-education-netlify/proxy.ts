import {NextResponse,type NextRequest} from 'next/server';
import {SESSION_COOKIE,verifySession} from './lib/session.mjs';
export function proxy(req:NextRequest){
 const path=req.nextUrl.pathname;const publicPath=path==='/login'||path==='/api/auth/login';
 if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'მოთხოვნა არ არის დაშვებული'},{status:403});
 if(!publicPath&&!verifySession(req.cookies.get(SESSION_COOKIE)?.value,process.env.OWNER_USER_ID||'',process.env.SESSION_SECRET||'')){if(path.startsWith('/api/'))return NextResponse.json({error:'შესვლა აუცილებელია'},{status:401});return NextResponse.redirect(new URL('/login',req.url))}
 const response=NextResponse.next();response.headers.set('Cache-Control','private, no-store');response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('X-Frame-Options','DENY');return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|pdf.worker.min.mjs).*)']};
