import { useEffect, useState } from 'react';
import type { BaseImage } from './base-image';
import { openPdf } from './drawing-import';
export type PdfViewport={x:number;y:number;width:number;height:number};
export function usePdfPatch(base:BaseImage,view:PdfViewport,pixels:number){
 const [doc,setDoc]=useState<Awaited<ReturnType<typeof openPdf>>>();
 const [patch,setPatch]=useState<{url:string;view:PdfViewport}>();
 useEffect(()=>{if(!base.pdfSource)return;let cancelled=false,loaded:Awaited<ReturnType<typeof openPdf>>|undefined;setPatch(undefined);setDoc(undefined);void openPdf(base.pdfSource).then(d=>{loaded=d;if(cancelled)void d.destroy();else setDoc(d);}).catch(()=>{});return()=>{cancelled=true;if(loaded)void loaded.destroy();};},[base.pdfSource]);
 useEffect(()=>{if(!doc||pixels<=0)return;let cancelled=false,task:ReturnType<typeof doc.page.render>|undefined;const canvas=document.createElement('canvas');
  const timer=setTimeout(()=>{const scale=Math.min(pixels*1.5/view.width,Math.sqrt(5000000/(view.width*view.height)));canvas.width=Math.max(1,Math.ceil(view.width*scale));canvas.height=Math.max(1,Math.ceil(view.height*scale));task=doc.page.render({canvas,viewport:doc.page.getViewport({scale}),transform:[1,0,0,1,-view.x*scale,-view.y*scale]});void task.promise.then(()=>{if(!cancelled)setPatch({url:canvas.toDataURL('image/png'),view});}).catch(()=>{}).finally(()=>{canvas.width=canvas.height=0;});},180);
  return()=>{cancelled=true;clearTimeout(timer);task?.cancel();};
 },[doc,view,pixels]);
 return patch;
}
