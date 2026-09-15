import type {PerformanceReport} from './render-options';
import {Icon} from './workbench-ui';

type Props={
 backgroundColor:string;groundColor:string;realistic:boolean;guides:boolean;stress:boolean;running:boolean;
 progress:string;report:PerformanceReport|null;count:number;
 solarHour:number;showShadows:boolean;onSolarHour:(value:number)=>void;onShowShadows:(value:boolean)=>void;
 onBackground:(value:string)=>void;onGround:(value:string)=>void;onRealistic:(value:boolean)=>void;
 onGuides:(value:boolean)=>void;onStartTest:()=>void;onStopTest:()=>void;onResetTest:()=>void;onClose:()=>void;
};

export function DisplayPopover(props:Props){
 const {backgroundColor,groundColor,realistic,guides,stress,running,progress,report,count}=props;
 return <section className="display-popover" aria-label="显示设置">
  <header><strong>显示设置</strong><button className="icon-button" aria-label="关闭显示设置" onClick={props.onClose}><Icon name="close"/></button></header>
  <label className="display-sun">冬至真太阳时 <span>{props.solarHour}:00</span><input aria-label="三维真太阳时" type="range" min="9" max="15" step="1" value={props.solarHour} onChange={e=>props.onSolarHour(Number(e.target.value))}/></label>
  <label className="checkline"><input type="checkbox" checked={props.showShadows} onChange={e=>props.onShowShadows(e.target.checked)}/>显示阴影禁布区</label>
  <div className="color-presets"><button onClick={()=>{props.onBackground('#dce5ec');props.onGround('#c7cccb');}}>冷灰</button><button onClick={()=>{props.onBackground('#ede8dd');props.onGround('#cfc3a8');}}>暖灰</button></div>
  <div className="scene-colors"><label>背景<input aria-label="背景颜色" type="color" value={backgroundColor} onInput={e=>props.onBackground(e.currentTarget.value)} onChange={e=>props.onBackground(e.target.value)}/></label><label>地面<input aria-label="地面颜色" type="color" value={groundColor} onInput={e=>props.onGround(e.currentTarget.value)} onChange={e=>props.onGround(e.target.value)}/></label><button className="icon-button" aria-label="恢复默认颜色" title="恢复默认颜色" onClick={()=>{props.onBackground('#dce5ec');props.onGround('#c7cccb');}}><Icon name="reset"/></button></div>
  <div className="quality-switch choice-segment"><button className={!realistic?'selected':''} disabled={running} onClick={()=>props.onRealistic(false)}>简洁</button><button className={realistic?'selected':''} disabled={running} onClick={()=>props.onRealistic(true)}>真实材质</button></div>
  <label className="checkline"><input type="checkbox" checked={guides} disabled={running||stress} onChange={e=>props.onGuides(e.target.checked)}/>显示布置辅助线</label>
  <details className="display-advanced"><summary>性能验证</summary><p>{stress?'当前：1000 块独立测试场景':`当前：项目场景，${count} 块组件`}</p><button disabled={running} onClick={props.onStartTest}>测试 1000 块</button>{running&&<button onClick={props.onStopTest}>停止测试</button>}{stress&&!running&&<button onClick={props.onResetTest}>返回项目场景</button>}<p role="status">{progress}</p>{report&&<div className="performance-result"><strong>{report.passed?'达到本轮目标':'未达到本轮目标'}</strong><p>平均 {report.medianFps.toFixed(1)} FPS · P95 {report.medianP95Ms.toFixed(1)} ms</p><p>{report.calls} 次绘制 · {report.triangles.toLocaleString()} 三角形</p></div>}</details>
 </section>;
}
