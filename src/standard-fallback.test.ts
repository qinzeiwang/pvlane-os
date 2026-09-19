import {expect,it} from 'vitest';
import {autoLayout} from './auto-layout';
import {corners,defaultModule,detect,footprint} from './domain';
const base={portrait:true,tilt:0,edge:0,gap:.2,maxColumns:10,wallHeight:0,rowGap:.2,spacingMode:'manual' as const,tableRows:3,module:{...defaultModule,kind:'standard' as const,length:2,width:1,gap:0}};
for(const pitched of [false,true])for(const portrait of [false,true])it(`标准组件余位逐级补排 pitched=${pitched} portrait=${portrait}`,()=>{
 for(const [depth,expected] of [[10.3,[3,2]],[8.3,[3,1]],[4.1,[2]],[2.1,[1]]] as const){
  const roof=portrait?{width:4,depth}:{width:depth,depth:4};
  const result=autoLayout(roof,[],{...base,portrait,...(pitched?{pitch:{kind:'single' as const,axis:'z' as const,high:1 as const,percent:0,eave:3.5}}:{})});
  expect(result.arrays.map(a=>a.rows)).toEqual(expected);
  expect(result.count).toBe(result.arrays.reduce((n,a)=>n+a.rows*a.columns,0));
  expect(detect(result.arrays,[],roof)).toEqual([]);
 }
});
it('双坡两侧分别补排且不跨越屋脊',()=>{
 const result=autoLayout({width:4,depth:10},[],{...base,pitch:{kind:'gable',axis:'z',high:1,percent:15,eave:3.5}});
 expect(result.arrays.map(a=>a.rows)).toEqual([2,2]);
 expect(result.arrays[0].z).toBeLessThan(0);expect(result.arrays[1].z).toBeGreaterThan(0);
 expect(detect(result.arrays,[],{width:4,depth:10})).toEqual([]);
});
it('双坡从屋脊向两侧起排，单坡从高侧起排',()=>{
 const roof={width:8,depth:20},edge=.5;
 const gable=autoLayout(roof,[],{...base,edge,rowGap:4,pitch:{kind:'gable',axis:'z',high:1,percent:15,eave:3.5}});
 const negative=gable.arrays.filter(a=>a.z<0).flatMap(a=>corners(footprint(a)).map(v=>v.z));
 const positive=gable.arrays.filter(a=>a.z>0).flatMap(a=>corners(footprint(a)).map(v=>v.z));
 expect(Math.max(...negative)).toBeCloseTo(-edge,6);
 expect(Math.min(...positive)).toBeCloseTo(edge,6);
 const single=autoLayout(roof,[],{...base,edge,rowGap:4,pitch:{kind:'single',axis:'z',high:1,percent:15,eave:3.5}});
 expect(single.arrays[0].z).toBeGreaterThan(0);
});

for(const pitched of [false,true])it(`禁布区阻挡大组时尝试小组 pitched=${pitched}`,()=>{
 const objects=[{id:'a',name:'a',kind:'keepout' as const,x:-1,z:2,width:.8,depth:1,height:0,yaw:0},{id:'b',name:'b',kind:'keepout' as const,x:0,z:0,width:.8,depth:1,height:0,yaw:0}];
 const roof={width:3,depth:6};
 const result=autoLayout(roof,objects,{...base,...(pitched?{pitch:{kind:'single' as const,axis:'z' as const,high:1 as const,percent:0,eave:3.5}}:{})});
 expect(result.arrays.map(a=>a.rows)).toEqual([2,1,3]);
 expect(detect(result.arrays,objects,roof)).toEqual([]);
 expect(result.count).toBe(6);
});
