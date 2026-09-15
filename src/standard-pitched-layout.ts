import {corners,initial,overlaps,validModule,defaultModule,type Obstacle,type PVArray} from './domain';
import {roofGradient,roofHeight,validPitch} from './pitched-roof';
import type {LayoutOptions} from './auto-layout';
export function standardPitchedLayout(roof:{width:number;depth:number},objects:Obstacle[],o:LayoutOptions){
 const p=o.pitch!,m=o.module??defaultModule,rows=o.tableRows??1,limit=o.limit??5000;
 if(!validPitch(p)||!validModule(m)||![roof.width,roof.depth,o.edge,o.gap,o.rowGap??0].every(Number.isFinite)||roof.width<=0||roof.depth<=0||o.edge<0||o.gap<0||(o.rowGap??0)<0||!Number.isInteger(rows)||rows<1||rows>3||!Number.isInteger(o.maxColumns)||o.maxColumns<1||o.maxColumns>100||!Number.isInteger(limit)||limit<0||limit>5000)throw new Error('标准组件坡面布置参数无效');
 const turned=!o.portrait,local=(x:number,z:number)=>turned?{x:-z,z:x}:{x,z};
 const roofW=turned?roof.depth:roof.width,roofD=turned?roof.width:roof.depth,g=roofGradient(p,0,0);
 const kx=1/Math.sqrt(1+(turned?g.sz:g.sx)**2),kz=1/Math.sqrt(1+(turned?g.sx:g.sz)**2),w=m.width*kx;
 const arrays:PVArray[]=[];let count=0;
 const result=(capped=false)=>({arrays,count,capped,rowGap:o.rowGap??0,actual:o.rowGap??0,recommended:0,shortened:false});
 for(let top=-roofD/2+o.edge;top<roofD/2-o.edge;){
  let bandRows=rows,d=0;
  // Split at a ridge rather than discarding a full strip that crosses it.
  const ridgeAcrossScan=p.kind==='gable'&&((p.axis==='z')!==turned);
  if(ridgeAcrossScan&&top>=-o.edge-1e-7&&top<o.edge+1e-7)top=o.edge;
  const bottom=ridgeAcrossScan&&top<0?-o.edge:roofD/2-o.edge;
  while(bandRows>0){d=(bandRows*m.length+(bandRows-1)*m.gap)*kz;if(top+d<=bottom+1e-7)break;bandRows--;}
  if(!bandRows){if(ridgeAcrossScan&&top<0){top=o.edge;continue;}break;}
  const z=top+d/2;top+=d+(o.rowGap??0)*kz;
  let run:number[]=[],runSide=0,runRows=bandRows,runZ=z;
  const flush=()=>{if(!run.length)return;const c=local((run[0]+run[run.length-1])/2,runZ),grad=roofGradient(p,c.x,c.z);arrays.push({...initial,...c,module:{...m},id:`standard-${arrays.length+1}`,name:`标准阵列 ${arrays.length+1}`,rows:runRows,columns:run.length,connectedRows:true,portrait:true,azimuth:turned?270:180,tilt:0,surface:{sx:turned?grad.sz:grad.sx,sz:turned?-grad.sx:grad.sz,height:roofHeight(roof,p,c.x,c.z)}});run=[];};
  let column=0;
  for(let x=-roofW/2+o.edge+w/2;x+w/2<=roofW/2-o.edge+1e-7;){
   let chosen=bandRows,chosenZ=z,side=0;
   for(;chosen>0;chosen--){
    const depth=(chosen*m.length+(chosen-1)*m.gap)*kz;chosenZ=z-d/2+depth/2;
    const c=local(x,chosenZ),rect={...c,width:w,depth,yaw:turned?-Math.PI/2:0},v=corners(rect).map(t=>p.axis==='x'?t.x:t.z);side=Math.sign(p.axis==='x'?c.x:c.z);
    if(!objects.some(t=>overlaps(rect,t))&&!(p.kind==='gable'&&Math.min(...v)<o.edge-1e-7&&Math.max(...v)>-o.edge+1e-7))break;
   }
   if(!chosen)flush();else{
    if(count+chosen>limit){flush();return result(true);}
    if(run.length&&(chosen!==runRows||(p.kind==='gable'&&side!==runSide)))flush();
    runRows=chosen;runZ=chosenZ;runSide=side;run.push(x);count+=chosen;
   }
   column++;const end=column%o.maxColumns===0;if(end)flush();x+=w+(end?o.gap:m.gap)*kx;
  }
  flush();
 }
 return result();
}
