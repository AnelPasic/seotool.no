import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {pageListSchema} from '../src/page-builder.ts';
import YAML from 'yaml';

test('standard exporter includes all three internal galleries and neutral fixtures',()=>{
 const root=mkdtempSync(join(tmpdir(),'mws-gallery-'));
 try {
  const target=join(root,'site');
  execFileSync(process.execPath,[fileURLToPath(new URL('../scripts/create-site.mjs',import.meta.url)),'--target',target],{stdio:'pipe'});
  for(const route of ['design-system.astro','design-system/global-elements.astro','design-system/proof-list.astro'])
   assert.ok(existsSync(join(target,'src/pages',route)),route);
  const fixtures=readFileSync(join(target,'src/design-system/fixtures.ts'),'utf8');
  assert.doesNotMatch(fixtures,/nysta|eurotents|helt.opplagt|optimalisering\.oslo|@/i);
 } finally {rmSync(root,{recursive:true,force:true});}
});

test('PageList optional CMS columns preserve legacy data and reject non-column values',()=>{
 for(const columns of [undefined,null,''])assert.equal(pageListSchema.parse({columns}).columns,undefined);
 for(const columns of [1,2,3])assert.equal(pageListSchema.parse({columns}).columns,columns);
 for(const columns of [0,4,1.5,'3'])assert.equal(pageListSchema.safeParse({columns}).success,false);
 const cms=YAML.parse(readFileSync(new URL('../.pages.yml',import.meta.url),'utf8'));
 const fields=cms.components.builderSections.blocks.find(b=>b.name==='pageList').fields.find(f=>f.name==='pageList').fields;
 assert.equal(fields.find(f=>f.name==='columns').type,'number');
 assert.deepEqual(fields.find(f=>f.name==='columns').options,{min:1,max:3,step:1});
});
