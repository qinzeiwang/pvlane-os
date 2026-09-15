import {it,expect} from 'vitest';
import {reshapeRegion} from './reshape-region';
import {newRoof,worldArray,worldObstacle} from './roof-project';
import {initial} from './domain';
import {layoutSignatureFor,needsLayoutUpdate} from './layout-state';
it('修改只替换当前轮廓，组件世界位置与朝向保持，标记待更新',()=>{
 const r=newRoof();r.arrays=[{...initial,id:'a',name:'a',x:1,z:2}];r.obstacles=[{id:'o',name:'o',x:0,z:0,width:1,depth:1,height:1,yaw:0}];r.layoutSignature=layoutSignatureFor(r,.5);
 const other={...newRoof(),x:100};const a=worldArray(r.arrays[0],r),o=worldObstacle(r.obstacles[0],r);
 const [next,unchanged]=reshapeRegion([r,other],r.id,{x:1,z:1,yaw:.2,width:28,depth:19});
 expect(next.id).toBe(r.id);expect(next.name).toBe(r.name);expect(unchanged).toBe(other);expect(next.arrays.length).toBe(1);
 const after=worldArray(next.arrays[0],next);expect(after.x).toBeCloseTo(a.x);expect(after.z).toBeCloseTo(a.z);expect(after.azimuth).toBeCloseTo(a.azimuth);
 const ob=worldObstacle(next.obstacles[0],next);expect(ob.x).toBeCloseTo(o.x);expect(ob.z).toBeCloseTo(o.z);expect(ob.yaw).toBeCloseTo(o.yaw);expect(needsLayoutUpdate(next,.5)).toBe(true);expect(needsLayoutUpdate(r,.5)).toBe(false);
});
it('拒绝与其他区域重叠或遗漏已有障碍物，不修改原数据',()=>{
 const r=newRoof();r.obstacles=[{id:'o',name:'o',x:8,z:0,width:1,depth:1,height:1,yaw:0}];const before=JSON.stringify(r);
 expect(()=>reshapeRegion([r],r.id,{x:0,z:0,yaw:0,width:4,depth:4})).toThrow('障碍物');
 expect(()=>reshapeRegion([r,{...newRoof(),x:30}],r.id,{x:25,z:0,yaw:0,width:20,depth:20})).toThrow('重叠');expect(JSON.stringify(r)).toBe(before);
});
it('局部参数和全局边距变化均待更新，旧组件保留',()=>{
 const r=newRoof();r.arrays=[{...initial,id:'a',name:'a'}];r.layoutSignature=layoutSignatureFor(r,.5);
 expect(needsLayoutUpdate({...r,moduleSpec:{...r.moduleSpec,power:560}},.5)).toBe(true);expect(needsLayoutUpdate(r,1)).toBe(true);
 expect(needsLayoutUpdate({...r,name:'更名'},.5)).toBe(false);
});
