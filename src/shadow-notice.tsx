import type {RoofDesign} from './roof-project';
import type {SunSettings} from './sun-position';
import {ignoresShadows,locationMismatch} from './location-presets';
import {layoutSignatureFor} from './layout-state';
import {winterRays} from './solar';
export function shadowNotice(s:SunSettings,roofs:RoofDesign[],edge=.5){
 const relevant=roofs.filter(r=>(!r.pitch||r.obstacles.some(o=>o.kind!=='keepout')));
 if(!relevant.length)return undefined;
 const affected=relevant.filter(r=>ignoresShadows(s)||!winterRays(s.latitude).length||r.layoutOptions.shadowIgnored||r.layoutOptions.shadowLatitude!==s.latitude||r.layoutSignature!==layoutSignatureFor(r,edge));
 if(!affected.length)return undefined;
 const names=affected.slice(0,3).map(r=>r.name).join('、')+(affected.length>3?`等 ${affected.length} 个屋面`:'');
 const reason=ignoresShadows(s)?'尚未确定项目坐标，必须补充地点或经纬度':!winterRays(s.latitude).length?'所在地冬至无有效日照，当前校核时段不适用':'尚未完成或需要更新当前参数的布置校核';
 const risks=[affected.some(r=>!r.pitch)?'平屋面排间及女儿墙':undefined,affected.some(r=>r.pitch)?'坡屋面气楼、障碍物':undefined].filter(Boolean).join('、');
 return {title:'未完成阴影校核',text:`${names}：${reason}。${risks}可能遮挡组件；当前方案不能视为已满足防遮挡要求。`,settings:ignoresShadows(s)};
}
export function LocationMismatchNotice({value,address,onSettings}:{value:SunSettings;address:string;onSettings?:()=>void}){
 const mismatch=locationMismatch(value,address);if(!mismatch)return null;
 return <div className="shadow-alert location-mismatch-alert" role="alert"><strong>地点与经纬度可能不一致</strong><p>坐标距{mismatch.city}参考点约 {Math.round(mismatch.distance)} km，仍以经纬度计算。请核对地点、坐标顺序及正负号。</p>{onSettings&&<button type="button" onClick={onSettings}>核对地点</button>}</div>;
}
export function ShadowNotice({notice,onSettings}:{notice:ReturnType<typeof shadowNotice>;onSettings?:()=>void}){
 if(!notice)return null;
 return <div className="shadow-alert" role="alert"><strong>{notice.title}</strong><p>{notice.text}</p>{onSettings&&notice.settings&&<button type="button" onClick={onSettings}>设置地点与经纬度</button>}</div>;
}
