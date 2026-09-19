import { roofHeight, type RoofPitch } from './pitched-roof';
import { useState, type SetStateAction } from 'react';
import { defaultModule, roof as defaultRoof, type ModuleSpec, type PVArray, type Obstacle, type Point, type Rect, corners } from './domain';
import type { LayoutOptions } from './auto-layout';
import {standardModuleId} from './module-library';
export type RoofDesign = {
  northAngle?:number;
  pitch?:RoofPitch; flatHeight?:number;
  id:string; name:string; x:number; z:number; yaw:number;
  roof:{width:number;depth:number}; moduleId?:string; moduleSpec:ModuleSpec; layoutOptions:LayoutOptions;
  wallHeight:number; obstacles:Obstacle[]; arrays:PVArray[];
  layoutSignature:string; layoutMessage:string; previous:PVArray[]|null;
};
export const newRoof = (name='屋面 1'):RoofDesign => ({id:crypto.randomUUID(),name,x:0,z:0,yaw:0,roof:{...defaultRoof},moduleId:standardModuleId,moduleSpec:{...defaultModule},layoutOptions:{portrait:true,tilt:20,edge:.5,gap:1,maxColumns:18,tableRows:1,spacingMode:'solar',rowGap:0},wallHeight:.32,obstacles:[],arrays:[],layoutSignature:'',layoutMessage:'',previous:null});
// New geometry starts empty; only editable design preferences are inherited.
export function roofFromPrevious(previous:RoofDesign,name:string):RoofDesign {
 return {...newRoof(name),northAngle:previous.northAngle,moduleId:previous.moduleId,moduleSpec:{...previous.moduleSpec},layoutOptions:structuredClone(previous.layoutOptions),pitch:previous.pitch?{...previous.pitch}:undefined,flatHeight:previous.flatHeight,wallHeight:previous.wallHeight};
}
export const roofRect = (r:RoofDesign):Rect => ({x:r.x,z:r.z,yaw:r.yaw,...r.roof});
export function toWorld(p:Point,r:Pick<RoofDesign,'x'|'z'|'yaw'>):Point {const c=Math.cos(r.yaw),s=Math.sin(r.yaw);return {x:r.x+p.x*c+p.z*s,z:r.z-p.x*s+p.z*c};}
export function toLocal(p:Point,r:Pick<RoofDesign,'x'|'z'|'yaw'>):Point {const c=Math.cos(r.yaw),s=Math.sin(r.yaw),x=p.x-r.x,z=p.z-r.z;return {x:x*c-z*s,z:x*s+z*c};}
export const worldArray = (a:PVArray,r:RoofDesign):PVArray => ({...a,...toWorld(a,r),id:`${r.id}/${a.id}`,azimuth:a.azimuth-r.yaw*180/Math.PI,...(!r.pitch?{elevation:(r.flatHeight??3.5)-3.5}:{})});
export function worldObstacle(o:Obstacle,r:RoofDesign):Obstacle {
 const heights=r.pitch?corners(o).map(p=>roofHeight(r.roof,r.pitch!,p.x,p.z)):[(r.flatHeight??3.5)-3.5];
 const bottom=Math.min(...heights),top=Math.max(...heights);
 return {...o,baseHeight:bottom,height:o.height+top-bottom,...toWorld(o,r),id:`${r.id}/${o.id}`,yaw:o.yaw+r.yaw};
}
export function projectBounds(roofs:RoofDesign[]) {
  if (!roofs.length) return { x: 0, z: 0, width: 0, depth: 0 };
  const p = roofs.flatMap(r => corners(roofRect(r)));
  const xs = p.map(p => p.x), zs = p.map(p => p.z);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, z: (Math.min(...zs) + Math.max(...zs)) / 2, width: Math.max(...xs) - Math.min(...xs), depth: Math.max(...zs) - Math.min(...zs) };
}
export function totals(roofs:RoofDesign[]) {return roofs.reduce((s,r)=>{for(const a of r.arrays){s.count+=a.rows*a.columns;s.capacity+=a.rows*a.columns*(a.module??defaultModule).power/1000;}return s;},{count:0,capacity:0});}
export function useRoofProject(){
 const [roofs,setRoofs]=useState<RoofDesign[]>(()=>[newRoof()]);
 const [activeId,setActiveId]=useState('');
 const active=roofs.find(r=>r.id===activeId)??roofs[0];
 function field<K extends keyof RoofDesign>(key:K):(value:SetStateAction<RoofDesign[K]>)=>void{return value=>setRoofs(prev=>prev.map(r=>r.id===active.id?{...r,[key]:typeof value==='function'?(value as (p:RoofDesign[K])=>RoofDesign[K])(r[key]):value}:r));}
 return {roofs,setRoofs,active,setActiveId,roof:active.roof,setRoof:field('roof'),moduleSpec:active.moduleSpec,setModuleSpec:field('moduleSpec'),layoutOptions:active.layoutOptions,setLayoutOptions:field('layoutOptions'),wallHeight:active.wallHeight,setWallHeight:field('wallHeight'),obstacles:active.obstacles,setObstacles:field('obstacles'),arrays:active.arrays,setArrays:field('arrays'),layoutSignature:active.layoutSignature,setLayoutSignature:field('layoutSignature'),layoutMessage:active.layoutMessage,setLayoutMessage:field('layoutMessage'),previous:active.previous,setPrevious:field('previous')};
}

export const geographicYaw=(r:RoofDesign)=>r.yaw+(r.northAngle??0)*Math.PI/180;
