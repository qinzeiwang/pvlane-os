import {readModuleLibrary,saveModuleLibrary,mergeModuleLibrary} from './saved-module-library';
import {useCallback,useEffect,useState} from 'react';
import {defaultModule,validModule} from './domain';
import {Icon} from './workbench-ui';
import type {ModuleCatalogItem} from './module-library';

type Props={items:ModuleCatalogItem[];usedIds:Set<string>;onChange:(items:ModuleCatalogItem[])=>string|null};
function LibraryItem({item,used,canDelete,onApply,onDelete,onDirty}:{item:ModuleCatalogItem;used:boolean;canDelete:boolean;onApply:(item:ModuleCatalogItem)=>string|null;onDelete:()=>void;onDirty:(id:string,dirty:boolean)=>void}){
 const [draft,setDraft]=useState(item),[error,setError]=useState('');
 useEffect(()=>{setDraft(item);setError('');},[item]);
 const dirty=JSON.stringify(draft)!==JSON.stringify(item);
 useEffect(()=>{onDirty(item.id,dirty);return()=>onDirty(item.id,false);},[item.id,dirty,onDirty]);
 const deleteReason=used?'正在被屋面使用，不能删除':!canDelete?'组件库至少保留一种组件':'删除组件';
 return <form className="module-library-item" onSubmit={e=>{e.preventDefault();if(!draft.name.trim()||!validModule(draft.spec)){setError('请填写名称和有效的组件规格');return;}setError(onApply({...draft,name:draft.name.trim()})??'');}}>
  <div className="module-library-heading"><input aria-label="组件名称" maxLength={80} required value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/><button type="button" className="icon-button" title={deleteReason} aria-label={`${deleteReason}：${item.name}`} disabled={!canDelete||used} onClick={onDelete}><Icon name="trash"/></button></div>
  <div className="module-library-fields">
  {([{key:'power',label:'功率 Wp',min:1,max:2000,step:1},{key:'length',label:'长度 m',min:.2,max:5,step:.001},{key:'width',label:'宽度 m',min:.2,max:5,step:.001},{key:'gap',label:'拼缝 m',min:0,max:2,step:.001}] as const).map(field=><label key={field.key}>{field.label}<input aria-label={item.name+' '+field.label} type="number" required min={field.min} max={field.max} step={field.step} value={Number.isNaN(draft.spec[field.key])?'':draft.spec[field.key]} onChange={e=>setDraft({...draft,spec:{...draft.spec,[field.key]:e.target.value===''?NaN:Number(e.target.value)}})}/></label>)}</div>
  {dirty&&<div className="module-library-apply"><span>{used?'应用后需重新布置引用此组件的区域':''}</span><div><button type="button" onClick={()=>{setDraft(item);setError('');}}>取消修改</button><button type="submit">应用规格</button></div></div>}{error&&<p role="alert" className="error">{error}</p>}
 </form>;
}
export function ModuleLibraryPanel({items,usedIds,onChange}:Props){
 const [error,setError]=useState(''),[message,setMessage]=useState(''),[defaultId,setDefaultId]=useState(()=>readModuleLibrary().defaultId);
 const [pending,setPending]=useState<Set<string>>(()=>new Set());
 const onDirty=useCallback((id:string,dirty:boolean)=>setPending(current=>{if(current.has(id)===dirty)return current;const next=new Set(current);if(dirty)next.add(id);else next.delete(id);return next;}),[]);
 const selectedDefault=items.some(i=>i.id===defaultId)?defaultId:items[0]?.id;
 const saveCommon=()=>{try{saveModuleLibrary({items,defaultId:selectedDefault});setError('');setMessage('常用库已保存，新项目将使用这些规格和默认组件');}catch{setMessage('');setError('常用库保存失败，请检查浏览器存储是否可用');}};
 const importCommon=()=>{try{const failure=onChange(mergeModuleLibrary(items,readModuleLibrary().items));if(failure)throw Error(failure);setError('');setMessage('常用组件已加入当前项目，现有规格保持不变');}catch(e){setMessage('');setError((e as Error).message);}};
 return <><section className="module-library-common"><p>常用库保存在当前浏览器，新建项目自动使用。规格修改须点击“应用规格”才生效；关闭窗口会丢弃未应用的修改。</p><label>新项目默认组件<select aria-label="新项目默认组件" value={selectedDefault} onChange={e=>{setDefaultId(e.target.value);setMessage('');}}>{items.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div><button disabled={pending.size>0} title={pending.size?'请先应用或取消下方规格修改':undefined} onClick={saveCommon}>保存为常用库</button><button onClick={importCommon}>导入常用库</button></div>{pending.size>0&&<p role="status">有 {pending.size} 项规格修改尚未应用，请应用或取消后再保存常用库。</p>}{message&&<p role="status">{message}</p>}</section><details className="module-library" open><summary>项目组件库 · {items.length} 种</summary><p className="module-library-note">使用中的组件不可删除；组件库至少保留一种组件。</p><div className="module-library-list">{items.map(item=><LibraryItem key={item.id} item={item} used={usedIds.has(item.id)} canDelete={items.length>1} onDirty={onDirty} onApply={next=>onChange(items.map(x=>x.id===next.id?next:x))} onDelete={()=>setError(onChange(items.filter(x=>x.id!==item.id))??'')}/>)}</div><button className="module-library-add" disabled={items.length>=50} onClick={()=>{const spec=items[0]?.spec??defaultModule;setError(onChange([...items,{id:crypto.randomUUID(),name:'新组件 '+(items.length+1),spec:{...spec}}])??'');}}><Icon name="plus"/>新增组件</button>{error&&<p role="alert" className="error">{error}</p>}</details></>;
}
export function ModulePicker({items,value,standardOnly,onSelect}:{items:ModuleCatalogItem[];value?:string;standardOnly?:boolean;onSelect:(item:ModuleCatalogItem)=>void}){
 const available=items.filter(item=>!standardOnly||(item.spec.kind??'standard')==='standard');
 const selected=available.find(item=>item.id===value);
 return <section className="module-picker"><div className="module-picker-heading"><h2>组件</h2></div><select aria-label="当前区域组件" value={selected?.id??''} onChange={e=>{const item=available.find(x=>x.id===e.target.value);if(item)onSelect(item);}}>{!selected&&<option value="" disabled>请选择组件</option>}{available.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>{selected&&<small>标准 · {selected.spec.power} Wp<span>{selected.spec.length} × {selected.spec.width} m</span></small>}</section>;
}
