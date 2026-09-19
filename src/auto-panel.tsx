import type { ReactNode } from 'react';
import {Icon} from './workbench-ui';
import {formatOrientation} from './project-statistics';
import {layoutDirection} from './auto-layout';
import { tableSpacing, type LayoutOptions } from './auto-layout';
export function AutoPanel({ options, onChange, disabled, advanced,northAngle=0 }: { options: LayoutOptions; onChange: (value: LayoutOptions) => void; disabled: boolean; advanced?: ReactNode;northAngle?:number }) {
  const spacing = tableSpacing(options);
  const orientation=<div className="rule-row"><span>组件横竖排</span><button className="direction-control" type="button" aria-label="切换组件横竖排" title="切换组件长边与边 A 平行或垂直" onClick={()=>onChange({...options,portrait:!options.portrait})}><Icon name="panel-orientation"/><span>{options.portrait?'垂直边 A':'平行边 A'}</span></button></div>;
  const q=layoutDirection(options),azimuth=((180+90*q-(options.roofYaw??0)*180/Math.PI)%360+360)%360;




  const numberField = (key: 'tilt' | 'maxColumns' | 'edge' | 'gap' | 'rowGap', label: string, max: number) => {
    const min=key==='maxColumns'?1:0,value=Number.isNaN(options[key])?'':options[key]??0;
    return <label className="rule-row"><span>{label}</span><input aria-label={label} type="number" min={min} max={max} step={key==='maxColumns'?1:.1} value={value} onChange={e=>{if(e.target.value==='')return;const n=Number(e.target.value);if(Number.isFinite(n)&&n>=min&&n<=max)onChange({...options,[key]:n});}} onBlur={e=>{e.currentTarget.value=String(value);}} /></label>;
  };
  return <section className="auto-settings"><fieldset disabled={disabled}>
    <div className="compact-rules">
      <div className="rule-row"><span>连排数量</span><div className="choice-segment" role="group" aria-label="同一斜面连排数">{[1,2,3].map(n=><button type="button" key={n} aria-pressed={(options.tableRows??1)===n} onClick={()=>onChange({...options,tableRows:n})}>{n} 排</button>)}</div></div>
      {!options.pitch&&numberField('tilt', '倾角 °', 60)}
      {options.pitch?orientation:<div className="rule-row"><span>组件朝向</span><button type="button" className="direction-control" aria-label="旋转组件朝向" title="每次旋转 90°，支持四个方向" onClick={()=>onChange({...options,direction:(q+1)%4,portrait:(q+1)%2===0})}><Icon name="module-direction" style={{transform:`rotate(${azimuth+northAngle}deg)`}}/><span>{formatOrientation(Math.round(azimuth))}</span></button></div>}
      {numberField('gap', '左右通道 m', 20)}
      {options.pitch&&numberField('rowGap','前后组间距 m',100)}
    </div>
    {!options.pitch&&<div className="spacing-controls">
      <div className="compact-rules">
        <div className="rule-row"><span>前后间距</span><div className="choice-segment" role="group" aria-label="前后间距模式">{(['solar','manual'] as const).map(mode=><button type="button" key={mode} aria-pressed={(options.spacingMode??'solar')===mode} onClick={()=>{if(mode!==(options.spacingMode??'solar'))onChange({...options,spacingMode:mode,rowGap:mode==='manual'?Number(spacing.actual.toFixed(2)):0});}}>{mode==='solar'?'自动':'手动'}</button>)}</div></div>
        <label className="rule-row"><span>净距 m</span><input aria-label="前后净距 m" type="number" min="0" max="100" step="0.1" readOnly={options.spacingMode!=='manual'} value={options.spacingMode==='manual'?(Number.isNaN(options.rowGap)?'':options.rowGap??0):(Number.isFinite(spacing.actual)?spacing.actual.toFixed(2):'')} onChange={e=>{if(e.target.value==='')return;const n=Number(e.target.value);if(Number.isFinite(n)&&n>=0&&n<=100)onChange({...options,rowGap:n});}} onBlur={e=>{e.currentTarget.value=String(options.spacingMode==='manual'?options.rowGap??0:Number.isFinite(spacing.actual)?spacing.actual.toFixed(2):'');}}/></label>
      </div>
      <small className={options.spacingMode==='manual'&&spacing.shortened?'spacing-warning':''}>{options.spacingMode==='manual'?`日照参考 ${Number.isFinite(spacing.recommended)?spacing.recommended.toFixed(2):'—'} m${spacing.shortened?' · 当前间距较小':''}`:'按日照计算，随倾角和连排数量更新'}</small>
    </div>}
    {options.pitch&&<small className="layout-rule-note">贴坡安装 · 按组留间距</small>}
  </fieldset></section>;
}

export function AdvancedLayoutPanel({options,onChange,advanced}:{options:LayoutOptions;onChange:(v:LayoutOptions)=>void;advanced?:ReactNode}){
 return <div className="advanced-fields">{<label>每组最多列数<input aria-label="每组最多列数" type="number" min="1" max="100" step="1" value={options.maxColumns} onChange={e=>onChange({...options,maxColumns:Number(e.target.value)})}/></label>}{advanced}</div>;
}
