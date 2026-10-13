import {getConnectionString} from '@netlify/database';
import pg from 'pg';
import {drizzle} from 'drizzle-orm/node-postgres';
import * as schema from './schema';
let pool:pg.Pool|undefined;
export function getPool(){if(!pool)pool=new pg.Pool({connectionString:process.env.DATABASE_URL||getConnectionString(),max:4,idleTimeoutMillis:10000,connectionTimeoutMillis:10000});return pool}
export function getDb(){return createDatabase(getPool())}
export function createDatabase(pool:pg.Pool){const db=drizzle(pool,{schema});return Object.assign(db,{async batch(queries:Array<{toSQL():{sql:string;params:unknown[]}}>){const client=await pool.connect();try{await client.query('BEGIN');const results=[];for(const q of queries){const query=q.toSQL();const result=await client.query(query.sql,query.params);results.push({...result,meta:{changes:result.rowCount}})}await client.query('COMMIT');return results}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}}})}
