import { expect, it } from 'vitest';
import { rectangleFromThree, metricRect, worldToImage, imageToWorld, containsRect, snapAxis } from './drawing-geometry';
import { newRoof, toWorld, toLocal, worldArray, roofRect, totals, worldObstacle, projectBounds } from './roof-project';
import { geometry, footprint, corners, detect } from './domain';
import { autoLayout } from './auto-layout';
import { shadowZones } from './shadow-zones';
import { requireSinglePage } from './pdf-policy';
import { parseWorkspace, type WorkspaceFile } from './workspace-file';
import type { BaseImage } from './base-image';
import {catalogFromModules} from './module-library';
it('returns a zero-size bounds rectangle when there are no roofs yet',()=>{
 expect(projectBounds([])).toEqual({x:0,z:0,width:0,depth:0});
});
it('snaps a nearly horizontal or vertical roof edge without changing diagonal edges',()=>{
 expect(snapAxis({x:0,z:0},{x:100,z:2})).toEqual({x:100,z:0});
 expect(snapAxis({x:0,z:0},{x:2,z:100})).toEqual({x:0,z:100});
 expect(snapAxis({x:0,z:0},{x:10,z:8})).toEqual({x:10,z:8});
});
it('constructs a rotated rectangle from an edge and perpendicular depth in either drawing direction',()=>{
 const a={x:10,z:20},b={x:40,z:60},c={x:2,z:26};const r=rectangleFromThree(a,b,c)!;
 expect(r.width).toBe(50);expect(r.depth).toBeCloseTo(10);expect(corners(r).some(p=>Math.hypot(p.x-a.x,p.z-a.z)<1e-6)).toBe(true);
 expect(rectangleFromThree(a,a,c)).toBeNull();expect(rectangleFromThree(a,b,b)).toBeNull();
 const reverse=rectangleFromThree(b,a,c)!;expect(reverse.x).toBeCloseTo(r.x);expect(reverse.z).toBeCloseTo(r.z);expect(reverse.depth).toBeCloseTo(r.depth);
});
it('maps calibrated PDF coordinates to metric geometry without depending on render resolution',()=>{
 const base:BaseImage={url:'data:image/png;base64,AA==',name:'drawing',width:2384,height:1684,metersPerPixel:.1};
 const point={x:230,z:400};expect(worldToImage(imageToWorld(point,base),base)).toEqual(point);
 const r=metricRect({x:1192,z:842,width:300,depth:200,yaw:.2},base);expect(r).toEqual({x:0,z:0,width:30,depth:20,yaw:.2});
 expect(containsRect(r,{x:0,z:0,width:2,depth:2,yaw:.5})).toBe(true);expect(containsRect(r,{x:20,z:0,width:2,depth:2,yaw:0})).toBe(false);
});
it('keeps roof-local and world 2D/3D footprints identical under roof rotation',()=>{
 const roof={...newRoof(),x:100,z:-60,yaw:-.23};const a={...autoLayout(roof.roof,[],roof.layoutOptions).arrays[0],module:{width:1.2,length:2.4,power:650,gap:.02}};
 const world=worldArray(a,roof),localCorners=corners(footprint(a)).map(p=>toWorld(p,roof)),globalCorners=corners(footprint(world));
 localCorners.forEach((p,i)=>{expect(p.x).toBeCloseTo(globalCorners[i].x);expect(p.z).toBeCloseTo(globalCorners[i].z);});
 expect(toLocal(toWorld({x:3,z:4},roof),roof)).toEqual(expect.objectContaining({x:expect.closeTo(3),z:expect.closeTo(4)}));
 expect(geometry(world).w).toBe(1.2);
});
it('rotates sunlight into the roof frame before projecting obstacle shadows',()=>{
 const r={...newRoof(),x:0,z:0,yaw:.4,roof:{width:100,depth:100}};
 const o={id:'o',name:'o',x:0,z:0,width:2,depth:3,height:1,yaw:.1};
 const local=shadowZones(r.roof,[o],0,r.yaw).find(z=>z.id==='shadow-o')!.points.map(p=>toWorld(p,r));
 const world=shadowZones(r.roof,[worldObstacle(o,r)],0).find(z=>z.id===`shadow-${r.id}/o`)!.points;
 expect(local.length).toBe(world.length);for(const p of local)expect(world.some(q=>Math.hypot(q.x-p.x,q.z-p.z)<1e-7)).toBe(true);
});
it('preserves independent module specifications and sums actual placed module capacities across roofs',()=>{
 const first=newRoof(),second={...newRoof('屋面 2'),x:50,moduleSpec:{width:1.2,length:2.4,power:650,gap:.02}};
 first.arrays=autoLayout(first.roof,[],{...first.layoutOptions,module:first.moduleSpec}).arrays;second.arrays=autoLayout(second.roof,[],{...second.layoutOptions,module:second.moduleSpec}).arrays;
 const countA=first.arrays.reduce((n,a)=>n+a.rows*a.columns,0),countB=second.arrays.reduce((n,a)=>n+a.rows*a.columns,0);
 expect(totals([first,second])).toEqual({count:countA+countB,capacity:expect.closeTo((countA*550+countB*650)/1000)});
 second.moduleSpec={...second.moduleSpec,power:700};expect(totals([first,second]).capacity).toBeCloseTo((countA*550+countB*650)/1000);
 expect(detect(second.arrays,[],second.roof)).toEqual([]);
});
it('round trips multiple roofs and rejects invalid world coordinates, duplicate roofs, and PDF sources',()=>{
 const r=newRoof();const p:WorkspaceFile={version:3,name:'test',activeId:r.id,roofs:[r,{...newRoof('2'),x:50,yaw:.2,moduleSpec:{...r.moduleSpec,power:650}}],solarHour:9,backgroundColor:'#dce5ec',groundColor:'#c7cccb'};
 const loaded=parseWorkspace(JSON.stringify(p));const moduleCatalog=catalogFromModules(p.roofs.map(r=>r.moduleSpec));expect(loaded).toEqual({...p,roofs:p.roofs.map((r,i)=>({...r,moduleId:moduleCatalog[i].id})),moduleCatalog,globalEdge:r.layoutOptions.edge});
 expect(parseWorkspace(JSON.stringify({...p,globalEdge:1.2})).globalEdge).toBe(1.2);
 expect(()=>parseWorkspace(JSON.stringify({...p,globalEdge:-1}))).toThrow();expect(()=>parseWorkspace(JSON.stringify({...p,roofs:[r,r]}))).toThrow();
 expect(()=>parseWorkspace(JSON.stringify({...p,roofs:[{...r,yaw:'1'}]}))).toThrow();
 expect(()=>parseWorkspace(JSON.stringify({...p,baseImage:{url:'data:image/png;base64,AA==',width:100,height:100,name:'x',pdfSource:'https://outside/file.pdf'}}))).toThrow();
});
it('migrates a previously cropped single roof without moving its placement on the original image',()=>{
 const r=newRoof();const p={version:2,name:'old',roof:r.roof,obstacles:[],arrays:[],module:r.moduleSpec,rules:r.layoutOptions,wallHeight:.32,solarHour:9,backgroundColor:'#dce5ec',groundColor:'#c7cccb',baseImage:{url:'data:image/png;base64,AA==',width:1000,height:800,name:'x',metersPerPixel:.1,frame:{x:100,y:100,width:300,height:200}}};
 const next=parseWorkspace(JSON.stringify(p));expect(next.roofs[0].x).toBe(-25);expect(next.roofs[0].z).toBe(-20);expect(next.baseImage!.frame!.width).toBe(1000);
});
it('accepts exactly one PDF page and applies the remaining project capacity to complete strips',()=>{
 expect(()=>requireSinglePage(1)).not.toThrow();expect(()=>requireSinglePage(2)).toThrow('仅支持单页');expect(()=>requireSinglePage(0)).toThrow();
 const r=newRoof();const result=autoLayout(r.roof,[],{...r.layoutOptions,tableRows:3,limit:10});expect(result.count).toBe(9);expect(result.capped).toBe(true);
});

it('flat roof elevation moves panels and obstacles without changing layout footprint',()=>{
 const r=newRoof(),a=autoLayout(r.roof,[],r.layoutOptions).arrays[0],raised={...r,flatHeight:12};
 const before=worldArray(a,r),after=worldArray(a,raised);
 expect(footprint(after)).toEqual(footprint(before));
 const p=geometry(before).panels,q=geometry(after).panels;
 q.forEach((v,i)=>{expect(v.y-p[i].y).toBeCloseTo(8.5);expect(v.x).toBe(p[i].x);expect(v.z).toBe(p[i].z);});
 const obstacle={id:'o',name:'o',x:0,z:0,width:2,depth:2,height:1,yaw:0};
 expect(worldObstacle(obstacle,raised).baseHeight).toBe(8.5);
});
