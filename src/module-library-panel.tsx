import {useEffect,useState} from 'react';
import {defaultModule,validModule} from './domain';
import {Icon} from './workbench-ui';
import type {ModuleCatalogItem} from './module-library';

type Props={items:ModuleCatalogItem[];usedIds:Set<string>;onChange:(items:ModuleCatalogItem[])=>string|null};
function LibraryItem({item,used,canDelete,onApply,onDelete}:{item:ModuleCatalogItem;used:boolean;canDelete:boolean;onApply:(item:ModuleCatalogItem)=>string|null;onDelete:()=>void}){
 const [draft,setDraft]=useState(item),[error,setError]=useState('');
 useEffect(()=>{setDraft(item);setError('');},[item]);
 const dirty=JSON.stringify(draft)!==JSON.stringify(item);
 return <form className="module-library-item" onSubmit={e=>{e.preventDefault();if(!draft.name.trim()||!validModule(draft.spec)){setError('请填写名称和有效的组件规格');return;}setError(onApply({...draft,name:draft.name.trim()})??'');}}>
  <div className="module-library-heading"><input aria-label="组件名称" maxLength={80} required value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/><button type="button" className="icon-button" title={used?'正在被区域使用，不能删除':'删除组件'} aria-label={'删除 '+item.name} disabled={!canDelete||used} onClick={onDelete}><Icon name="trash"/></button></div>
  <div className="module-library-fields">
  {([{key:'power',label:'功率 Wp',min:1,max:2000,step:1},{key:'length',label:'长度 m',min:.2,max:5,step:.001},{key:'width',label:'宽度 m',min:.2,max:5,step:.001},{key:'gap',label:'拼缝 m',min:0,max:2,step:.001}] as const).map(field=><label key={field.key}>{field.label}<input aria-label={item.name+' '+field.label} type="number" required min={field.min} max={field.max} step={field.step} value={Number.isNaN(draft.spec[field.key])?'':draft.spec[field.key]} onChange={e=>setDraft({...draft,spec:{...draft.spec,[field.key]:e.target.value===''?NaN:Number(e.target.value)}})}/></label>)}</div>
  {dirty&&<div className="module-library-apply"><span>{used?'应用后需重新布置引用此组件的区域':''}</span><button type="submit">应用规格</button></div>}{error&&<p role="alert" className="error">{error}</p>}
 </form>;
}
export function ModuleLibraryPanel({items,usedIds,onChange}:Props){
 const [error,setError]=useState('');
 return <details className="module-library" open><summary>项目组件库 · {items.length} 种</summary><div className="module-library-list">{items.map(item=><LibraryItem key={item.id} item={item} used={usedIds.has(item.id)} canDelete={items.length>1} onApply={next=>onChange(items.map(x=>x.id===next.id?next:x))} onDelete={()=>setError(onChange(items.filter(x=>x.id!==item.id))??'')}/>)}</div><button className="module-library-add" disabled={items.length>=50} onClick={()=>{const spec=items[0]?.spec??defaultModule;setError(onChange([...items,{id:crypto.randomUUID(),name:'新组件 '+(items.length+1),spec:{...spec}}])??'');}}><Icon name="plus"/>新增组件</button>{error&&<p role="alert" className="error">{error}</p>}</details>;
}
export function ModulePicker({items,value,standardOnly,onSelect,onManage}:{items:ModuleCatalogItem[];value?:string;standardOnly?:boolean;onSelect:(item:ModuleCatalogItem)=>void;onManage:()=>void}){
 const available=items.filter(item=>!standardOnly||(item.spec.kind??'standard')==='standard');
 const selected=available.find(item=>item.id===value);
 return <section className="module-picker"><div className="module-picker-heading"><h2>组件</h2><button className="module-library-entry icon-button" title="管理项目组件库" aria-label="管理项目组件库" onClick={onManage}><Icon name="settings"/></button></div><select aria-label="当前区域组件" value={selected?.id??''} onChange={e=>{const item=available.find(x=>x.id===e.target.value);if(item)onSelect(item);}}>{!selected&&<option value="" disabled>请选择组件</option>}{available.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select>{selected&&<small>标准 · {selected.spec.power} Wp<span>{selected.spec.length} × {selected.spec.width} m</span></small>}</section>;
}
