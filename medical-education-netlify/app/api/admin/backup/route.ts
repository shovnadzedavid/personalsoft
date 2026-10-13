import {getChatGPTUser} from '../../../auth';
import {getDb} from '../../../../db';
import {records,audit,trackerSources,trackerPrograms,trackerRuns} from '../../../../db/schema';
import {eq} from 'drizzle-orm';
export const dynamic='force-dynamic';
export async function GET(){const user=await getChatGPTUser();if(!user)return Response.json({error:'შესვლა აუცილებელია'},{status:401});const db=getDb();const [personal,history,sources,programs,runs]=await Promise.all([db.select().from(records).where(eq(records.owner,user.userId)),db.select().from(audit).where(eq(audit.owner,user.userId)),db.select().from(trackerSources),db.select().from(trackerPrograms),db.select().from(trackerRuns)]);const body={version:1,created:new Date().toISOString(),owner:user.userId,includesFiles:false,tables:{records:personal,audit:history,trackerSources:sources,trackerPrograms:programs,trackerRuns:runs}};return Response.json(body,{headers:{'Content-Disposition':'attachment; filename="medical-education-backup.json"','Cache-Control':'private, no-store'}})}
