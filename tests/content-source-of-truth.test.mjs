import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import YAML from 'yaml';
import {builderPageSchema,sharedContentSchema,validateSharedContentEntries} from '../src/page-builder.ts';

const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');
const json=(p)=>JSON.parse(read(p));
const cms=YAML.parse(read('../.pages.yml'));
const byName=(arr,name)=>arr.find(x=>x.name===name);

test('CONTENT-01: one native source for each editable family; fixed masters do not masquerade as shared sections',()=>{
 const ui=byName(cms.content,'globalUi');
 assert.deepEqual(ui.items.map(x=>x.name),['siteHeader','siteAppearance','siteFooter']);
 assert.deepEqual(ui.items.map(x=>x.path),[
  'src/content/site-chrome/header.json',
  'src/content/site-chrome/appearance.json',
  'src/content/site-chrome/footer.json'
 ]);
 assert.equal(byName(cms.content,'contentTone').path,'coordination/CONTENT-TONE.json');
 const globals=byName(cms.content,'globalContentGroup');
 const shared=byName(globals.items,'sharedContent');
 const fixed=byName(globals.items,'builderGlobalMasters');
 assert.equal(shared.type,'collection');
 assert.equal(shared.path,'src/content/global-content');
 assert.equal(shared.operations.rename,false);
 assert.equal(shared.operations.delete,false);
 assert.equal(fixed.type,'file');
 assert.equal(fixed.path,'src/content/global-masters.json');
 const masters=json('../src/content/global-masters.json');
 assert.deepEqual(Object.keys(masters).sort(),['faq','services','process','benefits','pricing','proof','contact','calculator'].sort());
 for(const name of ['pricing','proof','contact','calculator']){
   assert.equal(masters[name].type,'protected');
   assert.equal(masters[name].publicationApproved,false);
 }
});

test('CONTENT-01: real neutral Home, Tjeneste and Artikkel use local page ownership and typed references',()=>{
 const home=json('../src/content/pages/home.json');
 const service=json('../src/content/pages/tjeneste.json');
 const article=json('../src/content/pages/managed-articles/innsikt-artikkel.json');
 for(const [page,kind] of [[home,'home'],[service,'service'],[article,'article']]){
   assert.equal(page.kind,kind);
   assert.equal(typeof page.seo.title,'string');
   assert.equal(typeof page.hero.title,'string');
   assert.ok(Array.isArray(page.sections));
   assert.ok(Array.isArray(page.faq));
   assert.equal(builderPageSchema.safeParse(page).success,true,kind);
 }
 for(const page of [home,service])assert.ok(page.sections.some(s=>s._block==='sharedContent'&&s.entry==='felles-eksempel'));
 assert.ok(home.sections.some(s=>s._block==='global'&&s.element==='process'));
 assert.ok(home.sections.some(s=>s._block==='global'&&s.element==='faq'));
 assert.equal(article.sections.some(s=>s._block==='sharedContent'||s._block==='global'),false);
 for(const page of [home,service,article])assert.equal(Object.hasOwn(page,'globalMasters'),false);
 assert.equal(Object.hasOwn(home,'header'),false);
 assert.equal(Object.hasOwn(home,'footer'),false);
 const content=json('../src/content/global-content/felles-eksempel.json');
 assert.equal(sharedContentSchema.safeParse(content).success,true);
 assert.deepEqual(Object.keys(validateSharedContentEntries({'felles-eksempel.json':content})),['felles-eksempel']);
});

test('CONTENT-01: utility price page and protected commercial price master have separate roles',()=>{
 const page=json('../src/content/pages/priser.json');
 const masters=json('../src/content/global-masters.json');
 assert.ok(page.hero&&page.seo);
 assert.equal(page.slug,'priser');
 assert.equal(builderPageSchema.safeParse(page).success,true);
 assert.equal(masters.pricing.type,'protected');
 assert.equal(masters.pricing.publicationApproved,false);
 assert.equal(Object.hasOwn(page,'publicationApproved'),false);
});
