import {getChatGPTUser} from '../../auth';
import {getDb} from '../../../db';
import {records,audit} from '../../../db/schema';
import {and,eq} from 'drizzle-orm';
import {validate,type Row} from '../../../lib/model';
export const dynamic='force-dynamic';
async function context(){const user=await getChatGPTUser();return user?{owner:user.userId,db:getDb()}:null}
async function all(c:any):Promise<Row[]>{return (await c.db.select().from(records).where(eq(records.owner,c.owner))).map((r:any)=>({...r,data:JSON.parse(r.data)}))}
export async function GET(){const c=await context();if(!c)return Response.json({error:'შესვლა აუცილებელია'},{status:401});return Response.json({rows:(await all(c)).filter(r=>!['payments','acts'].includes(r.kind))})}
export async function POST(req:Request){const c=await context();if(!c)return Response.json({error:'შესვლა აუცილებელია'},{status:401});try{
 const body:any=await req.json();const rows=await all(c);const existing=body.id?rows.find(r=>r.id===body.id):null;
 if(body.id&&!existing)return Response.json({error:'ჩანაწერი ვერ მოიძებნა'},{status:404});
 if(existing&&body.revision!==existing.revision)return Response.json({error:'ჩანაწერი შეიცვალა. განაახლე გვერდი.'},{status:409});
 if(existing?.kind==='acts')return Response.json({error:'შენახული აქტი უცვლელია; შექმენი ახალი.'},{status:400});
 const kind=existing?.kind||body.kind;let d=body.data;
 if(!d||typeof d!=='object'||Array.isArray(d)||JSON.stringify(d).length>100000)return Response.json({error:'არასწორი მონაცემები'},{status:400});
 if(['acts','payments'].includes(kind))return Response.json({error:'ფინანსური ნაწილი გამორთულია'},{status:400});
 const err=validate(kind,d,rows,body.id);if(err)return Response.json({error:err},{status:400});
 const id=existing?.id||crypto.randomUUID();const updated=new Date().toISOString();const revision=(existing?.revision||0)+1;
 const op=existing?c.db.update(records).set({data:JSON.stringify(d),updated,revision}).where(and(eq(records.id,id),eq(records.owner,c.owner),eq(records.revision,existing.revision))):c.db.insert(records).values({id,owner:c.owner,kind,data:JSON.stringify(d),updated,revision});
 const result=await c.db.batch([op,c.db.insert(audit).values({id:crypto.randomUUID(),owner:c.owner,action:existing?'update':'create',kind,recordId:id,created:updated})]);
 if(existing&&result[0].meta?.changes===0)return Response.json({error:'ჩანაწერი შეიცვალა. განაახლე გვერდი.'},{status:409});
 return Response.json({row:{id,kind,data:d,updated,revision}});
 }catch(e){console.error('record operation failed',e);return Response.json({error:'შენახვა ვერ დასრულდა'},{status:500})}}
export async function DELETE(req:Request){const c=await context();if(!c)return Response.json({error:'შესვლა აუცილებელია'},{status:401});const {id}=await req.json() as {id:string};const rows=await all(c);const row=rows.find(r=>r.id===id);if(!row)return Response.json({error:'ჩანაწერი ვერ მოიძებნა'},{status:404});if(row.kind==='acts'||rows.some(r=>r.id!==id&&(Object.values(r.data).includes(id)||(r.kind==='acts'&&(r.data.items||[]).some((s:any)=>s.id===id)))))return Response.json({error:'ჩანაწერი დაკავშირებულია სხვა მონაცემებთან და ვერ წაიშლება'},{status:400});await c.db.batch([c.db.delete(records).where(and(eq(records.id,id),eq(records.owner,c.owner))),c.db.insert(audit).values({id:crypto.randomUUID(),owner:c.owner,kind:row.kind,recordId:id,action:'delete',created:new Date().toISOString()})]);return Response.json({ok:true})}
