/**
 * MWS-052 checkpoint 4: isolated SECOND BRAND porting test.
 *
 * This is intentionally NOT an authenticated Pages CMS session.
 * It models the same JSON→Git commit→build→reopen→revert data path,
 * using a disposable git checkout at the website root; never touches
 * the pilot, the shared starter's own content, or any real customer.
 */
import assert from 'node:assert/strict';
import {mkdtempSync,cpSync,symlinkSync,mkdirSync,readFileSync,writeFileSync,renameSync,rmSync,readdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawn} from 'node:child_process';
import YAML from 'yaml';
import {chromium} from 'playwright';

const source=resolve(fileURLToPath(new URL('../',import.meta.url)));
const sandbox=mkdtempSync(join(tmpdir(),'mws-second-brand-'));
const evidence=process.env.MWS_EVIDENCE_DIR||join(sandbox,'test-evidence');
const origin='http://127.0.0.1:4387';
const baseBrand='SykkelLab Demo';
const shareId='verksted-rad';
let child,browser;
let previewOutput='';
function startPreview(){
 previewOutput='';
 const pkg=JSON.parse(readFileSync(join(source,'node_modules/astro/package.json'),'utf8'));
 const astroBin=resolve(join(source,'node_modules/astro'),typeof pkg.bin==='string'?pkg.bin:pkg.bin.astro);
 const processHandle=spawn(process.execPath,[astroBin,'preview','--host','127.0.0.1','--port','4387'],{cwd:sandbox,env:{...process.env,SITE_URL:'https://sykkellab.invalid'},stdio:['ignore','pipe','pipe']});
 for(const stream of [processHandle.stdout,processHandle.stderr])stream.on('data',data=>previewOutput+=data);
 return processHandle;
}

const own=(path)=>join(sandbox,path);
const from=(path)=>join(source,path);
const read=(path)=>readFileSync(own(path),'utf8');
const readJson=(path)=>JSON.parse(read(path));
const writeJson=(path,data)=>writeFileSync(own(path),JSON.stringify(data,null,2)+'\n');
const run=(command,args,cwd=sandbox,env={})=>execFileSync(command==='npm'?process.execPath:command,command==='npm'?[process.env.npm_execpath||join(dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),...args]:args,{
 cwd,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:180_000,
 env:{...process.env,SITE_URL:'https://sykkellab.invalid',...env},
});
function ensure(statement,reason){assert.ok(statement,reason);}
function inspectBuild(expected){
 const html=read('dist/index.html');
 ensure(!/^\/\*\s*\n\s*X-Robots-Tag:/m.test(read('dist/_headers')),'Global HTTP noindex must be managed externally');
 const service=read('dist/tjeneste/index.html');
 const notFound=read('dist/404.html');
 for(const asset of ['pagefind/pagefind.js','pagefind/pagefind-component-ui.js','pagefind/pagefind-component-ui.css','pagefind/pagefind-entry.json']){
  ensure(existsSync(own('dist/'+asset)),'missing Pagefind asset '+asset);
 }
 ensure(html.includes('data-pagefind-body'),'homepage must opt in to internal Pagefind');
 ensure(service.includes('data-pagefind-body'),'service must opt in to internal Pagefind');
 ensure(!notFound.includes('data-pagefind-body'),'404 excluded from internal Pagefind');
 for(const [name,doc] of [['home',html],['service',service],['404',notFound]]){
  if(name==='404')ensure(/<meta name="robots" content="noindex,nofollow"/.test(doc),'404 should remain noindex');
  else ensure(!/<meta name="robots" content="noindex/.test(doc),name+' has unexpected global noindex');
  ensure(doc.includes(baseBrand),name+' does not show second brand');
  ensure(!doc.includes('Eksempelbedrift')&&!doc.includes('Optimalisering Oslo'),name+' leaks another brand');
 }
 ensure(html.includes(expected)&&service.includes(expected),'shared content must render on both routes');
 for(const dir of ['kontakt','om','priser','innsikt/artikkel']){
  ensure(existsSync(own('dist/'+dir+'/index.html')),'missing route '+dir);
  ensure(!read('dist/'+dir+'/index.html').includes('content="noindex,nofollow"'),'Unexpected app-level noindex '+dir);
 }
}
async function awaitPreview(){
 for(let i=0;i<80;i++){
  if(child.exitCode!==null)throw new Error('Astro preview terminated early: '+child.exitCode+' '+previewOutput);
  try {const res=await fetch(origin+'/');if(res.ok)return;}catch{}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 throw new Error('Preview did not start on '+origin);
}
async function measureTypography(){
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();
 const samples=[];
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  for(const theme of ['sykkellab-light','sykkellab-dark']){
   const row=await page.evaluate(theme=>{
    document.documentElement.dataset.theme=theme;
    const size=selector=>getComputedStyle(document.querySelector(selector)).fontSize;
    const family=selector=>getComputedStyle(document.querySelector(selector)).fontFamily;
    return {
     h1:size('.commercial-hero h1'),
     h2:size('#verksted-rad h2'),
     body:size('#verksted-rad .body-copy p'),
     header:size('.header-nav-parent > a'),
     footer:size('.footer-about p'),
     h1Font:family('.commercial-hero h1'),h2Font:family('#verksted-rad h2'),
     bodyFont:family('#verksted-rad .body-copy p'),headerFont:family('.header-nav-parent > a'),
     footerFont:family('.footer-about p'),
     overflow:document.documentElement.scrollWidth-innerWidth,
     rootToken:getComputedStyle(document.documentElement).getPropertyValue('--text-6xl'),
     h1Class:document.querySelector('.commercial-hero h1').className,
     styleHasTypography:[...document.querySelectorAll('style')].some(s=>s.textContent.includes('--font-sans:Georgia, serif'))
    };
   },theme);
   assert.ok(row.overflow<=2,'typography overflow '+width+' '+theme);
   samples.push({width,theme,...row});
  }
 }
 await browser.close();browser=undefined;
 return samples;
}
async function previewTypography(){
 child=startPreview();
 try {await awaitPreview();return await measureTypography();}
 finally{
  if(child){
   const current=child;
   await new Promise(resolve=>{current.once('exit',resolve);current.kill('SIGTERM');});
   child=undefined;
  }
 }
}
async function inspectBrowser(expected){
 browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox']});
 const desktop=await browser.newPage({viewport:{width:1440,height:900},colorScheme:'light'});
 await desktop.goto(origin+'/',{waitUntil:'networkidle'});
 ensure(await desktop.locator('pagefind-modal-trigger.site-search-trigger--desktop').count()===1,'CMS search toggle must render desktop trigger');
 ensure(await desktop.locator('pagefind-modal').count()===1,'CMS search toggle must render modal');
 const indexed=await desktop.evaluate(async()=>{
  const engine=await import('/pagefind/pagefind.js');
  const results=[];
  for(const term of ['blåbærsykkel','sølvkjede','værmelding']){
   const found=await engine.search(term);
   const items=await Promise.all(found.results.slice(0,5).map(item=>item.data()));
   results.push({term,urls:items.map(item=>item.url)});
  }
  return results;
 });
 for(const result of indexed)ensure(result.urls.some(url=>url==='/'||url.startsWith('/tjeneste/')),'Actual Pagefind search failed: '+result.term);
 ensure(await desktop.locator('header').getByText(baseBrand).isVisible(),'desktop header brand');
 // Preserve essential Chrome interaction coverage after retiring the separate kit.
 const navItem=desktop.locator('.desktop-nav .header-nav-item').first();
 const disclosure=navItem.locator('button[data-nav-disclosure]');
 await disclosure.focus();
 await disclosure.press('Enter');
 ensure(await disclosure.getAttribute('aria-expanded')==='true','desktop dropdown failed keyboard activation');
 ensure(await navItem.locator('.header-mega-menu, .header-submenu').isVisible(),'desktop dropdown not visible');
 await disclosure.press('Escape');
 ensure(await disclosure.getAttribute('aria-expanded')==='false','desktop dropdown did not close on Escape');
 ensure(await disclosure.evaluate(el=>document.activeElement===el),'dropdown focus not restored');
 const themeSwitch=desktop.locator('label.mws-chrome-theme-switch--desktop');
 await themeSwitch.click();
 ensure(await desktop.locator('html').getAttribute('data-theme')==='sykkellab-dark','dark theme did not activate');
 await desktop.reload({waitUntil:'networkidle'});
 ensure(await desktop.locator('html').getAttribute('data-theme')==='sykkellab-dark','manual dark theme did not persist');
 await themeSwitch.click();
 ensure(await desktop.locator('html').getAttribute('data-theme')==='sykkellab-light','light theme did not restore');
 const stickyOffset=await desktop.locator('[data-mws-chrome-header]').evaluate(el=>{
  const style=getComputedStyle(el),rect=el.getBoundingClientRect();
  return {top:parseFloat(style.top),margin:parseFloat(style.marginTop),radius:parseFloat(style.borderTopLeftRadius),
   shadow:style.boxShadow,width:rect.width,left:rect.left,right:innerWidth-rect.right,background:style.backgroundColor};
 });
 ensure(stickyOffset.top===0&&stickyOffset.margin===0,'Oslo sticky top/margin must be zero: '+JSON.stringify(stickyOffset));
 ensure(stickyOffset.radius===0&&stickyOffset.shadow==='none','Oslo sticky header must not be a floating card');
 ensure(Math.abs(stickyOffset.width-1440)<=2&&Math.abs(stickyOffset.left)<=2&&Math.abs(stickyOffset.right)<=2,'Oslo sticky header must span viewport');
 ensure(stickyOffset.background!=='rgba(0, 0, 0, 0)','Header background must not be transparent');
 ensure(await desktop.locator('section#'+shareId).getByRole('heading',{name:expected}).isVisible(),'desktop shared section'); 
 const widthData=await desktop.locator('section#'+shareId).evaluate(el=>{
   const outer=el.getBoundingClientRect(),inner=el.querySelector('.shell').getBoundingClientRect();
   return {outer:outer.width,inner:inner.width,left:inner.left,right:window.innerWidth-inner.right,viewport:window.innerWidth};
 });
 ensure(Math.abs(widthData.outer-widthData.viewport)<=2,'desktop section background must span full viewport');
 ensure(widthData.inner<=1440&&widthData.left>=15&&widthData.right>=15,'desktop cards must remain inside centered shell');

 ensure(await desktop.locator('meta[name="robots"]').count()===0,'desktop homepage has global noindex');
 const desktopGrid=await desktop.locator('#'+shareId+' .body-copy').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
 const desktopCards=await desktop.locator('#'+shareId+' .section-items').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
 assert.equal(desktopGrid,3,'desktop paragraphs must be three columns');
 assert.equal(desktopCards,3,'desktop cards must be three columns');
 const sourceLists=await desktop.evaluate(()=>{
  const cols=sel=>getComputedStyle(document.querySelector(sel)).gridTemplateColumns.split(' ').length;
  return {
   cards:cols('#pagelist-cards .section-items'),
   media:cols('#pagelist-mediacards .page-list-mediaCards'),
   alternating:cols('#pagelist-alternating .page-list-alternating .listing-item'),
   compact:document.querySelectorAll('#pagelist-compact .page-list-row.info-item').length,
   links:document.querySelectorAll('#pagelist-links .page-list-links a.text-link').length,
   figures:document.querySelectorAll('#pagelist-mediacards figure.listing-media .listing-visual svg').length,
   arrows:document.querySelectorAll('#pagelist-links .arrow-icon').length,
  };
 });
 assert.deepEqual(sourceLists,{cards:3,media:3,alternating:2,compact:3,links:3,figures:3,arrows:3},
   'Oslo PageList source structure and 1440px geometry');
 const pair=await desktop.locator('#pagelist-alternating .page-list-alternating > li:nth-child(2) .listing-item').evaluate(el=>{
  const copy=getComputedStyle(el.querySelector('.listing-copy')).gridColumnStart;
  const visual=getComputedStyle(el.querySelector('.listing-visual')).gridColumnStart;
  return {copy,visual};
 });
 assert.deepEqual(pair,{copy:'2',visual:'1'},'even alternating row must reverse media and copy');
 await desktop.setViewportSize({width:768,height:900});
 assert.equal(await desktop.locator('#pagelist-mediacards .page-list-mediaCards').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),2,
   'Oslo media cards use 2 columns at 768px');
 await desktop.setViewportSize({width:1440,height:900});
 // #87 Oslo Footer source contract: semantic theme, 4/3/2/1 columns,
 // linked group heading and native legal link, and no MWS-only footer design.
 ensure(await desktop.locator('.site-footer.bg-secondary.text-secondary-content').count()===1,'Oslo semantic Footer missing');
 ensure(await desktop.locator('.site-footer .footer-link-group').count()===3,'Footer Groups must use independent CMS data');
 ensure(await desktop.locator('.site-footer .footer-group-title a[href="/innsikt/artikkel/"]').count()===1,'CMS group headingHref missing');
 ensure(await desktop.locator('.site-footer .footer-bottom--columns nav a[href="/kontakt/"]').count()===1,'CMS legal Footer link missing');
 for(const [width,columns] of [[1440,4],[1100,3],[650,2],[480,1],[390,1]]){
  await desktop.setViewportSize({width,height:900});
  for(const mode of ['sykkellab-light','sykkellab-dark']){
   await desktop.evaluate(theme=>{document.documentElement.dataset.theme=theme;},mode);
   const metrics=await desktop.locator('.site-footer').evaluate(el=>{
    const grid=el.querySelector('.footer-grid--columns');
    const footer=getComputedStyle(el);
    const probe=document.createElement('div');probe.className='bg-secondary text-secondary-content';
    document.body.append(probe);const expected=getComputedStyle(probe);
    const result={
     columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,
     ink:footer.color,expectedInk:expected.color,bg:footer.backgroundColor,expectedBg:expected.backgroundColor,
     padding:parseFloat(footer.paddingTop),width:el.getBoundingClientRect().width,
     horizontalOverflow:document.documentElement.scrollWidth-window.innerWidth,
    };probe.remove();return result;
   });
   ensure(metrics.columns===columns,width+' '+mode+' Oslo Footer columns '+JSON.stringify(metrics));
   ensure(metrics.ink===metrics.expectedInk&&metrics.bg===metrics.expectedBg,width+' '+mode+' Footer secondary theme pair');
   ensure(metrics.padding===88,width+' '+mode+' canonical Oslo Footer top spacing: '+JSON.stringify(metrics));
   ensure(Math.abs(metrics.width-width)<=2&&metrics.horizontalOverflow<=2,width+' '+mode+' footer overflow/full-bleed geometry');
   if([1440,650,390].includes(width)){
    mkdirSync(evidence,{recursive:true});
    await desktop.locator('.site-footer').screenshot({path:join(evidence,'sykkellab-footer-'+width+'-'+mode+'.png')});
   }
  }
 }
 await desktop.setViewportSize({width:1440,height:900});
 await desktop.evaluate(()=>{document.documentElement.dataset.theme='sykkellab-light';});
 // OWNER #87: legacy plain data also uses the one native Card renderer.
 const parts=await desktop.locator('#'+shareId+' .section-items > article').evaluateAll(nodes=>nodes.map(el=>({
  variant:el.dataset.boxVariant,card:el.classList.contains('card'),
  body:!!el.querySelector(':scope > .card-body'),title:!!el.querySelector('.card-title'),
  padding:parseFloat(getComputedStyle(el.querySelector(':scope > .card-body')).paddingLeft)
 })));
 assert.equal(parts.length,3);
 for(const item of parts){assert.equal(item.variant,'card');assert.equal(item.card,true);assert.equal(item.body,true);assert.equal(item.title,true);assert.ok(item.padding>=16);}

 // Color tokens must respond to the actual compiled daisyUI Light/Dark themes.
 const themedSection=desktop.locator('#'+shareId);
 const lightColors=await themedSection.evaluate(el=>({
  section:getComputedStyle(el).backgroundColor,
  text:getComputedStyle(el).color,
  card:getComputedStyle(el.querySelector('.section-items article')).backgroundColor
 }));
 ensure(lightColors.section!==lightColors.card,'base-100 nested card should contrast with primary section');
 await desktop.evaluate(()=>{document.documentElement.dataset.theme='sykkellab-dark';});
 const darkColors=await themedSection.evaluate(el=>({
  section:getComputedStyle(el).backgroundColor,
  text:getComputedStyle(el).color,
  card:getComputedStyle(el.querySelector('.section-items article')).backgroundColor
 }));
 ensure(darkColors.section!==lightColors.section,'primary background must respond to Dark theme');
 ensure(darkColors.text!==lightColors.text,'primary-content foreground must respond to Dark theme');
 ensure(darkColors.section!==darkColors.card,'nested card contrast must remain in Dark theme');
 await desktop.evaluate(()=>{document.documentElement.dataset.theme='sykkellab-light';});

 // #87 OWNER override: ordinary content sections follow Oslo base-100 background and 90px desktop section-space, not old MWS transparent/unpadded rule.
 await desktop.goto(origin+'/tjeneste/',{waitUntil:'domcontentloaded'});
 for(const theme of ['sykkellab-light','sykkellab-dark']){
  await desktop.evaluate(value=>{document.documentElement.dataset.theme=value;},theme);
  const plain=await desktop.locator('section#innhold').evaluate(el=>{
   const css=getComputedStyle(el);
   const probe=document.createElement('div');
   probe.className='bg-base-100';document.body.append(probe);
   const expectedBg=getComputedStyle(probe).backgroundColor;probe.remove();
   return {surface:el.dataset.surface,background:css.backgroundColor,expectedBg,padding:css.paddingTop,border:css.borderTopWidth,radius:css.borderTopLeftRadius};
  });
  assert.equal(plain.surface,undefined,'Default is represented by an absent attribute');
  assert.equal(plain.background,plain.expectedBg,'Ordinary section keeps the source base-100 surface ('+theme+')');
  assert.equal(plain.padding,'104px','Oslo home/service composition has canonical 104px desktop section spacing ('+theme+')');
  assert.equal(plain.border,'0px','Standard section should have no border ('+theme+')');
  assert.equal(plain.radius,'0px','Standard section should have no radius ('+theme+')');
 }
 await desktop.evaluate(()=>{document.documentElement.dataset.theme='sykkellab-light';});

 // #87 Oslo breakpoint contract: desktop begins at 901px, mobile ends at 900px.
 await desktop.setViewportSize({width:900,height:900});
 ensure(await desktop.locator('[data-mws-mobile-toggle]').isVisible(),'900px mobile menu toggle must be visible');
 ensure(!(await desktop.locator('.desktop-nav').isVisible()),'900px desktop nav must be hidden');
 await desktop.locator('[data-mws-mobile-toggle]').click();
 ensure(await desktop.locator('.mobile-menu').isVisible(),'900px mobile menu must open');
 await desktop.locator('[data-mws-mobile-toggle]').click();
 await desktop.setViewportSize({width:901,height:900});
 ensure(await desktop.locator('.desktop-nav').isVisible(),'901px desktop nav must be visible');
 ensure(!(await desktop.locator('[data-mws-mobile-toggle]').isVisible()),'901px mobile toggle must be hidden');
 const navOverflow=await desktop.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 ensure(navOverflow<=2,'901px breakpoint must not cause horizontal overflow: '+navOverflow);

 // #21: actual browser rectangles at six widths and three representative routes.
 // Based on the effective Oslo CSS, not a claim of live Worker-to-Worker parity.
 for(const [vp,mainWidth,headerWidth,heroWidth] of [
  [320,288,288,288],[390,350,350,350],[768,704,728,704],
  [1024,960,944,960],[1440,1360,1360,1360],[1920,1440,1440,1440]
 ]){
  await desktop.setViewportSize({width:vp,height:900});
  for(const path of ['/','/tjeneste/','/om/']){
   await desktop.goto(origin+path,{waitUntil:'domcontentloaded'});
   const rect=await desktop.evaluate(()=>{
    const get=selector=>{
     const e=document.querySelector(selector);
     if(!e)return null;
     const b=e.getBoundingClientRect();
     return {width:b.width,left:b.left,right:innerWidth-b.right};
    };
    return {
     main:get('main .content-section > .shell'),
     header:get('.site-header .header-inner.navbar'),
     hero:get('.commercial-hero[data-hero-family="utility"] .hero-container.shell, .commercial-hero:not([data-hero-family="utility"])'),
     heroOuter:get('.commercial-hero'),
     footer:get('.site-footer .shell'),
     overflow:document.documentElement.scrollWidth-innerWidth,
     sticky:parseFloat(getComputedStyle(document.querySelector('[data-mws-chrome-header]')).top),
     headerFrame:get('[data-mws-chrome-header]')
    };
   });
   for(const [key,expected] of [['main',mainWidth],['header',headerWidth],['hero',heroWidth],['footer',heroWidth]]){
    const b=rect[key];
    ensure(b,vp+' '+path+' missing '+key);
    ensure(Math.abs(b.width-expected)<=2,vp+' '+path+' '+key+' width '+b.width+' expected '+expected);
    ensure(Math.abs(b.left-b.right)<=2,vp+' '+path+' '+key+' not centered '+JSON.stringify(b));
   }
   if(path==='/om/')ensure(Math.abs(rect.heroOuter.width-vp)<=2,vp+' Oslo utility outer hero must be full bleed '+JSON.stringify(rect.heroOuter));
   if(rect.overflow>2){
    const offenders=await desktop.evaluate(()=>
     [...document.querySelectorAll('body *')]
      .map(el=>({el,r:el.getBoundingClientRect()}))
      .filter(x=>x.r.width>0&&(x.r.right>innerWidth+2||x.r.left< -2))
      .slice(0,12)
      .map(x=>({tag:x.el.tagName,cls:String(x.el.className).slice(0,100),text:(x.el.textContent||'').trim().slice(0,50),left:x.r.left,right:x.r.right,width:x.r.width}))
    );
    console.error('WIDTH-OUTLIERS '+vp+' '+path+' '+JSON.stringify(offenders));
   }
   ensure(rect.overflow<=2,vp+' '+path+' overflow '+rect.overflow);
   ensure(rect.sticky===0,vp+' '+path+' Oslo sticky top must be zero '+rect.sticky);
   ensure(Math.abs(rect.headerFrame.width-vp)<=2&&Math.abs(rect.headerFrame.left)<=2&&Math.abs(rect.headerFrame.right)<=2,vp+' '+path+' sticky header must be full width '+JSON.stringify(rect.headerFrame));
  }
 }
 // Issue #87: actual full-bleed, flush Oslo sticky header after scroll.
 // No top gap, inset, rounded frame or floating shadow.
 mkdirSync(evidence,{recursive:true});
 for(const width of [390,768,1440]){
  await desktop.setViewportSize({width,height:900});
  await desktop.goto(origin+'/',{waitUntil:'domcontentloaded'});
  const before=await desktop.locator('[data-mws-chrome-header]').evaluate(el=>{
   const r=el.getBoundingClientRect(),s=getComputedStyle(el);
   return {top:r.top,height:r.height,left:r.left,right:innerWidth-r.right,
     gap:parseFloat(s.top),margin:parseFloat(s.marginTop),
     radius:parseFloat(s.borderTopLeftRadius),shadow:s.boxShadow,
    scrollHeight:document.documentElement.scrollHeight,
    scrollWidth:document.documentElement.scrollWidth};
  });
  ensure(before.gap===0&&before.margin===0,width+' Oslo sticky top and margin must be zero');
  ensure(Math.abs(before.top)<=2,width+' Oslo header must begin at viewport top');
  ensure(Math.abs(before.left)<=2&&Math.abs(before.right)<=2,width+' Oslo header must reach viewport edges');
  ensure(before.radius===0&&before.shadow==='none',width+' header must not be a floating card');
  const scroll=await desktop.evaluate(()=>{
   scrollTo({top:Math.min(600,Math.max(0,document.documentElement.scrollHeight-innerHeight)),behavior:'instant'});
   return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(scrollY))));
  });
  ensure(scroll>=150,width+' test page must be long enough to verify sticky behavior');
  const after=await desktop.locator('[data-mws-chrome-header]').evaluate(el=>{
   const r=el.getBoundingClientRect(),s=getComputedStyle(el);
   const nav=el.querySelector('.header-inner.navbar')?.getBoundingClientRect();
   const cta=innerWidth>=901
    ? el.querySelector('.header-actions > a.btn')
    : el.querySelector('[data-mws-mobile-toggle]');
   const box=cta?.getBoundingClientRect();
   const hit=box&&document.elementFromPoint(box.left+box.width/2,box.top+box.height/2);
   return {top:r.top,height:r.height,left:r.left,right:innerWidth-r.right,
    gap:parseFloat(s.top),navContained:!!nav&&nav.left>=r.left-1&&nav.right<=r.right+1,
    buttonVisible:!!box&&box.width>=40&&box.height>=40,
    buttonHit:!!hit&&!!cta&&(cta===hit||cta.contains(hit)),
    scrollHeight:document.documentElement.scrollHeight,
    scrollWidth:document.documentElement.scrollWidth};
  });
  ensure(Math.abs(after.top)<=2&&after.gap===0,width+' Oslo sticky top must remain zero after scroll '+JSON.stringify(after));
  ensure(Math.abs(after.height-before.height)<=2,width+' sticky header height shifted after scroll');
  ensure(Math.abs(after.left)<=2&&Math.abs(after.right)<=2,width+' header must remain full width after scroll');
  ensure(after.scrollHeight===before.scrollHeight,width+' header changed document height');
  ensure(after.scrollWidth<=width+2,width+' horizontal overflow after scroll');
  ensure(after.navContained,width+' sticky header inner navbar overlaps outer frame');
  ensure(after.buttonVisible&&after.buttonHit,width+' CTA/mobile-menu trigger blocked after scroll');
  await desktop.screenshot({path:join(evidence,'sykkellab-sticky-'+width+'.png')});
  if(width<901){
   const button=desktop.locator('[data-mws-mobile-toggle]');
   await button.click();
   ensure(await button.getAttribute('aria-expanded')==='true',width+' scrolled mobile nav did not open');
   ensure(await desktop.locator('[data-mws-mobile-nav]').isVisible(),width+' mobile panel hidden after scrolling');
   ensure(await desktop.locator('.header-actions > a.btn').isVisible(),width+' CTA must remain reachable in the mobile header');
   await button.click();
   ensure(await button.getAttribute('aria-expanded')==='false',width+' scrolled mobile nav did not close');
  }
 }
 await desktop.setViewportSize({width:1440,height:900});
 await desktop.goto(origin+'/',{waitUntil:'domcontentloaded'});
 ensure(await desktop.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),'desktop horizontal overflow');
 mkdirSync(evidence,{recursive:true});
 await desktop.screenshot({path:join(evidence,'sykkellab-desktop.png'),fullPage:true});
 await desktop.goto(origin+'/tjeneste/',{waitUntil:'networkidle'});
 ensure(await desktop.locator('#'+shareId).getByRole('heading',{name:expected}).isVisible(),'second route shares content');
 await desktop.close();

 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,colorScheme:'light'});
 await mobile.goto(origin+'/',{waitUntil:'networkidle'});
 ensure(await mobile.locator('pagefind-modal').count()===1,'mobile search modal missing');
 ensure(await mobile.locator('.wordmark').getAttribute('aria-label')===baseBrand,'mobile brand keeps accessible name when compact wordmark text is hidden');
 ensure(await mobile.locator('[data-mws-chrome-header]').evaluate(el=>parseFloat(getComputedStyle(el).top))===0,'mobile sticky header must match Oslo top: 0');
 ensure(await mobile.locator('#'+shareId).getByRole('heading',{name:expected}).isVisible(),'mobile global section');
 const mobileWidth=await mobile.locator('#'+shareId).evaluate(el=>{
  const outer=el.getBoundingClientRect(),inner=el.querySelector('.shell').getBoundingClientRect();
  return {outer:outer.width,inner:inner.width,viewport:window.innerWidth};
 });
 ensure(Math.abs(mobileWidth.outer-mobileWidth.viewport)<=2,'mobile section background must be full bleed');
 ensure(mobileWidth.inner<mobileWidth.outer,'mobile cards need side gutters');

 const mobileGrid=await mobile.locator('#'+shareId+' .body-copy').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
 const mobileCards=await mobile.locator('#'+shareId+' .section-items').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
 assert.equal(mobileGrid,1,'mobile paragraphs must stack');
 assert.equal(mobileCards,1,'mobile cards must stack');
 assert.equal(await mobile.locator('#pagelist-cards .section-items').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1,'Oslo editorial cards stack at 390px');
 assert.equal(await mobile.locator('#pagelist-mediacards .page-list-mediaCards').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1,'Oslo media cards stack at 390px');
 assert.equal(await mobile.locator('#pagelist-alternating .listing-item').first().evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),1,'Oslo alternating rows stack at 390px');
 ensure(await mobile.locator('#'+shareId+' .section-items article[data-box-variant="card"] .card-body').count()===3,'Mobile card body missing');
 ensure(await mobile.locator('#'+shareId+' .section-items article[data-box-variant="plain"].card').count()===0,'Plain variant gained card style on mobile');

 ensure(await mobile.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),'mobile horizontal overflow');
 const menu=mobile.locator('[data-mws-mobile-toggle]');
 ensure(await menu.isVisible(),'mobile nav toggle not visible');
 await menu.click();
 ensure(await menu.getAttribute('aria-expanded')==='true','mobile navigation did not open');
 ensure(await mobile.locator('[data-mws-mobile-nav]').isVisible(),'mobile navigation panel hidden');
 ensure(await mobile.locator('[data-mws-mobile-nav] pagefind-modal-trigger').isVisible(),'CMS search unavailable in mobile menu');
 ensure(await mobile.locator('.header-actions > a.btn').isVisible(),'CTA must remain reachable in mobile header');
 await mobile.screenshot({path:join(evidence,'sykkellab-mobile-menu.png'),fullPage:true});
 await mobile.close();
 await browser.close();browser=undefined;
 console.log('PASS browser: desktop 3-column paragraphs/cards, mobile stacking + nav, sticky header normal/scrolled on 390/768/1440, no overflow, 2 shared routes, screenshots');
}
async function main(){
 try{
  for(const item of ['astro.config.mjs','package.json','tsconfig.json','.pages.yml','.gitignore','src','scripts','coordination'])
   cpSync(from(item),own(item),{recursive:true});
  if(existsSync(from('public')))cpSync(from('public'),own('public'),{recursive:true});
  symlinkSync(from('node_modules'),own('node_modules'),process.platform==='win32'?'junction':'dir');
  // Different website and different id/UUID: NO parent project's URL or owned data.
  const header=readJson('src/content/site-chrome/header.json');
  header.brand.name=baseBrand;
  header.headerOptions.showSearch=true;
  ensure(header.search?.mode==='pagefind','Only the Vis søk toggle must be necessary');
  header.navigation[0].label='Service';
  header.primaryCta={label:'Kontakt (demo)',href:'/kontakt/',variant:'primary'};
  writeJson('src/content/site-chrome/header.json',header);
  const footer=readJson('src/content/site-chrome/footer.json');
  footer.footer.copyright=baseBrand;
  footer.footer.about='Fiktivt sykkelverksted laget for en isolert teknisk test. Ingen ekte tjenester eller avtaler.';
  footer.footer.note='TESTNETTSTED – ikke et virksomhetstilbud.';
  footer.footer.groups.push({heading:'Veiledning',headingHref:'/innsikt/artikkel/',
   links:[{label:'Sjekkliste',href:'/innsikt/artikkel/'}]});
  footer.footer.legalLinks=[{label:'Kontakt og personvern',href:'/kontakt/'}];
  writeJson('src/content/site-chrome/footer.json',footer);
  const appearance=readJson('src/content/site-chrome/appearance.json');
  appearance.themes.lightCss=appearance.themes.lightCss.replace(/name:\s*"[^"]+"/,'name: "sykkellab-light"').replace(/--color-primary:\s*[^;]+;/,'--color-primary: oklch(48% 0.14 247);');
  appearance.themes.darkCss=appearance.themes.darkCss.replace(/name:\s*"[^"]+"/,'name: "sykkellab-dark"').replace(/--color-primary:\s*[^;]+;/,'--color-primary: oklch(77% 0.15 250);');
  writeJson('src/content/site-chrome/appearance.json',appearance);
  for(const file of [
   ...readdirSync(own('src/content/pages')).filter(x=>x.endsWith('.json')),
   ...readdirSync(own('src/content/pages/managed-articles')).filter(x=>x.endsWith('.json')).map(x=>'managed-articles/'+x)
  ]){
   const data=readJson('src/content/pages/'+file);
   data.seo.title=data.seo.title.replaceAll('Eksempelbedrift',baseBrand);
   data.seo.description='Fiktivt innhold for '+baseBrand+' – ikke et ekte virksomhetstilbud.';
   if(data.slug==='home'){
    data.hero.title='Sykkelen klar til neste tur.';
    data.hero.support='Dette er et teknisk testnettsted for en oppdiktet sykkelservice.';
   }
   if(data.slug==='tjeneste'){
    data.hero.title='Service uten unødvendig venting (demo)';
    data.hero.support='Eksempel på en tjenesteside i en annen bransje.';
   }
   // #87 isolated Pages CMS fixtures: all five canonical Oslo list modes.
   if(['tjeneste','om','kontakt'].includes(data.slug)){
    const icons={tjeneste:'search',om:'analytics',kontakt:'conversion'};
    data.listing={...data.listing,visible:true,visual:{kind:'icon',icon:icons[data.slug]}};
   }
   if(data.slug==='home'){
    const entries=['tjeneste','om','kontakt'].map(slug=>({_block:'page',slug}));
    for(const layout of ['cards','mediaCards','alternating','compact','links']){
     data.sections.push({_block:'pageList',id:'pagelist-'+layout.toLowerCase(),heading:'Visning '+layout,visibility:'visible',
       pageList:{source:'pages',mode:'manual',sort:'editorial',limit:3,layout,entries}});
    }
   }
   for(const section of data.sections)if(section._block==='sharedContent'&&section.entry==='felles-eksempel')section.entry=shareId;
   writeJson('src/content/pages/'+file,data);
  }
  const sourcePath='src/content/global-content/felles-eksempel.json';
  const renamed='src/content/global-content/'+shareId+'.json';
  const shared=readJson(sourcePath);
  shared.id=shareId;shared.name='Sykkelvedlikehold';shared.uid='aa301f6d-1bb6-49c1-92ed-519b2d8ecdd3';
  shared.heading='Sykkelservice for alle typer turer';
  shared.body=['Dette er demonstrasjonsinnhold.','Kun for en uavhengig nettstedtest.','Ingen dokumenterte kundeløfter.'];
  shared.surface='primary';
  shared.items=[{title:'Råd',text:'Eksempeltekst for service.',surface:'base-100',boxVariant:'plain'},
    {title:'Tilsyn',text:'Eksempeltekst for vedlikehold.',surface:'secondary',boxVariant:'card'},
    {title:'Kontroll',text:'Eksempeltekst for sikkerhetskontroll.',surface:'info',boxVariant:'plain'}];
  writeJson(renamed,shared);rmSync(own(sourcePath));
  const yaml=YAML.parseDocument(read('.pages.yml'),{uniqueKeys:true});
  assert.equal(yaml.errors.length,0,'Invalid CMS YAML in isolated project');
  const cms=yaml.toJS();
  ensure(cms.content[1].items.some(x=>x.name==='sharedContent'&&x.type==='collection'),'Native CMS collection missing');
  ensure(cms.components.builderSharedPlacement.fields[0].options.collection==='sharedContent','Reference binding lost');
  for(const editor of cms.content.slice(3).flatMap(item=>item.type==='group'?item.items:[item]))ensure(existsSync(own(editor.path)),'CMS editor path incorrect at repo root: '+editor.path);
  // Same repository-root layout Pages CMS expects; this is a dry-run of editor JSON commits, NOT Pages CMS login.
  run('git',['init','-q']);
  run('git',['config','core.autocrlf','false']);
  run('git',['config','user.email','acceptance@example.invalid']);
  run('git',['config','user.name','Second-brand CI fixture']);
  run('git',['add','.']);
  run('git',['commit','-qm','baseline: isolated SykkelLab Demo']);
  const baseContent=read(renamed);
  shared.heading='Vedlikeholdsråd – bekreftet etter Git-lagring';
  shared.body[0]='Blåbærsykkel, sølvkjede og værmelding: Oppdatert i testens redigeringsrunde.';
  writeJson(renamed,shared);
  run('git',['add',renamed]);
  run('git',['commit','-qm','simulated CMS edit: change shared content source']);
  ensure(run('git',['show','HEAD:'+renamed]).includes(shared.heading),'Git commit did not save edited content');
  const reloaded=readJson(renamed);
  assert.equal(reloaded.heading,shared.heading,'Reopen did not preserve edited value');
  run('npm',['run','build']);
  inspectBuild(shared.heading);
  child=startPreview();
  await awaitPreview();
  await inspectBrowser(shared.heading).catch(error=>{console.error('Browser gate:',error.stack||error);throw error;});
  await new Promise(resolve=>{const current=child;current.once('exit',resolve);current.kill('SIGTERM');});child=undefined;
  run('git',['revert','--no-edit','HEAD']);
  ensure(read(renamed)===baseContent,'Revert did not restore original content exactly');
  run('npm',['run','build']);
  inspectBuild('Sykkelservice for alle typer turer');
  ensure(!read('dist/index.html').includes(shared.heading),'Edited content persists after revert');
  ensure(run('git',['status','--porcelain']).trim()==='','Fixture git worktree not clean after revert: '+run('git',['status','--porcelain']));
  // Issue #30: isolated Pages CMS JSON -> Git -> build -> browser, with no real customer edits.
  const beforeTypography=await previewTypography();
  const originalAppearance=read('src/content/site-chrome/appearance.json');
  const typAppearance=readJson('src/content/site-chrome/appearance.json');
  typAppearance.typography={fontFamily:'serif'};
  writeJson('src/content/site-chrome/appearance.json',typAppearance);
  run('git',['add','src/content/site-chrome/appearance.json']);
  run('git',['commit','-qm','simulated Pages CMS typography token edit only']);
  ensure(run('git',['show','HEAD:src/content/site-chrome/appearance.json']).includes('"fontFamily"'),'font selection was not saved in Git');
  assert.equal(readJson('src/content/site-chrome/appearance.json').typography.fontFamily,'serif');
  run('npm',['run','build']);
  const afterTypography=await previewTypography();
  console.log('MWS #30 diagnostic',JSON.stringify({before:beforeTypography[0],after:afterTypography[0]}));
  for(let i=0;i<beforeTypography.length;i++){
   const a=beforeTypography[i],b=afterTypography[i];
   for(const role of ['h1','h2','body','header','footer']){
     ensure(a[role]===b[role],role+' size changed after font-only edit at '+a.width+'/'+a.theme+': '+a[role]+' -> '+b[role]);
     ensure(a[role+'Font']!==b[role+'Font'],role+' font did not change after CMS edit at '+a.width+'/'+a.theme+': '+a[role+'Font']);
    }
  }
  run('git',['revert','--no-edit','HEAD']);
  ensure(read('src/content/site-chrome/appearance.json')===originalAppearance,'CMS revert must restore old appearance exactly');
  run('npm',['run','build']);
  ensure(run('git',['status','--porcelain']).trim()==='','Typography fixture dirty after revert: '+run('git',['status','--porcelain']));
  console.log('PASS Oslo #87: font-only CMS save/Git/build/revert; sizes unchanged, font changed on H1/H2/body/header/footer at 390/768/1440 in Light/Dark');
  console.log('PASS second brand: independent root install, CMS config paths, distinct theme/brand/IDs, save/commit/reopen/revert, normal routes indexable in source; 404 excluded');
 }finally{
  if(browser)await browser.close().catch(()=>{});
  if(child&&child.exitCode===null)await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM');});
  rmSync(sandbox,{recursive:true,force:true,maxRetries:10,retryDelay:250});
 }
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
