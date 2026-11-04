// Optional upstream-drift check. Pass a local Oslo app checkout; never fetch or mutate it.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const source=process.argv[2];
if(!source)throw new Error('Usage: node scripts/check-design-system-source.mjs PATH_TO_OSLO_APP');
const manifest=JSON.parse(readFileSync(new URL('../src/design-system/oslo-source.json',import.meta.url),'utf8'));
const changed=[];
for(const [path,hash] of Object.entries(manifest.files)){
 try {
  const bytes=readFileSync(resolve(source,path),'utf8').replaceAll('\r\n','\n');
  if(createHash('sha256').update(bytes).digest('hex')!==hash)changed.push(path);
 } catch {changed.push(path);}
}
assert.deepEqual(changed,[],`Oslo gallery changed since ${manifest.commit}; review new/missing specimens and update the port.`);
console.log(`Oslo gallery source matches ${manifest.commit} (${Object.keys(manifest.files).length} files).`);
