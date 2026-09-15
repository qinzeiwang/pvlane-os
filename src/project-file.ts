import { valid, validModule, type ModuleSpec, type PVArray, type Obstacle } from './domain';
import type { LayoutOptions } from './auto-layout';
import { validLayoutOptions } from './layout-validation';
import type { BaseImage } from './base-image';
export type ProjectFile = {version:1|2;name:string;roof:{width:number;depth:number};obstacles:Obstacle[];arrays:PVArray[];module:ModuleSpec;rules:LayoutOptions;wallHeight:number;solarHour:number;backgroundColor:string;groundColor:string;baseImage?:BaseImage};
export function parseProject(text:string):ProjectFile {
 const p=JSON.parse(text) as ProjectFile;
 const range=(v:number,min:number,max:number)=>Number.isFinite(v)&&v>=min&&v<=max;
 if(![1,2].includes(p.version)||typeof p.name!=='string'||!p.roof||!range(p.roof.width,2,200)||!range(p.roof.depth,2,200)||!p.module||!validModule(p.module)||!range(p.wallHeight,0,5)||!range(p.solarHour,9,15))throw new Error('项目参数或版本无效');
 if(!Array.isArray(p.arrays)||p.arrays.length>5000||p.arrays.some(a=>!valid(a)||typeof a.id!=='string'||typeof a.name!=='string')||p.arrays.reduce((n,a)=>n+a.rows*a.columns,0)>5000||new Set(p.arrays.map(a=>a.id)).size!==p.arrays.length)throw new Error('阵列数据无效');
 if(!Array.isArray(p.obstacles)||p.obstacles.length>100||p.obstacles.some(o=>(o.kind!==undefined&&!['obstacle','keepout'].includes(o.kind))||typeof o.id!=='string'||typeof o.name!=='string'||![o.x,o.z,o.yaw].every(Number.isFinite)||!range(o.width,.2,500)||!range(o.depth,.2,500)||!(o.kind==='keepout'?o.height===0:range(o.height,.2,30)))||new Set(p.obstacles.map(o=>o.id)).size!==p.obstacles.length)throw new Error('障碍物数据无效');
 if(!validLayoutOptions(p.rules))throw new Error('排布规则无效');
 if(!/^#[0-9a-f]{6}$/i.test(p.backgroundColor)||!/^#[0-9a-f]{6}$/i.test(p.groundColor))throw new Error('颜色无效');
 const b=p.baseImage;if(b){if(b.northAngle!==undefined&&(!Number.isFinite(b.northAngle)||b.northAngle<0||b.northAngle>=360))throw new Error('北向角度无效');if(b.pdfSource!==undefined&&(typeof b.pdfSource!=='string'||!/^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/.test(b.pdfSource)||b.pdfSource.length>41000000))throw new Error('PDF 原文件数据无效');if(typeof b.name!=='string'||typeof b.url!=='string'||!/^data:image\/(png|jpeg|webp);base64,/.test(b.url)||b.url.length>60000000||!range(b.width,1,10000)||!range(b.height,1,10000)||b.metersPerPixel!==undefined&&!range(b.metersPerPixel,.000001,10000))throw new Error('底图无效');if(b.frame&&(!b.metersPerPixel||![b.frame.x,b.frame.y,b.frame.width,b.frame.height].every(Number.isFinite)||b.frame.x<0||b.frame.y<0||b.frame.width<=0||b.frame.height<=0||b.frame.x+b.frame.width>b.width+1||b.frame.y+b.frame.height>b.height+1))throw new Error('底图区域无效');}
 return p;
}
export function downloadProject(p:ProjectFile){const url=URL.createObjectURL(new Blob([JSON.stringify(p)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`${p.name.replace(/[\\/:*?"<>|]/g,'_')||'屋面方案'}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
