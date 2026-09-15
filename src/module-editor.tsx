import type {ModuleSpec} from './domain';
export function ModuleEditor({value,onChange,advanced=false,standardOnly=false,fieldsOnly=false}:{fieldsOnly?:boolean;standardOnly?:boolean;value:ModuleSpec;onChange:(v:ModuleSpec)=>void;advanced?:boolean}){
 if(!advanced&&!fieldsOnly)return <section className="module-selection module-compact">
 {([['power','功率 Wp',1,2000],['length','长 m',.2,5],['width','宽 m',.2,5]] as const).map(([key,label,min,max])=><label key={key}>{label}<input aria-label={label} type="number" step={key==='power'?1:.001} min={min} max={max} value={Number.isNaN(value[key])?'':value[key]} onChange={e=>onChange({...value,[key]:e.target.value===''?NaN:Number(e.target.value)})}/></label>)}
 </section>;
 return <div className="fields">{([['power','功率 Wp',1,2000],['length','长度 m',.2,5],['width','宽度 m',.2,5],['gap','组件间距 m',0,2]] as const).filter(([key])=>advanced?key==='gap':key!=='gap').map(([key,label,min,max])=><label key={key}>{label}<input aria-label={label} type="number" step={key==='power'?1:.001} min={min} max={max} value={Number.isNaN(value[key])?'':value[key]} onChange={e=>onChange({...value,[key]:e.target.value===''?NaN:Number(e.target.value)})}/></label>)}</div>;
}
