import {corners,type Obstacle} from './domain';
import {roofHeight,type RoofPitch} from './pitched-roof';
import type {SunRay} from './solar';
import {shadowZones} from './shadow-zones';
export function buildingTop(roof:{width:number;depth:number},pitch:RoofPitch|undefined,o:Obstacle){
 if(!pitch)return o.height;
 const points=corners(o);if(pitch.kind==='gable')for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4],va=pitch.axis==='x'?a.x:a.z,vb=pitch.axis==='x'?b.x:b.z;if(va*vb<0){const t=-va/(vb-va);points.push({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});}}
 return Math.max(...points.map(p=>roofHeight(roof,pitch,p.x,p.z)))+o.height;
}
export function buildingContext(roof:{width:number;depth:number},pitch:RoofPitch|undefined,objects:Obstacle[],host:Obstacle){
 const height=buildingTop(roof,pitch,host),c=Math.cos(host.yaw),s=Math.sin(host.yaw);
 const localObjects=objects.filter(o=>o.id!==host.id).map(o=>{const dx=o.x-host.x,dz=o.z-host.z;return {...o,x:dx*c-dz*s,z:dx*s+dz*c,yaw:o.yaw-host.yaw,height:o.kind==='keepout'?0:Math.max(0,buildingTop(roof,pitch,o)-height)};});
 return {height,objects:localObjects};
}
export function topShadowZones(roof:{width:number;depth:number},pitch:RoofPitch|undefined,objects:Obstacle[],host:Obstacle|undefined,yaw:number,rays?:readonly SunRay[]){
 if(!host)return [];
 const ctx=buildingContext(roof,pitch,objects,host),c=Math.cos(host.yaw),s=Math.sin(host.yaw);
 return shadowZones(host,ctx.objects,0,yaw+host.yaw,rays).map(zone=>({...zone,points:zone.points.map(p=>({x:host.x+p.x*c+p.z*s,z:host.z-p.x*s+p.z*c}))}));
}
