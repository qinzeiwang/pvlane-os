import {useDialog} from './use-dialog';
import {RoofTypeSelector} from './roof-type-selector';
import {useState} from 'react';
import {Icon} from './workbench-ui';
import type {RegionForm} from './region-form';
export function NewRegion({previous='flat',onCreate,onClose,hasDrawing}:{previous?:RegionForm;onCreate:(form:RegionForm)=>void;onClose:()=>void;hasDrawing:boolean}){
 useDialog('[aria-label="新增区域"][role="dialog"]',true,onClose);
 const [form,setForm]=useState<RegionForm>(previous);
 return <div className="project-dialog-backdrop"><section className="project-dialog new-region" role="dialog" aria-modal="true" aria-label="新增区域" onKeyDown={e=>{if(e.key==='Escape')onClose();}}><div className="advanced-heading"><h2>新增屋面</h2><button className="icon-button" aria-label="取消新增" onClick={onClose}><Icon name="close"/></button></div>

 <RoofTypeSelector value={form==='polygon'?'flat':form} polygonSelected={form==='polygon'} onPolygon={()=>setForm('polygon')} onChange={setForm}/>{form==='polygon'&&<p>平屋面异形轮廓，支持斜边和凹角，不要求相邻边垂直。</p>}
 <div><button onClick={onClose}>取消</button><button className="primary-action" disabled={!form} onClick={()=>form&&onCreate(form)}>{hasDrawing||form==='polygon'?'开始圈选':'创建区域'}</button></div>
 </section></div>;
}
