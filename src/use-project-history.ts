import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {UndoHistory} from './undo-history';
export const isTextEditing=(target:EventTarget|null)=>target instanceof HTMLElement&&!!target.closest('input,textarea,select,[contenteditable="true"]');
export function useProjectHistory<T>(value:T,equal:(a:T,b:T)=>boolean,restore:(v:T)=>void,epoch:number,keyboardEnabled:boolean){
 const [revision,refresh]=useState(0),history=useRef<UndoHistory<T>|null>(null),group=useRef<unknown>(null),lastEpoch=useRef(epoch),restoring=useRef(false);
 if(!history.current)history.current=new UndoHistory(value,equal);
 const callbacks=useRef({restore,keyboardEnabled});callbacks.current={restore,keyboardEnabled};
 useLayoutEffect(()=>{
  const h=history.current!;
  if(lastEpoch.current!==epoch){h.reset(value);lastEpoch.current=epoch;group.current=null;refresh(n=>n+1);}
  else if(restoring.current){h.present=value;restoring.current=false;}
  else if(h.record(value,group.current))refresh(n=>n+1);
 },[value,epoch]);
 const travel=(redo:boolean)=>{const next=redo?history.current!.redo():history.current!.undo();if(next!==undefined){restoring.current=true;group.current=null;callbacks.current.restore(next);refresh(n=>n+1);}};
 const actions=useRef(travel);actions.current=travel;
 useEffect(()=>{
  let focusToken:object|null=null;
  const focus=(e:FocusEvent)=>{if(isTextEditing(e.target)){focusToken={};group.current=focusToken;}};
  const blur=()=>{focusToken=null;group.current=null;};
  const down=()=>{group.current=focusToken??{};};
  const up=()=>{const token=group.current;setTimeout(()=>{if(group.current===token)group.current=focusToken;},0);};
  const key=(e:KeyboardEvent)=>{if(!callbacks.current.keyboardEnabled||e.defaultPrevented||isTextEditing(e.target)||!(e.ctrlKey||e.metaKey)||e.altKey)return;const k=e.key.toLowerCase();if(k==='z'||k==='y'){e.preventDefault();actions.current(k==='y'||e.shiftKey);}};
  window.addEventListener('focusin',focus);window.addEventListener('focusout',blur);window.addEventListener('pointerdown',down,true);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);window.addEventListener('keydown',key);window.addEventListener('blur',blur);
  return()=>{window.removeEventListener('focusin',focus);window.removeEventListener('focusout',blur);window.removeEventListener('pointerdown',down,true);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);window.removeEventListener('keydown',key);window.removeEventListener('blur',blur);};
 },[]);
 void revision;
 return {undo:()=>travel(false),redo:()=>travel(true),canUndo:history.current.past.length>0,canRedo:history.current.future.length>0};
}
