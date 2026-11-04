import test from 'node:test';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import YAML from 'yaml';
import {sectionSchema,sharedContentSchema,builderPageSchema,validateSharedContentEntries} from '../src/page-builder.ts';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(join(root,p),'utf8');
const item=(href)=>({title:'Kort',text:'Uten lenke',...(href===undefined?{}:{href})});
const local=(href)=>({_block:'content',id:'nytt-kort',heading:'Test',items:[item(href)]});
const shared=(href)=>({_block:'content',uid:'d754b170-6ad1-4b8e-b836-898292eb36df',id:'nytt-kort',name:'Test',heading:'Test',items:[item(href)]});

test('Pages CMS optional card link accepts blank/whitespace and flags invalid values',()=>{
 const c=YAML.parseDocument(read('.pages.yml'),{uniqueKeys:true});
 assert.equal(c.errors.length,0);
 const cms=c.toJS();
 const f=cms.components.richItems.fields.find(x=>x.name==='href');
 assert.equal(f.required,undefined);
 const match=new RegExp(f.pattern);
 for(const value of ['', ' ', ' \t ', '/om/', '/priser/#vilkar'])assert.ok(match.test(value),JSON.stringify(value));
 for(const value of ['etablert','https://external.test','/ with spaces'])assert.equal(match.test(value),false,JSON.stringify(value));
 const required=cms.components.richLinks.fields.find(x=>x.name==='href');
 assert.equal(required.required,true);
 assert.equal(new RegExp(required.pattern).test(''),false,'required links still require paths');
});
test('local + global optional card links normalize empty values without adding hrefs',()=>{
 for(const href of [undefined,'',' ', '  \t ']){
   const p=sectionSchema.parse(local(href)),g=sharedContentSchema.parse(shared(href));
   assert.equal(p.items[0].href,undefined);
   assert.equal(g.items[0].href,undefined);
   assert.equal(p.items[0].href,undefined,'the renderer must not create a link');
   assert.equal(g.items[0].href,undefined,'the shared renderer must not create a link');
 }
 for(const href of ['/om/','/priser/#vilkar']){
   assert.equal(sectionSchema.parse(local(href)).items[0].href,href);
   assert.equal(sharedContentSchema.parse(shared(href)).items[0].href,href);
 }
 for(const href of ['etablert','https://external.test','//external.test','/ with spaces']){
   assert.equal(sectionSchema.safeParse(local(href)).success,false,href);
   assert.equal(sharedContentSchema.safeParse(shared(href)).success,false,href);
 }
});
test('preflight fails invalid generated card content on pages and shared JSON',()=>{
 const source=JSON.parse(read('src/content/pages/home.json'));
 for(const value of ['etablert','//external.test']){
  const candidate={...source,sections:[...source.sections,local(value)]};
  assert.equal(builderPageSchema.safeParse(candidate).success,false,'page '+value);
  assert.throws(()=>validateSharedContentEntries({'nytt-kort.json':shared(value)}),'global '+value);
 }
 const good={...source,sections:[...source.sections,local('')]};
 const parsed=builderPageSchema.parse(good);
 assert.equal(parsed.sections.at(-1).items[0].href,undefined);
 const global=validateSharedContentEntries({'nytt-kort.json':shared('')});
 assert.equal(global['nytt-kort'].items[0].href,undefined);
 const template=read('src/components/ContentCard.astro');
 assert.match(template,/\(href\|\|Astro\.slots\.has/,'optional link still guards the entire card action');
 assert.match(template,/href=\{href\}/,'card action retains the validated URL');
});
