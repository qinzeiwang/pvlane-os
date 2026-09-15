import {expect,it} from 'vitest';
import {corners} from './domain';
import {resizeObject} from './resize-object';
it('拖动旋转矩形的角点时固定对角，不围绕中心缩放',()=>{
 const o={id:'o',name:'o',x:10,z:20,width:4,depth:6,yaw:.7,height:2};
 for(let i=0;i<4;i++){const original=corners(o),p={x:original[i].x+1,z:original[i].z+.5},updated=resizeObject(o,p,i),result=corners(updated);expect(result[(i+2)%4].x).toBeCloseTo(original[(i+2)%4].x);expect(result[(i+2)%4].z).toBeCloseTo(original[(i+2)%4].z);expect(result[i].x).toBeCloseTo(p.x);expect(result[i].z).toBeCloseTo(p.z);expect(updated.height).toBe(2);}
});
