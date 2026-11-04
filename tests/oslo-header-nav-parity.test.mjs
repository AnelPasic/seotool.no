import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('#87 header uses the real Oslo toolbar, menu and customer-owned links',()=>{
 const header=read('src/components/SiteChromeHeader.astro');
 const base=read('src/components/BaseLayout.astro');
 for(const marker of ['site-header','site-header--sticky','shell header-inner navbar',
  'class="desktop-nav"','class="header-actions"','data-mws-chrome-header',
  'data-mws-mobile-toggle','data-mws-mobile-nav','mountSiteChromeHeaders',
  'config.primaryCta.href','SiteChromeLanguages','SiteChromeSearch'])
  assert.ok(header.includes(marker),marker);
 assert.ok(base.indexOf('<SiteChromeHeader') < base.indexOf('<main id="main"'));
 assert.doesNotMatch(header,/mws-chrome-shell|mws-chrome-desktop-nav/);
});

test('#87 mega/dropdown menus use Oslo DOM and native disclosure controls',()=>{
 const nav=read('src/components/SiteChromeNav.astro');
 for(const marker of ['header-nav-item','header-nav-item--mega','class="header-nav-parent"',
  'data-nav-disclosure','aria-controls={id}','aria-expanded="false"',
  'class="header-mega-menu bg-base-100"','class="header-mega-inner shell"',
  'class="header-mega-columns"','header-mega-links','header-mega-promo',
  'class="header-submenu menu bg-base-100"','header-submenu-label','header-submenu-description'])
  assert.ok(nav.includes(marker),marker);
 assert.doesNotMatch(nav,/mws-chrome-panel/);
});

test('#87 search, language and nav interactions use Oslo-owned responsive CSS',()=>{
 const search=read('src/components/SiteChromeSearch.astro');
 const langs=read('src/components/SiteChromeLanguages.astro');
 const js=read('src/lib/site-chrome-interactions.ts');
 const header=read('src/components/SiteChromeHeader.astro');
 const css=read('src/styles/header-navigation.css');
 for(const marker of ['site-search-trigger','site-search-trigger--mobile','site-search-trigger--desktop','pagefind-modal-trigger'])
  assert.ok(search.includes(marker),marker);
 for(const marker of ['language-switch','language-switch__choice','language-switch--mobile','language-switch--desktop'])
  assert.ok(langs.includes(marker),marker);
 assert.ok(js.includes("matchMedia('(min-width: 901px)')"));
 assert.ok(js.includes("toggleAttribute('data-nav-open'"));
 assert.ok(css.includes('(max-width: 900px)')&&css.includes('(min-width: 901px)'));
 assert.match(css,/\.site-shell \.site-header\.site-header--sticky\s*\{\s*position:\s*sticky;\s*top:\s*0;/);
 assert.match(css,/color: var\(--color-secondary-content\)/);
 assert.ok(header.includes("import '../styles/header-navigation.css'"));
});
