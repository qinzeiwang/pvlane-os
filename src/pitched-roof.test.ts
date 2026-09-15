import {it,expect} from 'vitest';
import {roofHeight,roofGradient,validPitch,defaultPitch} from './pitched-roof';
it('坡面高差和坡度方向正确',()=>{const roof={width:20,depth:30},p={...defaultPitch,eave:4,percent:10,high:1 as const};expect(roofHeight(roof,p,0,15)-roofHeight(roof,p,0,-15)).toBeCloseTo(3);expect(roofGradient(p,0,0).sz).toBeCloseTo(.1);expect(validPitch({...p,percent:NaN})).toBe(false);const g={...p,kind:'gable' as const};expect(roofHeight(roof,g,0,0)-roofHeight(roof,g,0,15)).toBeCloseTo(1.5);expect(roofGradient(g,0,-1).sz).toBeCloseTo(.1);expect(roofGradient(g,0,1).sz).toBeCloseTo(-.1);});
