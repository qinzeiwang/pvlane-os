import {pitchedShadowZones} from './pitched-shadow-zones';
import {hitsShadow} from './shadow-zones';
import {corners,initial,overlaps,validModule,defaultModule,type Obstacle,type PVArray} from './domain';
import {roofGradient,roofHeight,validPitch} from './pitched-roof';
import type {LayoutOptions} from './auto-layout';

type Band={z:number;rows:number;depth:number};

export function standardPitchedLayout(roof:{width:number;depth:number},objects:Obstacle[],o:LayoutOptions){
 const p=o.pitch!,m=o.module??defaultModule,rows=o.tableRows??1,limit=o.limit??5000;
 if(!validPitch(p)||!validModule(m)||![roof.width,roof.depth,o.edge,o.gap,o.rowGap??0].every(Number.isFinite)||roof.width<=0||roof.depth<=0||o.edge<0||o.gap<0||(o.rowGap??0)<0||!Number.isInteger(rows)||rows<1||rows>3||!Number.isInteger(o.maxColumns)||o.maxColumns<1||o.maxColumns>100||!Number.isInteger(limit)||limit<0||limit>5000)throw new Error('标准组件坡面布置参数无效');
 const forbidden=pitchedShadowZones(roof,objects,p,o.roofYaw??0);
 const turned=!o.portrait,local=(x:number,z:number)=>turned?{x:-z,z:x}:{x,z};
 const roofW=turned?roof.depth:roof.width,roofD=turned?roof.width:roof.depth,g=roofGradient(p,0,0);
 const kx=1/Math.sqrt(1+(turned?g.sz:g.sx)**2),kz=1/Math.sqrt(1+(turned?g.sx:g.sz)**2),w=m.width*kx;
 const arrays:PVArray[]=[];let count=0;
 const result=(capped=false)=>({arrays,count,capped,rowGap:o.rowGap??0,actual:o.rowGap??0,recommended:0,shortened:false});
 const slopeAcrossBands=(p.axis==='z')!==turned;
 const makeBands=(start:number,end:number,direction:1|-1)=>{
  const bands:Band[]=[];let cursor=start;
  while(direction>0?cursor<end-1e-7:cursor>end+1e-7){
   let bandRows=rows,depth=0;
   while(bandRows>0){
    depth=(bandRows*m.length+(bandRows-1)*m.gap)*kz;
    if(direction>0?cursor+depth<=end+1e-7:cursor-depth>=end-1e-7)break;
    bandRows--;
   }
   if(!bandRows)break;
   bands.push({z:cursor+direction*depth/2,rows:bandRows,depth});
   cursor+=direction*(depth+(o.rowGap??0)*kz);
  }
  return bands;
 };
 let bands:Band[];
 if(p.kind==='gable'&&slopeAcrossBands)bands=[...makeBands(-o.edge,-roofD/2+o.edge,-1),...makeBands(o.edge,roofD/2-o.edge,1)];
 else if(p.kind==='single'&&slopeAcrossBands){
  const high=turned?-p.high:p.high;
  bands=high>0?makeBands(roofD/2-o.edge,-roofD/2+o.edge,-1):makeBands(-roofD/2+o.edge,roofD/2-o.edge,1);
 }else bands=makeBands(-roofD/2+o.edge,roofD/2-o.edge,1);
 const makeColumns=(start:number,end:number,direction:1|-1)=>{
  const values:number[]=[];let boundary=start,column=0;
  while(true){
   const x=boundary+direction*w/2;
   if(direction>0?x+w/2>end+1e-7:x-w/2<end-1e-7)break;
   values.push(x);column++;
   boundary+=direction*(w+(column%o.maxColumns===0?o.gap:m.gap)*kx);
  }
  return values;
 };
 let columns:number[];
 if(p.kind==='gable'&&!slopeAcrossBands)columns=[...makeColumns(-o.edge,-roofW/2+o.edge,-1),...makeColumns(o.edge,roofW/2-o.edge,1)];
 else if(p.kind==='single'&&!slopeAcrossBands)columns=p.high>0?makeColumns(roofW/2-o.edge,-roofW/2+o.edge,-1):makeColumns(-roofW/2+o.edge,roofW/2-o.edge,1);
 else columns=makeColumns(-roofW/2+o.edge,roofW/2-o.edge,1);
 for(const band of bands){
  const {z,rows:bandRows,depth}=band;
  let run:number[]=[],runSide=0,runRows=bandRows,runZ=z,previousX:number|undefined;
  const flush=()=>{if(!run.length)return;const c=local((run[0]+run[run.length-1])/2,runZ),grad=roofGradient(p,c.x,c.z);arrays.push({...initial,...c,module:{...m},id:`standard-${arrays.length+1}`,name:`标准阵列 ${arrays.length+1}`,rows:runRows,columns:run.length,connectedRows:true,portrait:true,azimuth:turned?270:180,tilt:0,surface:{sx:turned?grad.sz:grad.sx,sz:turned?-grad.sx:grad.sz,height:roofHeight(roof,p,c.x,c.z)}});run=[];previousX=undefined;};
  for(const x of columns){
   let chosen=bandRows,chosenZ=z,side=0;
   for(;chosen>0;chosen--){
    const chosenDepth=(chosen*m.length+(chosen-1)*m.gap)*kz;
    chosenZ=z-depth/2+chosenDepth/2;
    const c=local(x,chosenZ),rect={...c,width:w,depth:chosenDepth,yaw:turned?-Math.PI/2:0},v=corners(rect).map(t=>p.axis==='x'?t.x:t.z);side=Math.sign(p.axis==='x'?c.x:c.z);
    if(!objects.some(t=>overlaps(rect,t))&&!forbidden.some(zone=>hitsShadow(rect,zone))&&!(p.kind==='gable'&&Math.min(...v)<o.edge-1e-7&&Math.max(...v)>-o.edge+1e-7))break;
   }
   const discontinuous=previousX!==undefined&&Math.abs(Math.abs(x-previousX)-(w+m.gap*kx))>1e-6;
   if(!chosen)flush();else{
    if(count+chosen>limit){flush();return result(true);}
    if(run.length&&(chosen!==runRows||(p.kind==='gable'&&side!==runSide)||discontinuous))flush();
    runRows=chosen;runZ=chosenZ;runSide=side;run.push(x);previousX=x;count+=chosen;
    if(run.length===o.maxColumns)flush();
   }
  }
  flush();
 }
 return result();
}
