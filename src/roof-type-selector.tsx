import {useEffect,useState} from 'react';
import {Icon} from './workbench-ui';
export type RoofType='flat'|'gable'|'single';
/** Shared by creation and editing; existing single-slope projects remain explicit. */
export function RoofTypeSelector({value,onChange,disabled=false}:{value:RoofType;onChange:(value:RoofType)=>void;disabled?:boolean}){
 const [expanded,setExpanded]=useState(value==='single');
 useEffect(()=>{if(value==='single')setExpanded(true)},[value]);
 const open=expanded;
 const choice=(kind:RoofType,label:string)=><button type="button" aria-label={label} aria-pressed={value===kind} disabled={disabled} onClick={()=>onChange(kind)}><Icon name={kind+'-roof'}/><span>{label}</span></button>;
 return <div className="roof-type-selector"><div className="region-types" role="group" aria-label="屋面类型">{choice('flat','平屋面')}{choice('gable','双坡屋面')}<button type="button" aria-label="其他屋面类型" aria-expanded={open} disabled={disabled} onClick={()=>setExpanded(!open)}><Icon name="more"/>{value==='single'&&!open&&<span>单坡</span>}</button></div>{open&&<div className="region-types roof-type-extra" role="group" aria-label="其他屋面类型">{choice('single','单坡屋面')}</div>}</div>;
}
