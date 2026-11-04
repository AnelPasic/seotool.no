import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('OWNER #87 ordinary items use one native Card renderer, including legacy plain data',()=>{
 const router=read('src/components/RichContentSection.astro');
 const home=read('src/components/OsloHomeSection.astro');
 const article=read('src/components/OsloContentSection.astro');
 const card=read('src/components/ContentCard.astro');
 for(const part of ['card min-w-0','card-body min-w-0','card-title','card-actions','bg-secondary text-secondary-content'])assert.ok(card.includes(part),part);
 for(const component of [home,article]){
  assert.match(component,/<ContentCard/);
  assert.match(component,/surfaceAttribute\(item.surface\)\?\?'secondary'/);
  assert.doesNotMatch(component,/item\.boxVariant/);
  assert.match(component,/hasRichMarkdown\(text\)/);
 }
 assert.match(router,/<OsloHomeSection/);assert.match(router,/<OsloContentSection/);
 assert.match(card,/hasRichMarkdown\(text\)/);
 assert.doesNotMatch(home+article+card,/\.rich-card\{|class="info-item"/);
});

test('Oslo PageList reuses exact source semantic cards, native mediaCards and editorial layouts',()=>{
 const src=read('src/components/PageList.astro');
 for(const part of ["layout === 'cards'",'class="section-items"','class="text-link"','card card-border bg-base-100 h-full overflow-hidden',
                    'card-body min-w-0 flex-1 items-start gap-0','card-title mb-4 text-2xl','card-actions mt-auto',
                    'class="listing-media"','listing-item min-w-0','page-list-alternating',
                    'page-list-mediaCards','page-list-row','`page-list-${layout}`',
                    'presentationVisual','data-visual-kind','<ListingVisual','<Arrow diagonal'])
   assert.ok(src.includes(part),'missing canonical Oslo PageList DOM/class '+part);
 for(const legacy of ['.mws-list-', 'mws-list-entry','mws-list-media','p-[var(--list-gap)]'])
   assert.ok(!src.includes(legacy),'MWS-only PageList visual skin returned '+legacy);
});
