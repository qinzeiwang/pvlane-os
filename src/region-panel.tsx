import type {RoofDesign} from './roof-project';
import type {Obstacle} from './domain';
import {defaultPitch} from './pitched-roof';
import {turnPitch} from './roof-direction';
import {Icon} from './workbench-ui';
type Props={region:RoofDesign;selected?:Obstacle;editing:boolean;disabled:boolean;onChange:(patch:Partial<RoofDesign>)=>void;onAdd:(kind:'obstacle'|'keepout')=>void;onSelect:(id:string|null)=>void;onEdit:(id:string)=>void;onFinish:()=>void;onCancel:()=>void;onDelete:()=>void};
export function RegionPanel({region:r,selected,editing,disabled,onChange,onAdd,onSelect,onEdit,onFinish,onCancel,onDelete}:Props){
 const number=(label:string,value:number,min:number,max:number,change:(n:number)=>void)=><label className="region-field"><span>{label}</span><input aria-label={label} type="number" step="0.1" min={min} max={max} value={value} disabled={disabled} onChange={e=>{const n=Number(e.target.value);if(e.target.value&&Number.isFinite(n)&&n>=min&&n<=max)change(n);}}/></label>;
 return <section className="region-panel" onKeyDown={e=>{if(editing&&e.key==='Escape'){e.stopPropagation();onCancel();}if(editing&&e.key==='Enter'&&e.target instanceof HTMLInputElement){e.stopPropagation();e.currentTarget.blur();onFinish();}}}>
 {<><section className="region-section"><h2>屋面类型</h2><div className="region-types" role="group" aria-label="屋面类型">{(['flat','single','gable'] as const).map(kind=><button key={kind} aria-label={kind==='flat'?'平屋面':kind==='single'?'单坡屋面':'双坡屋面'} aria-pressed={(r.pitch?.kind??'flat')===kind} disabled={disabled} onClick={()=>onChange({pitch:kind==='flat'?undefined:{...(r.pitch??defaultPitch),kind}})}><Icon name={kind+'-roof'}/><span>{kind==='flat'?'平屋面':kind==='single'?'单坡':'双坡'}</span></button>)}</div></section>
 <section className="region-section"><h2>屋面信息{r.pitch&&<button className="icon-button" aria-label={r.pitch.kind==='single'?'旋转坡向':'切换屋脊方向'} title={r.pitch.kind==='single'?'旋转坡向；画布箭头由高指向低，也可点击箭头转向':'切换居中屋脊方向；也可点击画布屋脊线'} onClick={()=>onChange({pitch:turnPitch(r.pitch!)})}><Icon name="slope-direction"/></button>}</h2><div className="region-fields">
 {r.pitch?<>{number('坡度 %',r.pitch.percent,0,100,percent=>onChange({pitch:{...r.pitch!,percent}}))}{number('低檐高 m',r.pitch.eave,1,100,eave=>onChange({pitch:{...r.pitch!,eave}}))}</>:<>{number('屋面高度 m',r.flatHeight??3.5,1,100,flatHeight=>onChange({flatHeight}))}{number('女儿墙高 m',r.wallHeight,0,5,wallHeight=>onChange({wallHeight}))}</>}
 </div></section></>}
 {(['obstacle','keepout'] as const).map(kind=>{const items=r.obstacles.filter(o=>(o.kind??'obstacle')===kind),label=kind==='keepout'?'禁布区':'障碍物';return <section key={kind} className="region-section region-objects"><h2>{label}<span className="object-count">{items.length} 个</span><button className="icon-button" aria-label={'新增'+label} title={'新增'+label} disabled={disabled||r.obstacles.length>=100} onClick={()=>onAdd(kind)}><Icon name="plus"/></button></h2>
 <div className="object-rows">{items.map(o=><div key={o.id} className={'object-row-wrap'+(selected?.id===o.id?' is-selected':'')}>
 <div className="object-row"><button className="object-row-select" aria-pressed={selected?.id===o.id} onClick={()=>onSelect(o.id)}>{o.name}</button><button className="icon-button object-row-edit" aria-label={'修改'+o.name} title={'修改'+o.name} disabled={disabled} onClick={()=>onEdit(o.id)}><Icon name="edit"/></button></div>
 {selected?.id===o.id&&editing&&<div className="object-inline-editor">
 {kind==='obstacle'&&number('高度 m',o.height,.2,30,height=>onChange({obstacles:r.obstacles.map(item=>item.id===o.id?{...item,height}:item)}))}
 <div className="object-edit-status"><button className="object-delete" aria-label={'删除'+o.name} title={'删除'+o.name} onClick={onDelete}>删除</button><button className="cancel-object-edit" onClick={onCancel}>取消</button><button className="finish-object-edit" onClick={onFinish}><Icon name="check"/>完成</button></div>
 </div>}</div>)}</div>
 </section>;})}
 </section>;
}
