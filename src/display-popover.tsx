import {locationNote} from './location-presets';
import {SunDateTime} from './sun-controls';
import type {SunSettings} from './sun-position';
import type {PerformanceReport} from './render-options';
import {Icon} from './workbench-ui';

type Props={sunSettings:SunSettings;onSunSettings:(v:SunSettings)=>void;shadowMode:"current"|"winter";onShadowMode:(v:"current"|"winter")=>void;
 backgroundColor:string;groundColor:string;quality:import('./render-options').RenderQuality;guides:boolean;stress:boolean;running:boolean;
 progress:string;report:PerformanceReport|null;count:number;
 solarHour:number;showShadows:boolean;onSolarHour:(value:number)=>void;onShowShadows:(value:boolean)=>void;
 onBackground:(value:string)=>void;onGround:(value:string)=>void;onQuality:(value:import('./render-options').RenderQuality)=>void;
 onGuides:(value:boolean)=>void;onStartTest:()=>void;onStopTest:()=>void;onResetTest:()=>void;onClose:()=>void;
};

export function DisplayPopover(props:Props){
 const {backgroundColor,groundColor,quality,guides,stress,running,progress,report,count}=props;
 return <section className="display-popover" aria-label="显示设置">
  <header><strong>显示设置</strong><button className="icon-button" aria-label="关闭显示设置" onClick={props.onClose}><Icon name="close"/></button></header>
  <p className="sun-readout">{locationNote(props.sunSettings)}</p><SunDateTime value={props.sunSettings} onChange={props.onSunSettings}/>
  <label>阴影显示<select aria-label="阴影显示" value={props.shadowMode} onChange={e=>props.onShadowMode(e.target.value as 'current'|'winter')}><option value="current">当前日期与时间</option><option value="winter">所在地冬至校核</option></select></label><p className="sun-readout">当前阴影随地点、日期时间及北向变化；自动布置按所在地冬至 9–15 时真太阳时校核。</p>{Math.abs(props.sunSettings.latitude)>=66.5&&<p className="sun-readout">所在地冬至可能为极夜，当前冬至校核不适用，请另定设计时段。</p>}
  <label className="checkline"><input type="checkbox" checked={props.showShadows} onChange={e=>props.onShowShadows(e.target.checked)}/>显示阴影禁布区</label>
  <div className="color-presets"><button onClick={()=>{props.onBackground('#dce5ec');props.onGround('#c7cccb');}}>冷灰</button><button onClick={()=>{props.onBackground('#ede8dd');props.onGround('#cfc3a8');}}>暖灰</button></div>
  <div className="scene-colors"><label>背景<input aria-label="背景颜色" type="color" value={backgroundColor} onInput={e=>props.onBackground(e.currentTarget.value)} onChange={e=>props.onBackground(e.target.value)}/></label><label>地面<input aria-label="地面颜色" type="color" value={groundColor} onInput={e=>props.onGround(e.currentTarget.value)} onChange={e=>props.onGround(e.target.value)}/></label><button className="icon-button" aria-label="恢复默认颜色" title="恢复默认颜色" onClick={()=>{props.onBackground('#dce5ec');props.onGround('#c7cccb');}}><Icon name="reset"/></button></div>
  <div className="quality-switch choice-segment" role="group" aria-label="渲染质量">{([['simple','简单'],['standard','标准'],['fine','精细']] as const).map(([value,label])=><button key={value} aria-pressed={quality===value} className={quality===value?'selected':''} disabled={running} onClick={()=>props.onQuality(value)}>{label}</button>)}</div>
  <label className="checkline"><input type="checkbox" checked={guides} disabled={running||stress} onChange={e=>props.onGuides(e.target.checked)}/>显示布置辅助线</label>
  <details className="display-advanced"><summary>性能验证</summary><p>{stress?'当前：1000 块独立测试场景':`当前：项目场景，${count} 块组件`}</p><button disabled={running} onClick={props.onStartTest}>测试 1000 块</button>{running&&<button onClick={props.onStopTest}>停止测试</button>}{stress&&!running&&<button onClick={props.onResetTest}>返回项目场景</button>}<p role="status">{progress}</p>{report&&<div className="performance-result"><strong>{report.passed?'达到本轮目标':'未达到本轮目标'}</strong><p>平均 {report.medianFps.toFixed(1)} FPS · P95 {report.medianP95Ms.toFixed(1)} ms</p><p>{report.calls} 次绘制 · {report.triangles.toLocaleString()} 三角形</p></div>}</details>
 </section>;
}
