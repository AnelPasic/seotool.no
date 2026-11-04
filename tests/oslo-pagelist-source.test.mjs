import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('#87 PageList: five layouts use canonical Oslo DOM, not extra MWS wrappers',()=>{
 const source=read('src/components/PageList.astro');
 const pageSections=read('src/components/PageSections.astro');
 for(const marker of [
  '<section id={id} class:list={[\'content-section section-space\'',
  '<div class="shell">','<div class="section-heading" data-heading-align="center">',
  '<div><h2>{heading}</h2></div>',
  '<div class="section-items"',
  '<ContentCard title={item.title} text={item.summary} surface="secondary"',
  'page-list-', 'data-count={items.length}',
  'listing-item min-w-0',
  'card card-border bg-base-100 h-full overflow-hidden',
  '<figure class="listing-media"><ListingVisual visual={item.displayVisual}/></figure>',
  'card-body min-w-0 flex-1 items-start gap-0',
  'card-title mb-4 text-2xl','card-actions mt-auto',
  'page-list-row','text-link','<Arrow diagonal />','presentationVisual(item,layout)',
  "layout === 'cards'", "layout === 'mediaCards' || layout === 'alternating'", "layout === 'links'"
 ]) assert.ok(source.includes(marker),'Missing Oslo PageList source contract '+marker);
 assert.doesNotMatch(source,/mws-list-|mws-list-entry|mws-list-media|p-\[var\(--list-gap\)\]/,'old MWS presentation removed');
 assert.match(pageSections, /<PageList id=\{item\.section\.id\} heading=\{item\.section\.heading\} items=\{item\.items\} layout=\{item\.section\.pageList\.layout\} columns=\{item\.section\.pageList\.columns\} \/>/);
 assert.doesNotMatch(pageSections,/<section id=\{item\.section\.id\} class="py-16 md:py-24"/,'do not wrap Oslo section in incompatible MWS section');
 assert.ok(read('src/components/PageView.astro').includes("'invite-home'"));
});

test('#87 PageList: exact Oslo media/alternating source CSS and responsive column cutoffs',()=>{
 const src=read('src/components/PageList.astro');
 const visual=read('src/components/ListingVisual.astro');
 for(const selector of [
  '.page-list-alternating .listing-item',
  '.page-list-alternating > li:nth-child(even) .listing-copy',
  '.page-list-mediaCards[data-count="2"]',
  '.page-list-mediaCards[data-count="1"]',
  '@media (min-width: 1101px)',
  '@media (max-width: 1100px)',
  '@media (max-width: 700px)',
  '.page-list-alternating .listing-item[data-visual-kind="icon"]'
 ])assert.ok(src.includes(selector),'Oslo CSS missing: '+selector);
 for(const role of [
  'class="listing-visual"',
  'data-kind={visual.kind}','aspect-ratio: 3 / 2',
  'border-radius: var(--radius-card-lg)','background: var(--color-base-300)',
  'clamp(64px, 8vw, 112px)'
 ])assert.ok(visual.includes(role),role);
 const icons=read('src/components/PackageFocusIcon.astro');
 for(const marker of ['M229.66,218.34l-50.07-50.06','M88,24V16a8,8','viewBox="0 0 256 256"'])
  assert.ok(icons.includes(marker),'Oslo Phosphor inline icon missing: '+marker);
 assert.ok(visual.includes('M240,56v64a8,8'),'Original Oslo trend path stays identical');
});

test('#87 PageList: Oslo shared composition is imported and all layouts remain CMS controlled',()=>{
 const css=read('src/styles/global.css'),foundation=read('src/styles/shared.css');
 const sections=read('src/styles/compositions/sections.css');
 const homeSection=read('src/components/OsloHomeSection.astro');
 assert.match(css,/@import "\.\/shared\.css" layer\(composition\);/);
 assert.ok(homeSection.includes("import '../styles/compositions/sections.css'"));
 for(const marker of ['.shell { width: min(1200px, calc(100% - 96px));','.section-space { padding-block: 90px; }','.section-items { display: grid; grid-template-columns: repeat(3, 1fr);','.info-item { position: relative;'])
  assert.ok(foundation.includes(marker),marker);
 assert.ok(sections.includes('.invite-home .section-space { padding-block: 104px; }'));
 assert.ok(sections.includes('@media (max-width: 1100px)'));
 assert.ok(sections.includes('@media (max-width: 650px)'));
 const cfg=read('src/page-builder.ts');
 assert.match(cfg,/layout: z\.enum\(\['cards', 'mediaCards', 'alternating', 'compact', 'links'\]\)/);
 assert.match(cfg,/page\.listing\?\.visible === false/);
 assert.match(cfg,/publicationApproved && c\.namePermission/);
 assert.match(cfg,/layout === 'alternating' \? \(item\.visual \?\?/);
});
