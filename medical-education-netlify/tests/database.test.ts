import test from 'node:test';import assert from 'node:assert/strict';
import {engine,database} from './database-fixture';
import {records,audit,trackerSources} from '../db/schema';
import {changeSource,sourceList} from '../lib/tracker-store';
import {eq} from 'drizzle-orm';
test('PostgreSQL migrations, persistent source management, and atomic rollback',async()=>{try{
 const source=await changeSource({name:'ტესტის ორგანიზაცია',url:'https://netlify-test.ge/courses'});assert.ok('id' in source);
 assert.equal((await sourceList()).find(s=>s.id===source.id)?.name,'ტესტის ორგანიზაცია');
 await assert.rejects(changeSource({name:'დუბლირებული ორგანიზაცია',url:'https://netlify-test.ge/courses'}),/უკვე/);
 const updated=await changeSource({operation:'edit',id:source.id,name:'შეცვლილი ორგანიზაცია',url:'https://netlify-test.ge/education',specialty:'ნევროლოგია'});assert.ok('id' in updated);assert.equal(updated.id,source.id);
 await changeSource({operation:'toggle',id:source.id,enabled:false});assert.equal((await sourceList()).find(s=>s.id===source.id)?.enabled,false);
 await database.update(trackerSources).set({lockedUntil:Date.now()+90000}).where(eq(trackerSources.id,source.id));assert.equal(typeof (await database.select().from(trackerSources).where(eq(trackerSources.id,source.id)))[0].lockedUntil,'number'); // epoch writes must fit bigint
 await database.insert(records).values({id:'existing',owner:'owner',kind:'rooms',data:'{}',updated:'2026-10-13'});
 await assert.rejects(database.batch([database.insert(audit).values({id:'rollback',owner:'owner',action:'create',kind:'rooms',recordId:'existing',created:'2026-10-13'}),database.insert(records).values({id:'existing',owner:'owner',kind:'rooms',data:'{}',updated:'2026-10-13'})]));
 assert.equal((await database.select().from(audit).where(eq(audit.id,'rollback'))).length,0);
 const result=await database.batch([database.update(records).set({revision:2}).where(eq(records.id,'existing'))]);assert.equal(result[0].meta.changes,1);
 }finally{await engine.close()}});
