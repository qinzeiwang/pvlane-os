import {useState} from 'react';
import type {BaseImage} from './base-image';
import {Icon} from './workbench-ui';
import './system-settings.css';

type Props={name:string;address:string;base?:BaseImage;north:number;edge:number;busy:boolean;region?:string;maxColumns?:number;onMaxColumns:(v:number)=>void;
 onName:(v:string)=>void;onAddress:(v:string)=>void;onNorth:(v:number)=>void;onEdge:(v:number)=>void;
 onScale:()=>void;onDirection:()=>void;onReplace:()=>void;onClose:()=>void};
export function SystemSettings(p:Props){const [northText,setNorthText]=useState(String(p.north));const [columnsText,setColumnsText]=useState(String(p.maxColumns??18));return <div className="project-dialog-backdrop" onKeyDown={e=>{if(e.key==='Escape')p.onClose()}}>
 <section className="project-dialog settings-dialog" role="dialog" aria-modal="true" aria-label="系统设置">
  <header className="settings-heading"><h2>系统设置</h2><button className="icon-button" aria-label="关闭系统设置" onClick={p.onClose}><Icon name="close"/></button></header>
  <div className="settings-body">
   <section className="settings-section"><h3>项目信息</h3><div className="settings-fields"><label>项目名称<input aria-label="项目名称" value={p.name} onChange={e=>p.onName(e.target.value)} onBlur={()=>p.onName(p.name.trim()||'未命名项目')}/></label><label>项目地址<input aria-label="项目地址" placeholder="选填" value={p.address} onChange={e=>p.onAddress(e.target.value)}/></label></div></section>
   <section className="settings-section"><h3>图纸与方向</h3>
    <div className="settings-action-row"><div><strong>比例尺</strong><small>{p.base?.blank?'无底图 · 按绘制尺寸':p.base?.metersPerPixel?`1 像素 = ${Number(p.base.metersPerPixel.toPrecision(5))} m`:p.base?'尚未标定':'无底图'}</small></div><button disabled={!p.base||p.base.blank||p.busy} onClick={p.onScale}><Icon name="spacing"/>重新标定</button></div>
    {p.base&&!p.base.blank&&<p className="settings-note">重新标定将调整屋面尺寸并清空现有排布，之后需重新布置。</p>}
    <div className="settings-north-row"><label>北向角度 °<input aria-label="图纸北向角度" type="number" min="0" max="360" step="0.1" value={northText} onBlur={()=>{if(!northText.trim()||Number(northText)<0||Number(northText)>360)setNorthText(String(p.north));}} onChange={e=>{setNorthText(e.target.value);const n=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(n)&&n>=0&&n<=360)p.onNorth(n%360)}}/></label><button disabled={!p.base||p.busy} onClick={p.onDirection}><Icon name="module-direction"/>图上指定北向</button><button className="settings-text-button" onClick={()=>{p.onNorth(0);setNorthText('0');}}>上方为北</button></div>
    <p className="settings-note">上方为 0°，顺时针旋转。</p>
    {p.base&&!p.base.blank&&<details className="settings-secondary"><summary>底图文件</summary><div className="settings-action-row"><small>{p.base.name}</small><button disabled={p.busy} onClick={p.onReplace}>更换底图</button></div><p className="settings-note">更换底图会开始新方案，请先保存当前项目。</p></details>}
   </section>
   <section className="settings-section"><h3>布置默认值</h3><div className="settings-fields"><label>屋面 / 屋脊投影边距 m<input aria-label="全局屋面 / 屋脊投影边距 m" type="number" min="0" max="20" step="0.1" value={p.edge} onChange={e=>{const n=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(n)&&n>=0&&n<=20)p.onEdge(n)}}/></label>{p.maxColumns!==undefined&&<label>每排最多块数 · {p.region}<input aria-label="每排最多块数" type="number" min="1" max="100" step="1" disabled={p.busy} value={columnsText} onChange={e=>{setColumnsText(e.target.value);const n=Number(e.target.value);if(Number.isInteger(n)&&n>=1&&n<=100)p.onMaxColumns(n);}} onBlur={()=>setColumnsText(String(p.maxColumns))}/></label>}</div></section>
  </div><footer className="settings-footer"><button onClick={p.onClose}>完成</button></footer>
 </section></div>}
