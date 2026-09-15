import type {ModuleSpec} from './domain';
export type RoofPitch={kind:'single'|'gable';axis:'x'|'z';high:1|-1;percent:number;eave:number};
export const defaultPitch:RoofPitch={kind:'single',axis:'z',high:-1,percent:15,eave:3.5};
export const validPitch=(p:RoofPitch)=>p&&['single','gable'].includes(p.kind)&&['x','z'].includes(p.axis)&&[1,-1].includes(p.high)&&Number.isFinite(p.percent)&&p.percent>=0&&p.percent<=100&&Number.isFinite(p.eave)&&p.eave>=1&&p.eave<=100;
type Size={width:number;depth:number};
export function roofHeight(roof:Size,p:RoofPitch,x:number,z:number){
 const span=p.axis==='x'?roof.width:roof.depth,t=p.axis==='x'?x:z;
 return p.eave-3.5+(p.kind==='single'?span/2+p.high*t:span/2-Math.abs(t))*p.percent/100;
}
export function roofGradient(p:RoofPitch,x:number,z:number){const t=p.axis==='x'?x:z,s=(p.kind==='single'?p.high:t<0?1:-1)*p.percent/100;return {sx:p.axis==='x'?s:0,sz:p.axis==='z'?s:0};}
