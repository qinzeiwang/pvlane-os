import type { BaseImage } from './base-image';
import { requireSinglePage } from './pdf-policy';
export const readDataUrl=(file:File)=>new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(new Error('文件读取失败'));r.readAsDataURL(file);});
export async function openPdf(source:string){
 const pdf=await import('pdfjs-dist');
 const worker=await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
 pdf.GlobalWorkerOptions.workerSrc=worker.default;
 const data=Uint8Array.from(atob(source.split(',')[1]),c=>c.charCodeAt(0));
 const task=pdf.getDocument({data,cMapUrl:'/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdfjs/standard_fonts/',wasmUrl:'/pdfjs/wasm/'});
 try {const document=await task.promise;requireSinglePage(document.numPages);return {page:await document.getPage(1),destroy:()=>task.destroy()};}
 catch(e){await task.destroy();throw e;}
}
export async function loadDrawing(file:File):Promise<BaseImage>{
 if(file.size>30000000)throw new Error('底图文件不超过 30 MB');
 if(file.type==='application/pdf'||/\.pdf$/i.test(file.name)){
  const pdfSource=(await readDataUrl(file)).replace(/^data:[^;]*;/,'data:application/pdf;'),doc=await openPdf(pdfSource);
  try{const native=doc.page.getViewport({scale:1}),scale=Math.min(2,4096/Math.max(native.width,native.height)),viewport=doc.page.getViewport({scale});
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
   await doc.page.render({canvas,viewport}).promise;
   const url=canvas.toDataURL('image/png');canvas.width=canvas.height=0;
   return {name:file.name,url,pdfSource,width:native.width,height:native.height};
  }finally{await doc.destroy();}
 }
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('请选择单页 PDF、PNG、JPG 或 WebP');
 const url=await readDataUrl(file),image=new Image();image.src=url;await image.decode();
 if(image.width>10000||image.height>10000)throw new Error('图片边长不超过 10000 像素');
 return {name:file.name,url,width:image.width,height:image.height};
}
