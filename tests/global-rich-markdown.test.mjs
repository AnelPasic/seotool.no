import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import YAML from 'yaml';
import {hasRichMarkdown,renderSafeMarkdown} from '../src/lib/rich-markdown.ts';
import {sharedContentSchema} from '../src/page-builder.ts';
const raw=(url)=>readFileSync(new URL(url,import.meta.url),'utf8');

test('Pages CMS rich text applies ONLY to reusable globals, not local or protected fields',()=>{
 const cfg=YAML.parse(raw('../.pages.yml'));
 const group=cfg.content.find(x=>x.name==='globalContentGroup');
 const shared=group.items.find(x=>x.name==='sharedContent');
 const body=shared.fields.find(x=>x.name==='body'),items=shared.fields.find(x=>x.name==='items');
 assert.equal(body.component,'globalMarkdownBody');
 assert.equal(items.component,'globalMarkdownItems');
 assert.equal(cfg.components.globalMarkdownBody.type,'rich-text');
 assert.equal(cfg.components.globalMarkdownBody.options.format,'markdown');
 assert.equal(cfg.components.globalMarkdownBody.options.media,false);
 const fields=cfg.components.globalMarkdownItems.fields;
 assert.equal(fields.find(x=>x.name==='text').type,'rich-text');
 assert.equal(fields.find(x=>x.name==='text').options.media,false);
 assert.equal(cfg.components.richBody.type,'text','Local sections keep their old editor');
 assert.equal(cfg.components.richItems.fields.find(x=>x.name==='text').type,'text','Local items keep old editor');
 assert.equal(group.items.find(x=>x.name==='builderGlobalMasters').fields.find(x=>x.name==='pricing')?.component,'builderProtectedMaster');
});
test('legacy shared content and 3 independent columns keep original schema/data',()=>{
 const json=raw('../src/content/global-content/felles-eksempel.json');
 const parsed=JSON.parse(json),before=structuredClone(parsed);
 assert.equal(sharedContentSchema.safeParse(parsed).success,true);
 assert.deepEqual(parsed,before);
 const source=sharedContentSchema.parse({...parsed,body:['## Første','- Andre','**Tredje**'],layout:'three-columns'});
 assert.equal(source.body.length,3);
 assert.equal(source.layout,'three-columns');
 assert.deepEqual(source.body,['## Første','- Andre','**Tredje**']);
 const html=source.body.map(renderSafeMarkdown);
 assert.equal(html.length,3);
 assert.match(html[0],/<h2>Første<\/h2>/);
 assert.match(html[1],/<ul>/);
 assert.match(html[2],/<strong>/);
});
test('safe rich text emits semantic h2-h6, ordered lists, emphasis and links',()=>{
 for(let h=2;h<=6;h++)assert.equal(renderSafeMarkdown('#'.repeat(h)+' Tittel'),'<h'+h+'>Tittel</h'+h+'>');
 assert.match(renderSafeMarkdown('1. En\n2. To'),/<ol><li>En<\/li><li>To<\/li><\/ol>/);
 assert.match(renderSafeMarkdown('**Fet** og _kursiv_'),/<strong>Fet<\/strong> og <em>kursiv<\/em>/);
 assert.match(renderSafeMarkdown('[Besøk](/kontakt/)'),/<a href="\/kontakt\/">Besøk<\/a>/);
 assert.equal(hasRichMarkdown('Vanlig tekst\nmed linjeskift'),false);
 assert.throws(()=>renderSafeMarkdown('# Hovedoverskrift'),/H1/);
});
test('raw HTML escaped and javascript/data/credential links cannot become active',()=>{
 for(const input of ['- <img src=x onerror=alert(1)>','## <script>test</script>','[click](javascript:alert(1))','[click](data:text/html,a)','[click](//danger.test)','[click](https://user:secret@example.com)']){
  const rendered=renderSafeMarkdown(input);
  assert.doesNotMatch(rendered,/<script\b|<img\b|<a href="(?:javascript|data|\/\/)/i);
  if(input.includes('[click]'))assert.doesNotMatch(rendered,/<a href=/);
 }
});
test('shared section renderers preserve safe Markdown and independent paragraph layouts',()=>{
 for(const file of ['OsloHomeSection','OsloContentSection']){
  const component=raw('../src/components/'+file+'.astro');
  assert.match(component,/hasRichMarkdown\(text\)/);
  assert.match(component,/<RichMarkdown text=\{text\}/);
  assert.match(component,/paragraphLayoutAttribute\(section/);
  assert.match(component,/contentLayoutAttribute\(section.layout/);
 }
 const card=raw('../src/components/ContentCard.astro');
 assert.match(card,/hasRichMarkdown\(text\)/);assert.match(card,/<RichMarkdown text=\{text\}/);
});
