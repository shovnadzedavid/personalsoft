import {getChatGPTUser} from '../../../auth';
import {importProgram} from '../../../../lib/tracker-store';
export const dynamic='force-dynamic';
export async function POST(req:Request){const u=await getChatGPTUser();if(!u)return Response.json({error:'შესვლა აუცილებელია'},{status:401});try{const b:any=await req.json();return Response.json(await importProgram(b.id,u.userId))}catch(e:any){return Response.json({error:String(e.message||e)},{status:400})}}
