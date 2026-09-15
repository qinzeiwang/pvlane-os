import {expect,it} from 'vitest';
import {defaultPitch,roofHeight} from './pitched-roof';
import {pitchSegments,turnPitch} from './roof-direction';
it('坡向箭头始终从高指向低，四次转向回到原方向',()=>{
 let p={...defaultPitch};
 for(let i=0;i<4;i++){const [x,z,bx,bz]=pitchSegments(30,20,p)[0];expect(roofHeight({width:30,depth:20},p,x,z)).toBeGreaterThan(roofHeight({width:30,depth:20},p,bx,bz));p=turnPitch(p);}
 expect(p).toEqual(defaultPitch);
});
it('双坡屋脊居中，方向与实际坡面一致',()=>{
 const p={...defaultPitch,kind:'gable' as const};
 expect(pitchSegments(30,20,p)).toEqual([[-12,0,12,0]]);
 expect(pitchSegments(30,20,turnPitch(p))).toEqual([[0,-8,0,8]]);
});
