import {getChatGPTUser} from '../../auth';
import {getDb} from '../../../db';
import {records,audit} from '../../../db/schema';
import {eq} from 'drizzle-orm';
import {validate,type Row} from '../../../lib/model';
import {expandSchedule} from '../../../lib/schedule';
export const dynamic='force-dynamic';
export async function POST(req:Request){const u=await getChatGPTUser();if(!u)return Response.json({error:'შესვლა აუცილებელია'},{status:401});try{
 const body:any=await req.json();if(!body.data||typeof body.data!=='object'||!body.schedule||JSON.stringify(body).length>100000||!/^[-a-zA-Z0-9]{20,80}$/.test(body.batchId||''))return Response.json({error:'არასწორი მონაცემები'},{status:400});
 const db=getDb();const rows:Row[]=(await db.select().from(records).where(eq(records.owner,u.userId))).map(r=>({...r,data:JSON.parse(r.data)}));
 const replay=rows.filter(r=>r.kind==='sessions'&&r.data.seriesId===body.batchId);if(replay.length)return Response.json({rows:replay});
 const dates=expandSchedule(body.schedule,body.data.start,body.data.end);const updated=new Date().toISOString();
 const planned:Row[]=dates.map((d,i)=>({id:body.batchId+'-'+i,kind:'sessions',revision:1,updated,data:{...body.data,...d,seriesId:body.batchId,recurring:body.schedule.mode==='weekly',seriesFrom:body.schedule.from||dates[0].date,seriesTo:body.schedule.to||dates.at(-1)!.date,seriesDays:body.schedule.weekdays||[]}}));
 for(const r of planned){const err=validate('sessions',r.data,rows);if(err)return Response.json({error:r.data.date+' '+r.data.start+'–'+r.data.end+': '+err},{status:400})}
 // PostgreSQL batch is transactional: an insert failure rolls back the complete series.
 await db.batch([db.insert(audit).values({id:crypto.randomUUID(),owner:u.userId,action:'create-series',kind:'sessions',recordId:body.batchId,created:updated}),...planned.map(r=>db.insert(records).values({...r,owner:u.userId,data:JSON.stringify(r.data)}))]);return Response.json({rows:planned});
 }catch(e:any){return Response.json({error:e.message||'სერიის შენახვა ვერ დასრულდა'},{status:400})}}
