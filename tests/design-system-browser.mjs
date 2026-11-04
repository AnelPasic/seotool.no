// Targeted gallery QA, deliberately separate from the ordinary verify command.
// node tests/design-system-browser.mjs --url http://127.0.0.1:4337 --reference http://127.0.0.1:4336 --evidence PATH
import {chromium} from 'playwright';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
const flag=n=>process.argv[process.argv.indexOf(n)+1];
const base=flag('--url'),reference=flag('--reference'),output=resolve(flag('--evidence'));
assert.ok(base?.startsWith('http://127.0.0.1:')&&reference?.startsWith('http://127.0.0.1:'),'Use local QA targets only');
mkdirSync(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--force-device-scale-factor=1']});
const report={viewports:[390,768,1440],zoom:1,checks:[],samples:[],differences:[],errors:[]};
const check=(condition,label)=>{report.checks.push({label,pass:!!condition});};
const routes=[['gallery','/design-system/','/qa-neutral/'],['global','/design-system/global-elements/','/qa-neutral-global/'],['proof','/design-system/proof-list/','/qa-neutral-proof/']];
const selectors=['.site-header','.header-inner','main h1','main h2','.ds-type-specimen h2','[data-hero-demo="split-right"] .hero-frame','[data-hero-demo="split-right"] .hero-proof','[data-hero-demo="service"] .hero-frame','[data-hero-demo="pricing"] .hero-frame','[data-daisy-card-color="secondary"] .card-body','[data-assessment-layout="split"] .assessment-form','[data-assessment-layout="horizontal"] .assessment-form','[data-leverage] .leverage-grid','[data-leverage] .calculator-inputs','[data-proof-list-specimen="proof-list-kort"] .card-body','.site-footer','.footer-grid--columns'];
const snapshot=()=>{
 const props=['fontSize','lineHeight','fontWeight','fontFamily','paddingTop','paddingRight','paddingBottom','paddingLeft','borderRadius','backgroundColor','color','gridTemplateColumns','gap','position','top'];
 const nodes={};
 for(const selector of window.__qaSelectors){
  const el=document.querySelector(selector);if(!el)continue;
  const style=getComputedStyle(el),rect=el.getBoundingClientRect();
  nodes[selector]={tag:el.tagName,classes:el.className,width:rect.width,height:rect.height,styles:Object.fromEntries(props.map(k=>[k,style[k]])),dom:el.outerHTML.slice(0,900)};
 }
 const grids=[...document.querySelectorAll('[data-page-list-demo-layout]')].map(el=>{
  const grid=el.querySelector('.section-items,.page-list');return {layout:el.getAttribute('data-page-list-demo-layout'),requested:Number(el.getAttribute('data-page-list-demo-columns')),columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length};
 });
 return {width:innerWidth,scale:visualViewport.scale,dpr:devicePixelRatio,overflow:document.documentElement.scrollWidth-innerWidth,nodes,grids,theme:document.documentElement.dataset.mwsThemeMode,robots:document.querySelector('meta[name="robots"]')?.getAttribute('content'),modalCount:document.querySelectorAll('pagefind-modal').length,forms:[...document.querySelectorAll('form')].map(f=>({method:f.method,action:f.getAttribute('action'),endpoint:f.getAttribute('data-endpoint'),submitDisabled:f.querySelector('[type="submit"]')?.disabled}))};
};
try {
 for(const width of report.viewports){
  const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1,colorScheme:'light',reducedMotion:'reduce'});
  const mws=await context.newPage(),oslo=await context.newPage();
  for(const p of [mws,oslo])p.on('pageerror',e=>report.errors.push(e.message));
  for(const [route,path,refPath] of routes){
   for(const [name,p,url] of [['mws',mws,base+path],['oslo',oslo,reference+refPath]]){
    const response=await p.goto(url,{waitUntil:'networkidle'});check(response.status()===200,`${name} ${route} ${width}: HTTP 200`);
    await p.evaluate(()=>document.fonts.ready);
    for(const theme of ['light','dark']){
     if(route==='gallery')await p.locator(`[data-design-theme-mode][value="${theme}"]`).check();
     else {await p.evaluate(mode=>localStorage.setItem('mws-theme-mode',mode),theme);await p.reload({waitUntil:'networkidle'});}
     if(route!=='gallery'){await p.waitForLoadState('networkidle');await p.evaluate(()=>document.fonts.ready);}
     await p.evaluate(s=>window.__qaSelectors=s,selectors);
     const data=await p.evaluate(snapshot);report.samples.push({name,route,width,theme,...data});
     check(data.width===width&&data.scale===1&&data.dpr===1,`${name} ${route} ${width} ${theme}: CSS pixels / 100% zoom`);
     if(name==='mws'){
      check(data.nodes['.footer-grid--columns'].styles.gridTemplateColumns.split(' ').length===(width<=480?1:width<=650?2:width<=1100?3:4),`${route} ${width} ${theme}: intended Footer columns`);
      check(data.nodes['.site-header'].styles.fontFamily.includes('Figtree'),`${route} ${width} ${theme}: source body font`);
      check(data.overflow<=1,`${route} ${width} ${theme}: no page overflow (${data.overflow}px)`);
      check(data.robots==='noindex,nofollow',`${route} ${width} ${theme}: noindex`);
      check(data.modalCount===1,`${route} ${width} ${theme}: one Pagefind modal`);
      check(data.theme===theme,`${route} ${width} ${theme}: synchronized theme`);
      check(Math.abs(parseFloat(data.nodes['main h1'].styles.fontSize)-Math.min(52,Math.max(28,width*.045)))<0.1,`${route} ${width} ${theme}: source H1 scale`);
      if(route==='gallery'){
       check(await p.locator('[data-hero-demo] .hero-proof').count()===5,`${width} ${theme}: fictional featured-proof specimens`);
       check(await p.locator('[data-hero-demo]').count()===8,`${width} ${theme}: eight source Hero specimens`);
       check(await p.locator('[data-daisy-card-color]').count()===11,`${width} ${theme}: eleven semantic Card specimens`);
       check(data.grids.length===13,`${width} ${theme}: all thirteen PageList layout/column specimens`);
       for(const grid of data.grids)check(grid.columns===(grid.layout==='alternating'?1:Math.min(grid.requested,width<=700?1:width<=1100?2:3)),`${width} ${theme}: ${grid.layout}/${grid.requested} responsive columns (${grid.columns})`);
       check(data.forms.every(f=>f.method==='dialog'&&!f.action&&!f.endpoint&&f.submitDisabled),`${width} ${theme}: forms are inert without JavaScript`);
      }
     }
     const height=await p.evaluate(()=>document.documentElement.scrollHeight);
     for(let y=0;y<height;y+=6000){const file=join(output,`${name}-${route}-${width}-${theme}-${y}.webp`);if(!existsSync(file))await p.screenshot({path:file,type:'webp',quality:65,clip:{x:0,y,width,height:Math.min(6000,height-y)},captureBeyondViewport:true,fullPage:true});}
     if(name==='mws'&&width===1440&&theme==='light')writeFileSync(join(output,`${route}-dom.html`),await p.content());
    }
   }
  }
  // Interactive behavior once per representative width, outside screenshot state.
  await mws.goto(base+'/design-system/',{waitUntil:'networkidle'});
  await mws.locator('[data-design-theme-mode][value="dark"]').check();await mws.reload({waitUntil:'networkidle'});
  check(await mws.locator('[data-design-theme-mode][value="dark"]').isChecked(),`${width}: gallery/header theme persists after reload`);
  const summary=mws.locator('#ds-home-faq summary').first();await summary.focus();await summary.press('Enter');
  check(await summary.evaluate(el=>el.parentElement.open),`${width}: FAQ opens by keyboard`);
  if(width<=900){
   const menu=mws.locator('[data-mws-mobile-toggle]');await menu.click();check(await menu.getAttribute('aria-expanded')==='true',`${width}: mobile menu opens`);await mws.keyboard.press('Escape');check(await menu.getAttribute('aria-expanded')==='false',`${width}: mobile menu closes on Escape`);
  }else{
   const mega=mws.locator('.desktop-nav button[aria-expanded]').first();await mega.focus();await mega.press('Enter');check(await mega.getAttribute('aria-expanded')==='true','1440: mega opens by keyboard');await mws.keyboard.press('Escape');check(await mega.getAttribute('aria-expanded')==='false','1440: mega closes on Escape');
  }
  let outbound=0;mws.on('request',r=>{if(r.method()==='POST')outbound++;});
  await mws.locator('form').evaluateAll(forms=>forms.forEach(form=>{form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));HTMLFormElement.prototype.submit.call(form);}));
  check(outbound===0&&mws.url()===base+'/design-system/',`${width}: programmatic demo submits do not send or navigate`);
  if(width===1440){
   const results=await mws.evaluate(async()=>{const pf=await import('/pagefind/pagefind.js');const r=await pf.search('tjeneste');return await Promise.all(r.results.map(async x=>(await x.data()).url));});
   check(results.length>0&&results.every(url=>!url.includes('/design-system/')),'Pagefind returns actual public pages and no internal gallery');
   await mws.locator('pagefind-modal-trigger').first().click();
   check(await mws.locator('pagefind-modal').evaluate(el=>!!el.querySelector('dialog[open]')),'Pagefind modal opens');
   await mws.keyboard.press('Escape');
   await oslo.goto(reference+'/qa-neutral/',{waitUntil:'networkidle'});
   check(await oslo.evaluate(()=>!!customElements.get('pagefind-modal-trigger')&&document.querySelectorAll('pagefind-modal').length===1),'Reference Pagefind is upgraded and mounted once with neutral generated assets');
   const referenceResults=await oslo.evaluate(async()=>{const pf=await import('/pagefind/pagefind.js');const r=await pf.search('tjeneste');return await Promise.all(r.results.map(async x=>(await x.data()).url));});
   check(referenceResults.length>0&&referenceResults.every(url=>!url.includes('/design-system/')),'Reference search uses the same neutral public-page index');
   await oslo.locator('pagefind-modal-trigger').first().click();
   await oslo.locator('pagefind-modal dialog').waitFor({state:'visible'});
   check(await oslo.locator('pagefind-modal dialog').isVisible(),'Reference Pagefind modal opens');
   await oslo.screenshot({path:join(output,'oslo-search-1440.png')});
   await oslo.keyboard.press('Escape');
  }
  await context.close();
 }
 for(const sample of report.samples.filter(x=>x.name==='mws')){
  const ref=report.samples.find(x=>x.name==='oslo'&&x.route===sample.route&&x.width===sample.width&&x.theme===sample.theme);if(!ref)continue;
  for(const [selector,node] of Object.entries(sample.nodes)){
   const original=ref.nodes[selector];if(!original)continue;
   const changes={};
   for(const [key,value] of Object.entries(node.styles)){
    const norm=x=>x.replaceAll('"',"'");if(norm(value)!==norm(original.styles[key]))changes[key]={mws:value,oslo:original.styles[key]};
   }
   for(const key of ['width','height'])if(Math.abs(node[key]-original[key])>1)changes[key]={mws:node[key],oslo:original[key]};
   if(Object.keys(changes).length)report.differences.push({route:sample.route,width:sample.width,theme:sample.theme,selector,changes});
  }
 }
}finally{await browser.close();writeFileSync(join(output,'browser-report.json'),JSON.stringify(report,null,2));}
const failed=report.checks.filter(x=>!x.pass);console.log(JSON.stringify({checks:report.checks.length,failed,differences:report.differences.length,pageErrors:report.errors},null,2));
assert.equal(failed.length,0,'Browser contract failures: see browser-report.json');
assert.equal(report.errors.length,0,'Browser JavaScript errors: see browser-report.json');
