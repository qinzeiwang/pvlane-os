import {layoutDirection} from './auto-layout';
import {toWorld,type RoofDesign} from './roof-project';
export type LayoutMarker={id:string;segments:number[][];head:number[];outline?:number[][]};
export function layoutMarker(r:RoofDesign):LayoutMarker|undefined{
 if(r.pitch)return;
 const length=4.5,head=length*.28;
 let map=(x:number,z:number)=>({x,z}),start=-length/2,end=length/2,edge:number[]|undefined;
 {const angle=layoutDirection(r.layoutOptions)*Math.PI/2;map=(x,z)=>({x:x*Math.cos(angle)-z*Math.sin(angle),z:x*Math.sin(angle)+z*Math.cos(angle)});}
 const world=(x:number,z:number)=>{const p=toWorld(map(x,z),r);return [p.x,p.z];};
 // Compact four-point silhouette as the panel's module-direction icon.
 const tip=world(0,end),left=world(-length*.18,start),notch=world(0,start+length*4/17),right=world(length*.18,start);
 const outline=[[...tip,...left],[...left,...notch],[...notch,...right],[...right,...tip]];
 return {id:r.id,segments:[[...world(0,start),...tip],...outline],outline,head:[...tip,...left,...notch,...tip,...notch,...right]};
}
