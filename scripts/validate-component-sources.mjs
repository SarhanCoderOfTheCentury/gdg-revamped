import fs from 'node:fs';
import {createHash} from 'node:crypto';

const manifest=JSON.parse(fs.readFileSync('docs/component-provenance.json','utf8'));
for(const file of manifest.files) {
  const actual=createHash('sha256').update(fs.readFileSync(file.path)).digest('hex');
  if(actual!==file.sha256) throw new Error(`Approved component source differs: ${file.path}`);
}
console.log(`Verified ${manifest.files.length} supplied component sources/assets against their original hashes.`);
