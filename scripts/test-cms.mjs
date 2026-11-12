import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'gdg-cms-'));
const routes=['home','events','speakers','gallery','ourstory','contact'];
const page=id=>`<!doctype html><html><head></head><body><main>${id==='speakers'?'<div><article>old</article></div>':id==='gallery'?'<div><button data-album-id="old">old</button></div>':'<p>CMS text</p>'}</main></body></html>`;
await fs.mkdir(path.join(temp,'site/assets'),{recursive:true});
for(const id of routes){const dir=path.join(temp,'site',id==='home'?'':id);await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'index.html'),page(id));}
let omit=false;
const records={site_pages:routes.map(id=>({id,html:page(id),published:true})),events:[{id:'fixture',title:'CMS fixture event',description:'',photos:['/assets/fixture.webp'],speakers:[],date:'2026-01-01',published:true,sort_order:0}],speakers:[{id:'fixture',name:'CMS fixture speaker',role:'Fixture only',image:'/assets/fixture.webp',published:true,sort_order:0}],site_settings:[{key:'homeEvents',value:[{title:'Fixture carousel',image:'/assets/fixture.webp'}],published:true}]};
const server=http.createServer((req,res)=>{assert.ok(req.url.includes('published=eq.true'));const table=new URL(req.url,'http://localhost').pathname.split('/').pop();res.setHeader('Content-Type','application/json');res.end(JSON.stringify(omit&&table==='site_pages'?[]:records[table]||[]));});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const run=()=>new Promise(resolve=>{const child=spawn(process.execPath,[path.resolve('scripts/prepare-site.mjs')],{cwd:temp,env:{...process.env,SUPABASE_URL:`http://127.0.0.1:${server.address().port}`,SUPABASE_PUBLISHABLE_KEY:'fixture-only'}});let log='';child.stdout.on('data',d=>log+=d);child.stderr.on('data',d=>log+=d);child.on('close',code=>resolve({code,log}));});
try{let result=await run();assert.equal(result.code,0,result.log);assert.match(await fs.readFile(path.join(temp,'dist/speakers/index.html'),'utf8'),/CMS fixture speaker/);assert.match(await fs.readFile(path.join(temp,'dist/gallery/index.html'),'utf8'),/CMS fixture event/);assert.match(await fs.readFile(path.join(temp,'dist/assets/data.js'),'utf8'),/storage\/v1\/object\/public/);omit=true;result=await run();assert.notEqual(result.code,0);assert.match(result.log,/six core CMS pages/);console.log('CMS integration: published reads, directory rendering, storage mapping, and missing-page failure passed (mock API; no live credentials used).');}finally{server.close();await fs.rm(temp,{recursive:true,force:true});}
