import {getChatGPTUser} from '../../../auth';
export async function GET(){if(!await getChatGPTUser())return Response.json({error:'შესვლა აუცილებელია'},{status:401});return Response.json({provider:'netlify',schedule:'0 4,14 * * *',timezone:'UTC',localTimes:['08:00','18:00'],independent:true})}
