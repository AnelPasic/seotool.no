import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveHeroProof} from '../src/lib/hero-proof.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Hero delegates media and gated proof to the source components',()=>{
 const hero=read('src/components/Hero.astro'),media=read('src/components/HeroMedia.astro');
 for(const role of ["'commercial-hero'","'home-hero shell'","'service-hero shell'",'data-hero-family={family}','hero-content hero-frame w-full p-0 grid-cols-1','page-hero-copy','button btn btn-primary','centered-none'])assert.ok(hero.includes(role),role);
 for(const role of ['hero-visual','hero-photo','hero-proof','hero-proof-result','hero-proof-support'])assert.ok(media.includes(role),role);
 assert.match(read('src/components/PageView.astro'),/resolveHeroProof\(page.hero,masters,heroProofCases\)/);
 const caseRecord={id:'fiction',displayName:'Fiktiv',metric:'Test',context:'Test',publicationApproved:true,namePermission:true,evidenceVerified:true};
 const h={visual:{kind:'image'},featuredProofCaseId:'fiction'};
 const masters={proof:{type:'protected',renderKey:'proof',publicationApproved:true}};
 assert.equal(resolveHeroProof(h,masters,[caseRecord]),caseRecord);
 for(const field of ['publicationApproved','namePermission','evidenceVerified'])assert.throws(()=>resolveHeroProof(h,masters,[{...caseRecord,[field]:false}]));
 assert.throws(()=>resolveHeroProof(h,{proof:{...masters.proof,publicationApproved:false}},[caseRecord]));
 assert.doesNotMatch(hero+media,/Nysta|Helt Opplagt|Optimalisering Oslo|70%|500%/);
});
test('FAQ uses native disclosure and source-owned shared styles',()=>{
 const faq=read('src/components/Faq.astro');
 for(const role of ['faq-section section-space','shell faq-grid','faq-list','collapse collapse-plus','collapse-title','collapse-content'])assert.ok(faq.includes(role),role);
 assert.match(faq,/items.length > 0/);
 assert.match(read('src/components/PageSections.astro'),/<Faq id=\{item.section.id\} items=\{item.items\}/);
 assert.doesNotMatch(faq,/new Function\(|eval\(|onclick=/);
});
