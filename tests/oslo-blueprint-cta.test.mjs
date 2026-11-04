import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import YAML from 'yaml';
import {sectionSchema,sharedContentSchema} from '../src/page-builder.ts';
import {surfaceClasses} from '../src/lib/surface-classes.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('MWS CTA is a native CMS presentation, not a site-specific color alias',()=>{
  const cms=YAML.parse(read('.pages.yml'));
  assert.deepEqual(cms.components.richPresentation.options.values.map(x=>x.name),['content','cta']);
  const local=cms.components.builderRichLocal.fields;
  const global=cms.content.find(x=>x.name==='globalContentGroup').items.find(x=>x.name==='sharedContent').fields;
  assert.equal(local.find(x=>x.name==='presentation').component,'richPresentation');
  assert.equal(global.find(x=>x.name==='presentation').component,'richPresentation');
  const sample={_block:'content',id:'kontroll',heading:'CTA',presentation:'cta',body:['Kort budskap'],links:[{label:'Les mer',href:'/kontakt/'}]};
  assert.equal(sectionSchema.parse(sample).presentation,'cta');
  assert.equal(sharedContentSchema.parse({...sample,uid:'11111111-2222-4333-8444-555555555555',name:'CTA'}).presentation,'cta');
  assert.equal(sectionSchema.parse({_block:'content',id:'tekst',heading:'Vanlig'}).presentation,undefined,'old JSON must stay untouched');
  assert.equal(sectionSchema.safeParse({...sample,presentation:'custom'}).success,false);
  assert.equal(surfaceClasses('info'),'bg-info text-info-content');
});

test('ordinary sections use the source UI adapter and native CTA surface',()=>{
 const router=read('src/components/RichContentSection.astro');
 const src=read('src/components/OsloHomeSection.astro');
 assert.match(router,/const cta=section.presentation==='cta'/);
 assert.match(router,/infoSurface=\{cta\}/);
 assert.match(src,/content-section section-space home-section-/);
 assert.match(src,/<div class="shell">/);
 assert.match(src,/<div class="section-heading" data-heading-align=/);
 assert.match(src,/class="body-copy" data-content-layout=/);
 assert.match(src,/section-items/);assert.match(src,/section-links/);
 assert.match(src,/bg-info text-info-content/);assert.match(src,/<ContentCard/);
 assert.match(src,/hasRichMarkdown/);
});

test('live form component uses identical Oslo assessment/form class roles without faking submissions',()=>{
  const wrapper=read('src/components/AssessmentSection.astro');
  assert.match(wrapper,/<section id=\{id\} class="assessment-section section-space bg-info text-info-content">/);
  assert.match(wrapper,/<div class="shell standalone-assessment-grid">/);
  assert.match(wrapper,/<div class="assessment-copy">/);
  assert.match(wrapper, /Astro\.slots\.has\('form'\)/);
  assert.match(wrapper, /<slot name="form"\s*\/>/);
  assert.ok(!wrapper.includes('data-medon-lead'),'form never invented by site shell');
});
