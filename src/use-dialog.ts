import {useEffect,useRef} from 'react';

/** Keep modal keyboard input inside the dialog and restore the opener on exit. */
export function useDialog(selector:string,open:boolean,onClose:(()=>void)|null){
 const close=useRef(onClose);close.current=onClose;
 useEffect(()=>{
  if(!open)return;
  const dialog=document.querySelector<HTMLElement>(selector);if(!dialog)return;
  const opener=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const blocked:{element:HTMLElement;inert:boolean}[]=[];
  for(let branch:HTMLElement|null=dialog;branch?.parentElement;branch=branch.parentElement){
   for(const sibling of branch.parentElement.children){
    if(sibling!==branch&&sibling instanceof HTMLElement){blocked.push({element:sibling,inert:sibling.inert});sibling.inert=true;}
   }
  }
  const focusable=()=>Array.from(dialog.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],summary,iframe,[tabindex]')).filter(el=>!el.matches(':disabled,[hidden],[tabindex="-1"]')&&!el.closest('[hidden],[inert]')&&el.getClientRects().length>0);
  const originalTabIndex=dialog.getAttribute('tabindex');dialog.tabIndex=-1;
  (dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]')??(dialog.hasAttribute('data-dialog-initial-focus')?dialog:null)??focusable()[0]??dialog).focus({preventScroll:true});
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'&&close.current){event.preventDefault();event.stopImmediatePropagation();close.current();return;}
   if(event.key!=='Tab')return;
   const items=focusable(),first=items[0],last=items.at(-1);
   if(!first){event.preventDefault();dialog.focus();return;}
   if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialog)){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',key,true);
  const message=(event:MessageEvent)=>{if(event.data==='pvlane-close-report'&&event.source===dialog.querySelector('iframe')?.contentWindow)close.current?.();};
  window.addEventListener('message',message);
  return()=>{
   document.removeEventListener('keydown',key,true);
   window.removeEventListener('message',message);
   blocked.forEach(({element,inert})=>{element.inert=inert;});
   if(originalTabIndex===null)dialog.removeAttribute('tabindex');else dialog.setAttribute('tabindex',originalTabIndex);
   if(opener?.isConnected&&!opener.closest('[inert]'))opener.focus({preventScroll:true});
  };
 },[selector,open]);
}
