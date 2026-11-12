import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
const dry=process.argv.includes('--dry-run');
const bucket=process.env.SUPABASE_STORAGE_BUCKET||'gdg-assets';
const source=path.resolve('site');
const raw=await fs.readFile(path.join(source,'assets/data.js'),'utf8');
const data=JSON.parse(raw.slice(raw.indexOf('=')+1).trim().replace(/;$/,''));
const files=[];
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())await walk(f);else if(/\.(webp|avif|png|jpe?g|svg|woff2?)$/i.test(e.name))files.push(f);}}
await walk(path.join(source,'assets'));
console.log(`Import plan: ${files.length} media/font files, ${data.events.length} events, ${data.speakers.length} speakers, six pages.`);
if(dry){console.log('Dry run: no network requests or writes.');process.exit(0);}
if(!url||!key)throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. No credentials were printed.');
if(process.env.DATABASE_URL){
 const {Client}=await import('pg');const db=new Client({connectionString:process.env.DATABASE_URL});
 await db.connect();try{await db.query(await fs.readFile('supabase/schema.sql','utf8'));}finally{await db.end();}
}
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
for(const table of ['events','speakers','site_pages','site_settings']){
 const {error}=await client.from(table).select('*',{head:true,count:'exact'});
 if(error)throw new Error(`Cannot access ${table}. Run supabase/schema.sql first (or supply DATABASE_URL).`);
}
const {data:buckets,error:be}=await client.storage.listBuckets();if(be)throw new Error('Cannot inspect storage buckets. Check the private service key.');
if(!buckets.some(b=>b.id===bucket)){const {error}=await client.storage.createBucket(bucket,{public:true,fileSizeLimit:26214400});if(error)throw new Error('Cannot create the media bucket.');}
else{const {error}=await client.storage.updateBucket(bucket,{public:true,fileSizeLimit:26214400});if(error)throw new Error('Cannot configure the dedicated media bucket.');}
const mime={webp:'image/webp',avif:'image/avif',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',svg:'image/svg+xml',woff:'font/woff',woff2:'font/woff2'};
let cursor=0,uploaded=0;
await Promise.all(Array.from({length:4},async()=>{while(cursor<files.length){const file=files[cursor++];const name=path.relative(source,file).split(path.sep).join('/');const {error}=await client.storage.from(bucket).upload(name,await fs.readFile(file),{upsert:true,contentType:mime[file.split('.').pop().toLowerCase()],cacheControl:'3600'});if(error)throw new Error(`Media upload failed for ${name}.`);uploaded++;}}));
async function upsert(table,rows){if(!rows.length)return;const {error}=await client.from(table).upsert(rows);if(error)throw new Error(`Import failed for ${table}. Check schema and service-key permissions.`);}
// Public rows retain stable local media paths. Builds map them to the configured bucket.
await upsert('events',data.events.map((e,i)=>({id:e.id,title:e.title,description:e.description||'',image:e.image,venue:e.venue||'',category:e.category||'event',date:e.date,end_date:e.endDate,photos:e.photos||[],speakers:e.speakers||[],published:true,sort_order:i})));
await upsert('speakers',data.speakers.map((s,i)=>({id:createHash('sha256').update(`${i}:${s.name}`).digest('hex').slice(0,24),name:s.name,role:s.role||'',image:s.image,linkedin:s.linkedin,published:true,sort_order:i})));
for(const route of ['','events','speakers','gallery','ourstory','contact']){
 const html=await fs.readFile(path.join(source,route,'index.html'),'utf8');
 await upsert('site_pages',[{id:route||'home',title:html.match(/<title>(.*?)<\/title>/s)?.[1]||route,html,published:true}]);
}
await upsert('site_settings',[{key:'homeEvents',value:data.homeEvents,published:true}]);
console.log(`Imported ${uploaded} files and all content. Existing rows with the same IDs were updated; unrelated rows were retained.`);
