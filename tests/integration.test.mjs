import test from 'node:test';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import YAML from 'yaml';
import { builderPageSchema, pageListSchema, publicPath, resolvePageList, resolveSections, validateSharedContentEntries } from '../src/page-builder.ts';
import { resolveHeroProof } from '../src/lib/hero-proof.ts';
import { composeSiteChrome } from '../src/lib/site-chrome-content.ts';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = p => readFileSync(join(root,p),'utf8');
const json = p => JSON.parse(read(p));
const dir = 'src/content/pages';
const filenames = [
 ...readdirSync(join(root,dir)).filter(x=>x.endsWith('.json')),
 ...readdirSync(join(root,dir,'managed-articles')).filter(x=>x.endsWith('.json')).map(x=>'managed-articles/'+x),
];
const pages = filenames.map(x => builderPageSchema.parse(json(dir+'/'+x)));
const masters = json('src/content/global-masters.json');
const shared=validateSharedContentEntries(Object.fromEntries(readdirSync(join(root,'src/content/global-content')).filter(f=>f.endsWith('.json')).map(f=>[f,json('src/content/global-content/'+f)])));
const home=pages.find(p=>p.slug==='home'),service=pages.find(p=>p.slug==='tjeneste');
const chrome = composeSiteChrome(json('src/content/site-chrome/header.json'),json('src/content/site-chrome/footer.json'),json('src/content/site-chrome/appearance.json'));
test('one canonical page per actual route, no missing component', () => {
  assert.equal(new Set(pages.map(p=>publicPath(p.slug))).size,pages.length);
  assert.ok(pages.length >= 7, 'Starter includes base routes');
  assert.equal(pages.find(p=>p.slug==='home')?.kind,'home');
  assert.equal(pages.find(p=>p.slug==='404')?.kind,'utility');
  for(const path of ['src/components/BaseLayout.astro','src/components/PageView.astro','src/components/Hero.astro','src/components/SiteChromeHeader.astro','src/components/PageSections.astro']) assert.ok(existsSync(join(root,path)),path);
});
test('native CMS exposes the one shared editorial hierarchy across all pages', () => {
  const source = read('.pages.yml');
  const parsed = YAML.parseDocument(source,{uniqueKeys:true});
  assert.equal(parsed.errors.length,0,parsed.errors.map(e=>e.message).join('\n'));
  const cms=parsed.toJS();
  const names=cms.content.map(x=>x.name);
  assert.deepEqual(names.slice(0,3),['globalUi','globalContentGroup','contentTone']);
  assert.equal(cms.content[1].items[0].type,'collection');
  assert.equal(cms.content[1].items[0].name,'sharedContent');
  assert.equal(cms.components.builderSharedPlacement.fields[0].type,'reference');
  const entries=cms.content.slice(3).filter(entry=>entry.type==='file');
  assert.equal(entries.length,7,'Seven fixed pages protected; services/articles use separate native collections');
  const articles=cms.content.find(x=>x.name==='insightGroup')?.items?.[0];
  assert.equal(articles?.name,'managedArticles');
  assert.equal(articles?.label,'Artikler');
  assert.deepEqual(articles?.operations,{create:true,rename:false,delete:true});
  const services=cms.content.find(x=>x.name==='serviceGroup')?.items?.[0];
  assert.equal(services?.label,'Alle tjenester');
  assert.equal(services?.path,'src/content/pages');
  assert.ok(!services.exclude.includes('tjeneste.json'));
  for(const entry of entries){
    assert.ok(existsSync(join(root,entry.path)),entry.path);
    assert.deepEqual(entry.fields.map(f=>f.name),['slug','seo','hero','sections','faq','listing','kind']);
    assert.equal(entry.fields[0].readonly,true);
    assert.equal(entry.fields[2].component,'standardPageHero');
    assert.equal(entry.fields[3].component,'builderSections');
  }
  assert.ok(cms.components.builderSections);
  assert.ok(cms.components.standardPageHero);
  assert.equal(cms.settings.content.merge,true);
});
test('PageList pages source retains legacy key but shows only services and products', () => {
  const cms=YAML.parse(read('.pages.yml'));
  const source=cms.components.builderSections.blocks.find(b=>b.name==='pageList').fields
    .find(f=>f.name==='pageList').fields.find(f=>f.name==='source');
  assert.equal(source.options.values.find(x=>x.name==='pages').label,'Tjenester og produkter');
  assert.deepEqual(source.options.values.map(x=>x.name),['articles','pages','cases']);
  const saved=JSON.parse(JSON.stringify({source:'pages',mode:'automatic',sort:'editorial',limit:12,layout:'cards',entries:[]}));
  assert.equal(pageListSchema.parse(saved).source,'pages');
  const product=builderPageSchema.parse({...service,slug:'produkter/produkt',listing:{...service.listing,title:'Produkt',order:1,visible:true}});
  const index=builderPageSchema.parse({...service,slug:'oversikt',kind:'index',listing:{...service.listing,visible:true,title:'Oversikt'}});
  const available=[...pages,product,index];
  const auto=resolvePageList(saved,available).map(x=>x.slug);
  assert.ok(!auto.includes('tjeneste'));
  assert.ok(auto.includes('produkter/produkt'));
  for(const excluded of ['home','innsikt/artikkel','oversikt','om','priser','kontakt','tjeneste','404'])assert.ok(!auto.includes(excluded),excluded);
  assert.deepEqual(resolvePageList({...saved,source:'articles'},available).map(x=>x.slug),['innsikt/artikkel']);
  assert.deepEqual(resolvePageList({...saved,mode:'manual',entries:[{_block:'page',slug:'innsikt/artikkel'},{_block:'page',slug:'oversikt'}]},available).map(x=>x.slug),['innsikt/artikkel','oversikt']);
});

test('neutral navigation routes exist and search/languages are not fake', () => {
  assert.equal(chrome.headerOptions.showSearch,true);
  assert.equal(chrome.headerOptions.showLanguageSwitch,false);
  const paths=new Set(pages.map(p=>publicPath(p.slug)));
  const all=[...chrome.navigation.flatMap(n=>[n.href,...(n.kind==='dropdown'?n.links.map(x=>x.href):n.kind==='mega'?n.columns.flatMap(c=>c.links.map(x=>x.href)):[])]),chrome.primaryCta?.href,...chrome.footer.groups.flatMap(g=>g.links.map(x=>x.href)),...chrome.footer.legalLinks.map(x=>x.href)];
  for(const path of all)if(path?.startsWith('/'))assert.ok(paths.has(path),'Broken demo route '+path);
});
test('no invented active offer, protected source or lead submission', () => {
  assert.match(read('src/components/BaseLayout.astro'),/noindex && <meta name="robots" content="noindex,nofollow"/);
  assert.ok(!existsSync(join(root,'src/pages/api/leads.ts')));
  for(const master of Object.values(masters))if(master.type==='protected')assert.equal(master.publicationApproved,false);
  for(const p of pages){
    if(p.hero.visual.kind==='image'){
      const asset=p.hero.visual.image.src.replace(/^\//,'');
      assert.ok(asset.startsWith('images/pages/'));
      assert.ok(existsSync(join(root,'public',asset)),asset);
    }
    assert.ok(resolveSections(p,masters,pages,[],shared).every(s=>s.type!=='global'||s.master.type!=='protected'));
  }
});
test('tone is default neutral and one CMS source', () => {
  assert.equal(json('coordination/CONTENT-TONE.json').defaultPreset,'balansert');
  const toneEditor=YAML.parse(read('.pages.yml')).content.find(e=>e.name==='contentTone');
  const presetFields=toneEditor.fields.filter(f=>['defaultPreset','heroPreset','servicePreset','explanationPreset','faqPreset'].includes(f.name));
  assert.equal(presetFields.length,5);
  for(const field of presetFields){
    assert.ok(field.options.values.some(v=>v.name==='spisspluskomisk'),field.name+' missing comic preset');
    assert.ok(field.options.values.some(v=>v.name==='spisspluskomiskplus'),field.name+' missing comic+ preset');
    assert.ok(field.options.values.some(v=>v.name==='spissplushysterisk'),field.name+' missing Hysterisk preset');
  }
  assert.match(read('coordination/AGENT-VOICE-INSTRUCTIONS.md'),/spissplushysterisk/);
  assert.equal((read('.pages.yml').match(/name: contentTone/g)||[]).length,1);
});

test('commercial sales-copy authoring contract is shipped and separate from tone',()=>{
  const agent=read('coordination/AGENT-VOICE-INSTRUCTIONS.md');
  const profile=read('coordination/CONTENT-VOICE-PROFILE.md');
  const h1=read('coordination/H1-LAB.md');
  assert.match(agent,/Commercial Value Gate/);
  assert.match(agent,/DIY/);
  assert.match(profile,/Commercial Value Gate/);
  assert.match(h1,/Commercial Value Gate/);
  assert.match(agent,/Hysterisk/);
});

test('native shared source reuses one JSON on two pages, local hide is independent',()=>{
  const h=resolveSections(home,masters,pages,[],shared),s=resolveSections(service,masters,pages,[],shared);
  const a=h.find(x=>x.type==='content'&&x.section.id==='felles-eksempel');
  const b=s.find(x=>x.type==='content'&&x.section.id==='felles-eksempel');
  assert.deepEqual(a?.section,b?.section);
  assert.equal(a.section.body.length,3);
  assert.equal(a.section.items.length,3);
  assert.equal(a.section.layout,'three-columns');
  const hidden={...service,sections:service.sections.map(x=>x._block==='sharedContent'?{...x,visibility:'hidden'}:x)};
  assert.ok(!resolveSections(hidden,masters,pages,[],shared).some(x=>x.type==='content'&&x.section.id==='felles-eksempel'));
  assert.ok(resolveSections(home,masters,pages,[],shared).some(x=>x.type==='content'&&x.section.id==='felles-eksempel'));
});
test('invalid, duplicate and colliding shared sources fail before publication',()=>{
  const source=json('src/content/global-content/felles-eksempel.json');
  assert.throws(()=>validateSharedContentEntries({'different.json':source}),/filename\/ID mismatch/);
  assert.throws(()=>validateSharedContentEntries({'priser.json':{...source,id:'priser'}}));
  assert.throws(()=>validateSharedContentEntries({'x.json':{...source,id:'x'},'y.json':{...source,id:'y'}}),/Duplicate shared content identity/);
  const missing={...home,sections:[...home.sections,{_block:'sharedContent',entry:'does-not-exist'}]};
  assert.throws(()=>resolveSections(missing,masters,pages,[],shared),/Missing shared source/);
  const twice={...home,sections:[...home.sections,{_block:'sharedContent',entry:'felles-eksempel',visibility:'hidden'}]};
  assert.throws(()=>resolveSections(twice,masters,pages,[],shared),/Duplicate shared placement/);
  const collision={...home,sections:[...home.sections,{_block:'content',id:'felles-eksempel',heading:'Collision',body:[]}]};
  assert.throws(()=>resolveSections(collision,masters,pages,[],shared),/Duplicate rendered anchor/);
});
test('featured Hero proof cannot bypass shared approval, named permission or evidence',()=>{
  const featured={...home.hero,visual:{kind:'image',image:{src:'/images/pages/example.webp',alt:'Example',positionX:50,positionY:50}},featuredProofCaseId:'documented'};
  const data={id:'documented',displayName:'Example',metric:'Verified',context:'Example',publicationApproved:true,namePermission:true,evidenceVerified:true};
  assert.throws(()=>resolveHeroProof(featured,masters,[data]),/approved proof slot/);
  const approved={...masters,proof:{type:'protected',renderKey:'proof',publicationApproved:true}};
  assert.deepEqual(resolveHeroProof(featured,approved,[data]),data);
  assert.throws(()=>resolveHeroProof(featured,approved,[{...data,evidenceVerified:false}]),/evidence/);
  assert.throws(()=>resolveHeroProof({...featured,visual:{kind:'none'}},approved,[data]),/visible image/);
});
test('single CMS section fields retain local/global rich shape, independent paragraph/card grid',()=>{
 const cms=YAML.parse(read('.pages.yml'));
 const r=cms.components;
 const local=r.builderRichLocal.fields.map(x=>x.name);
 const sharedFields=cms.content[1].items[0].fields.map(x=>x.name);
 for(const field of ['heading','body','items','links','layout','surface','headingAlign'])assert.ok(local.includes(field)&&sharedFields.includes(field),field);
 assert.ok(r.builderSections.blocks.some(x=>x.name==='sharedContent'&&x.component==='builderSharedPlacement'));
 assert.match(read('src/components/OsloHomeSection.astro'),/paragraphLayoutAttribute\(section/);
 assert.match(read('src/styles/shared.css'),/data-content-layout="three-columns"/);
});


test('MWS-024: native Pagefind is provisioned on every build even while CMS search is off',()=>{
 const pkg=json('package.json');
 assert.equal(pkg.devDependencies.pagefind,'1.5.2');
 assert.equal(pkg.scripts.build,'astro build && npm run search:index');
 assert.equal(pkg.scripts['search:index'],'pagefind --site dist && node scripts/verify-pagefind.mjs');
 assert.deepEqual(chrome.search,{label:'Søk på nettstedet',mode:'pagefind'});
 assert.equal(typeof chrome.headerOptions.showSearch,'boolean','visibility stays client-controlled');
 const base=read('src/components/BaseLayout.astro');
 assert.match(base,/data-pagefind-body=\{noindex \? undefined : ''\}/);
 assert.match(base,/SiteChromeSearchHead/);
 assert.match(read('src/components/SiteChromeSearchHead.astro'),/pagefind-component-ui\.js/);
 assert.match(read('src/components/SiteChromeSearchHead.astro'),/pagefind-component-ui\.css/);
 assert.match(read('src/components/SiteChromeHeader.astro'),/SiteChromeSearch/);
 assert.equal((base.match(/<pagefind-modal /g)||[]).length,1);
 assert.doesNotMatch(read('public/_headers'),/^\/\*\s*\n\s*X-Robots-Tag:/m);
 const cms=YAML.parse(read('.pages.yml'));
 const header=cms.content.find(x=>x.name==='globalUi').items.find(x=>x.name==='siteHeader');
 assert.ok(header.fields.find(x=>x.name==='headerOptions').fields.some(x=>x.name==='showSearch'));
});

test('MWS #33: full starter theme parser accepts known newline-separated tokens for both modes', async () => {
 const {parseDaisyTheme,themeOverridesCss,chromeThemeSchema}=await import('../src/lib/site-chrome-theme.ts');
 const {themes}=json('src/content/site-chrome/appearance.json');
 const from='--radius-field: 0.5rem;\n  --radius-box: 1rem;';
 const broken='--radius-field: 0.5rem\n  --radius-box: 1.25rem;';
 const fixed='--radius-field: 0.5rem;\n  --radius-box: 1.25rem;';
 for(const mode of ['light','dark'])themes[mode+'Css']=themes[mode+'Css'].replace(/--radius-field:\s*[^;]+;/,'--radius-field: 0.5rem;').replace(/--radius-box:\s*[^;]+;/,'--radius-box: 1rem;');
 assert.ok(themes.lightCss.includes(from)&&themes.darkCss.includes(from));
 const brokenThemes={...themes,lightCss:themes.lightCss.replace(from,broken),darkCss:themes.darkCss.replace(from,broken)};
 const fixedThemes={...themes,lightCss:themes.lightCss.replace(from,fixed),darkCss:themes.darkCss.replace(from,fixed)};
 assert.equal(chromeThemeSchema.safeParse(brokenThemes).success,true);
 assert.equal(themeOverridesCss(brokenThemes),themeOverridesCss(fixedThemes));
 for(const mode of ['light','dark']){
  const parsed=parseDaisyTheme(brokenThemes[mode+'Css'],mode);
  assert.equal(parsed.variables['--radius-field'],'0.5rem');
  assert.equal(parsed.variables['--radius-box'],'1.25rem');
 }
 assert.throws(()=>parseDaisyTheme(brokenThemes.lightCss.replace('--radius-box: 1.25rem;','--radius-box: var(--bad);'),'light'));
});

test('Cloudflare Git preview foundation leaves indexing to provider controls',()=>{
 const headers=read('public/_headers');
 assert.doesNotMatch(headers,/^\/\*\s*\n\s*X-Robots-Tag:/m);
 assert.equal(read('.node-version').trim(),'24.12.0');
 assert.match(read('astro.config.mjs'),/process\.env\.CF_PAGES_URL/);
 const instructions=read('PREVIEW-DEPLOY.md');
 const agents=read('AGENTS.md');
 const target=read('coordination/PREVIEW-TARGET.md');
 assert.match(instructions,/Connect to Git/);
 assert.match(instructions,/Mandatory read-only discovery/);
 assert.match(instructions,/Existing Cloudflare Workers target/);
 assert.match(instructions,/No existing verified preview/);
 assert.match(instructions,/Workers Builds Git integration/);
 assert.match(instructions,/GitHub Actions \+ Wrangler deploy/);
 assert.match(instructions,/npx wrangler versions upload/);
 assert.match(instructions,/CF_PAGES_URL/);
 assert.match(instructions,/do not assume/);
 assert.match(instructions,/one/i);
 assert.match(instructions,/CMS round-trip/);
 assert.match(instructions,/create Pages or migrate the Worker/i);
 assert.match(instructions,/not access control/);
 assert.match(agents,/DISCOVER → REUSE → PROVISION ONCE/);
 assert.match(agents,/never add parallel Pages/i);
 assert.match(target,/Status:\*\* UNVERIFIED/);
 assert.match(target,/Primary preview URL: UNKNOWN/);
 assert.doesNotMatch(agents,/configure \*\*Cloudflare Pages Git integration\*\* for automatic/);
 const headerCss=read('src/styles/header-navigation.css');
 assert.match(headerCss,/\.site-shell \.site-header\.site-header--sticky\s*\{\s*position:\s*sticky;\s*top:\s*0;/);
 assert.doesNotMatch(headerCss,/--mws-chrome-sticky-gap|margin:\s*var\(--mws-chrome-sticky-gap\)/);
 assert.match(read('src/styles/shared.css'),/\.site-shell \.site-header \{ background: var\(--color-base-200\); \}/);
});
