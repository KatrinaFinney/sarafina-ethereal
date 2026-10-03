import {loadEnvConfig} from '@next/env';
import {createClient} from '@libsql/client/http';
import {readFile} from 'node:fs/promises';
loadEnvConfig(process.cwd());
if(!process.env.TURSO_DATABASE_URL||!process.env.TURSO_AUTH_TOKEN)throw Error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before migrating.');
const db=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});
const statements=(await readFile(new URL('../db/schema.sql',import.meta.url),'utf8')).split(';').map(s=>s.trim()).filter(Boolean);
await db.batch(statements,'write');console.log('Database schema applied.');db.close();
