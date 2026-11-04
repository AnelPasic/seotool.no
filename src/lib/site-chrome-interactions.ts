/** Ordinary website navigation disclosure, not an application ARIA menu. */
export function mountHeaderNavigation(header:HTMLElement){
 const toggle=header.querySelector<HTMLButtonElement>('[data-home-menu]')!;
 const mobile=header.querySelector<HTMLElement>('[data-mws-mobile-nav]')!;
 const controls=[...header.querySelectorAll<HTMLButtonElement>('[data-nav-disclosure]')];
 const desktopFinePointer=matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
 const closing=new WeakMap<HTMLLIElement,ReturnType<typeof setTimeout>>();
 const panel=(button:HTMLButtonElement)=>header.querySelector<HTMLElement>('#'+button.getAttribute('aria-controls')!)!;
 function cancelClose(item:HTMLLIElement){const timer=closing.get(item);if(timer!==undefined)clearTimeout(timer);}
 function setOpen(button:HTMLButtonElement,open:boolean){
  const item=button.closest('li')!;cancelClose(item);
  button.setAttribute('aria-expanded',String(open));
  panel(button).hidden=!open;
  item.toggleAttribute('data-nav-open',open);
 }
 function closeChildren(){controls.forEach(button=>setOpen(button,false));}
 function closeMobile(){
  closeChildren();toggle.setAttribute('aria-expanded','false');
  toggle.setAttribute('aria-label',toggle.dataset.openLabel!);mobile.hidden=true;
 }
 function openChild(button:HTMLButtonElement){closeChildren();setOpen(button,true);}
 controls.forEach(button=>{
  const item=button.closest<HTMLLIElement>('li.header-nav-item')!;
  button.addEventListener('click',()=>{
   const open=button.getAttribute('aria-expanded')!=='true';
   closeChildren();if(open)setOpen(button,true);
  });
  button.addEventListener('keydown',event=>{
   if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
   event.preventDefault();openChild(button);
   const links=[...panel(button).querySelectorAll<HTMLAnchorElement>('a')];
   (event.key==='ArrowDown'?links[0]:links.at(-1))?.focus();
  });
  item.addEventListener('focusout',event=>{
   if(!item.contains(event.relatedTarget as Node|null))setOpen(button,false);
  });
  if(item.closest('.desktop-nav')){
   item.addEventListener('pointerenter',event=>{
    if(event.pointerType==='mouse'&&desktopFinePointer.matches)openChild(button);
   });
   item.addEventListener('pointerleave',event=>{
    if(event.pointerType!=='mouse'||!desktopFinePointer.matches)return;
    cancelClose(item);
    closing.set(item,setTimeout(()=>setOpen(button,false),150));
   });
  }
 });
 toggle.addEventListener('click',()=>{
  const open=toggle.getAttribute('aria-expanded')!=='true';closeMobile();
  if(open){toggle.setAttribute('aria-expanded','true');
   toggle.setAttribute('aria-label',toggle.dataset.closeLabel!);mobile.hidden=false;}
 });
 header.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMobile));
 document.addEventListener('click',event=>{
  if(!header.contains(event.target as Node))closeMobile();
 });
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  const child=controls.find(button=>button.getAttribute('aria-expanded')==='true');
  if(child){event.preventDefault();setOpen(child,false);child.focus();return;}
  if(toggle.getAttribute('aria-expanded')==='true'){
   event.preventDefault();closeMobile();toggle.focus();
  }
 });
 matchMedia('(min-width: 901px)').addEventListener('change',event=>{
  const active=document.activeElement;
  const hiddenFocus=event.matches?mobile.contains(active):!!header.querySelector('.desktop-nav')?.contains(active);
  closeMobile();
  if(hiddenFocus)(event.matches?header.querySelector<HTMLAnchorElement>('.desktop-nav a'):toggle)?.focus();
 });
}

/** One site header per page. Preserve Oslo's interaction code and use only
 * MWS-specific data binding for locating the exported header/mobile region. */
export function mountSiteChromeHeaders():void {
  document.querySelectorAll<HTMLElement>('[data-mws-chrome-header]').forEach(header=>{
    if(header.dataset.mwsMounted==='1')return;
    header.dataset.mwsMounted='1';
    mountHeaderNavigation(header);
  });
}
