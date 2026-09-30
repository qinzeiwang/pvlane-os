import {useEffect,useState} from 'react';
import {Icon} from './workbench-ui';
export type RoofType='flat'|'gable'|'single';
/** Shared by creation and editing; existing single-slope projects remain explicit. */
export function RoofTypeSelector({value,onChange,disabled=false,polygonSelected=false,onPolygon}:{value:RoofType;onChange:(value:RoofType)=>void;disabled?:boolean;polygonSelected?:boolean;onPolygon?:()=>void}){
 const [expanded,setExpanded]=useState(value==='single'||polygonSelected);
 useEffect(()=>{if(value==='single'||polygonSelected)setExpanded(true)},[value,polygonSelected]);
 const open=expanded;
 const choice=(kind:RoofType,label:string)=><button type="button" aria-label={label} aria-pressed={value===kind&&!polygonSelected} disabled={disabled} onClick={()=>onChange(kind)}><Icon name={kind+'-roof'}/><span>{label}</span></button>;
 return <div className="roof-type-selector"><div className="region-types" role="group" aria-label="屋面类型">{choice('flat','平屋面')}{choice('gable','双坡屋面')}<button type="button" aria-label="其他屋面类型" aria-expanded={open} disabled={disabled} onClick={()=>setExpanded(!open)}><Icon name="more"/>{!open&&(polygonSelected||value==='single')&&<span>{polygonSelected?'多边形':'单坡'}</span>}</button></div>{open&&<div className="region-types roof-type-extra" role="group" aria-label="其他屋面类型">{choice('single','单坡屋面')}{onPolygon&&<button type="button" aria-label="多边形屋面" aria-pressed={polygonSelected} disabled={disabled} onClick={onPolygon}><Icon name="polygon-roof"/><span>多边形屋面</span></button>}</div>}</div>;
}
