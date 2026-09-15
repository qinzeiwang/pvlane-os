import {defaultModule} from './domain';
import {autoLayout} from './auto-layout';
import {it,expect} from 'vitest';
import {newRoof,roofFromPrevious} from './roof-project';
import {defaultPitch} from './pitched-roof';
it('新增屋面继承组件和规则，但不复制几何与布置',()=>{
 const previous=newRoof();previous.pitch={...defaultPitch,percent:18,eave:9};previous.moduleSpec={...defaultModule,power:570};previous.layoutOptions={...previous.layoutOptions,gap:.8,portrait:false,rowGap:.4};previous.wallHeight=.6;
 previous.x=20;previous.obstacles=[{id:'x',name:'x',kind:'keepout',height:0,x:0,z:0,width:2,depth:2,yaw:0}];previous.arrays=autoLayout(previous.roof,[],{...previous.layoutOptions,pitch:previous.pitch,module:previous.moduleSpec}).arrays;
 const r=roofFromPrevious(previous,'屋面 2');expect(r.id).not.toBe(previous.id);expect(r.moduleSpec).toEqual(previous.moduleSpec);expect(r.layoutOptions).toEqual(previous.layoutOptions);expect(r.pitch).toEqual(previous.pitch);expect(r.wallHeight).toBe(.6);expect(r.arrays).toEqual([]);expect(r.obstacles).toEqual([]);expect(r.x).toBe(0);expect(r.previous).toBeNull();
 r.moduleSpec.power=600;r.layoutOptions.gap=2;r.pitch!.percent=25;
 expect(previous.moduleSpec.power).toBe(570);expect(previous.layoutOptions.gap).toBe(.8);expect(previous.pitch.percent).toBe(18);
});
it('连续新增继续沿用刚设置的参数，平屋面也能继承',()=>{const a=newRoof();a.layoutOptions.gap=1.8;const b=roofFromPrevious(a,'2');b.layoutOptions.gap=2.1;const c=roofFromPrevious(b,'3');expect(c.layoutOptions.gap).toBe(2.1);expect(c.pitch).toBeUndefined();});
