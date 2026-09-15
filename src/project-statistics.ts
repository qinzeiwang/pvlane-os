import {defaultModule,geometry,type PVArray,type ModuleSpec} from './domain';
import {worldArray,type RoofDesign} from './roof-project';
export function panelOrientation(a:PVArray){
 const g=geometry(a),nx=-Math.sin(g.roll),ny=Math.cos(g.tilt)*Math.cos(g.roll),nz=Math.sin(g.tilt)*Math.cos(g.roll);
 const x=nx*Math.cos(g.yaw)+nz*Math.sin(g.yaw),z=-nx*Math.sin(g.yaw)+nz*Math.cos(g.yaw);
 const tilt=Math.acos(Math.max(-1,Math.min(1,ny)))*180/Math.PI;
 return {tilt,azimuth:tilt<1e-7?null:(Math.atan2(x,-z)*180/Math.PI+360)%360,projection:Math.abs(ny)};
}
export function projectStatistics(roofs:RoofDesign[]){
 const regions=roofs.map(r=>{
  const factor=Math.sqrt(1+((r.pitch?.percent??0)/100)**2);
  let count=0,capacity=0,occupiedArea=0;
  for(const a of r.arrays){const m=a.module??defaultModule,n=a.rows*a.columns;count+=n;capacity+=n*m.power/1000;occupiedArea+=n*m.width*m.length*panelOrientation(worldArray(a,r)).projection*factor;}
  return {id:r.id,name:r.name,roofArea:r.roof.width*r.roof.depth*factor,count,capacity,occupiedArea};
 });
 const total=regions.reduce((t,r)=>({roofArea:t.roofArea+r.roofArea,count:t.count+r.count,capacity:t.capacity+r.capacity,occupiedArea:t.occupiedArea+r.occupiedArea}),{roofArea:0,count:0,capacity:0,occupiedArea:0});
 return {regions,total};
}

/** Compass bearing: north 0°, clockwise; describe relative to the nearest cardinal. */
export function formatOrientation(azimuth:number|null):string {
 if(azimuth===null)return '水平 · 无朝向';
 if(!Number.isFinite(azimuth))return '—';
 const a=((Math.round(azimuth*100)/100)%360+360)%360;
 const index=Math.floor((a+45)/90)%4;
 const delta=((a-index*90+540)%360)-180;
 const cardinal=['北','东','南','西'][index];
 if(Math.abs(delta)<.005)return '正'+cardinal;
 const toward=delta>0?['东','南','西','北'][index]:['西','北','东','南'][index];
 return `${cardinal}偏${toward} ${Number(Math.abs(delta).toFixed(2))}°`;
}
