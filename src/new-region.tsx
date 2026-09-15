import {useState} from 'react';
import {Icon} from './workbench-ui';
import type {RegionForm} from './region-form';
export function NewRegion({previous='flat',onCreate,onClose,hasDrawing}:{previous?:RegionForm;onCreate:(form:RegionForm)=>void;onClose:()=>void;hasDrawing:boolean}){
 const [form,setForm]=useState<RegionForm>(previous);
 return <div className="project-dialog-backdrop"><section className="project-dialog new-region" role="dialog" aria-modal="true" aria-label="新增区域" onKeyDown={e=>{if(e.key==='Escape')onClose();}}><div className="advanced-heading"><h2>新增屋面</h2><button className="icon-button" aria-label="取消新增" onClick={onClose}><Icon name="close"/></button></div>

 {<div className="region-types">{[['flat','平屋面','flat-roof'],['single','单坡屋面','single-roof'],['gable','双坡屋面','gable-roof']].map(([id,label,icon])=><button key={id} aria-pressed={form===id} onClick={()=>setForm(id as RegionForm)}><Icon name={icon}/>{label}</button>)}</div>}
 <div><button onClick={onClose}>取消</button><button disabled={!form} onClick={()=>form&&onCreate(form)}>{hasDrawing?'开始圈选':'创建区域'}</button></div>
 </section></div>;
}
