import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import { siteChromeSchema } from '../src/lib/site-chrome.ts';
import { composeSiteChrome } from '../src/lib/site-chrome-content.ts';
import { resolveSiteChromeLogos } from '../src/lib/site-chrome-logos.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('#87 Footer source uses exact Oslo daisyUI DOM roles, not alternative MWS markup',()=>{
 const s=read('src/components/SiteChromeFooter.astro');
 for(const marker of [
  '<footer class="site-footer bg-secondary text-secondary-content">',
  '<div class="shell">',
  'footer footer-grid footer-grid--columns footer-vertical min-[651px]:footer-horizontal',
  'gap-x-5 gap-y-8 pb-9 min-[651px]:pb-[55px] text-(length:--type-body) leading-(--leading-body) *:w-full',
  '<div class="footer-about block justify-items-normal">',
  'footer-title footer-brand normal-case opacity-100 mb-0',
  'site-brand-image-pair site-brand-image-pair--footer',
  'site-brand-image site-brand-image--light',
  'site-brand-image site-brand-image--dark',
  '<nav class="footer-link-group" aria-label={group.heading}>',
  '<h2 class="footer-title footer-group-title">',
  'group.headingHref','group.links.map',
  '<div class="shell footer-bottom footer-bottom--columns">',
  'config.footer.copyright','config.footer.note',
  'config.footer.legalLinks.map',
  'aria-label="Personvern og informasjon"'
 ])assert.ok(s.includes(marker),'Missing Oslo Footer role '+marker);
 assert.doesNotMatch(s,/mws-chrome-footer|class="font-sans/);
 assert.match(read('src/styles/global.css'), /@import "\.\/shared\.css" layer\(composition\);/,'Oslo shared CSS owns footer styling');
 assert.ok(read('src/styles/shared.css').includes('.site-shell .site-footer .footer-grid--columns'));
 const layout=read('src/components/BaseLayout.astro');
 assert.ok(layout.includes('<SiteChromeFooter config={chrome} />'));
});

test('#87 Footer styles preserve Oslo source grid, tablet/mobile cutoffs, and secondary-content palette',()=>{
 const s=read('src/styles/shared.css');
 for(const marker of [
  '.site-footer { padding-top: 65px; }',
  'grid-template-columns: minmax(235px, 1.45fr) repeat(3, minmax(0, 1fr))',
  'column-gap: clamp(26px, 3.2vw, 70px)',
  '.site-shell .site-footer .footer-link-group',
  '.site-shell .site-footer .footer-group-title',
  '.site-shell .site-footer .footer-bottom--columns',
  '@media (min-width: 651px) and (max-width: 1100px)',
  '@media (max-width: 650px)',
  '@media (max-width: 480px)',
  '.site-shell .site-footer { padding-top: 88px; }',
  '.site-shell .footer-grid p, .site-shell .footer-bottom { color: var(--color-secondary-content); }',
  '.site-shell .footer-bottom { border-top: 1px solid color-mix(in srgb, var(--color-secondary-content) 25%, transparent); }',
  '.site-shell .site-footer .site-brand-image-pair--footer',
  'html[data-mws-theme-mode="dark"] .site-brand-image--dark'
 ]) assert.ok(s.includes(marker),'Missing source Oslo Footer styling '+marker);
  assert.doesNotMatch(s,/background:\s*#[0-9a-f]+/i);
});

test('#87 CMS footer retains site-owned content, headingHref, safe links, legal links and logo inheritance',()=>{
 const footer=JSON.parse(read('src/content/site-chrome/footer.json'));
 const header=JSON.parse(read('src/content/site-chrome/header.json'));
 const appearance=JSON.parse(read('src/content/site-chrome/appearance.json'));
 const combined=composeSiteChrome(header,footer,appearance);
 const group={heading:'Eksempel',headingHref:'/tjeneste/',links:[{label:'Kontakt',href:'/kontakt/'}]};
 assert.deepEqual(siteChromeSchema.parse({...combined,footer:{...combined.footer,groups:[group]}}).footer.groups,[group]);
 assert.equal(siteChromeSchema.safeParse({...combined,footer:{...combined.footer,groups:[{...group,headingHref:'javascript:alert(1)'}]}}).success,false);
 assert.equal(siteChromeSchema.safeParse({...combined,footer:{...combined.footer,groups:[{...group,headingHref:'//evil.example'}]}}).success,false);
 const cms=YAML.parse(read('.pages.yml'));
 const entry=cms.content.flatMap(x=>x.type==='group' ? x.items : [x]).find(x=>x.name==='siteFooter');
 const groupField=entry.fields.find(x=>x.name==='footer').fields.find(x=>x.name==='groups');
 assert.ok(groupField.fields.some(x=>x.name==='headingHref'));
 const logos=resolveSiteChromeLogos({...combined,logoLight:'/images/branding/logo-light.png',logoDark:'/images/branding/logo-dark.png'});
 assert.equal(logos.footerLight,'/images/branding/logo-light.png');
 assert.equal(logos.footerDark,'/images/branding/logo-dark.png');
});
