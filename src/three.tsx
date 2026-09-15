import {pitchSegments} from './roof-direction';
import { PitchedMesh } from './pitched-mesh';
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  corners,
  bindPointer,
  geometry,
  obstacles as defaultObstacles,
  roof as defaultRoof,
  viewStart,
  orbitPosition,
  orbit,
  zoomView,
  type ViewProps,
  type PVArray,
} from "./domain";
import {
  outline,
  direction,
  roofGrid,
  centerAxes,
  northArrow,
} from "./visuals";
import { RealisticScene, thousandPanels } from "./realistic";
import { usePdfPatch, type PdfViewport } from './pdf-patch';
import type { PerformanceTrial } from "./render-options";
function PitchStroke({length,unit,tone='#317ca7'}:{length:number;unit:number;tone?:string}){
 return <>{[0,1].map(layer=>{const radius=unit*(layer?1.2:2.8),color=layer?tone:'#ffffff';return <group key={layer}><mesh renderOrder={10000+layer}><boxGeometry args={[length,.01,radius*2]}/><meshBasicMaterial color={color} depthTest={false} depthWrite={false} toneMapped={false}/></mesh>{[-1,1].map(end=><mesh key={end} position={[end*length/2,0,0]} rotation={[-Math.PI/2,0,0]} renderOrder={10000+layer}><circleGeometry args={[radius,16]}/><meshBasicMaterial color={color} depthTest={false} depthWrite={false} toneMapped={false}/></mesh>)}</group>;})}</>;
}
function DimensionLabel({text,position,unit}:{text:string;position:[number,number,number];unit:number}){
 const texture=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=240;canvas.height=64;const c=canvas.getContext('2d')!;c.fillStyle='#ffffff';c.beginPath();c.roundRect(1,1,238,62,12);c.fill();c.font='500 30px Segoe UI';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#285a78';c.fillText(text,120,33);return new THREE.CanvasTexture(canvas);},[text]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <sprite position={position} scale={[unit*90,unit*24,1]} renderOrder={11000}><spriteMaterial map={texture} toneMapped={false} transparent depthTest={false} depthWrite={false}/></sprite>;
}
function OverlayImage({item,index,selected,unit}:{item:import('./image-overlays').ImageOverlay;index:number;selected:boolean;unit:number}){
 const [texture,setTexture]=useState<THREE.Texture>();const {invalidate}=useThree();
 useEffect(()=>{let disposed=false;const t=new THREE.TextureLoader().load(item.url,()=>{if(disposed)return;t.colorSpace=THREE.SRGBColorSpace;setTexture(t);invalidate();});return()=>{disposed=true;t.dispose();};},[item.url,invalidate]);
 if(!item.visible||!texture)return null;
 return <group position={[item.x,0,item.z]} rotation={[0,item.yaw,0]}><mesh position={[0,.021+index*.0001,0]} rotation={[-Math.PI/2,0,0]} renderOrder={10+index}><planeGeometry args={[item.width,item.depth]}/><meshBasicMaterial map={texture} transparent opacity={item.opacity} depthTest={false} depthWrite={false} toneMapped={false}/></mesh>{selected&&<><lineLoop renderOrder={12000}><bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array(outline(item.width,item.depth,.1)),3]}/></bufferGeometry><lineBasicMaterial color="#387ead" depthTest={false}/></lineLoop>{corners({...item,x:0,z:0,yaw:0}).map((p,i)=><mesh key={i} position={[p.x,.12,p.z]} rotation={[-Math.PI/2,0,0]} renderOrder={12001}><circleGeometry args={[unit*6,16]}/><meshBasicMaterial color="white" depthTest={false}/></mesh>)}</>}</group>;
}
function BaseImagePlane({base}:{base:import('./base-image').BaseImage}) {
 const texture=useLoader(THREE.TextureLoader,base.url);texture.colorSpace=THREE.SRGBColorSpace;
 const f=base.frame!,k=base.metersPerPixel!;
 return <mesh position={[(base.width/2-f.x-f.width/2)*k,.012,(base.height/2-f.y-f.height/2)*k]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[base.width*k,base.height*k]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>;
}
function PdfPatchPlane({base,view,pixels}:{base:import('./base-image').BaseImage;view:PdfViewport;pixels:number}) {
 const patch=usePdfPatch(base,view,pixels),{invalidate}=useThree();
 const [ready,setReady]=useState<{texture:THREE.Texture;view:PdfViewport}>();
 useEffect(()=>{if(!patch)return;let cancelled=false;const texture=new THREE.TextureLoader().load(patch.url,()=>{if(cancelled)return;texture.colorSpace=THREE.SRGBColorSpace;setReady({texture,view:patch.view});invalidate();});
  return()=>{cancelled=true;texture.dispose();};
 },[patch,invalidate]);
 if(!ready)return null;
 const f=base.frame!,k=base.metersPerPixel!,r=ready.view;
 return <mesh position={[(r.x+r.width/2-f.x-f.width/2)*k,.018,(r.y+r.height/2-f.y-f.height/2)*k]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[r.width*k,r.height*k]}/><meshBasicMaterial map={ready.texture} toneMapped={false} depthWrite={false}/></mesh>;
}
function Lines({
  points,
  color,
  segments = false,
}: {
  points: number[];
  color: string;
  segments?: boolean;
}) {
  const data = useMemo(() => new Float32Array(points), [points]);
  const Tag = segments ? "lineSegments" : "line";
  return (
    <Tag>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} />
    </Tag>
  );
}
function ShadowPolygon({ points, elevation=0 }: { elevation?:number; points: { x: number; z: number }[] }) {
  const vertices = useMemo(() => {
    const coords: number[] = [];
    for (let i = 1; i < points.length - 1; i++) for (const p of [points[0], points[i], points[i + 1]]) coords.push(p.x, elevation+0.025, p.z);
    return new Float32Array(coords);
  }, [points,elevation]);
  return <group><mesh><bufferGeometry><bufferAttribute attach="attributes-position" args={[vertices, 3]} /></bufferGeometry><meshBasicMaterial color="#c96048" transparent opacity={0.22} depthWrite={false} side={THREE.DoubleSide} /></mesh><Lines points={[...points, points[0]].flatMap(p => [p.x, elevation+.03, p.z])} color="#b8614d" /></group>;
}
function makeTopCells(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=1024;
 const c=canvas.getContext('2d')!;c.fillStyle='#343c4a';c.fillRect(0,0,512,1024);
 for(let row=0;row<12;row++)for(let col=0;col<6;col++){
  const x=col*85+2,y=row*85+2;
  c.fillStyle='#171f2e';c.beginPath();c.roundRect(x,y,83,83,2);c.fill();
 }
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
 return map;
}
function TopArray({a,selected,conflict,map}:{a:PVArray;selected:boolean;conflict:boolean;map:THREE.Texture}) {
 const g=useMemo(()=>geometry(a),[a]);
 const data=useMemo(()=>{
  const fill:number[]=[],edges:number[]=[],uv:number[]=[];
  const w=a.surface?g.w/Math.sqrt(1+a.surface.sx**2):g.w;
  const d=a.surface?g.l/Math.sqrt(1+a.surface.sz**2):g.l*Math.cos(g.tilt);
  for(const p of g.panels){
   const x0=p.x-w/2,x1=p.x+w/2,z0=p.z-d/2,z1=p.z+d/2;
   fill.push(x0,.2,z0,x0,.2,z1,x1,.2,z1,x0,.2,z0,x1,.2,z1,x1,.2,z0);
   const coords=[0,1,0,0,1,0,0,1,1,0,1,1];
   for(let i=0;i<coords.length;i+=2)uv.push(...(a.portrait?[coords[i],coords[i+1]]:[coords[i+1],1-coords[i]]));
   edges.push(x0,.21,z0,x1,.21,z0,x1,.21,z0,x1,.21,z1,x1,.21,z1,x0,.21,z1,x0,.21,z1,x0,.21,z0);
  }
  return {fill:new Float32Array(fill),uv:new Float32Array(uv),edges};
 },[a,g]);
 return <group position={[a.x,0,a.z]} rotation={[0,g.yaw,0]}>
  <mesh userData={{arrayId:a.id}}><bufferGeometry><bufferAttribute attach="attributes-position" args={[data.fill,3]}/><bufferAttribute attach="attributes-uv" args={[data.uv,2]}/></bufferGeometry><meshBasicMaterial map={map} color={conflict?'#bd6260':selected?'#b4d9dd':'#ffffff'} toneMapped={false}/></mesh>
  <Lines points={data.edges} segments color={conflict?'#f1c4bb':selected?'#718994':'#4b5a65'}/>
  <Lines points={outline(g.width,g.depth,.22)} color={conflict?'#bd322a':selected?'#efa343':'#87919a'}/>
 </group>;
}
function ArrayMesh({
  a,
  selected,
  conflict,
  mode,
  guides = true,
}: {
  a: PVArray;
  selected: boolean;
  conflict: boolean;
  mode: string;
  guides?: boolean;
}) {
  const g = useMemo(
    () => geometry(a),
    [a],
  );
  const color = conflict ? "#bb4c42" : selected ? "#285f80" : "#4b7187";
  return (
    <group position={[a.x, 0, a.z]} rotation={[0, g.yaw, 0]}>
      {g.panels.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, a.surface&&mode==="top"?.2:p.y, p.z]}
          rotation={a.surface&&mode==="top"?[0,0,0]:[g.tilt, 0, g.roll]}
          userData={{ arrayId: a.id }}
        >
          <boxGeometry args={[a.surface&&mode==="top"?g.w/Math.sqrt(1+a.surface.sx**2):g.w, 0.035, a.surface&&mode==="top"?g.l/Math.sqrt(1+a.surface.sz**2):g.l]} />
          {mode === "top" ? (
            <meshBasicMaterial color={color} />
          ) : (
            <meshLambertMaterial color={color} />
          )}
        </mesh>
      ))}
      {guides && (selected || conflict) && (
        <Lines
          points={outline(g.width, g.depth)}
          color={conflict ? "#cc392c" : "#db8b22"}
        />
      )}
      {guides && (
        <Lines
          points={direction(g.depth)}
          color={conflict ? "#cc392c" : "#be7313"}
        />
      )}
    </group>
  );
}
function Scene(props: ViewProps) {
  const topCells=useMemo(makeTopCells,[]);
  useEffect(()=>()=>topCells.dispose(),[topCells]);
  const roof = props.roof ?? defaultRoof;
  const obstacles = props.obstacles ?? defaultObstacles;
  const sites=props.sites??[{id:"roof",name:"屋面",x:0,z:0,yaw:0,...roof,wallHeight:props.wallHeight??.32}];
  const latest = useRef(props);
  latest.current = props;
  const { gl, size, set, scene, invalidate, get } = useThree();
  useEffect(()=>{props.onCaptureReady?.(()=>{gl.render(scene,get().camera);return gl.domElement.toDataURL("image/png");});return()=>props.onCaptureReady?.(null);},[gl,scene,get,props.onCaptureReady]);
  const detailed = props.mode === "3d" && props.visual?.realistic;
  const stress = props.mode === "3d" && !!props.visual?.stress;
  const showGuides =
    props.mode === "top" || (!!props.visual?.guides && !stress);
  const testArrays = useMemo(thousandPanels, []);
  const renderArrays = stress ? testArrays : props.arrays;
  const cameras = useMemo(
    () => ({
      top: Object.assign(
        new THREE.OrthographicCamera(-20, 20, 14, -14, 0.1, 500),
        { manual: true },
      ),
      perspective: Object.assign(
        new THREE.PerspectiveCamera(45, 1, 0.1, 1500),
        {
          manual: true,
        },
      ),
    }),
    [],
  );
  const active = props.mode === "top" ? cameras.top : cameras.perspective;
  const view = useRef(viewStart(1.7));
  const [pdfView,setPdfView]=useState<PdfViewport>({x:0,y:0,width:1,height:1});
  const fit = () => {
    const v = view.current,
      aspect =
        gl.domElement.clientWidth / Math.max(1, gl.domElement.clientHeight);
    const reserved = stress ? 0 : Math.min(350,gl.domElement.clientWidth*.28);
    if (active === cameras.top) {
      const c = cameras.top;
      c.left = (-v.span * aspect) / 2 - reserved*v.span/(2*Math.max(1,gl.domElement.clientHeight));
      c.right = (v.span * aspect) / 2 - reserved*v.span/(2*Math.max(1,gl.domElement.clientHeight));
      c.top = v.span / 2;
      c.bottom = -v.span / 2;
      c.position.set(v.x, 400, v.z);
      c.up.set(0, 0, -1);
      const base=latest.current.baseImage;
      if(base?.frame&&base.metersPerPixel){const f=base.frame,k=base.metersPerPixel;const next={x:(v.x+c.left)/k+f.x+f.width/2,y:(v.z-c.top)/k+f.y+f.height/2,width:(c.right-c.left)/k,height:v.span/k};latest.current.onDrawingView?.({...next,viewportHeight:gl.domElement.clientHeight});setPdfView(old=>Math.abs(old.x-next.x)+Math.abs(old.y-next.y)+Math.abs(old.width-next.width)+Math.abs(old.height-next.height)<1e-6?old:next);}

    } else {
      cameras.perspective.near = stress ? 2 : 0.3;
      cameras.perspective.aspect = aspect;
      cameras.perspective.setViewOffset(gl.domElement.clientWidth,gl.domElement.clientHeight,-reserved/2,0,gl.domElement.clientWidth,gl.domElement.clientHeight);
      const p = orbitPosition(v);
      active.position.set(p.x, p.y, p.z);
      active.up.set(0, 1, 0);
    }
    active.lookAt(v.x, 0, v.z);
    active.updateProjectionMatrix();
    active.updateMatrixWorld();
    invalidate();
  };
  useLayoutEffect(() => {
    set({ camera: active });
    fit();
  }, [active, size.width, size.height]);
  useLayoutEffect(() => {
    view.current = viewStart(
      gl.domElement.clientWidth / Math.max(1, gl.domElement.clientHeight),
    );
    if (stress) {
      view.current.distance = 150;
      view.current.pitch = 0.88;
    } else if (props.mode === "3d") {
      view.current.distance = 42;
      view.current.pitch = 0.7;
      view.current.yaw = 0.48;
    }
    if (!stress) {
      const aspect = (gl.domElement.clientWidth-Math.min(350,gl.domElement.clientWidth*.28)) / Math.max(1, gl.domElement.clientHeight);
      view.current.x=props.focus?.x??0;view.current.z=props.focus?.z??0;
      view.current.span = Math.max(roof.depth * 1.4, roof.width * 1.4 / aspect, 10);
      view.current.distance = Math.max(roof.width, roof.depth) * 1.7;
    }
    fit();
  }, [props.reset, props.mode, stress]);
  useLayoutEffect(()=>{
    const r=props.restoreDrawingView,b=props.baseImage;
    if(!r||!b?.frame||!b.metersPerPixel||props.mode!=='top')return;
    const k=b.metersPerPixel,h=Math.max(1,gl.domElement.clientHeight),reserved=Math.min(350,gl.domElement.clientWidth*.28);
    view.current.span=r.height*k*h/(r.viewportHeight??h);
    view.current.x=(r.x+r.width/2-b.frame.x-b.frame.width/2)*k+reserved*view.current.span/(2*h);
    view.current.z=(r.y+r.height/2-b.frame.y-b.frame.height/2)*k;
    fit();
  },[props.restoreDrawingView,props.mode]);
  const benchmark = useRef<{
    start: number;
    last: number;
    measuring: boolean;
    gaps: number[];
    trials: PerformanceTrial[];
  } | null>(null);
  useEffect(() => {
    if (!props.visual?.run || !stress) return;
    benchmark.current = {
      start: performance.now(),
      last: performance.now(),
      measuring: false,
      gaps: [],
      trials: [],
    };
    props.visual.onProgress("第 1/3 轮预热 · 5 秒");
    invalidate();
    return () => {
      benchmark.current = null;
    };
  }, [props.visual?.run, stress, detailed]);
  useFrame((_, delta) => {
    const b = benchmark.current;
    if (!b) return;
    if (document.hidden) {
      benchmark.current = null;
      latest.current.visual?.onProgress(
        "测试已停止：页面进入后台，请保持页面可见后重试。",
      );
      return;
    }
    view.current.yaw += Math.min(delta, 0.1) * 0.22;
    fit();
    const now = performance.now();
    if (!b.measuring) {
      if (now - b.start >= 5000) {
        b.measuring = true;
        b.start = now;
        b.last = now;
        latest.current.visual?.onProgress(
          `第 ${b.trials.length + 1}/3 轮采样 · 20 秒`,
        );
      }
      return;
    }
    b.gaps.push(now - b.last);
    b.last = now;
    if (now - b.start < 20000) return;
    const sorted = [...b.gaps].sort((a, b) => a - b),
      durationMs = now - b.start;
    b.trials.push({
      fps: (1000 * b.gaps.length) / durationMs,
      p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1],
      frames: b.gaps.length,
      durationMs,
    });
    if (b.trials.length < 3) {
      b.start = now;
      b.measuring = false;
      b.gaps = [];
      latest.current.visual?.onProgress(
        `第 ${b.trials.length + 1}/3 轮预热 · 5 秒`,
      );
      return;
    }
    const median = (v: number[]) => v.sort((a, b) => a - b)[1],
      fps = median(b.trials.map((t) => t.fps)),
      p95 = median(b.trials.map((t) => t.p95Ms)),
      context = gl.getContext(),
      ext = context.getExtension("WEBGL_debug_renderer_info"),
      dim = new THREE.Vector2();
    gl.getDrawingBufferSize(dim);
    const report = {
      recordedAt: new Date().toISOString(),
      quality: detailed ? "真实材质 / 阴影 / 支架" : "简洁显示",
      panels: 1000,
      canvas: `${dim.x} × ${dim.y}`,
      renderer: ext
        ? String(context.getParameter(ext.UNMASKED_RENDERER_WEBGL))
        : "不可用",
      webgl: String(context.getParameter(context.VERSION)),
      trials: b.trials,
      medianFps: fps,
      medianP95Ms: p95,
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      passed: fps >= 30 && p95 <= 50,
    };
    benchmark.current = null;
    latest.current.visual?.onReport(report);
    latest.current.visual?.onProgress("测试完成 · 3 轮中位数");
  });
  useEffect(() => {
    const ray = new THREE.Raycaster(),
      plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
      target = new THREE.Vector3();
    const cast = (x: number, y: number) => {
      const r = gl.domElement.getBoundingClientRect();
      ray.setFromCamera(
        new THREE.Vector2(
          ((x - r.left) / r.width) * 2 - 1,
          (-(y - r.top) / r.height) * 2 + 1,
        ),
        active,
      );
    };
    return bindPointer(gl.domElement, {
      mode: () => latest.current.mode,
      point: (x, y) => {
        cast(x, y);
        const p = ray.ray.intersectPlane(plane, target);
        return p ? { x: p.x, z: p.z } : null;
      },
      hit: (x, y) => {
        cast(x, y);
        if(latest.current.mode==='top'){
          const w=ray.ray.intersectPlane(plane,target),current=latest.current;if(w){
            if(current.editingOverlay){const tol=(view.current.span/gl.domElement.clientHeight)*10;const chosen=current.imageOverlays?.find(o=>o.id===current.selectedOverlayId&&o.visible);if(chosen){const i=corners(chosen).findIndex(p=>Math.hypot(p.x-w.x,p.z-w.z)<tol);if(i>=0)return '@i/'+chosen.id+'/'+i;}for(const o of [...(current.imageOverlays??[])].reverse()){const dx=w.x-o.x,dz=w.z-o.z,c=Math.cos(o.yaw),s=Math.sin(o.yaw);if(o.visible&&Math.abs(dx*c-dz*s)<=o.width/2&&Math.abs(dx*s+dz*c)<=o.depth/2)return '@i/'+o.id;}return null;}
            const tol=(view.current.span/gl.domElement.clientHeight)*9;
            const ob=(current.obstacles??[]).find(o=>o.id===current.selectedObjectId);
            if(ob&&current.editingObject){const i=corners(ob).findIndex(p=>Math.hypot(p.x-w.x,p.z-w.z)<tol);if(i>=0)return '@h/'+ob.id+'/'+i;}
            const local=(r:{x:number;z:number;yaw:number})=>{const dx=w.x-r.x,dz=w.z-r.z,c=Math.cos(r.yaw),sn=Math.sin(r.yaw);return {x:dx*c-dz*sn,z:dx*sn+dz*c};};
            const marker=current.layoutMarker;
            if(marker&&marker.segments.some(([x,z,bx,bz])=>{const dx=bx-x,dz=bz-z,t=Math.max(0,Math.min(1,((w.x-x)*dx+(w.z-z)*dz)/(dx*dx+dz*dz)));return Math.hypot(w.x-x-t*dx,w.z-z-t*dz)<tol;}))return '@d/'+marker.id;
            const marked=current.showPitchMarker&&current.sites?.find(r=>r.id===current.selectedSiteId&&(r.markerPitch||r.pitch));
            if(marked&&(marked.markerPitch||marked.pitch)){const p=local(marked);if(pitchSegments(marked.width,marked.depth,(marked.markerPitch??marked.pitch)!).some(([x,z,bx,bz])=>{const dx=bx-x,dz=bz-z,t=Math.max(0,Math.min(1,((p.x-x)*dx+(p.z-z)*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-x-t*dx,p.z-z-t*dz)<tol;}))return '@p/'+marked.id;}
            const o=[...(current.obstacles??[])].reverse().find(o=>{const p=local(o);return Math.abs(p.x)<=o.width/2&&Math.abs(p.z)<=o.depth/2;});if(o)return '@o/'+o.id;
            const site=current.sites?.find(r=>{const p=local(r);return Math.abs(p.x)<=r.width/2+tol&&Math.abs(p.z)<=r.depth/2+tol&&(Math.abs(Math.abs(p.x)-r.width/2)<tol||Math.abs(Math.abs(p.z)-r.depth/2)<tol);});if(site)return '@s/'+site.id;
          }
        }
        return (
          ray
            .intersectObjects(scene.children, true)
            .find((h) => h.object instanceof THREE.Mesh && h.object.userData.arrayId)?.object.userData
            .arrayId ?? null
        );
      },
      position: (id) => {if(id.startsWith('@i/')){const [,key,index]=id.split('/'),o=latest.current.imageOverlays!.find(o=>o.id===key)!;return index===undefined?o:corners(o)[Number(index)];}if(id.startsWith('@s/')||id.startsWith('@p/')||id.startsWith('@d/'))return latest.current.sites?.find(r=>r.id===id.slice(3))??{x:0,z:0};if(id.startsWith('@o/')||id.startsWith('@h/')){const parts=id.slice(3).split('/'),o=(latest.current.obstacles??[]).find(o=>o.id===parts.slice(0,2).join('/'))!;return id.startsWith('@h/')?corners(o)[Number(parts[2])]:o;}return latest.current.arrays.find(a=>a.id===id)!;},
      select: (id) => latest.current.onSelect(id),
      edit:id=>latest.current.onEditObject?.(id),
      context:(id,x,y)=>latest.current.onObjectMenu?.(id,x,y),
      move: (id, x, z) => latest.current.onMove(id, x, z),
      pan: (x, z) => {
        if (benchmark.current) return;
        view.current.x += x;
        view.current.z += z;
        fit();
      },
      orbit: (dx, dy) => {
        if (benchmark.current) return;
        orbit(view.current, dx, dy);
        fit();
      },
      zoom: (f) => {
        if (benchmark.current) return;
        zoomView(view.current, f);
        fit();
      },
    });
  }, [active, gl, scene, props.reset, stress]);
  return (
    <>
      {detailed ? (
        <RealisticScene northAngle={props.baseImage?.northAngle??0} sites={sites} focus={props.focus} backgroundColor={props.visual?.backgroundColor} groundColor={props.visual?.groundColor} arrays={renderArrays} stress={stress} roof={roof} obstacles={obstacles} solarHour={props.solarHour} wallHeight={props.wallHeight} />
      ) : (
        <>
          <color attach="background" args={[props.visual?.backgroundColor ?? "#edf2f5"]} />
          <ambientLight intensity={1.4} />
          <directionalLight position={[-10, 25, -15]} intensity={2} />
          {sites.map(r=>r.pitch&&props.mode!=="top"?<group key={r.id} position={[r.x,0,r.z]} rotation={[0,r.yaw,0]}><PitchedMesh site={r}/></group>:<mesh key={r.id} position={[r.x,props.mode==='top'?-.15:(r.flatHeight??3.5)/2-3.5,r.z]} rotation={[0,r.yaw,0]}><boxGeometry args={[r.width,props.mode==='top'?.3:(r.flatHeight??3.5),r.depth]}/><meshBasicMaterial color="#d4dde3"/></mesh>)}
        </>
      )}
      {!stress&&props.mode==='top'&&<>{sites.filter(r=>r.id===props.selectedSiteId).map(r=><group key={'selected'+r.id} position={[r.x,0,r.z]} rotation={[0,r.yaw,0]}><Lines points={outline(r.width,r.depth,.12)} color="#008ee6"/><Lines points={outline(r.width+.08,r.depth+.08,.12)} color="#008ee6"/></group>)}{obstacles.filter(o=>o.id===props.selectedObjectId).map(o=><group key={'selected'+o.id} position={[o.x,0,o.z]} rotation={[0,o.yaw,0]}><mesh position={[0,Math.max(.35,o.height)+.05,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[o.width,o.depth]}/><meshBasicMaterial color="#00a5ff" transparent opacity={.35} depthTest={false}/></mesh><Lines points={outline(o.width,o.depth,Math.max(.35,o.height)+.07)} color="#007dcc"/>{props.editingObject&&<><DimensionLabel text={o.width.toFixed(2)+' m'} position={[0,Math.max(.35,o.height)+.15,-o.depth/2-view.current.span/size.height*20]} unit={view.current.span/size.height}/><DimensionLabel text={o.depth.toFixed(2)+' m'} position={[o.width/2+view.current.span/size.height*52,Math.max(.35,o.height)+.15,0]} unit={view.current.span/size.height}/></>}{props.editingObject&&corners({...o,x:0,z:0,yaw:0}).map((p,i)=><mesh key={i} position={[p.x,Math.max(.35,o.height)+.1,p.z]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[view.current.span/size.height*6,16]}/><meshBasicMaterial color="#ffffff" depthTest={false}/></mesh>)}</group>)}</>}
      {!stress && props.mode === "top" && props.baseImage?.frame && props.baseImage.metersPerPixel && <Suspense fallback={null}><BaseImagePlane base={props.baseImage}/>{props.baseImage.pdfSource&&<PdfPatchPlane base={props.baseImage} view={pdfView} pixels={size.width}/>}</Suspense>}
      {!stress && props.showShadows && props.shadowZones?.map(zone => <ShadowPolygon key={zone.id} points={zone.points} elevation={props.mode==='top'?0:zone.elevation??0} />)}
      {showGuides && (
        <>
          {sites.map(r=><group key={r.id} position={[r.x,0,r.z]} rotation={[0,r.yaw,0]}>{props.mode==='top'&&props.baseImage&&<mesh position={[0,.035,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[r.width,r.depth]}/><meshBasicMaterial color="#ffffff" transparent opacity={.58} depthWrite={false} toneMapped={false}/></mesh>}<Lines points={outline(r.width,r.depth,.025)} color="#2c7898"/>{r.pitch&&(()=>{const p=r.pitch,t=p.kind==='gable'?0:p.high*(p.axis==='z'?r.depth:r.width)/2;return <Lines points={p.axis==='z'?[-r.width/2,.04,t,r.width/2,.04,t]:[t,.04,-r.depth/2,t,.04,r.depth/2]} color="#e68a29"/>;})()}</group>)}
        </>
      )}
      {!detailed &&
        !stress &&
        obstacles.filter(o=>o.kind!=="keepout").map((o) => (
          <group key={o.id} position={[o.x, props.mode==="top"?0:o.baseHeight??0, o.z]} rotation={[0, o.yaw, 0]}>
            <mesh position={[0, o.height / 2, 0]}>
              <boxGeometry args={[o.width, o.height, o.depth]} />
              <meshLambertMaterial color="#c6935b" />
            </mesh>
            <Lines
              points={outline(o.width, o.depth, o.height + 0.01)}
              color="#805422"
            />
          </group>
        ))}
      {!stress&&props.mode==='top'&&obstacles.filter(o=>o.kind==='keepout').map(o=><group key={o.id} position={[o.x,0,o.z]} rotation={[0,o.yaw,0]}><mesh position={[0,.24,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[o.width,o.depth]}/><meshBasicMaterial color="#bf3860" transparent opacity={.3} depthWrite={false}/></mesh><Lines points={outline(o.width,o.depth,.25)} color="#b12f55"/></group>)}
      {!stress&&props.mode==='top'&&props.imageOverlays?.map((item,index)=><OverlayImage key={item.id} item={item} index={index} selected={!!props.editingOverlay&&item.id===props.selectedOverlayId} unit={view.current.span/size.height}/>)}
      {!stress&&props.mode==='top'&&props.layoutMarker&&<group>{(props.layoutMarker.outline??props.layoutMarker.segments).map(([x,z,bx,bz],i)=><group key={i} position={[(x+bx)/2,0,(z+bz)/2]} rotation={[0,-Math.atan2(bz-z,bx-x),0]}><PitchStroke length={Math.hypot(bx-x,bz-z)} unit={view.current.span/size.height} tone="#39795c"/></group>)}{props.layoutMarker.head.length>0&&<mesh renderOrder={10002}><bufferGeometry><bufferAttribute attach="attributes-position" args={[new Float32Array(props.layoutMarker.head.flatMap((v,i,a)=>i%2?[]:[v,0,a[i+1]])),3]}/></bufferGeometry><meshBasicMaterial color="#39795c" side={THREE.DoubleSide} depthTest={false} depthWrite={false} toneMapped={false}/></mesh>}</group>}
      {!stress&&props.mode==='top'&&props.showPitchMarker&&sites.filter(r=>r.id===props.selectedSiteId&&(r.markerPitch||r.pitch)).map(r=><group key={'pitch-'+r.id} position={[r.x,0,r.z]} rotation={[0,r.yaw,0]}>{pitchSegments(r.width,r.depth,(r.markerPitch??r.pitch)!).map(([x,z,bx,bz],i)=><group key={i} position={[(x+bx)/2,0,(z+bz)/2]} rotation={[0,-Math.atan2(bz-z,bx-x),0]}><PitchStroke length={Math.hypot(bx-x,bz-z)} unit={view.current.span/size.height}/></group>)}</group>)}
      {!detailed &&
        renderArrays.map((a) => (
          props.mode==='top'?<TopArray map={topCells} key={a.id} a={a} selected={props.selectedId===a.id} conflict={props.issues.some(i=>i.ids.includes(a.id))}/>:<ArrayMesh
            key={a.id}
            a={a}
            selected={props.selectedId === a.id}
            conflict={props.issues.some((i) => i.ids.includes(a.id))}
            mode={props.mode}
            guides={showGuides}
          />
        ))}
      {detailed &&
        showGuides &&
        props.arrays.map((a) => {
          const g = geometry(a);
          return (
            <group key={a.id} position={[a.x, 0, a.z]} rotation={[0, g.yaw, 0]}>
              <Lines
                points={outline(g.width, g.depth)}
                color={
                  props.issues.some((i) => i.ids.includes(a.id))
                    ? "#cc392c"
                    : "#db8b22"
                }
              />
              <Lines points={direction(g.depth)} color="#be7313" />
            </group>
          );
        })}
    </>
  );
}
export default function ThreeView(props: ViewProps) {
  return (
    <Canvas dpr={1} shadows frameloop="demand" gl={{ antialias: true }}>
      <Scene {...props} />
    </Canvas>
  );
}
