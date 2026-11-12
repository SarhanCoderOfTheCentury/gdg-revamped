import fs from 'node:fs/promises';
import path from 'node:path';
import {createClient} from '@supabase/supabase-js';
import {load} from 'cheerio';
await fs.rm('dist',{recursive:true,force:true});await fs.cp('site','dist',{recursive:true});
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
if(Boolean(url)!==Boolean(key))throw new Error('Both SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be configured, or both omitted.');
if(url){
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const read=async(table)=>{const {data,error}=await client.from(table).select('*').eq('published',true);if(error)throw new Error(`CMS read failed for ${table}; fix configuration before deploying. Local fallback is only used when CMS is unconfigured.`);return data;};
 const [events,speakers,pages,settings]=await Promise.all(['events','speakers','site_pages','site_settings'].map(read));
 if(!['home','events','speakers','gallery','ourstory','contact'].every(id=>pages.some(p=>p.id===id)))throw new Error('All six core CMS pages must be published. Run cms:upload first; missing/unpublished core pages abort deployment.');
 const routes=new Set(['home','events','speakers','gallery','ourstory','contact']);
 for(const p of pages){if(!routes.has(p.id))continue;const dest=path.join('dist',p.id==='home'?'':p.id,'index.html');await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,p.html);}
 events.sort((a,b)=>a.sort_order-b.sort_order);speakers.sort((a,b)=>a.sort_order-b.sort_order);
 const homeEvents=settings.find(s=>s.key==='homeEvents')?.value;
 if(!Array.isArray(homeEvents)||!homeEvents.length)throw new Error('The published homeEvents setting must contain at least one carousel item. Restore it before deploying.');
 const data={events:events.map(e=>({...e,endDate:e.end_date})),speakers,homeEvents};
 await fs.writeFile('dist/assets/data.js',`window.SITE_DATA = ${JSON.stringify(data)};\n`);
 // Publish CMS speaker additions/removals into the real directory.
 const sp=load(await fs.readFile('dist/speakers/index.html','utf8'));
 const grid=sp('main article').first().parent();if(grid.length){grid.empty().addClass('cms-profile-grid');for(const s of speakers){const a=sp('<article class="cms-profile"><img loading="lazy" decoding="async"><h2></h2><p></p></article>');a.find('img').attr({src:s.image||'/assets/portrait-placeholder.svg',alt:s.name,width:'320',height:'280'});a.find('h2').text(s.name);a.find('p').text(s.role);if(s.linkedin&&/^https:\/\/(www\.)?linkedin\.com\//.test(s.linkedin))a.append(sp('<a target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>').attr('href',s.linkedin));grid.append(a);}}
 await fs.writeFile('dist/speakers/index.html',sp.html());
 const ga=load(await fs.readFile('dist/gallery/index.html','utf8'));const albumGrid=ga('button[data-album-id]').first().parent();
 if(albumGrid.length){albumGrid.empty().addClass('cms-profile-grid');for(const e of events.filter(e=>e.photos.length)){const b=ga('<button type="button" class="cms-profile"><img loading="lazy" decoding="async"><strong></strong><span></span></button>');b.attr({'data-album-id':e.id,'data-photo-index':'0','aria-label':`Open the ${e.title} album, ${e.photos.length} photos`});b.find('img').attr({src:e.image||e.photos[0],alt:e.title,width:'480',height:'320'});b.find('strong').text(e.title);b.find('span').text(`${e.photos.length} photos · View album →`);albumGrid.append(b);}}
 await fs.writeFile('dist/gallery/index.html',ga.html());
 // Serve uploaded content/media from the client's public Supabase bucket.
 const base=`${url.replace(/\/$/,'')}/storage/v1/object/public/${encodeURIComponent(process.env.SUPABASE_STORAGE_BUCKET||'gdg-assets')}`;
 const rewrite=s=>s.replace(/\/assets\/([A-Za-z0-9_.@() -]+\.(?:webp|avif|png|jpe?g|svg|woff2?))/g,(_,p)=>`${base}/assets/${encodeURIComponent(p)}`);
 async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else if(/\.(html|css|js)$/.test(e.name))await fs.writeFile(p,rewrite(await fs.readFile(p,'utf8')));}}
 await walk('dist');console.log(`Prepared CMS content: ${events.length} published events, ${speakers.length} speakers.`);
}else console.log('Supabase unconfigured: preparing the complete local content snapshot.');
// All keys here are deliberately public. Private service/database tokens never enter dist.
await fs.writeFile('dist/assets/site-config.js',`window.GDG_CONFIG = ${JSON.stringify({posthogKey:process.env.PUBLIC_POSTHOG_KEY||'',posthogHost:process.env.PUBLIC_POSTHOG_HOST||'https://us.i.posthog.com'})};\n`);
for(const route of ['','events','speakers','gallery','ourstory','contact']){
 const file=path.join('dist',route,'index.html');const $=load(await fs.readFile(file,'utf8'));
 $('script[src*="site-config.js"],script[src*="analytics-loader.js"]').remove();
 $('body').append('<script src="/assets/site-config.js" defer></script><script src="/assets/analytics-loader.js" defer></script>');
 $('head').append('<link rel="stylesheet" href="/assets/cms.css">');
 // Enforce the gallery CTA contrast, including CMS pages imported before this fix.
 $('#gallery a[href="/gallery"]').addClass('gallery-redirect-button').text('View Gallery').attr('aria-label','View photo gallery');
 await fs.writeFile(file,$.html());
}
