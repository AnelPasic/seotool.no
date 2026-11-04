/** Restricted Markdown for user-authored CMS content.
 * Source is always plain Markdown; HTML is never interpreted, and every URL is validated.
 * Supported: h2-h6, paragraphs, unordered/ordered lists, emphasis and links.
 * Never use this to render arbitrary raw HTML or untrusted URLs.
 */
const html=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
function href(value:string):string|undefined {
  if(!value||/[\u0000-\u0020\u007f<>"'\\]/.test(value))return;
  if(value.startsWith('/'))return value.startsWith('//')?undefined:value;
  if(value.startsWith('#'))return /^#[A-Za-z][A-Za-z0-9_-]*$/.test(value)?value:undefined;
  try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?value:undefined;}
  catch{return;}
}
const inlinePattern=/!?\[([^\]\n]+)\]\(([^)\n]*)\)|\*\*([^*\n]+)\*\*|__([^_\n]+)__|\*([^*\n]+)\*|_([^_\n]+)_/g;
function inline(source:string,depth=0):string {
  if(depth>5)return html(source);
  const re=new RegExp(inlinePattern.source,'g');let out='',pos=0;
  for(const match of source.matchAll(re)){
    const index=match.index??0;
    out+=html(source.slice(pos,index));
    const token=match[0],link=match[1],url=match[2];
    if(link!==undefined){
      const safe=url===undefined?undefined:href(url.trim());
      out+=token.startsWith('!')||!safe?html(token):'<a href="'+html(safe)+'">'+html(link)+'</a>';
    }else if(match[3]!==undefined||match[4]!==undefined){
      out+='<strong>'+inline(match[3]??match[4]??'',depth+1)+'</strong>';
    }else out+='<em>'+inline(match[5]??match[6]??'',depth+1)+'</em>';
    pos=index+token.length;
  }
  return out+html(source.slice(pos));
}
const heading=/^\s{0,3}(#{1,6})[ \t]+(.+?)\s*$/;
const bullet=/^\s{0,3}([-+*]|\d+[.)])[ \t]+(.+?)\s*$/;
/** Legacy plain content does not need any rewrite or additional paragraph structure. */
export function hasRichMarkdown(source:string):boolean {
  if(!source)return false;
  return /(^|\n)\s{0,3}(?:#{1,6}|[-+*]|\d+[.)])[ \t]+\S/.test(source)
    || /\*\*[^*\n]+\*\*|__[^_\n]+__/.test(source)
    || /(^|[\s(])\*[^*\n]+\*(?=$|[\s.,;:!)])/m.test(source)
    || /(^|[\s(])_[^_\n]+_(?=$|[\s.,;:!)])/m.test(source)
    || /\[[^\]\n]+\]\([^\n)]*\)/.test(source);
}
/** Render an isolated body/card text. Every HTML angle bracket is escaped. */
export function renderSafeMarkdown(source:string):string {
  if(typeof source!=='string')throw new Error('Rich text must be a string');
  const lines=source.replace(/\r\n?/g,'\n').split('\n');
  const parts:string[]=[];let at=0;
  while(at<lines.length){
    const line=lines[at];
    if(!line.trim()){at++;continue;}
    const h=line.match(heading);
    if(h){
      if(h[1].length===1)throw new Error('H1 is reserved for the page Hero');
      const n=h[1].length;
      parts.push('<h'+n+'>'+inline(h[2])+'</h'+n+'>');at++;continue;
    }
    const list=line.match(bullet);
    if(list){
      const ordered=/^\d/.test(list[1]);const tag=ordered?'ol':'ul';const items:string[]=[];
      while(at<lines.length){
        const row=lines[at].match(bullet);
        if(!row||/^\d/.test(row[1])!==ordered)break;
        items.push('<li>'+inline(row[2])+'</li>');at++;
      }
      parts.push('<'+tag+'>'+items.join('')+'</'+tag+'>');continue;
    }
    const paragraph:string[]=[];
    while(at<lines.length&&lines[at].trim()&&!heading.test(lines[at])&&!bullet.test(lines[at])){
      paragraph.push(lines[at].trim());at++;
    }
    parts.push('<p>'+inline(paragraph.join(' '))+'</p>');
  }
  return parts.join('\n');
}
