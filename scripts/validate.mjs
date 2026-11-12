import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');
const problems = [];
const routes = ['', 'events', 'speakers', 'gallery', 'ourstory', 'contact'];
let referenceCount = 0;
const checkAsset = (url, context) => {
  if (!url?.startsWith('/') || url.startsWith('//')) return;
  referenceCount++;
  const clean = decodeURIComponent(url.split(/[?#]/)[0]);
  const candidate = path.join(root, clean);
  if (!fs.existsSync(candidate) && !fs.existsSync(path.join(candidate, 'index.html'))) problems.push(`${context}: missing ${clean}`);
};
for (const route of routes) {
  const filename = path.join(root, route, 'index.html');
  const source = fs.readFileSync(filename, 'utf8');
  for (const [,url] of source.matchAll(/(?:src|href)="([^"]+)"/g)) checkAsset(url, route || 'home');
  for (const [,url] of source.matchAll(/url\(["']?([^\)"']+)["']?\)/g)) checkAsset(url, route || 'home');
  if (/<script[^>]+src="https?:/i.test(source)) problems.push(`${route}: external runtime script`);
  if (source.includes('/_next/') || source.includes('posthog') || source.includes('self.__next_f')) problems.push(`${route}: original runtime reference`);
  if (!source.includes('id="main-content"')) problems.push(`${route}: missing skip link target`);
  if (!source.includes('id="mobile-menu"')) problems.push(`${route}: missing mobile navigation`);
  if (/<main[^>]*>[\s\S]*?<main[\s>]/.test(source)) problems.push(`${route}: nested main element`);
  const ids = [...source.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  if (new Set(ids).size !== ids.length) problems.push(`${route}: duplicate element IDs`);
}
for (const name of ['site.css','rebuild.css','typography.css','shell.css','home.css','remotion/components.css','remotion-integration.css']) {
  const css = fs.readFileSync(path.join(root,'assets',name),'utf8');
  for (const [,url] of css.matchAll(/url\(["']?([^\)"']+)["']?\)/g)) checkAsset(url,name);
}
const dataSource = fs.readFileSync(path.join(root,'assets/data.js'),'utf8');
const data = JSON.parse(dataSource.slice(dataSource.indexOf('=')+1).trim().replace(/;$/,''));
const mediaSource = fs.readFileSync(path.join(root,'assets/media.js'),'utf8');
const media = JSON.parse(mediaSource.slice(mediaSource.indexOf('=')+1).trim().replace(/;$/,''));
for (const [original, variants] of Object.entries(media)) {
  checkAsset(original,'original image');
  for (const size of ['thumb','small','medium']) if (variants[size]) checkAsset(variants[size],'responsive image');
}
let photoCount = 0;
for (const event of data.events) {
  if (event.image) checkAsset(event.image,'event image');
  for (const image of event.photos) { checkAsset(image,'album photo'); photoCount++; }
}
for (const speaker of data.speakers) if (speaker.image) checkAsset(speaker.image,'speaker image');
for (const event of data.homeEvents) {
  checkAsset(event.image,'carousel image');
  for (const image of event.photos) checkAsset(image,'carousel session');
}
const contact = fs.readFileSync(path.join(root,'contact/index.html'),'utf8');
if ((contact.match(/\srequired(?:[\s=>])/g)||[]).length !== 4) problems.push('contact: expected four required fields');
if (!Array.isArray(data.events) || !Array.isArray(data.speakers)) problems.push('Content arrays are missing');
if (problems.length) {
  for(const problem of problems) console.error(problem);
  process.exit(1);
}
console.log(`Validated ${routes.length} routes and ${referenceCount} local references. ${data.events.length} events, ${data.speakers.length} speakers, ${photoCount} album photos. No external runtime scripts or original backend references.`);
