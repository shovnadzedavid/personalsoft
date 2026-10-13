import {loadEnvFile} from 'node:process';
import {existsSync,readFileSync} from 'node:fs';
import pg from 'pg';
import {getConnectionString} from '@netlify/database';
if(existsSync('.env.local'))loadEnvFile('.env.local');const pool=new pg.Pool({connectionString:process.env.DATABASE_URL||getConnectionString()});try{await pool.query(readFileSync('netlify/database/migrations/0001_initial/migration.sql','utf8'));console.log('მონაცემთა ბაზის სტრუქტურა შექმნილია.')}finally{await pool.end()}
