import {expect,it} from 'vitest';
import {autoLayout} from './auto-layout';
import {corners,detect,footprint,type Point} from './domain';
import {polygonRect,polygonContains} from './polygon';
import {newRoof,roofRect,worldObstacle,totals,type RoofDesign} from './roof-project';
import {reshapeRegion} from './reshape-region';
import {applyRegionForm} from './region-form';
import {layoutSignatureFor,needsLayoutUpdate} from './layout-state';
import {parseWorkspace,type WorkspaceFile} from './workspace-file';
import {defaultSunSettings} from './sun-position';
import {schemeReport} from './scheme-report';
import {UndoHistory} from './undo-history';
import {blankDrawingForRoofs} from './base-image';
import {imageToWorld,worldToImage} from './drawing-geometry';

const shapes={
 convex:[{x:-25,z:-18},{x:20,z:-17.2},{x:26,z:0},{x:15,z:18},{x:-25,z:15}],
 concave:[{x:-25,z:-18},{x:20,z:-17.2},{x:26,z:3},{x:8,z:0},{x:12,z:18},{x:-25,z:15}],
};
const edge=.5;
it('空白项目画布不保留占位屋面',()=>{
 expect(blankDrawingForRoofs([]).frame).toBeUndefined();
});
it.each([0,1200,-5000,99990])('旧项目无底图编辑保留米制坐标与北向 %s',x=>{
 const r={...newRoof(),x,z:-x,yaw:.6};const before=JSON.stringify(r);
 const base=blankDrawingForRoofs([r],37);expect(base.frame).toBeDefined();expect(base.northAngle).toBe(37);
 for(const p of corners(roofRect(r))){const image=worldToImage(p,base);expect(image.x).toBeGreaterThanOrEqual(0);expect(image.x).toBeLessThanOrEqual(base.width);expect(image.z).toBeGreaterThanOrEqual(0);expect(image.z).toBeLessThanOrEqual(base.height);samePoint(imageToWorld(image,base),p);}
 expect(JSON.stringify(r)).toBe(before);
});
it.each(['{"version":3,"roofs":','', 'not a project'])('损坏文件给出可理解提示 %s',text=>{
 expect(()=>parseWorkspace(text)).toThrow('不是有效的 JSON');
});
it.each(['null','[]','3'])('非项目 JSON 被拒绝 %s',text=>{
 expect(()=>parseWorkspace(text)).toThrow('项目文件内容无效');
});
function calculate(r:RoofDesign){
 const out=autoLayout(r.roof,r.obstacles,{...r.layoutOptions,edge,module:r.moduleSpec,pitch:r.pitch,wallHeight:r.wallHeight,roofYaw:r.yaw});
 const next={...r,arrays:out.arrays,layoutSignature:layoutSignatureFor(r,edge)};
 expect(detect(next.arrays,next.obstacles,next.roof)).toEqual([]);
 for(const a of next.arrays)if(!a.hostObstacleId)expect(polygonContains(next.roof.outline!,corners(footprint(a)),edge)).toBe(true);
 return next;
}
function save(roofs:RoofDesign[],latitude:number){
 const data:WorkspaceFile={version:3,name:'异形用户流程',roofs,activeId:roofs[0].id,globalEdge:edge,solarHour:11,backgroundColor:'#ffffff',groundColor:'#cccccc',sunSettings:{...defaultSunSettings(),locationMode:'manual',latitude,longitude:116.4}};
 return parseWorkspace(JSON.stringify(data));
}
function samePoint(a:Point,b:Point){expect(a.x).toBeCloseTo(b.x,8);expect(a.z).toBeCloseTo(b.z,8);}

for(const [shape,points] of Object.entries(shapes))for(const latitude of [23,40,-34])for(const direction of [0,1,2,3])for(const yaw of [0,.43]){
 it(`异形完整修改流程 ${shape} 纬度${latitude} 朝向${direction} 旋转${yaw}`,()=>{
  const outline=polygonRect(direction%2?[...points].reverse():points);
  let r:RoofDesign={...applyRegionForm(newRoof('异形'), 'polygon'),x:15,z:8,yaw,roof:{width:outline.width,depth:outline.depth,outline:outline.outline}};
  r.obstacles=[
   {id:'o',name:'障碍物',x:-12,z:-8,width:2,depth:3,height:2,yaw:.2},
   {id:'k',name:'禁布区',kind:'keepout',x:-12,z:6,width:3,depth:4,height:0,yaw:0},
   {id:'b',name:'气楼',x:0,z:-8,width:8,depth:6,height:3,yaw:.1,topLayout:{enabled:true,tilt:10,edge:.5}},
  ];
  r.layoutOptions={...r.layoutOptions,shadowLatitude:latitude,shadowIgnored:false,direction,portrait:direction%2===0};
  r=calculate(r);expect(totals([r]).count).toBeGreaterThan(0);
  const worlds=r.obstacles.map(o=>worldObstacle(o,r)),original=JSON.stringify(r);
  const vertices=corners(roofRect(r));vertices[0]={x:vertices[0].x-.4,z:vertices[0].z-.6};
  let edited=reshapeRegion([r],r.id,polygonRect(vertices))[0];
  expect(JSON.stringify(r)).toBe(original);expect(edited.arrays).toEqual([]);expect(needsLayoutUpdate(edited,edge)).toBe(true);
  edited.obstacles.forEach((o,i)=>{const w=worldObstacle(o,edited);samePoint(w,worlds[i]);expect(w.yaw).toBeCloseTo(worlds[i].yaw,8);});
  expect(()=>schemeReport('待更新',[edited],edge,'data:image/png;base64,AAAA')).toThrow();
  const history=new UndoHistory(r,(a,b)=>JSON.stringify(a)===JSON.stringify(b));history.record(edited);
  expect(history.undo()).toEqual(r);expect(history.redo()).toEqual(edited);
  edited=calculate(edited);
  const loaded=save([edited],latitude);expect(totals(loaded.roofs)).toEqual(totals([edited]));expect(needsLayoutUpdate(loaded.roofs[0],edge)).toBe(false);
  const changed={...loaded.roofs[0],moduleSpec:{...edited.moduleSpec,power:610,width:1.2,length:2.4},obstacles:edited.obstacles.map(o=>o.id==='b'?{...o,topLayout:{...o.topLayout!,enabled:false}}:o.id==='o'?{...o,height:4}:o)};
  expect(needsLayoutUpdate(changed,edge)).toBe(true);expect(()=>schemeReport('旧结果',[changed],edge,'data:image/png;base64,AAAA')).toThrow();
  const final=calculate(changed);expect(final.arrays.every(a=>!a.hostObstacleId)).toBe(true);
  const reopened=save([final],latitude);expect(needsLayoutUpdate(reopened.roofs[0],edge)).toBe(false);
  const html=schemeReport('更新后',reopened.roofs,edge,'data:image/png;base64,AAAA','',reopened.sunSettings);expect(html).toContain(totals([final]).capacity.toFixed(2));expect(html).not.toMatch(/NaN|Infinity/);
 });
}

it('缩小异形轮廓不能遗失对象，失败不修改原工程',()=>{
 const r=newRoof();r.obstacles=[{id:'o',name:'对象',x:10,z:0,width:3,depth:3,height:1,yaw:0}];
 const before=JSON.stringify(r);expect(()=>reshapeRegion([r],r.id,polygonRect([{x:-5,z:-5},{x:5,z:-4},{x:4,z:5},{x:-5,z:5}]))).toThrow('障碍物');expect(JSON.stringify(r)).toBe(before);
});
it('双坡六排转换成矩形平屋面、单坡和异形平屋面均收敛到三排',()=>{
 const r=applyRegionForm(newRoof(),'gable');r.layoutOptions.tableRows=6;
 for(const form of ['flat','single','polygon'] as const){const next=applyRegionForm(r,form);expect(next.layoutOptions.tableRows).toBe(3);expect(next.pitch?.kind).toBe(form==='single'?'single':undefined);expect(r.layoutOptions.tableRows).toBe(6);}
});
