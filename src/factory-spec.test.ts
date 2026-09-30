import {expect,it} from 'vitest';
import {factorySpec} from './factory-spec';
for(const axis of ['x','z'] as const)for(const size of [[48,30],[80,20],[12,8]])it(`factory geometry ${axis}/${size}`,()=>{
 const s=factorySpec(size[0],size[1],{kind:'gable',axis,high:1,percent:15,eave:7});
 expect(s.roof.every(Number.isFinite)).toBe(true);expect(s.uv.length).toBe(s.roof.length/3*2);
 expect(s.boxes.every(b=>b.size.every(v=>v>0)&&b.position.every(Number.isFinite))).toBe(true);
 const length=axis==='x'?size[1]:size[0];expect(s.doorCount).toBe(length>=32?3:length>=16?2:1);
 const doors=s.boxes.filter(b=>b.name==='Factory door');expect(doors).toHaveLength(s.doorCount);
 for(const d of doors)for(const wall of s.boxes.filter(b=>b.material==='wall')){
  const a=axis==='x'?2:0;
  if(Math.abs(wall.position[axis==='x'?0:2]-d.position[axis==='x'?0:2])>.3)continue;
  expect(Math.abs(wall.position[a]-d.position[a])>=(wall.size[a]+d.size[a])/2-1e-8||Math.abs(wall.position[1]-d.position[1])>=(wall.size[1]+d.size[1])/2-1e-8).toBe(true);
 }
});
import {factoryDoorSide} from './factory-spec';
it('chooses the long facade facing geographic south after roof rotation and north calibration',()=>{
 expect(factoryDoorSide('z',0,0)).toBe(1);expect(factoryDoorSide('z',0,180)).toBe(-1);
 expect(factoryDoorSide('z',Math.PI,0)).toBe(-1);expect(factoryDoorSide('z',Math.PI,180)).toBe(1);
 expect(factoryDoorSide('x',Math.PI/2,0)).toBe(-1);expect(factoryDoorSide('x',Math.PI/2,180)).toBe(1);
 const s=factorySpec(48,30,{kind:'gable',axis:'z',high:1,percent:15,eave:7},-1);
 expect(s.boxes.filter(b=>b.name==='Factory door').every(b=>b.position[2]<0)).toBe(true);
});
