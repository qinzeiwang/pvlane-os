import {describe,it,expect} from 'vitest';
import {flatFacade} from './flat-facade';
describe('flat building facade',()=>{
 it('selects the most south-facing wall using roof rotation and project north',()=>{
  expect(flatFacade(30,20,20).entrance).toEqual({axis:'z',side:1});
  expect(flatFacade(30,20,20,0,90).entrance).toEqual({axis:'x',side:-1});
  expect(flatFacade(30,20,20,Math.PI,0).entrance).toEqual({axis:'z',side:-1});
 });
 it('aligns upper windows and keeps the ground floor entrance clear',()=>{
  const s=flatFacade(30,20,19.8);expect(s.floors).toBe(6);
  expect(s.boxes.filter(b=>b.material==='door')).toHaveLength(1);
  const windows=s.boxes.filter(b=>b.material==='glass'&&b.position[2]>10);
  const rows=Array.from({length:6},(_,i)=>windows.filter(b=>Math.abs(b.position[1]-(i+.55)*s.floorHeight)<.001).map(b=>b.position[0]));
  expect(rows[1]).toEqual(rows[5]);expect(rows[0].every(x=>Math.abs(x)>2)).toBe(true);
  expect(s.boxes.every(b=>b.position[1]+b.size[1]/2<=19.8)).toBe(true);
 });
});
