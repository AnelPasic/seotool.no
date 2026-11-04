import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Fail the normal build before publishing an enabled-but-broken search control.
// Internal Pagefind works independently of externally managed indexing policy.
const root=resolve('dist');
for(const asset of ['pagefind/pagefind.js','pagefind/pagefind-component-ui.js','pagefind/pagefind-component-ui.css','pagefind/pagefind-entry.json']){
 assert.ok(existsSync(resolve(root,asset)),'Missing generated Pagefind asset: '+asset);
}
const home=readFileSync(resolve(root,'index.html'),'utf8');
const service=readFileSync(resolve(root,'tjeneste/index.html'),'utf8');
const missing=readFileSync(resolve(root,'404.html'),'utf8');
for(const route of ['design-system','design-system/global-elements','design-system/proof-list']){
 const html=readFileSync(resolve(root,route,'index.html'),'utf8');
 assert.match(html,/<meta name="robots" content="noindex,nofollow"/,'Internal gallery must be noindex: '+route);
 assert.doesNotMatch(html,/data-pagefind-body/,'Internal gallery cannot enter search: '+route);
 assert.match(html,/data-pagefind-ignore="all"/,'Internal body must be ignored: '+route);
 for(const sitemap of ['sitemap.xml','sitemap-0.xml'])if(existsSync(resolve(root,sitemap)))
  assert.doesNotMatch(readFileSync(resolve(root,sitemap),'utf8'),/\/design-system(?:\/|<)/,'Internal galleries cannot enter sitemap');
}
assert.match(home,/data-pagefind-body(?:=|\s|>)/,'Homepage not opted into internal search');
assert.match(service,/data-pagefind-body(?:=|\s|>)/,'Service content not opted into internal search');
assert.doesNotMatch(missing,/data-pagefind-body/,'404 must not enter internal search');
for(const [name,html] of [['home',home],['service',service]]){
 assert.doesNotMatch(html,/<meta name="robots" content="noindex/,'Unexpected global noindex on '+name);
}
assert.match(missing,/<meta name="robots" content="noindex,nofollow"/,'404 must stay excluded');
const metadata=JSON.parse(readFileSync(resolve(root,'pagefind/pagefind-entry.json'),'utf8'));
assert.ok(JSON.stringify(metadata).includes('nb'),'Norwegian Pagefind language index missing');
const header=JSON.parse(readFileSync(resolve('src/content/site-chrome/header.json'),'utf8'));
assert.equal(header.search?.mode,'pagefind','Pagefind must be preconfigured for a one-toggle CMS change');
if(header.headerOptions.showSearch){
 assert.match(home,/pagefind-modal-trigger/,'Enabled search must render a trigger');
 assert.match(home,/<pagefind-modal/,'Enabled search must render a modal');
}else{
 assert.doesNotMatch(home,/<pagefind-modal-trigger/,'Disabled search must hide the trigger');
}
console.log('Pagefind generated: Norwegian index, UI assets, 404 exclusion and toggle state verified.');
