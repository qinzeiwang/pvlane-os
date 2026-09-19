import {corners,type Obstacle} from './domain';
import {roofHeight,roofGradient,type RoofPitch} from './pitched-roof';
import {clipRoof,convexHull,type ShadowZone} from './shadow-zones';
import {winterSun} from './solar';
// Winter 9–15 true-solar-time envelope, sampled every 15 minutes.
// Top faces are horizontal; rays intersect the first valid roof half-plane.
export function pitchedShadowZones(roof:{width:number;depth:number},objects:Obstacle[],pitch:RoofPitch,yaw=0):ShadowZone[]{
 return objects.filter(o=>o.kind!=='keepout'&&o.height>0).flatMap(o=>{
  const base=corners(o),axis=pitch.axis;
  const spansRidge=pitch.kind==='gable'&&Math.min(...base.map(p=>axis==='x'?p.x:p.z))<=0&&Math.max(...base.map(p=>axis==='x'?p.x:p.z))>=0;
  const top=Math.max(...base.map(p=>roofHeight(roof,pitch,p.x,p.z)),...(spansRidge?[roofHeight(roof,pitch,0,0)]:[]))+o.height;
  const projected=Array.from({length:25},(_,i)=>9+i/4).flatMap(hour=>{
   const s=winterSun(hour),c=Math.cos(yaw),sn=Math.sin(yaw),sun={x:s.x*c-s.z*sn,y:s.y,z:s.x*sn+s.z*c};
   return base.map(p=>{
    const candidates=(pitch.kind==='gable'?[-1,1]:[1]).flatMap(side=>{
     const g=roofGradient(pitch,axis==='x'?side:0,axis==='z'?side:0);
     const intercept=roofHeight(roof,pitch,0,0),den=sun.y-g.sx*sun.x-g.sz*sun.z;
     if(den<=1e-9)return [];
     const t=(top-intercept-g.sx*p.x-g.sz*p.z)/den;
     const q={x:p.x-t*sun.x,z:p.z-t*sun.z};
     return t>=0&&(pitch.kind!=='gable'||(axis==='x'?q.x:q.z)*side>=-1e-8)?[{...q,t}]:[];
    }).sort((a,b)=>a.t-b.t);
    return candidates[0]??{x:p.x-sun.x*Math.hypot(roof.width,roof.depth)*100,z:p.z-sun.z*Math.hypot(roof.width,roof.depth)*100};
   });
  });
  const points=clipRoof(convexHull([...base,...projected]),roof);
  return points.length<3?[]:[{id:`shadow-${o.id}`,name:`${o.name}坡面时段阴影包络`,points}];
 });
}
