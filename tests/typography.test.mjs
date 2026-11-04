import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import YAML from 'yaml';
import {typographySchema,typographyVariables,typographyOverridesCss} from '../src/lib/site-chrome-typography.ts';
import {composeSiteChrome} from '../src/lib/site-chrome-content.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const appearance=JSON.parse(read('src/content/site-chrome/appearance.json'));
const header=JSON.parse(read('src/content/site-chrome/header.json'));
const footer=JSON.parse(read('src/content/site-chrome/footer.json'));

test('Oslo baseline font is Instrument Sans + Figtree, only CMS font family can vary',()=>{
 const global=read('src/styles/global.css');
 const base=read('src/components/BaseLayout.astro');
 assert.ok(!('typography' in appearance));
 assert.match(base, /@fontsource-variable\/instrument-sans/);
 assert.match(base, /@fontsource-variable\/figtree/);
 assert.match(global, /--font-heading: 'Instrument Sans Variable'/);
 assert.match(global, /--font-body: 'Figtree Variable'/);
 const cms=YAML.parse(read('.pages.yml'));
 const appearanceEditor=cms.content.find(x=>x.name==='globalUi').items.find(x=>x.name==='siteAppearance');
 assert.deepEqual(appearanceEditor.fields.find(x=>x.name==='typography').fields.map(x=>x.name),['fontFamily']);
 const selection=typographySchema.parse({fontFamily:'serif'});
 assert.deepEqual(typographyVariables(selection),{
  '--font-sans':'Georgia, serif','--font-heading':'Georgia, serif','--font-body':'Georgia, serif'
 });
 for(const bad of [{scale:'large'},{lineHeight:'relaxed'},{weight:'strong'},{tracking:'tight'},
  {cssVariables:'--text-6xl:8rem;'},{fontFamily:'serif',scale:'large'}])
  assert.equal(typographySchema.safeParse(bad).success,false,JSON.stringify(bad));
});

test('optional customer font overrides apply to both actual CMS theme names without changing geometry',()=>{
 const chrome=composeSiteChrome(header,footer,{...appearance,typography:{fontFamily:'serif'}});
 const css=typographyOverridesCss(chrome.themes,chrome.typography);
 assert.match(css, /html\[data-theme="optimalisering"\]/);
 assert.match(css, /html\[data-theme="sunset"\]/);
 assert.match(css, /--font-heading:Georgia, serif;/);
 assert.match(css, /--font-body:Georgia, serif;/);
 assert.doesNotMatch(css,/--text-|--leading-|--tracking-|--color-|--radius-|--font-weight-|url\(/);
 assert.equal(typographyOverridesCss(chrome.themes),'');
});

test('Oslo type scale is loaded once and CSS layout comes from real source files',()=>{
 const global=read('src/styles/global.css');
 const shared=read('src/styles/shared.css');
 const typography=read('src/styles/typography.css');
 const hero=read('src/components/Hero.astro');
 const faq=read('src/components/Faq.astro');
 assert.match(global,/--text-6xl: clamp\(1\.75rem, 4\.5vw, 3\.25rem\)/);
 assert.match(global,/@import "\.\/shared\.css" layer\(composition\);/);
 assert.match(global,/@import "\.\/terminology\.css" layer\(composition\);/);
 assert.ok(typography.includes('--type-display:'));
 assert.ok(shared.includes('.shell'));
 assert.ok(hero.includes("const Heading=demo?'h2':'h1'"));
 assert.ok(faq.includes('class="collapse collapse-plus"'));
 assert.doesNotMatch(global,/site-chrome\.css|page-list-foundation\.css|oslo-primitives\.css/);
});
