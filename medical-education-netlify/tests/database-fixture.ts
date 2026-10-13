import {PGlite} from '@electric-sql/pglite';
import {createDatabase} from '../db';
import type pg from 'pg';
import {readFileSync} from 'node:fs';
export const engine=new PGlite();
await engine.exec(readFileSync('netlify/database/migrations/0001_initial/migration.sql','utf8'));
const adapter:any={async query(config:any,params:any[]=[]){const r:any=await engine.query(typeof config==='string'?config:config.text,params);return {rows:config.rowMode==='array'?r.rows.map((row:any)=>r.fields.map((f:any)=>row[f.name])):r.rows,rowCount:r.affectedRows??r.rows.length,fields:r.fields}},async connect(){return {...adapter,release(){}}}};
export const database=createDatabase(adapter as pg.Pool);
