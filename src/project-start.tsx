import {BrandLogo} from './brand-logo';
import {useRef,useState} from 'react';
import {Icon} from './workbench-ui';
import './project-start.css';

export function ProjectStart({pendingDrawing,name,address,onName,onAddress,creating,message,busy,onNew,onBack,onOpen,onCreate}:{pendingDrawing?:string;name:string;address:string;onName:(v:string)=>void;onAddress:(v:string)=>void;creating:boolean;message:string;busy:boolean;onNew:()=>void;onBack:()=>void;onOpen:(file?:File)=>Promise<void>;onCreate:(mode:'blank'|'drawing',file?:File)=>void}){
 const input=useRef<HTMLInputElement>(null);
 const [opening,setOpening]=useState(false);
 const drawingInput=useRef<HTMLInputElement>(null);
 return <main className="project-start">
  <div className="start-brand"><BrandLogo/></div>
  <section className="start-card">
   <span className="start-eyebrow">前期方案 · 从场地到装机量</span>
   <h1>{creating?'新建项目':'开始一个光伏方案'}</h1>
   {creating?<><div className="start-project-fields"><label>项目名称<input aria-label="新建项目名称" value={name} onChange={e=>onName(e.target.value)} onBlur={()=>{if(!name.trim())onName('未命名项目');}}/></label><label>项目地点<input aria-label="新建项目地点" placeholder="选填" value={address} onChange={e=>onAddress(e.target.value)}/></label></div><div className="start-options">
    <button disabled={busy} onClick={()=>pendingDrawing?onCreate('drawing'):drawingInput.current?.click()}><span className="start-option-icon open"><Icon name="folder"/></span><strong>{busy?'正在导入…':pendingDrawing?'继续标定':'导入底图'}</strong><small>{pendingDrawing??'图片 / 单页 PDF'}</small></button>
    <button disabled={busy} onClick={()=>onCreate('blank')}><span className="start-option-icon"><Icon name="frame"/></span><strong>无底图</strong><small>直接进入工作台</small></button>
   </div><div className="start-form-actions"><button disabled={busy} onClick={onBack}>返回</button></div><input ref={drawingInput} hidden type="file" accept="application/pdf,.pdf,image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0];e.target.value='';if(f)onCreate('drawing',f);}}/></>:<div className="start-options">
    <button onClick={onNew}><span className="start-option-icon"><Icon name="plus"/></span><strong>新建项目</strong><small>导入图纸，开始布置</small></button>
    <button disabled={opening} onClick={()=>input.current?.click()}><span className="start-option-icon open"><Icon name="folder"/></span><strong>{opening?'正在打开…':'打开项目'}</strong><small>从 JSON 文件继续方案</small></button>
   </div>}
   <input ref={input} hidden type="file" accept=".json" onChange={async e=>{const f=e.target.files?.[0];e.target.value='';setOpening(true);try{await onOpen(f);}finally{setOpening(false);}}}/>
   {message&&<p className="start-error" role="alert">{message}</p>}
  </section>
 </main>;
}
