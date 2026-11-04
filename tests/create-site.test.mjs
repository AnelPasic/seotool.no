import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,existsSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import YAML from 'yaml';

const sourceBrand=JSON.parse(readFileSync(new URL('../src/content/site-chrome/header.json',import.meta.url),'utf8')).brand.name;
const expectedBrand=sourceBrand==='Eksempelbedrift'?'Nytt Verksted':sourceBrand;
const expectedTitle=JSON.parse(readFileSync(new URL('../src/content/pages/home.json',import.meta.url),'utf8')).seo.title.replaceAll('Eksempelbedrift','Nytt Verksted');
const script=fileURLToPath(new URL('../scripts/create-site.mjs',import.meta.url));
function exportSite(args){return execFileSync(process.execPath,[script,...args],{encoding:'utf8',timeout:20000});}
test('standalone root export rebrands all demo page titles, keeps CMS references and never overwrites',()=>{
 const root=mkdtempSync(join(tmpdir(),'mws-export-test-'));
 try{
  const target=join(root,'my-test');
  const output=exportSite(['--target',target,'--brand','Nytt Verksted']);
  assert.match(output,/CREATED/);
  assert.match(output,/DISCOVER existing repo\/Cloudflare Workers or Pages deploy FIRST/);
  const targetRecord=readFileSync(join(target,'coordination/PREVIEW-TARGET.md'),'utf8');
  assert.match(targetRecord,/UNVERIFIED/);
  assert.match(targetRecord,/UNKNOWN \(Workers \/ Pages \/ other\)/);
  assert.doesNotMatch(targetRecord,/https:\/\/[^\s]+\.pages\.dev/,'never invent a live preview');
  for(const name of ['package.json','.pages.yml','AGENTS.md','src/pages/index.astro','.node-version','public/_headers','PREVIEW-DEPLOY.md','CONTENT-SOURCE-OF-TRUTH.md','CONTENT-04-PAGE-PATTERNS.md','coordination/PREVIEW-TARGET.md'])assert.ok(existsSync(join(target,name)));
  const agents=readFileSync(join(target,'AGENTS.md'),'utf8');
  const readme=readFileSync(join(target,'README.md'),'utf8');
  assert.match(agents,/Read `README\.md` and `PREVIEW-DEPLOY\.md`/);
  assert.doesNotMatch(agents,/\.\.\/(?:starter\/)?TEST-WITH-AGENT\.md/,'exported AGENTS must not point outside the site root');
  assert.doesNotMatch(readme,/\]\(\.\.\/TEST-WITH-AGENT\.md\)/,'exported README must not have a broken upstream-relative link');
  assert.match(readme,/https:\/\/github\.com\/AnelPasic\/MedonWebSystem\/blob\/main\/starter\/TEST-WITH-AGENT\.md/);
  // Editorial routing must work after export, without MWS parent folders or missing vendor instructions.
  for(const name of ['coordination/CONTENT-TONE.json','coordination/CONTENT-VOICE-PROFILE.md','coordination/AGENT-VOICE-INSTRUCTIONS.md','coordination/H1-LAB.md'])
    assert.ok(existsSync(join(target,name)),name);
  const voice=readFileSync(join(target,'coordination/AGENT-VOICE-INSTRUCTIONS.md'),'utf8');
  const profile=readFileSync(join(target,'coordination/CONTENT-VOICE-PROFILE.md'),'utf8');
  const tone=JSON.parse(readFileSync(join(target,'coordination/CONTENT-TONE.json'),'utf8'));
  assert.equal(tone.defaultPreset,'balansert','new sites must not inherit Medon/Oslo personality');
  assert.match(agents,/Before drafting or editing any customer-facing text/);
  assert.match(agents,/coordination\/CONTENT-TONE\.json/);
  assert.match(agents,/coordination\/CONTENT-VOICE-PROFILE\.md/);
  assert.match(agents,/coordination\/AGENT-VOICE-INSTRUCTIONS\.md/);
   assert.match(agents,/coordination\/H1-LAB\.md/);
  assert.match(voice,/minneverdig|memorabil|point stick/i,'Spiss+ must aim for helpful memorability');
  assert.match(voice,/inherit/);
  assert.match(voice,/nøktern/);
  assert.match(voice,/does not automatically|neither rewrites|never authorizes rewriting/i);
  assert.doesNotMatch(voice+'\n'+profile,/CONTENT-VOICE-INSTALL\.md|vendor\/medon-web-system\//,'export must not require absent upstream files');
  assert.ok(!existsSync(join(target,'node_modules')));
  const header=JSON.parse(readFileSync(join(target,'src/content/site-chrome/header.json'),'utf8'));
  const home=JSON.parse(readFileSync(join(target,'src/content/pages/home.json'),'utf8'));
  const article=JSON.parse(readFileSync(join(target,'src/content/pages/managed-articles/innsikt-artikkel.json'),'utf8'));
  assert.equal(article.slug,'innsikt/artikkel');
  assert.ok(!existsSync(join(target,'src/content/pages/artikkel.json')));
  assert.equal(header.brand.name,expectedBrand);
  assert.equal(home.seo.title,expectedTitle);
  assert.ok(!home.seo.title.includes('Eksempelbedrift'));
  const cms=YAML.parseDocument(readFileSync(join(target,'.pages.yml'),'utf8'),{uniqueKeys:true});
  assert.equal(cms.errors.length,0);
  const config=cms.toJS();
  const toneEditor=config.content.find(x=>x.name==='contentTone');
  assert.equal(toneEditor?.path,'coordination/CONTENT-TONE.json');
  assert.equal(toneEditor?.type,'file');
  const group=config.content.find(x=>x.name==='globalContentGroup');
  assert.equal(group.items[0].type,'collection');
  assert.equal(group.items[0].path,'src/content/global-content');
  assert.equal(config.components.builderSharedPlacement.fields[0].options.collection,'sharedContent');
  for(const editor of config.content.filter(x=>x.type==='file'))assert.ok(existsSync(join(target,editor.path)),editor.path);
  assert.throws(()=>exportSite(['--target',target,'--brand','Overwrite']),/Command failed|EEXIST/);
  assert.equal(JSON.parse(readFileSync(join(target,'src/content/site-chrome/header.json'),'utf8')).brand.name,expectedBrand);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('export refuses unsafe source overlap and preserves existing files',()=>{
 const root=mkdtempSync(join(tmpdir(),'mws-export-guard-'));
 try{
  const existing=join(root,'filled');
  mkdirSync(existing);
  writeFileSync(join(existing,'important.txt'),'NO OVERWRITE');
  assert.throws(()=>exportSite(['--target',existing]),/Command failed|EEXIST/);
  assert.equal(readFileSync(join(existing,'important.txt'),'utf8'),'NO OVERWRITE');
  assert.throws(()=>exportSite(['--target',fileURLToPath(new URL('../',import.meta.url))]),/Command failed|EEXIST/);
 }finally{rmSync(root,{recursive:true,force:true});}
});
