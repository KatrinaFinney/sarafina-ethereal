import 'server-only';
import {createClient,type InValue,type Client} from '@libsql/client/http';
let client:Client|undefined;
function connection(){if(!process.env.TURSO_DATABASE_URL||!process.env.TURSO_AUTH_TOKEN)throw Error('The content database has not been connected.');return client??=createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN});}
class Statement{constructor(private sql:string,private args:InValue[]=[]){ }bind(...args:InValue[]){return new Statement(this.sql,args);}async first<T=Record<string,unknown>>(){const r=await connection().execute({sql:this.sql,args:this.args});return (r.rows[0] as unknown as T)||null;}async all(){const r=await connection().execute({sql:this.sql,args:this.args});return {results:r.rows.map(row=>({...row}))};}async run(){return connection().execute({sql:this.sql,args:this.args});}}
export const database=()=>({prepare:(sql:string)=>new Statement(sql)});
