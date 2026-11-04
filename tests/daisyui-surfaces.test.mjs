import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import YAML from 'yaml';
import {sectionSchema,sharedContentSchema,builderPageSchema} from '../src/page-builder.ts';
import {surfaceClasses} from '../src/lib/surface-classes.ts';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const semantic=["base-100","base-200","base-300","primary","secondary","accent","neutral","info","success","warning","error"];
const legacy=["base","soft","mint","lavender","dark"];
test('shared Pages CMS picker accepts semantic daisyUI backgrounds and legacy values',()=>{
 const yml=YAML.parseDocument(read('.pages.yml'),{uniqueKeys:true});assert.equal(yml.errors.length,0);
 const c=yml.toJS();const surface=c.components.richSurface;
 const values=surface.options.values.map(x=>x.name);
 assert.deepEqual(values,['default',...semantic]);
 const a=c.components.builderRichLocal.fields.find(x=>x.name==='surface'),b=c.components.richItems.fields.find(x=>x.name==='surface');
 assert.equal(a.component,'richSurface');assert.equal(b.component,'richSurface');
 for(const name of values){
  const card={title:'Tittel',text:'Tekst',surface:name};
  const section={_block:'content',id:'section-one',heading:'Innhold',surface:name,items:[card]};
  const shared={...section,uid:'4118f3ce-9df1-4c62-90bc-11c41cedfc48',name:'Innhold'};
  assert.equal(sectionSchema.parse(section).surface,name);
  assert.equal(sharedContentSchema.parse(shared).items[0].surface,name);
  const tokens=surfaceClasses(name);
  if(name==='default')assert.equal(tokens,'','Standard must inherit without painting any background');
  else {assert.match(tokens,/\bbg-/);assert.match(tokens,/\btext-/);}
 }
 for(const bad of [...legacy,'mint-green','#fff','base-500'])assert.equal(sectionSchema.safeParse({_block:'content',id:'test',heading:'Test',surface:bad}).success,false,bad);
 assert.equal(surfaceClasses('secondary'),'bg-secondary text-secondary-content');
 for(const path of ['src/content/global-content/felles-eksempel.json','src/content/pages/tjeneste.json']){
  const contents=JSON.parse(read(path));
  const json=JSON.stringify(contents);
  assert.doesNotMatch(json,/"surface":"(?:base|soft|mint|lavender|dark)"/);
  const input=path.includes('felles')?sharedContentSchema.safeParse(contents):builderPageSchema.safeParse(contents);
  assert.ok(input.success,path+': '+(input.success?'':JSON.stringify(input.error.issues)));
 }
 const content=read('src/components/RichContentSection.astro');
 assert.doesNotMatch(content,/data-surface="(?:soft|mint|lavender|dark)"/);
 assert.match(read('src/components/OsloHomeSection.astro'),/surfaceAttribute\(section.surface/,'Default section surface is resolved by the shared helper');
});
test('full-bleed ordinary sections own one constrained shell',()=>{
 const view=read('src/components/PageView.astro');
 const section=read('src/components/OsloHomeSection.astro');
 const article=read('src/components/OsloContentSection.astro');
 assert.doesNotMatch(view,/<div class="(?:mws-main-shell|shell)"/);
 for(const source of [section,article]){
  assert.ok(source.indexOf('<div class="shell">')>source.indexOf('<section id='));
  assert.match(source,/class="body-copy" data-content-layout=/);
 }
 assert.ok(read('src/components/PageSections.astro').includes('<PageList id={item.section.id} heading={item.section.heading}'));
 assert.ok(read('src/components/Faq.astro').includes('<div class="shell faq-grid">'));
});
