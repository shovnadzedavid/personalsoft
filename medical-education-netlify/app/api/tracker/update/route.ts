import {getChatGPTUser} from '../../../auth';
import {updateSource} from '../../../../lib/tracker-store';
export const dynamic='force-dynamic';
// Manual requests require the administrator session; background jobs call the store directly.
export async function POST(req:Request){if(!await getChatGPTUser())return Response.json({error:'შესვლა აუცილებელია'},{status:401});const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return Response.json({error:'მოთხოვნის წყარო არ არის დაშვებული'},{status:403});try{const b:any=await req.json();if(typeof b.sourceId!=='string')return Response.json({error:'მიუთითე წყარო'},{status:400});const result=await updateSource(b.sourceId);return Response.json(result,{headers:{'Cache-Control':'no-store'}})}catch(e:any){return Response.json({error:String(e.message||e)},{status:400})}}
