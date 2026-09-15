import {parseImageOverlays,type ImageOverlay} from './image-overlays';
import { validPitch } from './pitched-roof';
import { parseProject } from './project-file';
import { newRoof, totals, type RoofDesign } from './roof-project';
import type { BaseImage } from './base-image';
import {parseModuleCatalog,sameModule,type ModuleCatalogItem} from './module-library';
export type WorkspaceFile={version:3;imageOverlays?:ImageOverlay[];moduleCatalog?:ModuleCatalogItem[];globalEdge?:number;name:string;address?:string;hasRegions?:boolean;roofs:RoofDesign[];activeId:string;solarHour:number;backgroundColor:string;groundColor:string;baseImage?:BaseImage};
export function parseWorkspace(text:string):WorkspaceFile {
 const raw=JSON.parse(text);
 const checkModule=(m:{kind?:string}|undefined)=>{if(m?.kind&&m.kind!=='standard')throw new Error('当前版本仅支持标准组件');};
 checkModule(raw.module);for(const r of raw.roofs??[]){checkModule(r.moduleSpec);for(const a of r.arrays??[])checkModule(a.module);}for(const a of raw.arrays??[])checkModule(a.module);for(const m of raw.moduleCatalog??[])checkModule(m?.spec);
 if(raw.version!==3){const p=parseProject(text),r={...newRoof(),northAngle:p.baseImage?.northAngle,roof:p.roof,obstacles:p.obstacles,arrays:p.arrays,moduleSpec:p.module,layoutOptions:p.rules,wallHeight:p.wallHeight};const b=p.baseImage;
  if(b?.frame&&b.metersPerPixel){r.x=(b.frame.x+b.frame.width/2-b.width/2)*b.metersPerPixel;r.z=(b.frame.y+b.frame.height/2-b.height/2)*b.metersPerPixel;b.frame={x:0,y:0,width:b.width,height:b.height};}
  const moduleCatalog=parseModuleCatalog(undefined,[r.moduleSpec]);r.moduleId=moduleCatalog[0].id;
  return {version:3,moduleCatalog,globalEdge:r.layoutOptions.edge,name:p.name,roofs:[r],activeId:r.id,solarHour:p.solarHour,backgroundColor:p.backgroundColor,groundColor:p.groundColor,baseImage:b};
 }
 const p=raw as WorkspaceFile;
 if(p.imageOverlays!==undefined)p.imageOverlays=parseImageOverlays(p.imageOverlays);
 delete (p as unknown as {energySettings?:unknown}).energySettings;
 if(p.address!==undefined&&typeof p.address!=='string')throw new Error('项目地址无效');
 if(p.hasRegions!==undefined&&typeof p.hasRegions!=='boolean')throw new Error('区域状态无效');
 if(!Array.isArray(p.roofs)||!p.roofs.length||p.roofs.length>50||new Set(p.roofs.map(r=>r.id)).size!==p.roofs.length)throw new Error('屋面数量或标识无效');
 for(const r of p.roofs){
  if(r.northAngle!==undefined&&(!Number.isFinite(r.northAngle)||r.northAngle<0||r.northAngle>=360))throw new Error('北向角度无效');
  r.northAngle=p.baseImage?.northAngle??r.northAngle;
  if(r.flatHeight!==undefined&&(!Number.isFinite(r.flatHeight)||r.flatHeight<1||r.flatHeight>100))throw new Error('屋面高度无效');
  if((r as unknown as {carport?:unknown}).carport!==undefined)throw new Error('当前版本不支持车棚项目数据');
  if(r.pitch!==undefined&&!validPitch(r.pitch))throw new Error("屋面坡度参数无效");
  if(typeof r.id!=='string'||r.id.includes('/')||typeof r.name!=='string'||![r.x,r.z,r.yaw].every(Number.isFinite)||Math.abs(r.x)>100000||Math.abs(r.z)>100000)throw new Error('屋面坐标无效');
  parseProject(JSON.stringify({version:2,name:p.name,roof:r.roof,obstacles:r.obstacles,arrays:r.arrays,module:r.moduleSpec,rules:r.layoutOptions,wallHeight:r.wallHeight,solarHour:p.solarHour,backgroundColor:p.backgroundColor,groundColor:p.groundColor}));
  if(r.moduleSpec.kind===undefined)r.moduleSpec.kind='standard';
  r.previous=null;
  if(typeof r.layoutSignature!=='string')r.layoutSignature='';
  if(typeof r.layoutMessage!=='string')r.layoutMessage='';
 }
 p.moduleCatalog=parseModuleCatalog(p.moduleCatalog,p.roofs.map(r=>r.moduleSpec));
 for(const r of p.roofs){
  if(r.northAngle!==undefined&&(!Number.isFinite(r.northAngle)||r.northAngle<0||r.northAngle>=360))throw new Error('北向角度无效');
  r.northAngle=p.baseImage?.northAngle??r.northAngle;
  const selected=p.moduleCatalog.find(item=>item.id===r.moduleId&&sameModule(item.spec,r.moduleSpec))||p.moduleCatalog.find(item=>sameModule(item.spec,r.moduleSpec));
  if(!selected)throw new Error(`${r.name} 的组件规格与组件库不一致`);
  r.moduleId=selected.id;
 }
 if(p.globalEdge===undefined)p.globalEdge=p.roofs[0].layoutOptions.edge;
 if(!Number.isFinite(p.globalEdge)||p.globalEdge<0||p.globalEdge>20)throw new Error('全局屋面边距无效');
 if(totals(p.roofs).count>5000)throw new Error('项目组件总数超过 5000');
 if(p.baseImage){const r=p.roofs[0];parseProject(JSON.stringify({version:2,name:p.name,roof:r.roof,obstacles:[],arrays:[],module:r.moduleSpec,rules:r.layoutOptions,wallHeight:r.wallHeight,solarHour:p.solarHour,backgroundColor:p.backgroundColor,groundColor:p.groundColor,baseImage:p.baseImage}));}
 if(!p.roofs.some(r=>r.id===p.activeId))p.activeId=p.roofs[0].id;
 return p;
}
type SaveHandle={name:string;createWritable:()=>Promise<{write:(data:Blob)=>Promise<void>;close:()=>Promise<void>}>};
export async function downloadWorkspace(p:WorkspaceFile):Promise<string|null>{
 const picker=(window as unknown as {showSaveFilePicker?:(options:unknown)=>Promise<SaveHandle>}).showSaveFilePicker;
 if(!picker)throw new Error('当前浏览器不支持选择保存位置，请在 Chrome 或 Edge 中打开本项目后保存。');
 const suggestedName=`${p.name.replace(/[\\/:*?"<>|]/g,'_')||'光伏方案'}.json`;
 try{
  const handle=await picker.call(window,{suggestedName,types:[{description:'光伏项目 JSON',accept:{'application/json':['.json']}}],excludeAcceptAllOption:true});
  const file=await handle.createWritable();
  await file.write(new Blob([JSON.stringify(p)],{type:'application/json'}));await file.close();return handle.name;
 }catch(e){if(e instanceof DOMException&&e.name==='AbortError')return null;throw e;}
}
