import type {RoofDesign} from './roof-project';
export function layoutSignatureFor(r:RoofDesign,globalEdge:number){return JSON.stringify({roof:r.roof,obstacles:r.obstacles,wallHeight:r.wallHeight,layoutOptions:r.layoutOptions,moduleSpec:r.moduleSpec,yaw:r.yaw,...(r.northAngle?{northAngle:r.northAngle}:{}),...(r.pitch?{pitchedShadowRevision:1}:{}),pitch:r.pitch,globalEdge});}
export const needsLayoutUpdate=(r:RoofDesign,edge:number)=>r.layoutSignature!==layoutSignatureFor(r,edge);
