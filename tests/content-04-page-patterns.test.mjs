import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { builderPageSchema, resolveSections } from '../src/page-builder.ts';

const read=(p)=>JSON.parse(readFileSync(new URL(p, import.meta.url),'utf8'));
const home=read('../src/content/pages/home.json');
const service=read('../src/content/pages/tjeneste.json');
const article=read('../src/content/pages/managed-articles/innsikt-artikkel.json');
const masters=read('../src/content/global-masters.json');
const shared={'felles-eksempel':read('../src/content/global-content/felles-eksempel.json')};

test('CONTENT-04: actual neutral Home/Service/Article retain their own SEO, Hero, distinct purpose and safe schemas',()=>{
 for(const [page,kind] of [[home,'home'],[service,'service'],[article,'article']]){
  assert.equal(page.kind,kind);
  assert.ok(page.seo.title?.trim()&&page.seo.description?.trim());
  assert.ok(page.hero.title?.trim()&&page.hero.support?.trim());
  assert.equal(page.hero.visual.kind,page===home?'image':'none');
  if(page===home)assert.equal(page.hero.visual.image.src,'/images/pages/hero-demo.svg');
  assert.ok(builderPageSchema.safeParse(page).success,kind);
 }
 assert.notEqual(home.hero.title,service.hero.title);
 assert.notEqual(service.hero.title,article.hero.title);
 assert.ok(home.sections.some(s=>s._block==='pageList'));
 assert.ok(service.sections.some(s=>s._block==='sharedContent'&&s.entry==='felles-eksempel'));
});

test('CONTENT-04: service supports an actual next step without activating a lead form',()=>{
 assert.equal(service.hero.primaryCta.href,'/kontakt/');
 assert.ok(service.sections.some(s=>s._block==='content'&&s.id==='innhold'));
 const next=service.sections.find(s=>s._block==='content'&&s.id==='neste-steg');
 assert.ok(next&&next.links.some(l=>l.href==='/kontakt/'));
 assert.ok(service.faq.length>0);
 assert.ok(resolveSections(service,masters,[home,service,article],[],shared).length>=3);
});

test('CONTENT-04: article has useful authored sections and contextual links without commercial/proof masters',()=>{
 const local=article.sections.filter(s=>s._block==='content');
 assert.ok(local.length>=3,'Starter article may not be an empty shell');
 assert.ok(local.every(s=>s.heading&&s.body.length));
 assert.ok(article.listing?.title&&article.listing.summary);
 assert.equal(article.sections.some(s=>s._block!=='content'),false);
 const hrefs=local.flatMap(s=>s.links??[]).map(l=>l.href);
 assert.ok(hrefs.includes('/tjeneste/'));
 assert.ok(hrefs.includes('/kontakt/'));
 const slugs=[home.slug,service.slug,article.slug,'priser','kontakt','om'];
 for(const href of hrefs)assert.ok(slugs.includes(href.replace(/^\//,'').replace(/\/$/,'')),href);
 assert.ok(resolveSections(article,masters,[home,service,article],[],shared).length>=3);
});

test('CONTENT-04: protected proof/pricing/contact stay disabled and are not faked to fill patterns',()=>{
 for(const key of ['proof','pricing','contact','calculator']){
  assert.equal(masters[key].type,'protected');
  assert.equal(masters[key].publicationApproved,false);
 }
 for(const p of [home,service,article])assert.equal(p.sections.some(s=>s._block==='global'&&['proof','pricing','contact','calculator'].includes(s.element)),false);
});
