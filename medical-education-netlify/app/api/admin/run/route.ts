import {getChatGPTUser} from '../../../auth';
import {dispatchTracker} from '../../../../lib/tracker-job';
export async function POST(){if(!await getChatGPTUser())return Response.json({error:'შესვლა აუცილებელია'},{status:401});try{return Response.json(await dispatchTracker(),{status:202})}catch(e:any){return Response.json({error:e.message},{status:503})}}
