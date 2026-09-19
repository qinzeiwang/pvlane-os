import {expect,it} from 'vitest';
import {corners} from './domain';
import {defaultPitch} from './pitched-roof';
import {pitchedShadowZones} from './pitched-shadow-zones';
import {parapets} from './shadow-zones';

it('女儿墙位于屋面范围内，零高度不生成女儿墙',()=>{
 const roof={width:30,depth:20};expect(parapets(roof,0)).toEqual([]);
 for(const wall of parapets(roof,.3))for(const point of corners(wall)){
  expect(Math.abs(point.x)).toBeLessThanOrEqual(15+1e-8);
  expect(Math.abs(point.z)).toBeLessThanOrEqual(10+1e-8);
 }
});

it('坡屋面障碍物生成阴影，禁布区不生成阴影',()=>{
 const roof={width:30,depth:20},object={id:'o',name:'障碍物',x:0,z:0,width:2,depth:2,height:2,yaw:0};
 expect(pitchedShadowZones(roof,[object],defaultPitch)).toHaveLength(1);
 expect(pitchedShadowZones(roof,[{...object,kind:'keepout'}],defaultPitch)).toEqual([]);
});
