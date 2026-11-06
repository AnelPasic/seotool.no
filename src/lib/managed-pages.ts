/** Validate only newly CMS-managed page files; never touch existing core pages. */
const simple=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const article=/^innsikt\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const blocked=new Set(['home','404','design-system','sitemap.xml','priser','kontakt','om','brukervilkar','personvern','artikkel']);
const fixedRoots=new Set(['404.json','home.json','kontakt.json','om.json','priser.json','brukervilkar.json','personvern.json']);
export function assertManagedPageSource(source:string,raw:unknown):void{
 const relative=source.replace(/\\/g,'/').split('/content/pages/')[1];
 if(!relative)throw new Error('Invalid source path: '+source);
 // Native unified service collection creates root JSON next to the seeded service.
 if(!relative.includes('/')){
  if(fixedRoots.has(relative))return;
  if(!raw||typeof raw!=='object')throw new Error('Invalid root page content: '+source);
  const page=raw as {slug?:unknown;kind?:unknown};
  if(page.kind!=='service')throw new Error('Wrong root service kind: '+source);
  if(typeof page.slug!=='string'||!simple.test(page.slug)||blocked.has(page.slug))
   throw new Error('Invalid root service slug: '+String(page.slug));
  if(relative!==page.slug+'.json')throw new Error('Root service filename/slug mismatch: '+source);
  return;
 }
 if(!relative.startsWith('managed-'))return;
 const match=/^(managed-services|managed-articles)\/([^/]+\.json)$/.exec(relative);
 if(!match)throw new Error('Invalid managed path: '+source);
 const [,folder,file]=match;
 if(!raw||typeof raw!=='object')throw new Error('Invalid page content: '+source);
 const page=raw as {slug?:unknown;kind?:unknown};
 const service=folder==='managed-services';
 if(page.kind!==(service?'service':'article'))throw new Error('Wrong managed page kind: '+source);
 if(typeof page.slug!=='string'||!(service?simple:article).test(page.slug)||blocked.has(page.slug))throw new Error('Invalid managed page slug: '+String(page.slug));
 const expected=(service?page.slug:page.slug.replace('/','-'))+'.json';
 if(file!==expected)throw new Error('Managed filename/slug mismatch: '+source);
}
export function assertInternalTargets(pages:readonly {slug:string}[],sources:readonly unknown[]):void{
 const valid=new Set(pages.filter(p=>p.slug!=='404').map(p=>p.slug==='home'?'/':'/'+p.slug+'/'));
 valid.add('/design-system/');
 const visit=(value:unknown):void=>{
  if(Array.isArray(value)){value.forEach(visit);return;}
  if(!value||typeof value!=='object')return;
  for(const [key,field] of Object.entries(value)){
   if(key==='href'&&typeof field==='string'&&field.startsWith('/')&&!field.startsWith('//')){
    const path=field.split(/[?#]/,1)[0]||'/';
    const canonical=path==='/'?'/':path.endsWith('/')?path:path+'/';
    if(!valid.has(canonical))throw new Error('Broken internal link after page delete: '+field);
   }else visit(field);
  }
 };
 sources.forEach(visit);
}
