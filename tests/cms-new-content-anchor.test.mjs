import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import YAML from 'yaml';
import {builderPageSchema,resolveSections} from '../src/page-builder.ts';

const root=new URL('../',import.meta.url);
const read=(path)=>readFileSync(new URL(path,root),'utf8');

test('stock Pages CMS ordinary content anchor is editable and required on every page',()=>{
 const doc=YAML.parseDocument(read('.pages.yml'),{uniqueKeys:true});
 assert.deepEqual(doc.errors,[]);
 const config=doc.toJS();
 const blocks=config.components.builderSections.blocks;
 const ordinary=blocks.find((b)=>b.name==='content');
 assert.equal(ordinary.component,'builderRichLocal');
 const id=config.components.builderRichLocal.fields.find((f)=>f.name==='id');
 assert.equal(id.required,true);
 assert.notEqual(id.readonly,true,'cannot require a readonly field with no generator');
 assert.notEqual(id.hidden,true);
 assert.match(id.description,/Unikt anker/);
 const pattern=new RegExp(id.pattern);
 for(const value of ['testing-links','om-oss','ny-seksjon'])assert.ok(pattern.test(value),value);
 for(const value of ['', 'TestingLinks','mellomrom i id','testing_links','-test','test-'])assert.equal(pattern.test(value),false,value);
 for(const entry of config.content.filter((e)=>e.type==='file'&&e.path?.startsWith('src/content/pages/'))){
  assert.equal(entry.fields.find((f)=>f.name==='sections').component,'builderSections',entry.path);
 }
});

test('new ordinary section saves, reopens and renders with an editable valid anchor',()=>{
 const original=JSON.parse(read('src/content/pages/om.json'));
 const sourceSections=structuredClone(original.sections);
 const added={_block:'content',id:'testing-links',heading:'TestingLinks',body:['Ny ordinær innholdsseksjon']};
 const edited=structuredClone(original);
 edited.sections.push(added);
 const reopened=JSON.parse(JSON.stringify(edited));
 assert.deepEqual(reopened.sections.slice(0,-1),sourceSections,'existing OWNER rows must be preserved');
 assert.deepEqual(reopened.sections.at(-1),added);
 const parsed=builderPageSchema.parse(reopened);
 assert.equal(parsed.sections.at(-1).id,'testing-links');
 const rendered=resolveSections(parsed,{},[parsed],[],{});
 assert.ok(rendered.some((s)=>s.type==='content'&&s.section.id==='testing-links'));
 assert.equal(builderPageSchema.safeParse({...edited,sections:[...sourceSections,{...added,id:''}]}).success,false);
 assert.equal(builderPageSchema.safeParse({...edited,sections:[...sourceSections,{...added,id:'invalid anchor'}]}).success,false);
 assert.equal(builderPageSchema.safeParse({...edited,sections:[...sourceSections,{...added,id:sourceSections[0].id}]}).success,false,'duplicate anchor must remain blocked');
});
