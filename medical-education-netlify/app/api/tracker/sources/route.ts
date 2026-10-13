import {getChatGPTUser} from '../../../auth';
import {changeSource} from '../../../../lib/tracker-store';
export const dynamic='force-dynamic';
export async function POST(req:Request){if(!await getChatGPTUser())return Response.json({error:'შესვლა აუცილებელია'},{status:401});const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return Response.json({error:'მოთხოვნის წყარო არ არის დაშვებული'},{status:403});try{return Response.json({source:await changeSource(await req.json())})}catch(e:any){return Response.json({error:String(e.message||e)},{status:400})}}
