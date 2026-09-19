import {ImageOverlayPanel} from './image-overlay-panel';
import {resizeOverlay,type ImageOverlay} from './image-overlays';
import {geographicYaw} from './roof-project';
import {Compass} from './north-compass';
import {layoutMarker} from './layout-direction';
import {layoutDirection} from './auto-layout';
import {useProjectHistory} from './use-project-history';
import {ProjectStart} from './project-start';
import {schemeReport,reportReadiness,downloadScheme} from './scheme-report';
import {layoutSignatureFor} from './layout-state';
import {NewRegion} from './new-region';
import {applyRegionForm,type RegionForm} from './region-form';
import {DisplayPopover} from './display-popover';
import { defaultPitch, type RoofPitch } from './pitched-roof';
import {RegionPanel} from './region-panel';
import {turnPitch} from './roof-direction';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  geometry, defaultModule, validModule,
  footprint,
  overlaps,
  defaultArrays,
  copyArray,
  detect,
  obstacles as defaultObstacles,
  roof as defaultRoof,
  valid,
  type Params,
  type Mode,
} from "./domain";
import "./style.css";
import "./design-system.css";
import "./panel.css";
import "./region-panel.css";
import "./brand.css";
import {resizeObject} from "./resize-object";
import {ModuleLibraryPanel,ModulePicker} from './module-library-panel';
import {defaultModuleCatalog,sameModule,type ModuleCatalogItem} from './module-library';
import { ImageEditor } from './image-editor';
import type { BaseImage } from './base-image';
import { parseWorkspace, downloadWorkspace, type WorkspaceFile } from './workspace-file';
import { useRoofProject, newRoof, roofFromPrevious, type RoofDesign, roofRect, toLocal, toWorld, worldArray, worldObstacle, projectBounds, totals } from './roof-project';
import { loadDrawing } from './drawing-import';
import { Icon } from "./workbench-ui";
import { shadowZones, hitsShadow } from "./shadow-zones";
import { pitchedShadowZones } from "./pitched-shadow-zones";
import { recommendedGap } from "./solar";
import { autoLayout, type LayoutOptions } from "./auto-layout";
import { AutoPanel, AdvancedLayoutPanel } from "./auto-panel";
import { SitePanel } from "./site-panel";
import type { PerformanceReport } from "./render-options";
const Three = lazy(() => import("./three"));
function App() {
  const engine = "three";
  const [historyEpoch,setHistoryEpoch]=useState(0);
  const [moduleCatalog,setModuleCatalog]=useState<ModuleCatalogItem[]>(defaultModuleCatalog);
  const [reportPreview,setReportPreview]=useState<{html:string;name:string}|null>(null);
  const [reportSaving,setReportSaving]=useState(false);
  const {roofs,setRoofs,active,setActiveId,roof,setRoof,moduleSpec,layoutOptions,setLayoutOptions,wallHeight,setWallHeight,obstacles,setObstacles,arrays,setArrays,layoutSignature,setLayoutSignature,layoutMessage,setLayoutMessage,previous,setPrevious}=useRoofProject();
  const inspector=useRef<HTMLDivElement>(null);
  const [editingObject,setEditingObject]=useState(false);
  const [renaming,setRenaming]=useState(false);
  const objectSnapshot=useRef<{id:string;objects:RoofDesign['obstacles']}|null>(null);
  const [canvasMenu,setCanvasMenu]=useState<{id:string;x:number;y:number}|null>(null);
  const [globalEdge,setGlobalEdge]=useState(.5);
  const [deletedRoof,setDeletedRoof]=useState<{roof:RoofDesign;index:number;placeholder?:RoofDesign}>();
  const [importing,setImporting]=useState(false);
  const [advancedOpen,setAdvancedOpen]=useState(false);
  const [displayOpen,setDisplayOpen]=useState(false);
  useEffect(()=>{
    const dismissOutside=(event:Event)=>{
      const target=event.target;if(!(target instanceof Element))return;
      document.querySelectorAll<HTMLDetailsElement>('.project-menu[open], .region-menu[open]').forEach(menu=>{if(!menu.contains(target))menu.open=false;});
      if(!target.closest('.display-popover, [data-display-trigger]'))setDisplayOpen(false);
    };
    const dismissOnEscape=(event:KeyboardEvent)=>{if(event.key!=='Escape')return;document.querySelectorAll<HTMLDetailsElement>('.project-menu[open], .region-menu[open]').forEach(menu=>{menu.open=false;});setDisplayOpen(false);};
    document.addEventListener('pointerdown',dismissOutside,true);document.addEventListener('click',dismissOutside,true);document.addEventListener('keydown',dismissOnEscape);
    return()=>{document.removeEventListener('pointerdown',dismissOutside,true);document.removeEventListener('click',dismissOutside,true);document.removeEventListener('keydown',dismissOnEscape);};
  },[]);
  const [saving,setSaving]=useState(false),[newProjectOpen,setNewProjectOpen]=useState(false);
  const [imageOverlays,setImageOverlays]=useState<ImageOverlay[]>([]);
  const [overlayOpen,setOverlayOpen]=useState(false),[selectedOverlay,setSelectedOverlay]=useState<string|null>(null);
  const [baseImage,setBaseImage] = useState<BaseImage>();
  const drawingView=useRef<{x:number;y:number;width:number;height:number;viewportHeight?:number}|undefined>(undefined);
  const [restoredDrawingView,setRestoredDrawingView]=useState<{x:number;y:number;width:number;height:number;viewportHeight?:number}>();
  const [hasSelection,setHasSelection]=useState(false);
  const [creating,setCreating]=useState(false);
  const [obstacleHeight,setObstacleHeight]=useState(1);
  const [drawingForm,setDrawingForm]=useState<RegionForm>();
  const [reportOpen,setReportOpen]=useState(false);
  const captureScene=useRef<(()=>string)|null>(null);
  const [reportError,setReportError]=useState('');
  const [globalOpen,setGlobalOpen]=useState(false);
  const [drawingTool,setDrawingTool]=useState<'roof'|'obstacle'|'keepout'|'scale'>('roof');
  const [drawingIntent,setDrawingIntent]=useState<'create'|'reshape'|'scale'|'obstacle'|'keepout'>('create');
  const [imageOpen,setImageOpen] = useState(false);
  const [fileMessage,setFileMessage] = useState('');
  const fileInput=useRef<HTMLInputElement>(null),imageInput=useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState('roof');
  const [entry,setEntry]=useState<'welcome'|'new'|'workspace'>('welcome');
  const [projectAddress,setProjectAddress]=useState('');
  const [projectName, setProjectName] = useState('未命名项目');
  const [selectedObstacleId, setSelectedObstacle] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState("#dce5ec");
  const [groundColor, setGroundColor] = useState("#c7cccb");
  const [collapsed, setCollapsed] = useState(false);
  const selectArray = (id: string | null) => { setSelected(id); setSelectedObstacle(null); };
  const [solarHour, setSolarHour] = useState(9);
  const [showShadows, setShowShadows] = useState(true);
  const [selectedId, setSelected] = useState<string | null>(null),
    [mode, setMode] = useState<Mode>("top"),
    [reset, setReset] = useState(0),
    [error, setError] = useState("");
  const [realistic, setRealistic] = useState(true),
    [guides, setGuides] = useState(false),
    [stress, setStress] = useState(false),
    [run, setRun] = useState(0),
    [progress, setProgress] = useState(""),
    [report, setReport] = useState<PerformanceReport | null>(() => {
      try {
        return JSON.parse(
          localStorage.getItem("pv.visual.performance") ?? "null",
        );
      } catch {
        return null;
      }
    });
  const historyValue=useMemo(()=>({imageOverlays,roofs,activeId:active.id,baseImage,hasSelection,globalEdge,moduleCatalog,projectName,projectAddress}),[imageOverlays,roofs,active.id,baseImage,hasSelection,globalEdge,moduleCatalog,projectName,projectAddress]);
  const history=useProjectHistory(historyValue,(a,b)=>{
    const signature=(v:typeof historyValue)=>JSON.stringify({imageOverlays:v.imageOverlays.map(({url,...o})=>o),roofs:v.roofs,base:v.baseImage?{name:v.baseImage.name,width:v.baseImage.width,height:v.baseImage.height,northAngle:v.baseImage.northAngle,metersPerPixel:v.baseImage.metersPerPixel,frame:v.baseImage.frame}:null,hasSelection:v.hasSelection,globalEdge:v.globalEdge,moduleCatalog:v.moduleCatalog,projectName:v.projectName,projectAddress:v.projectAddress},(key,value)=>key==='previous'||key==='layoutMessage'?undefined:value);
    return a.imageOverlays.every((o,i)=>o.url===b.imageOverlays[i]?.url)&&a.baseImage?.url===b.baseImage?.url&&signature(a)===signature(b);
  },v=>{setImageOverlays(v.imageOverlays);setRoofs(v.roofs);setActiveId(v.activeId);setBaseImage(v.baseImage);setHasSelection(v.hasSelection);setGlobalEdge(v.globalEdge);setModuleCatalog(v.moduleCatalog);setProjectName(v.projectName);setProjectAddress(v.projectAddress);setSelected(null);setSelectedObstacle(null);setEditingObject(false);setDeletedRoof(undefined);setFileMessage('');setError('');},historyEpoch,entry==='workspace'&&!imageOpen&&!importing&&!saving&&!reportPreview&&!reportOpen&&!newProjectOpen&&!stress);
  useEffect(()=>{if(!/^(项目已打开|已保存：|已取消保存|全部屋面已布置)/.test(fileMessage))return;const timer=setTimeout(()=>setFileMessage(''),5000);return()=>clearTimeout(timer);},[fileMessage]);
  const running = progress.startsWith("第");
  const sequence = useRef(3);
  const currentSignature = layoutSignatureFor(active,globalEdge);
  const layoutStale = layoutSignature !== currentSignature;
  const needsOutline=!!baseImage&&!baseImage.frame;
  const overlappingRoofs=roofs.filter(r=>r.id!==active.id&&overlaps(roofRect(active),roofRect(r)));
  const runLayout = (options: LayoutOptions) => {
    try {
      if(needsOutline)throw new Error('请先标定并圈屋面');
      if(overlappingRoofs.length)throw new Error('当前屋面与其他屋面重叠，请先调整轮廓');
      const result = autoLayout(roof, obstacles, { ...options, edge:globalEdge, pitch:active.pitch, wallHeight, module: moduleSpec, roofYaw:geographicYaw(active), limit:5000-totals(roofs.filter(r=>r.id!==active.id)).count });
      setFileMessage("");
      setLayoutSignature(currentSignature);
      setSelectedObstacle(null);
      setPrevious(arrays);
      setArrays(result.arrays);
      setSelected(null);
      setLayoutMessage(`已排布 ${result.count} 块 / ${(result.count * moduleSpec.power / 1000).toFixed(2)} kWp · 前后净距 ${result.rowGap.toFixed(2)} m${result.shortened ? " · 允许部分遮挡" : ""}${result.capped ? " · 已达完整连排数量上限" : ""}`);
    } catch(e) { setLayoutMessage(`请检查参数：${e instanceof Error ? e.message : "排布失败"}。组件长宽 0.2–5m，功率 1–2000Wp，连排 1–3、列数 1–100，间距不得为负。`); }
  };
  const zones = active.pitch?[]:shadowZones(roof, obstacles, wallHeight, geographicYaw(active));
  const shadowIssues = arrays.flatMap(a => zones.filter(zone => hitsShadow(footprint(a), zone)).map(zone => ({ kind: "obstacle" as const, ids: [a.id, zone.id], text: `${a.name} 进入${zone.name}` })));
  const selected = arrays.find((a) => a.id === selectedId),
    issues = [...detect(arrays, obstacles, roof), ...shadowIssues,...overlappingRoofs.map(r=>({kind:"boundary" as const,ids:arrays.map(a=>a.id),text:`与 ${r.name} 屋面重叠`}))],
    count = arrays.reduce((sum, a) => sum + a.rows * a.columns, 0);
  const selectedObstacle = obstacles.find(o => o.id === selectedObstacleId);
  useEffect(()=>{inspector.current?.scrollTo({top:0});},[active.id,selectedObstacleId,selectedId,panel]);
  const g = selected ? geometry(selected) : null;
  const update = (patch: Partial<Params>) => {
    if (!selected || mode !== "top") return;
    const next = { ...selected, ...patch };
    if (
      !valid(next) ||
      totals(roofs).count - selected.rows * selected.columns + next.rows * next.columns > 5000
    ) {
      setError("请输入有限数值：行列为正整数，总数 ≤ 5000，倾角 0–60°。");
      return;
    }
    next.azimuth = ((next.azimuth % 360) + 360) % 360;
    if (!next.connectedRows) next.rowGap = Math.max(next.rowGap ?? 0, recommendedGap(next.portrait ? (next.module ?? defaultModule).length : (next.module ?? defaultModule).width, next.tilt, next.azimuth-active.yaw*180/Math.PI));
    setArrays((prev) => prev.map((a) => (a.id === next.id ? next : a)));
    setError("");
    return next;
  };
  const copy = () => {
    if (!selected) return;
    if (totals(roofs).count + selected.rows * selected.columns > 5000) {
      setError("复制后超过 5000 块上限");
      return;
    }
    const n = sequence.current++;
    const a = copyArray(
      selected,
      crypto.randomUUID(),
      `阵列 ${String(n).padStart(2, "0")}`,
    );
    setArrays((prev) => [...prev, a]);
    setSelected(a.id);
    setError("");
  };
  const restore = () => {
    const sample=newRoof('示例屋面');sample.obstacles=defaultObstacles.map(o=>({...o}));sample.arrays=autoLayout(sample.roof,sample.obstacles,sample.layoutOptions).arrays;
    setRoofs([sample]);setActiveId(sample.id);setBaseImage(undefined);setImageOverlays([]);setOverlayOpen(false);setSelectedOverlay(null);setSelected(null);setMode('top');setReset(n=>n+1);setFileMessage('');
  };
  const capacity = arrays.reduce((sum,a)=>sum+a.rows*a.columns*(a.module??defaultModule).power/1000,0);
  const total=totals(roofs);
  const updateModuleCatalog=(next:ModuleCatalogItem[])=>{
    if(!next.length||next.length>50||next.some(item=>!item.name.trim()||!validModule(item.spec)))return '组件名称和规格无效，未应用修改';
    if(roofs.some(r=>r.moduleId&&!next.some(item=>item.id===r.moduleId)))return '组件正在被区域使用，不能删除';
    setModuleCatalog(next);
    setRoofs(current=>current.map(r=>{const item=next.find(candidate=>candidate.id===r.moduleId);return item?{...r,moduleSpec:{...item.spec}}:r;}));
    return null;
  };
  const bindModule=(r:RoofDesign):RoofDesign=>{
    const allowed=moduleCatalog;
    let item=allowed.find(item=>item.id===r.moduleId&&sameModule(item.spec,r.moduleSpec))??allowed.find(item=>sameModule(item.spec,r.moduleSpec))??allowed[0];
    if(!item){item={id:crypto.randomUUID(),name:`标准组件 ${defaultModule.power} Wp`,spec:{...defaultModule,kind:'standard'}};const added=item;setModuleCatalog(items=>[...items,added]);}
    return {...r,moduleId:item.id,moduleSpec:{...item.spec}};
  };
  const removeActiveRoof=()=>{
    const index=roofs.findIndex(r=>r.id===active.id),remaining=roofs.filter(r=>r.id!==active.id);
    const placeholder=remaining.length?undefined:roofFromPrevious(active,'屋面 1');
    setHasSelection(!placeholder);setDeletedRoof({roof:active,index,placeholder});setRoofs(placeholder?[placeholder]:remaining);
    setActiveId(placeholder?.id??remaining[Math.min(index,remaining.length-1)].id);setSelected(null);setSelectedObstacle(null);
    if(placeholder&&baseImage)setBaseImage({...baseImage,frame:undefined});
    setFileMessage(`已删除 ${active.name}，可撤回`);
  };
  const undoRoofRemoval=()=>{
    if(!deletedRoof)return;
    const next=roofs.filter(r=>r!==deletedRoof.placeholder);
    const restored={...deletedRoof.roof};
    const item=moduleCatalog.find(item=>item.id===restored.moduleId);
    if(item)restored.moduleSpec={...item.spec};
    else {
      if(moduleCatalog.length>=50){setFileMessage('组件库已满，请先腾出一个组件位置再恢复区域');return;}
      const recovered={id:crypto.randomUUID(),name:`标准组件 ${restored.moduleSpec.power} Wp`,spec:{...restored.moduleSpec}};
      restored.moduleId=recovered.id;setModuleCatalog(items=>[...items,recovered]);
    }
    next.splice(Math.min(deletedRoof.index,next.length),0,restored);
    if(totals(next).count>5000||next.length>50){setFileMessage('撤回后超过项目数量上限，请先移除新增内容');return;}
    setHasSelection(true);setRoofs(next);setActiveId(deletedRoof.roof.id);setSelected(null);setSelectedObstacle(null);
    if(baseImage&&!baseImage.frame)setBaseImage({...baseImage,frame:{x:0,y:0,width:baseImage.width,height:baseImage.height}});
    setDeletedRoof(undefined);setFileMessage('已恢复删除的屋面');
  };
  const chooseRoof=(id:string)=>{setEditingObject(false);setHasSelection(true);setActiveId(id);setSelected(null);setSelectedObstacle(null);setError('');};
  const editCanvasObject=(id:string)=>{
    const object=id.startsWith('@o/')||id.startsWith('@h/'),raw=id.startsWith('@')?id.slice(3):id;
    const rid=raw.split('/')[0],target=roofs.find(r=>r.id===rid);if(!target)return;
    chooseRoof(rid);setPanel('roof');setCollapsed(false);setCanvasMenu(null);
    if(object){objectSnapshot.current={id:rid,objects:structuredClone(target.obstacles)};setSelectedObstacle(raw.split('/')[1]);setMode('top');setEditingObject(true);}
    else if(baseImage){setDrawingIntent('reshape');setDrawingForm(undefined);setDrawingTool('roof');setImageOpen(true);}
  };
  const createBlankProject=()=>{
    setHistoryEpoch(n=>n+1);const r=newRoof();setHasSelection(false);setRoofs([r]);setActiveId(r.id);setBaseImage(undefined);setImageOverlays([]);setOverlayOpen(false);setSelectedOverlay(null);drawingView.current=undefined;setRestoredDrawingView(undefined);setProjectName('未命名项目');setModuleCatalog(defaultModuleCatalog());setDeletedRoof(undefined);setGlobalEdge(.5);
    setSelected(null);setSelectedObstacle(null);setImageOpen(false);setError('');setFileMessage('新项目已创建');
    setSolarHour(9);setShowShadows(true);setBackgroundColor('#dce5ec');setGroundColor('#c7cccb');
    setStress(false);setRun(0);setProgress('');setReport(null);setMode('top');setPanel('roof');setCollapsed(false);setReset(n=>n+1);setNewProjectOpen(false);setProjectAddress('');setEntry('new');
  };
  const save = async():Promise<boolean> => {
    if(saving)return false;
    setSaving(true);
    try {const project:WorkspaceFile={version:3,imageOverlays,moduleCatalog,name:projectName,address:projectAddress,hasRegions:hasSelection,roofs:roofs.map(r=>({...r,previous:null})),activeId:active.id,globalEdge,solarHour,backgroundColor,groundColor,baseImage};
      parseWorkspace(JSON.stringify(project));const name=await downloadWorkspace(project);
      setFileMessage(name?`已保存：${name}`:'已取消保存');return name!==null;
    }catch(e){setFileMessage(`保存失败：${(e as Error).message}`);return false;}finally{setSaving(false);}
  };
  const openFile = async(file?:File)=>{if(!file)return;try{if(file.size>120000000)throw new Error('项目文件超过 120 MB');const p=parseWorkspace(await file.text());setHistoryEpoch(n=>n+1);setModuleCatalog(p.moduleCatalog??defaultModuleCatalog());setProjectName(p.name);setProjectAddress(p.address??'');setEntry('workspace');setDeletedRoof(undefined);setGlobalEdge(p.globalEdge??.5);setRoofs(p.roofs);setActiveId(p.activeId);setHasSelection(p.hasRegions??true);setPanel('roof');setSolarHour(p.solarHour);setBackgroundColor(p.backgroundColor);setGroundColor(p.groundColor);setBaseImage(p.baseImage);setImageOverlays(p.imageOverlays??[]);setOverlayOpen(false);setSelectedOverlay(null);drawingView.current=undefined;setRestoredDrawingView(undefined);setSelected(null);setSelectedObstacle(null);setEditingObject(false);setImageOpen(false);setMode('top');setFileMessage('项目已打开');setReset(n=>n+1);}catch(e){setFileMessage((e as Error).message);}};
  const loadImage=async(file?:File)=>{if(!file||importing)return;setImporting(true);setFileMessage('正在读取底图…');try{const b=await loadDrawing(file);setEntry('workspace');setHistoryEpoch(n=>n+1);setBaseImage(b);setImageOverlays([]);setOverlayOpen(false);setSelectedOverlay(null);setDeletedRoof(undefined);drawingView.current=undefined;setRestoredDrawingView(undefined);setGlobalEdge(.5);const first=bindModule(newRoof());setRoofs([first]);setActiveId(first.id);setSelected(null);setHasSelection(false);setDrawingIntent('scale');setDrawingTool('scale');setDrawingForm(undefined);setImageOpen(true);setFileMessage('');setMode('top');}catch(e){setFileMessage((e as Error).message);}finally{setImporting(false);}};
  const runAll=()=>{try{if(roofs.some((r,i)=>roofs.slice(i+1).some(s=>overlaps(roofRect(r),roofRect(s)))))throw new Error('屋面之间存在重叠，请先调整轮廓');let remaining=5000;const next=roofs.map(r=>{const result=autoLayout(r.roof,r.obstacles,{...r.layoutOptions,edge:globalEdge,pitch:r.pitch,module:r.moduleSpec,wallHeight:r.wallHeight,roofYaw:geographicYaw(r),limit:remaining});remaining-=result.count;return {...r,previous:r.arrays,arrays:result.arrays,layoutSignature:layoutSignatureFor(r,globalEdge),layoutMessage:''};});setRoofs(next);setSelected(null);setFileMessage(remaining<3?'全部屋面已布置，接近项目 5000 块上限':'全部屋面已布置');}catch(e){setFileMessage((e as Error).message);}};
  const changeRoofKind: (kind:"flat"|"single"|"gable")=>void = kind=>setRoofs(prev=>prev.map(r=>r.id===active.id?{...r,pitch:kind==='flat'?undefined:{...(r.pitch??defaultPitch),kind},previous:null}:r));
  const createRegion=(form:RegionForm)=>{
    setCreating(false);setDrawingIntent('create');setDrawingForm(form);
    if(baseImage){setDrawingTool('roof');setImageOpen(true);return;}
    const prefix='屋面';let n=1;while(roofs.some(r=>r.name===`${prefix} ${n}`))n++;
    const r=bindModule(applyRegionForm(roofFromPrevious(active,`${prefix} ${n}`),form));
    const empty=!hasSelection&&roofs.length===1&&!active.arrays.length&&!active.obstacles.length;
    if(!empty){const b=projectBounds(roofs);r.x=b.x+b.width/2+r.roof.width/2+2;}else r.name=`${prefix} 1`;
    setRoofs(empty?[r]:[...roofs,r]);chooseRoof(r.id);setPanel('roof');setMode('top');setReset(n=>n+1);
  };
  const bounds=projectBounds(roofs);
  const worldArrays=(hasSelection?roofs:[]).flatMap(r=>r.arrays.map(a=>worldArray(a,r)));
  const worldObjects=(hasSelection?roofs:[]).flatMap(r=>r.obstacles.map(o=>worldObstacle(o,r)));
  const worldZones=(hasSelection?roofs:[]).flatMap(r=>(r.pitch?pitchedShadowZones(r.roof,r.obstacles,r.pitch,geographicYaw(r)).map(z=>({...z,topOnly:true})):shadowZones(r.roof,r.obstacles,r.wallHeight,geographicYaw(r))).map(z=>({...z,id:`${r.id}/${z.id}`,elevation:(r.flatHeight??3.5)-3.5,points:z.points.map(p=>toWorld(p,r))})));
  const worldIssues=roofs.flatMap(r=>{const localZones=r.pitch?pitchedShadowZones(r.roof,r.obstacles,r.pitch,geographicYaw(r)):shadowZones(r.roof,r.obstacles,r.wallHeight,geographicYaw(r));const localIssues=[...detect(r.arrays,r.obstacles,r.roof),...r.arrays.flatMap(a=>localZones.filter(z=>hitsShadow(footprint(a),z)).map(z=>({kind:'obstacle' as const,ids:[a.id],text:z.name})))];return localIssues.map(i=>({...i,ids:i.ids.map(id=>`${r.id}/${id}`)}));});
  const View = Three;
  if(entry!=='workspace')return <ProjectStart creating={entry==='new'} busy={importing} message={fileMessage} onNew={()=>{setFileMessage('');setEntry('new');}} onBack={()=>setEntry('welcome')} onOpen={openFile} onCreate={(mode,file)=>{setFileMessage('');if(mode==='drawing'){void loadImage(file);}else{setHistoryEpoch(n=>n+1);setEntry('workspace');}}}/>;
  return (
    <main>
      {reportPreview&&<div className="project-dialog-backdrop"><section className="report-preview" role="dialog" aria-modal="true" aria-label="方案报告预览"><div className="advanced-heading"><h2>方案报告预览</h2><div><button disabled={reportSaving} onClick={async()=>{setReportSaving(true);setReportError('');try{await downloadScheme(reportPreview.html,reportPreview.name);}catch(e){setReportError((e as Error).message);}finally{setReportSaving(false);}}}>{reportSaving?'保存中…':'下载到…'}</button><button className="icon-button" aria-label="关闭报告预览" onClick={()=>setReportPreview(null)}><Icon name="close"/></button></div></div>{reportError&&<p role="alert">{reportError}</p>}<iframe title="方案报告内容" srcDoc={reportPreview.html} sandbox="allow-scripts allow-modals"/></section></div>}
      {reportOpen&&<div className="project-dialog-backdrop"><section className="project-dialog" role="dialog" aria-modal="true" aria-label="生成方案报告"><div className="advanced-heading"><h2>生成方案报告</h2><button className="icon-button" aria-label="关闭报告" onClick={()=>setReportOpen(false)}><Icon name="close"/></button></div>{reportReadiness(roofs,globalEdge).length?<p>请先布置或更新：{reportReadiness(roofs,globalEdge).join('、')}</p>:<p>采用当前三维视角，包含各屋面面积、光伏数量、装机量、占用面积及合计。先预览报告，再选择保存位置；也可打印为 PDF。</p>}{reportError&&<p role="alert">{reportError}</p>}<div><button onClick={()=>setReportOpen(false)}>返回调整视角</button><button disabled={!!reportReadiness(roofs,globalEdge).length||mode!=='3d'||!hasSelection} onClick={()=>{try{if(!captureScene.current)throw new Error('三维场景尚未准备好');setReportPreview({html:schemeReport(projectName,roofs,globalEdge,captureScene.current(),projectAddress),name:projectName});setReportError('');setReportOpen(false);}catch(e){setReportError((e as Error).message);}}}>预览报告</button></div></section></div>}

      {creating&&<NewRegion previous={active.pitch?.kind??'flat'} hasDrawing={!!baseImage} onCreate={createRegion} onClose={()=>setCreating(false)}/>}
      {globalOpen&&<div className="project-dialog-backdrop"><section className="project-dialog global-settings-dialog" role="dialog" aria-modal="true" aria-label="项目与全局参数"><div className="advanced-heading"><h2>项目与全局参数</h2><button className="icon-button" aria-label="关闭项目设置" onClick={()=>setGlobalOpen(false)}><Icon name="close"/></button></div><div className="project-identity"><label>项目名称<input aria-label="项目名称" value={projectName} onChange={e=>setProjectName(e.target.value)} onBlur={()=>setProjectName(v=>v.trim()||'未命名项目')}/></label><label>项目地址<input aria-label="项目地址" value={projectAddress} placeholder="选填" onChange={e=>setProjectAddress(e.target.value)}/></label></div><ModuleLibraryPanel items={moduleCatalog} usedIds={new Set(roofs.map(r=>r.moduleId).filter((id):id is string=>!!id))} onChange={updateModuleCatalog}/>{hasSelection&&<button onClick={()=>{setGlobalOpen(false);setAdvancedOpen(true);}}>当前区域布置高级参数 · {active.name}</button>}<label>屋面 / 屋脊投影边距 m<input aria-label="全局屋面 / 屋脊投影边距 m" type="number" min="0" max="20" step="0.1" value={globalEdge} onChange={e=>{const n=Number(e.target.value);if(e.target.value!==''&&Number.isFinite(n)&&n>=0&&n<=20)setGlobalEdge(n);}}/></label>{baseImage&&<div className="advanced-map"><label>图纸北向角度 °<input aria-label="图纸北向角度" type="number" min="0" max="359.9" step="0.1" value={baseImage.northAngle??0} onChange={e=>{const n=Number(e.target.value);if(e.target.value&&Number.isFinite(n)&&n>=0&&n<360){setBaseImage({...baseImage,northAngle:n});setRoofs(rs=>rs.map(r=>({...r,northAngle:n})));}}}/></label><small>上方为 0°，顺时针旋转</small><button disabled={importing} title="更换底图会开始新方案，请先保存当前项目" onClick={()=>{setGlobalOpen(false);imageInput.current?.click();}}>更换图片 / PDF</button></div>}<div><button onClick={()=>setGlobalOpen(false)}>完成</button></div></section></div>}
      {newProjectOpen&&<div className="project-dialog-backdrop"><section className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="new-project-title"><h2 id="new-project-title">新建项目</h2><p>新建将清空当前工作区。是否先保存当前项目？</p><div><button disabled={saving} onClick={()=>setNewProjectOpen(false)}>取消</button><button disabled={saving} onClick={createBlankProject}>不保存，新建</button><button disabled={saving} onClick={async()=>{if(await save())createBlankProject();}}>{saving?'保存中…':'保存后新建'}</button></div>{fileMessage.startsWith('保存失败')&&<p role="alert">{fileMessage}</p>}</section></div>}
      {advancedOpen&&<div className="project-dialog-backdrop" onKeyDown={e=>{if(e.key==='Escape')setAdvancedOpen(false);}}><section className="project-dialog" role="dialog" aria-modal="true" aria-label="高级设置"><div className="advanced-heading"><h2>高级设置</h2><button className="icon-button" aria-label="关闭高级设置" onClick={()=>setAdvancedOpen(false)}><Icon name="close"/></button></div><p>{active.name} · 布置参数</p><AdvancedLayoutPanel options={{...layoutOptions,pitch:active.pitch,module:moduleSpec}} onChange={v=>{const {pitch,module,...rules}=v;setLayoutOptions(rules);}}/><div><button onClick={()=>setAdvancedOpen(false)}>完成</button></div></section></div>}
      <header className="topbar">
        <div className="brand"><span className="pvlane-wordmark">PVLANE</span></div>
        <button className="project-title project-name-button" title="编辑项目信息" onClick={()=>setGlobalOpen(true)}>{projectName}</button>

        <div className="top-actions"><div className="history-actions"><button className="icon-button" title="撤销 · Ctrl+Z" aria-label="撤销" disabled={!history.canUndo||importing||saving||running||imageOpen} onClick={history.undo}><Icon name="reset"/></button><button className="icon-button" title="重做 · Ctrl+Shift+Z" aria-label="重做" disabled={!history.canRedo||importing||saving||running||imageOpen} onClick={history.redo}><Icon name="redo"/></button></div><button aria-label="保存项目" title="选择位置并保存 JSON" className="icon-button save-action" disabled={saving||importing} onClick={()=>void save()}><Icon name="save"/></button><button className="icon-button" aria-label="全局参数" title="全局参数" onClick={()=>setGlobalOpen(true)}><Icon name="settings"/></button><details className="project-menu"><summary className="icon-button" title="项目菜单" aria-label="项目菜单"><Icon name="menu"/></summary><div><button disabled={stress||running||importing||saving} onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');setNewProjectOpen(true);}}><Icon name="plus"/>新建项目</button><button disabled={stress||running||importing||saving} onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');fileInput.current?.click();}}><Icon name="folder"/>打开项目</button><button onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');setGlobalOpen(true);}}><Icon name="file"/>项目信息</button></div></details><input ref={fileInput} type="file" accept=".json" hidden onChange={e=>{void openFile(e.target.files?.[0]);e.target.value='';}}/><input ref={imageInput} type="file" accept="application/pdf,.pdf,image/png,image/jpeg,image/webp" hidden onChange={e=>{void loadImage(e.target.files?.[0]);e.target.value='';}}/></div>
      </header>
      <section className="workspace">
        <aside className={`editor-float ${collapsed ? 'is-collapsed' : ''}`} data-page={panel==='report'?'report':panel==='roof'||panel==='project'?'roof':'layout'} aria-label="操作面板" onKeyDown={e => { if(e.key === 'Escape') setCollapsed(true); }}>
          <div className="panel-titlebar"><h1>操作面板</h1><button className="icon-button" aria-label={collapsed ? '展开面板' : '收起面板'} aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}><Icon name="chevron" /></button></div>
          <nav className="design-tabs" aria-label="设计步骤" hidden={collapsed}>{[['roof','区域','site'],['layout','布置','layout'],['report','报告','file']].map(([id,label,icon]) => <button key={id} data-tone={id} className={panel === id || id === 'layout' && ['arrays','angle','spacing'].includes(panel) ? 'active' : ''} onClick={() => setPanel(id)}><Icon name={icon}/><span>{label}</span></button>)}</nav>
          <div ref={inspector} className="inspector-content" hidden={collapsed}>
          {!hasSelection&&panel==='roof'&&<div className="region-context region-context-empty"><select className="region-switch" aria-label="当前区域" disabled><option>暂无区域</option></select><button className="icon-button" title="新增区域" aria-label="新增区域" disabled={importing} onClick={()=>{setCreating(true);}}><Icon name="plus"/></button></div>}
          {hasSelection&&panel!=='report'&&<div className="region-context">{renaming?<input className="region-name-edit" autoFocus aria-label="区域名称" defaultValue={active.name} onBlur={e=>{const name=e.target.value.trim()||active.name;setRoofs(rs=>rs.map(r=>r.id===active.id?{...r,name}:r));setRenaming(false);}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/>:<select className="region-switch" aria-label="当前区域" value={active.id} onChange={e=>chooseRoof(e.target.value)}>{roofs.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>}<button hidden={panel!=='roof'} className="icon-button" title="新增区域" aria-label="新增区域" disabled={importing||running||roofs.length>=50} onClick={()=>{setCreating(true);}}><Icon name="plus"/></button><details hidden={panel!=='roof'} className="region-menu region-more"><summary title="区域管理" aria-label="区域管理"><Icon name="more"/></summary><div className="region-menu-items"><button disabled={!baseImage||importing} onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');setDrawingIntent('reshape');setDrawingForm(undefined);setDrawingTool('roof');setImageOpen(true);}}>修改轮廓</button><details className="region-reference"><summary>区域信息</summary><p>长 {roof.depth.toFixed(1)} m · 宽 {roof.width.toFixed(1)} m</p><p>水平投影 {(roof.width*roof.depth).toFixed(1)} m²</p></details><button onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');setRenaming(true);}}>重命名</button><button disabled={running} onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');removeActiveRoof();}}>删除当前区域</button>{deletedRoof&&<button onClick={undoRoofRemoval}>撤回删除</button>}</div></details></div>}

          {!hasSelection&&panel==='layout'&&<button onClick={()=>{setPanel('roof');setCreating(true);}}>新增区域后布置</button>}

          <section hidden={panel !== 'project'} />

          <div className="layout-inspector" hidden={panel !== 'layout'||!hasSelection}>
          <ModulePicker items={moduleCatalog} value={active.moduleId} onSelect={item=>setRoofs(rs=>rs.map(r=>r.id===active.id?{...r,moduleId:item.id,moduleSpec:{...item.spec}}:r))} onManage={()=>setGlobalOpen(true)}/>



          <section className="layout-rules"><h2>排布规则</h2>
          <AutoPanel northAngle={active.northAngle??0} options={{...layoutOptions,pitch:active.pitch,module:moduleSpec,roofYaw:geographicYaw(active)}} onChange={v=>{const {module,roofYaw,pitch,...rules}=v;setLayoutOptions(rules);}} disabled={stress || running}/></section>
          </div>
          <section hidden={panel !== "display"}><h2>北京冬至阴影</h2>
            <button type="button" className="help-icon" aria-label="北纬 39.9° · 真太阳时 9:00–15:00 红色为整段多边形禁布包络，并非当前时刻阴影。" title="北纬 39.9° · 真太阳时 9:00–15:00 红色为整段多边形禁布包络，并非当前时刻阴影。"><Icon name="info"/></button>


            <div className="time-editor"><label htmlFor="solar-time">真太阳时 <output>{solarHour}:00</output></label><input id="solar-time" aria-label="三维真太阳时" type="range" min="9" max="15" step="1" value={solarHour} disabled={stress || running} onChange={e => setSolarHour(Number(e.target.value))} /><div><span>09:00</span><span>12:00</span><span>15:00</span></div></div>
            <label className="checkline"><input type="checkbox" checked={showShadows} onChange={e => setShowShadows(e.target.checked)} />显示阴影禁布区</label>

          </section>
          {panel==='roof'&&hasSelection&&!baseImage&&<SitePanel section="roof" roof={roof} obstacles={obstacles} onRoof={setRoof} onObstacles={setObstacles} disabled={running||stress}/>}
          {panel==='roof'&&hasSelection&&<RegionPanel region={active} selected={selectedObstacle} editing={editingObject} disabled={running||stress} onChange={patch=>setRoofs(rs=>rs.map(r=>r.id===active.id?{...r,...patch}:r))} onSelect={id=>{setSelected(null);setSelectedObstacle(id);setEditingObject(false);}} onEdit={id=>{objectSnapshot.current={id:active.id,objects:structuredClone(obstacles)};setSelected(null);setSelectedObstacle(id);setMode('top');setEditingObject(true);}} onCancel={()=>{const snapshot=objectSnapshot.current;if(snapshot&&snapshot.id===active.id)setObstacles(snapshot.objects);setEditingObject(false);setSelectedObstacle(null);}} onFinish={()=>setEditingObject(false)} onDelete={()=>{setObstacles(obstacles.filter(o=>o.id!==selectedObstacleId));setSelectedObstacle(null);setEditingObject(false);}} onAdd={kind=>{if(baseImage?.frame){setDrawingIntent(kind);setDrawingTool(kind);setDrawingForm(undefined);setImageOpen(true);}else{objectSnapshot.current={id:active.id,objects:structuredClone(obstacles)};const id=crypto.randomUUID();setObstacles([...obstacles,{id,kind,name:(kind==='keepout'?'禁布区':'障碍物')+' '+(obstacles.length+1),x:0,z:0,width:2,depth:2,height:kind==='keepout'?0:obstacleHeight,yaw:0}]);setSelected(null);setSelectedObstacle(id);setEditingObject(true);}}}/>}
          <section className="report-workflow" hidden={panel!=="report"}>
            <div className="report-intro"><Icon name="file"/><div><strong>装机量报告</strong><span>各屋面布置结果与项目合计</span></div></div>
            <dl className="report-facts"><div><dt>区域</dt><dd>{hasSelection?roofs.length:0} 个</dd></div><div><dt>组件</dt><dd>{total.count} 块</dd></div><div><dt>装机量</dt><dd>{total.capacity.toFixed(2)} kWp</dd></div></dl>
            {reportReadiness(roofs,globalEdge).length?<div className="report-readiness pending"><Icon name="info"/><span>请先更新：{reportReadiness(roofs,globalEdge).join('、')}</span></div>:<div className="report-readiness ready"><Icon name="check"/><span>数据已准备，可进入三维确认报告视角</span></div>}
            <div className="report-includes"><span>报告内容</span><ul><li>屋面面积与光伏占用面积</li><li>光伏数量与装机量</li><li>各屋面明细与项目合计</li></ul></div>
            <button className="primary-action report-primary" disabled={stress||running||!hasSelection} onClick={()=>{setMode('3d');setSelected(null);setSelectedObstacle(null);setReportError('');setReportOpen(true);}}>进入三维并预览报告</button>
          </section>
          <div hidden={!["arrays", "angle", "spacing"].includes(panel)}><div className="quality-switch">{[['arrays','阵列'],['angle','倾角朝向'],...(!selected?.connectedRows ? [['spacing','间距']] : [])].map(([id,label]) => <button className={panel === id ? 'selected' : ''} key={id} onClick={() => setPanel(id)}>{label}</button>)}</div><button type="button" className="help-icon" aria-label="手动调整当前阵列，自动布置会重新生成。" title="手动调整当前阵列，自动布置会重新生成。"><Icon name="info"/></button>
            <details className="array-list" hidden={panel !== "arrays"}><summary>切换阵列 · {arrays.length} 组</summary>
              <h2>
                阵列 <span>{arrays.length} 组</span>
              </h2>
              {arrays.map((a) => (
                <button
                  key={a.id}
                  className={selectedId === a.id ? "selected" : ""}
                  onClick={() => {
                    selectArray(a.id);
                    setError("");
                  }}
                >
                  {a.name}
                  <span>
                    {issues.some((i) => i.ids.includes(a.id))
                      ? "⚠ 冲突"
                      : `${a.rows * a.columns} 块`}
                  </span>
                </button>
              ))}
            </details>
            <div className="actions" hidden={panel !== "arrays"}>
              <button disabled={!selected || mode === "3d"} onClick={copy}>
                复制选中组
              </button>
              <button
                disabled={!selected || arrays.length === 1 || mode === "3d"}
                onClick={() => {
                  setArrays((prev) => prev.filter((a) => a.id !== selectedId));
                  setSelected(null);
                  setError("");
                }}
              >
                删除
              </button>
            </div>
            {panel !== "arrays" && <label>编辑对象<select aria-label="编辑阵列" value={selectedId ?? ''} onChange={e => selectArray(e.target.value || null)}><option value="" disabled>选择阵列</option>{arrays.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>}
            {selected && g ? (
              <>
                <h2 className="section-title" hidden={panel !== "arrays"}>
                  {selected.name} 参数{" "}
                  <span>{mode === "3d" ? "只读" : "可编辑"}</span>
                </h2>
                <fieldset disabled={mode === "3d"}>
                  <button hidden={panel !== "angle"} onClick={() => update({ azimuth: selected.azimuth + 90 })}>整个阵列旋转 90°</button>
                  {panel === "spacing" && <label>排间净距 m<input aria-label="排间净距 m" type="number" step="0.1" min="0" key={`${selected.id}-${selected.rowGap}`} defaultValue={selected.rowGap ?? 1} onBlur={e => { const n = Number(e.target.value); if (e.target.value && Number.isFinite(n) && n >= 0) { const result = update({ rowGap: n }); e.target.value = String(result?.rowGap ?? selected.rowGap ?? 1); } else e.target.value = String(selected.rowGap ?? 1); }} onKeyDown={e => { if(e.key === 'Enter') e.currentTarget.blur(); }} /><small>不低于冬至时段计算的保守间距。屋面边距和通道在自动排布中设置。</small></label>}
                  <div className="fields">
                    {(
                      [
                        ["rows", "排数"],
                        ["columns", "每排块数"],
                        ["tilt", "倾角 °"],
                        ["azimuth", "方位角 °"],
                        ["x", "中心 X / 东 m"],
                        ["z", "中心 Z / 南 m"],
                      ] as const
                    ).filter(([key]) => panel === "angle" ? key === "tilt" || key === "azimuth" : panel === "arrays" && key !== "tilt" && key !== "azimuth").map(([key, label]) => (
                      <label key={key}>
                        {label}
                        <input
                          aria-label={label}
                          key={`${selected.id}-${key}-${selected[key]}`}
                          type="number"
                          step={key === "x" || key === "z" ? ".1" : "1"}
                          defaultValue={Number(selected[key].toFixed(3))}
                          onBlur={(e) => {
                            if (e.target.value === "") {
                              setError("数值不能为空");
                              e.target.value = String(selected[key]);
                              return;
                            }
                            const committed = update({
                              [key]: Number(e.target.value),
                            });
                            e.target.value = String(
                              (committed ?? selected)[key],
                            );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>
                <p className="hint" hidden={panel === "spacing"}>
                  Enter / 移开焦点生效 · 0°北 / 90°东
                  <br />
                  占地 {g.width.toFixed(2)} × {g.depth.toFixed(2)} m
                </p>
                <div className="coordinates" hidden={panel !== "arrays"}>
                  X <b data-testid="x">{selected.x.toFixed(3)}</b> · Z{" "}
                  <b data-testid="z">{selected.z.toFixed(3)}</b> m
                </div>
              </>
            ) : (
              <p>点击组件或上方列表选择阵列。</p>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            {mode === "3d" && <button className="primary-action" onClick={() => setMode("top")}>切换平面编辑</button>}
          </div>
          </div>

          <div className="design-result" hidden={collapsed||!hasSelection||panel==='report'}>{fileMessage && <p role="status" className="file-message">{fileMessage}</p>}
<div className="compact-result"><span title={active.name}>{active.name}</span><span>{count} 块</span><strong>{capacity.toFixed(2)} kWp</strong></div>
            <details className="result-detail"><summary className={needsOutline||!count?'idle':layoutStale?'pending':issues.length?'blocked':'ok'}>{needsOutline ? '请先标定并圈屋面' : layoutStale ? count ? '待更新 · 当前显示旧布置' : '待自动布置' : issues.length ? `${issues.length} 项占地冲突` : '无占地冲突'}</summary><div>{issues.map((i,index) => <p key={index}>{i.text}</p>)}<p>北京冬至日 · 真太阳时 {solarHour}:00</p><p>屋面边界、阵列、障碍物及阴影禁布区校核</p>{arrays.some(a=>a.connectedRows && (a.rowGap??0)<recommendedGap(a.rows*(a.portrait?(a.module??defaultModule).length:(a.module??defaultModule).width)+(a.rows-1)*(a.module??defaultModule).gap,a.tilt,a.azimuth-active.yaw*180/Math.PI)) && <p className="spacing-warning">部分阵列采用缩短间距，请在三维查看遮挡。</p>}</div></details>
            {layoutMessage.startsWith('请检查') && <p className={`layout-message ${layoutMessage.startsWith("请检查") ? "validation-error" : ""}`} role="status">{layoutMessage}</p>}

          <div className="run-actions" hidden={panel!=="layout"||!hasSelection} aria-label="自动布置操作"><button className="primary-action" disabled={stress || running || needsOutline} onClick={() => runLayout(layoutOptions)}>{layoutStale&&arrays.length?'更新布置':'布置当前屋面'}</button>{panel==='layout'&&roofs.length>1&&<button className="all-layout" disabled={stress||running} onClick={runAll}>布置全部屋面</button>}<button className="icon-button" aria-label="撤回本次排布" title="撤回本次排布" disabled={!previous || stress || running} onClick={() => { if(previous) { setArrays(previous); setSelected(null); setPrevious(null); setLayoutSignature(''); setLayoutMessage('已撤回排布'); } }}><Icon name="reset" /></button></div>
          </div>
        </aside>
        <div className="viewport">

          <div className="viewport-tools">        <nav aria-label="视角">
          <button
            title="俯视布置" aria-label="俯视布置" className={mode === "top" ? "active" : ""}
            onClick={() => {
              setMode("top");
              setRun(0);
              setProgress("");
              setStress(false);
            }}
          >
            2D
          </button>
          <button
            title="三维查看" aria-label="三维查看" className={mode === "3d" ? "active" : ""}
            onClick={() => {setMode("3d");setOverlayOpen(false);}}
          >
            3D
          </button>
        </nav><button className="icon-button" title="回到全景" aria-label="回到全景" disabled={running} onClick={() => setReset(n => n + 1)}><Icon name="frame" /></button><button data-display-trigger className={`icon-button ${displayOpen?'active':''}`} title="显示设置" aria-label="显示设置" aria-expanded={displayOpen} onClick={()=>{setDisplayOpen(v=>!v);setOverlayOpen(false);}}><Icon name="layers"/></button><button className={"icon-button"+(overlayOpen?" active":"")} aria-label="叠加图片" title="叠加图片" onClick={()=>{setOverlayOpen(v=>!v);setDisplayOpen(false);setMode("top");setStress(false);setSelectedOverlay(id=>id??imageOverlays[0]?.id??null);}}><Icon name="image"/></button></div>
          {overlayOpen&&<ImageOverlayPanel items={imageOverlays} selected={selectedOverlay} center={hasSelection?{x:active.x,z:active.z}:{x:0,z:0}} initialWidth={hasSelection?active.roof.width:baseImage?.metersPerPixel?baseImage.width*baseImage.metersPerPixel*.35:30} onChange={setImageOverlays} onSelect={setSelectedOverlay} onClose={()=>setOverlayOpen(false)}/>}
          {displayOpen&&<DisplayPopover solarHour={solarHour} showShadows={showShadows} onSolarHour={setSolarHour} onShowShadows={setShowShadows} backgroundColor={backgroundColor} groundColor={groundColor} realistic={realistic} guides={guides} stress={stress} running={running} progress={progress} report={report} count={total.count} onBackground={setBackgroundColor} onGround={setGroundColor} onRealistic={value=>{setRealistic(value);setRun(0);setProgress('');setReport(null);}} onGuides={setGuides} onStartTest={()=>{setMode('3d');setStress(true);setGuides(false);setReport(null);setProgress('第 1/3 轮预热 · 5 秒');setRun(n=>n+1);}} onStopTest={()=>{setRun(0);setProgress('已停止');}} onResetTest={()=>{setStress(false);setRun(0);setProgress('');setReset(n=>n+1);}} onClose={()=>setDisplayOpen(false)}/>}
          {mode === "top" && <Compass angle={baseImage?.northAngle??0} onClick={()=>setGlobalOpen(true)}/>}
          <Suspense
            fallback={<div className="loading">正在加载 {engine}…</div>}
          >
            <View
              imageOverlays={imageOverlays} editingOverlay={overlayOpen} selectedOverlayId={selectedOverlay}
              baseImage={baseImage?.metersPerPixel?{...baseImage,frame:baseImage.frame??{x:0,y:0,width:baseImage.width,height:baseImage.height}}:baseImage}
              onCaptureReady={capture=>{captureScene.current=capture;}}
              sites={(hasSelection?roofs:[]).map(r=>({...roofRect(r),id:r.id,name:r.name,wallHeight:r.wallHeight,pitch:r.pitch,flatHeight:r.flatHeight}))}
              focus={bounds}
              onDrawingView={v=>{if(!imageOpen)drawingView.current=v;}}
              restoreDrawingView={restoredDrawingView}
              roof={bounds}
              wallHeight={wallHeight}
              solarHour={solarHour}
              shadowZones={worldZones}
              showShadows={showShadows}
              obstacles={worldObjects}
              arrays={worldArrays}
              selectedObjectId={selectedObstacleId?`${active.id}/${selectedObstacleId}`:null}
              selectedSiteId={hasSelection?active.id:undefined}
              editingObject={editingObject}
              selectedId={selectedId?`${active.id}/${selectedId}`:null}
              issues={worldIssues}
              mode={mode}
              reset={reset}
              visual={{
                backgroundColor, groundColor,
                realistic,
                guides,
                stress,
                run,
                onProgress: setProgress,
                onReport: (result) => {
                  setReport(result);
                  localStorage.setItem(
                    "pv.visual.performance",
                    JSON.stringify(result),
                  );
                },
              }}
              onEditObject={editCanvasObject}
              onObjectMenu={(id,x,y)=>{if(id.startsWith('@i/')){setSelectedOverlay(id.split('/')[1]);return;}const raw=id.startsWith('@')?id.slice(3):id;chooseRoof(raw.split('/')[0]);if(id.startsWith('@o/')||id.startsWith('@h/'))setSelectedObstacle(raw.split('/')[1]);setCanvasMenu({id,x,y});}}
              layoutMarker={panel==='layout'&&!selectedObstacle?layoutMarker(active):undefined}
              showPitchMarker={panel==='roof'&&!selectedObstacle}
              onSelect={id=>{if(id?.startsWith('@i/')){setSelectedOverlay(id.split('/')[1]);return;}if(overlayOpen){setSelectedOverlay(null);return;}if(id?.startsWith('@d/')){{const q=(layoutDirection(layoutOptions)+1)%4;setLayoutOptions({...layoutOptions,direction:q,portrait:q%2===0});}return;}if(id?.startsWith('@p/')){setRoofs(rs=>rs.map(r=>r.id===id.slice(3)?r.pitch?{...r,pitch:turnPitch(r.pitch)}:r:r));return;}if(!id){setSelected(null);setSelectedObstacle(null);setEditingObject(false);return;}if(id.startsWith('@s/')){chooseRoof(id.slice(3));setCollapsed(false);return;}if(id.startsWith('@o/')||id.startsWith('@h/')){const key=id.slice(3).split('/'),r=key[0],o=key[1];if(r!==active.id)chooseRoof(r);setSelected(null);setSelectedObstacle(o);setCollapsed(false);return;}const split=id.indexOf('/');chooseRoof(id.slice(0,split));setCollapsed(false);}}

              onMove={(id,x,z)=>{if(id.startsWith('@i/')){const [,key,corner]=id.split('/');setImageOverlays(items=>items.map(o=>o.id!==key?o:corner===undefined?{...o,x,z}:resizeOverlay(o,{x,z},Number(corner))));return;}if(id.startsWith('@s/'))return;if(id.startsWith('@o/')||id.startsWith('@h/')){if(!editingObject)return;const [rid,oid]=id.slice(3).split('/');setRoofs(rs=>rs.map(r=>{if(r.id!==rid)return r;return {...r,obstacles:r.obstacles.map(o=>{if(o.id!==oid)return o;const p=toLocal({x,z},r);if(id.startsWith('@h/')){return resizeObject(o,p,Number(id.split('/')[3]));}return {...o,...p};})};}));return;}return;}}

            />
          </Suspense>
        </div>
      {canvasMenu&&<div className="canvas-menu-backdrop" onPointerDown={()=>setCanvasMenu(null)} onContextMenu={e=>{e.preventDefault();setCanvasMenu(null);}}><div className="canvas-object-menu" role="menu" style={{left:Math.min(canvasMenu.x,window.innerWidth-170),top:Math.min(canvasMenu.y,window.innerHeight-70)}} onPointerDown={e=>e.stopPropagation()}><button role="menuitem" disabled={!canvasMenu.id.startsWith('@o/')&&!canvasMenu.id.startsWith('@h/')&&!baseImage} onClick={()=>editCanvasObject(canvasMenu.id)}>{canvasMenu.id.startsWith('@o/')||canvasMenu.id.startsWith('@h/')?'修改所选对象':'修改轮廓'}</button></div></div>}
      {imageOpen && baseImage && <ImageEditor imageOverlays={imageOverlays} obstacleHeight={obstacleHeight} onObstacleHeight={setObstacleHeight} onUndo={history.undo} onRedo={history.redo} canUndo={history.canUndo} canRedo={history.canRedo} intent={drawingIntent} initialForm={drawingForm} initialTool={drawingTool} initialView={drawingView.current} onViewClose={v=>{drawingView.current=v;setRestoredDrawingView({...v});}} base={baseImage} roofs={roofs} activeId={active.id} onBase={b=>{if(baseImage?.metersPerPixel&&b.metersPerPixel&&baseImage.metersPerPixel!==b.metersPerPixel){const k=b.metersPerPixel/baseImage.metersPerPixel;setImageOverlays(items=>items.map(o=>({...o,x:o.x*k,z:o.z*k,width:o.width*k,depth:o.depth*k,originalWidth:o.originalWidth*k})));}setBaseImage(b);setRoofs(rs=>rs.map(r=>({...r,northAngle:b.northAngle})));}} onRoofs={next=>setRoofs(next.map(bindModule))} onActive={chooseRoof} onClose={()=>{setImageOpen(false);setMode('top');setPanel('roof');}}/>}
      </section>

    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
