import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import YAML from 'yaml';
import {builderPageSchema,publicPath,resolvePageList} from '../src/page-builder.ts';
import {assertManagedPageSource,assertInternalTargets} from '../src/lib/managed-pages.ts';

const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const cms=YAML.parse(readFileSync(new URL('../.pages.yml',import.meta.url),'utf8'));
const old=[
 ...readdirSync(new URL('../src/content/pages/',import.meta.url)).filter(f=>f.endsWith('.json')),
 ...readdirSync(new URL('../src/content/pages/managed-articles/',import.meta.url)).filter(f=>f.endsWith('.json')).map(f=>'managed-articles/'+f),
].map(f=>json('../src/content/pages/'+f));

test('CONTENT-06: unified service menu and native article Add/Delete; fixed editors protected',()=>{
 const group=cms.content.find(x=>x.name==='serviceGroup');
 assert.equal(group.label,'Tjenester');
 assert.equal(group.type,'group');
 assert.deepEqual(group.items.map(x=>x.name),['services']);
 const service=group.items[0];
 assert.equal(service.label,'Alle tjenester');
 assert.equal(service.path,'src/content/pages');
 assert.equal(service.subfolders,false);
 assert.deepEqual(service.operations,{create:true,rename:false,delete:true});
 assert.deepEqual(service.filename,{template:'{fields.slug}.json',field:false});
 assert.deepEqual([...service.exclude].sort(),['404.json','home.json','kontakt.json','om.json','priser.json'].sort());
 assert.deepEqual(service.fields.map(f=>f.name),['slug','seo','hero','sections','faq','listing','kind']);
 assert.equal(service.fields[0].readonly,undefined);
 assert.equal(service.fields[0].required,true);
 assert.equal(service.fields.find(f=>f.name==='kind').default,'service');
 assert.equal(service.fields.find(f=>f.name==='kind').hidden,true);
 assert.equal(service.fields.find(f=>f.name==='hero').component,'standardPageHero');
 assert.equal(service.fields.find(f=>f.name==='sections').component,'builderSections');
 assert.ok(!cms.content.some(x=>x.name==='managedServices'||x.name==='starterTjeneste'));
 const insight=cms.content.find(x=>x.name==='insightGroup');
 assert.deepEqual(insight.items.map(x=>x.name),['managedArticles']);
 const article=insight.items[0];
 assert.equal(article.label,'Artikler');
 assert.ok(!cms.content.some(x=>x.name==='managedArticles'||x.name==='starterArtikkel'));
 assert.equal(article.path,'src/content/pages/managed-articles');
 assert.deepEqual(article.operations,{create:true,rename:false,delete:true});
 assert.equal(article.fields.find(f=>f.name==='kind').default,'article');
 const existing=cms.content.filter(x=>x.type==='file'&&x.path.startsWith('src/content/pages/'));
 assert.equal(existing.length,5);
 for(const x of existing)assert.equal(x.operations.delete,false,x.name);
 const original=json('../src/content/pages/tjeneste.json');
 assert.equal(original.kind,'service');
 assert.doesNotThrow(()=>assertManagedPageSource('src/content/pages/tjeneste.json',original));
});

test('CONTENT-06: synthetic create/read/page-list/delete roundtrip in isolated folders',()=>{
 const tmp=mkdtempSync(join(tmpdir(),'mws-page-lifecycle-'));
 try{
  for(const d of ['managed-articles'])mkdirSync(join(tmp,d));
  const entries=[
   {folder:'',file:'demo-service.json',page:{...json('../src/content/pages/tjeneste.json'),slug:'demo-service'}},
   {folder:'managed-articles',file:'innsikt-demo-guide.json',page:{...json('../src/content/pages/managed-articles/innsikt-artikkel.json'),slug:'innsikt/demo-guide'}}
  ];
  for(const e of entries){
   assert.equal(builderPageSchema.safeParse(e.page).success,true);
   const file=join(tmp,e.folder,e.file);writeFileSync(file,JSON.stringify(e.page));
   assertManagedPageSource('src/content/pages/'+(e.folder?e.folder+'/':'')+e.file,JSON.parse(readFileSync(file,'utf8')));
  }
  assert.equal(publicPath(entries[0].page.slug),'/demo-service/');
  assert.equal(publicPath(entries[1].page.slug),'/innsikt/demo-guide/');
  const available=[...old,...entries.map(e=>e.page)];
  assertInternalTargets(available,entries.map(e=>e.page));
  for(const [scope,slug] of [['pages','demo-service'],['articles','innsikt/demo-guide']]){
   const result=resolvePageList({source:scope,mode:'automatic',sort:'editorial',limit:12,layout:'cards',entries:[]},available);
   assert.ok(result.some(x=>x.slug===slug),slug);
  }
  entries.forEach(e=>rmSync(join(tmp,e.folder,e.file)));
  assert.equal(readdirSync(tmp).filter(x=>x.endsWith('.json')).length,0);
 }finally{rmSync(tmp,{recursive:true,force:true});}
});

test('CONTENT-06: root service security, pinned picker and link safety',()=>{
 const base=json('../src/content/pages/tjeneste.json');
 const page={...base,slug:'managed-demo'};
 const source='src/content/pages/managed-demo.json';
 assert.doesNotThrow(()=>assertManagedPageSource(source,page));
 assert.throws(()=>assertManagedPageSource(source,{...page,slug:'bad /name'}),/Invalid root service/);
 assert.throws(()=>assertManagedPageSource(source,{...page,slug:'another'}),/filename\/slug mismatch/);
 assert.throws(()=>assertManagedPageSource(source,{...page,slug:'home'}),/Invalid root service/);
 assert.throws(()=>assertManagedPageSource(source,{...page,slug:'kontakt'}),/Invalid root service/);
 assert.throws(()=>assertManagedPageSource(source,{...page,kind:'article'}),/Wrong root service kind/);
 // Existing nested compatibility stays intact for old customer source files.
 assert.doesNotThrow(()=>assertManagedPageSource('src/content/pages/managed-services/managed-demo.json',page));
 const tmp=mkdtempSync(join(tmpdir(),'mws-choice-stability-'));
 try{
  const folder=join(tmp,'pages');mkdirSync(folder);mkdirSync(join(folder,'managed-articles'));
  for(const name of ['404','home','kontakt','om','priser','tjeneste'])
   writeFileSync(join(folder,name+'.json'),readFileSync(new URL('../src/content/pages/'+name+'.json',import.meta.url),'utf8'));
  writeFileSync(join(folder,'managed-articles','innsikt-artikkel.json'),readFileSync(new URL('../src/content/pages/managed-articles/innsikt-artikkel.json',import.meta.url),'utf8'));
  writeFileSync(join(folder,'demo-service.json'),JSON.stringify({...base,slug:'demo-service'}));
  const config=join(tmp,'.pages.yml');writeFileSync(config,readFileSync(new URL('../.pages.yml',import.meta.url),'utf8'));
  const script=new URL('../scripts/sync-page-options.mjs',import.meta.url);
  execFileSync(process.execPath,[fileURLToPath(script),'--pages',folder,'--config',config,'--check'],{stdio:'pipe'});
 }finally{rmSync(tmp,{recursive:true,force:true});}
 const pages=[{slug:'home'},{slug:'kontakt'}];
 assert.doesNotThrow(()=>assertInternalTargets(pages,[{href:'/kontakt/'}]));
 assert.throws(()=>assertInternalTargets(pages,[{sections:[{links:[{href:'/deleted/'}]}]}]),/Broken internal link/);
 assert.doesNotThrow(()=>assertInternalTargets(pages,[{href:'https://example.org/'},{href:'/#assessment'}]));
});
