import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

// This intentionally pins the DESIGN METRICS from Oslo main@0a81b0b8.
// Only font family and daisyUI theme values may vary by client.
// Visual and runtime parity for ALL components is separately still required in #87.
test('new sites render no MWS-only demonstration banner or alternative UI shell',()=>{
 const layout=read('src/components/BaseLayout.astro');
 const global=read('src/styles/global.css');
 assert.match(layout,/<body class="site-shell" data-ui-shell>/);
 assert.ok(!layout.includes('mws-starter-warning'));
 assert.ok(!layout.includes('Teknisk demonstrasjon'));
 assert.match(layout,/<SiteChromeHeader config=\{chrome\} \/>/);
 assert.match(layout,/<main id="main"/);
 assert.ok(layout.indexOf('<SiteChromeHeader')<layout.indexOf('<main id="main"'),'Header before content');
 assert.doesNotMatch(global,/mws-starter-warning/);
 assert.match(read('src/styles/project.css'),/background: var\(--color-base-200\);/);
});

test('neutral MWS theme entrypoint pins exactly Oslo text scale and composition layers',()=>{
 const css=read('src/styles/global.css');
 const actual=Object.fromEntries([...css.matchAll(/--(text-(?:5xl|6xl|4xl|3xl|2xl|xl|lg|base)(?:--line-height)?|tracking-tight|radius-feature):\s*([^;]+);/g)].map(m=>[m[1],m[2].trim()]));
 const expected={
 'text-5xl':'clamp(1.75rem, 4.5vw, 3.25rem)',
 'text-6xl':'clamp(1.75rem, 4.5vw, 3.25rem)',
 'text-4xl':'clamp(2rem, 3.2vw, 3rem)',
 'text-3xl':'clamp(1.5rem, 2.2vw, 2rem)',
 'text-2xl':'clamp(1.375rem, 1.8vw, 1.625rem)',
 'text-xl':'clamp(1.25rem, 1.8vw, 1.375rem)',
 'text-lg':'clamp(1.125rem, 1.4vw, 1.25rem)',
 'text-base':'clamp(1rem, 1.35vw, 1.125rem)',
 'text-5xl--line-height':'1.08',
 'text-6xl--line-height':'1.08',
 'text-4xl--line-height':'1.12',
 'text-3xl--line-height':'1.2',
 'text-2xl--line-height':'1.25',
 'text-xl--line-height':'1.45',
 'text-base--line-height':'1.6',
 'tracking-tight':'-.052em',
 'radius-feature':'1.5rem',
 };
 assert.deepEqual(actual,expected);
 assert.match(css,/@layer theme, base, composition, components, utilities, project;/);
 assert.match(css,/@import "\.\/project\.css" layer\(project\);/);
 assert.match(css,/@import "\.\/surfaces\.css" layer\(composition\);/);
 assert.match(css,/@import "\.\/terminology\.css" layer\(composition\);/);
 assert.match(css,/--font-heading:\s*'Instrument Sans Variable'/);
 assert.match(css,/--font-body:\s*'Figtree Variable'/);
});

test('Oslo role typography and neutral spacing primitives are shipped into every exported starter',()=>{
 const roles=read('src/styles/typography.css');
 const primitive=read('src/styles/surfaces.css');
 const project=read('src/styles/project.css');
 for(const key of ['--type-display','--type-h1','--type-h2','--type-h3','--type-h4','--type-body','--type-label','--leading-display','--tracking-eyebrow'])
  assert.ok(roles.includes(key+':'),key);
 for(const pair of ['--panel-pad: 24px;','--panel-pad-lg: 32px;','--gap: 24px;','--gap-lg: 32px;','--control-height: 48px;'])
  assert.ok(primitive.includes(pair),pair);
 assert.ok(project.includes('.header-inner.navbar'));
 assert.ok(project.includes('.faq-list .collapse-title'));
 assert.ok(primitive.includes('--radius-card: var(--radius-box);'));
});
