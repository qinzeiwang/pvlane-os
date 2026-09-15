import { expect, it } from 'vitest';
import { geometry, initial, defaultModule, detect, footprint } from './domain';
import { autoLayout, tableSpacing } from './auto-layout';
import { recommendedGap } from './solar';
import { hitsShadow, shadowZones } from './shadow-zones';
import { parseProject, type ProjectFile } from './project-file';
const options = {portrait:true,tilt:20,edge:.5,gap:1,maxColumns:8,wallHeight:.32};

it('places two and three connected rows in one tilted plane with module-sized joints', () => {
  for (const rows of [2,3]) for (const tilt of [0,20,60]) {
    const a={...initial,connectedRows:true,rows,columns:2,tilt};
    const g=geometry(a), L=rows*g.l+(rows-1)*defaultModule.gap;
    expect(g.depth).toBeCloseTo(L*Math.cos(g.tilt));
    const plane=g.panels[0].y+g.panels[0].z*Math.tan(g.tilt);
    for(const p of g.panels) expect(p.y+p.z*Math.tan(g.tilt)).toBeCloseTo(plane);
    expect(g.panels[0].y+g.l/2*Math.sin(g.tilt)).toBeCloseTo(.3+L*Math.sin(g.tilt));
    expect(g.panels.at(-1)!.y-g.l/2*Math.sin(g.tilt)).toBeCloseTo(.3);
    expect(Math.hypot(g.panels[0].y-g.panels[2].y,g.panels[0].z-g.panels[2].z)-g.l).toBeCloseTo(defaultModule.gap);
  }
});

it('calculates shading clearance from the entire connected slope in either direction',()=>{
  for(const tableRows of [1,2,3]) for(const portrait of [true,false]){
    const L=tableRows*defaultModule.length+(tableRows-1)*defaultModule.gap;
    const s=tableSpacing({...options,tableRows,portrait});
    expect(s.actual).toBe(recommendedGap(L,options.tilt,portrait?180:270));
  }
});

it('allows shortened spacing to increase capacity without physical overlap or invading obstacle shade',()=>{
  const roof={width:40,depth:40};
  const objects=[{id:'o',name:'o',x:2,z:2,width:3,depth:4,yaw:.2,height:2}];
  for(const tableRows of [2,3]) for(const portrait of [true,false]){
    const rules={...options,tableRows,portrait};
    const solar=autoLayout(roof,objects,rules);
    const manual=autoLayout(roof,objects,{...rules,spacingMode:'manual',rowGap:.5});
    expect(manual.shortened).toBe(true);
    expect(manual.rowGap).toBe(.5);
    expect(manual.count).toBeGreaterThan(solar.count);
    expect(detect(manual.arrays,objects,roof)).toEqual([]);
    expect(manual.count).toBe(manual.arrays.reduce((n,a)=>n+a.rows*a.columns,0));
    expect(manual.arrays.every(a=>a.rows<=tableRows&&a.rows>=1&&a.connectedRows)).toBe(true);
    const zones=shadowZones(roof,objects,.32);
    expect(manual.arrays.some(a=>zones.some(z=>hitsShadow(footprint(a),z)))).toBe(false);
  }
});

it('keeps complete three-row strips at the capacity limit and rejects invalid modes',()=>{
  const result=autoLayout({width:200,depth:200},[],{...options,tableRows:3,tilt:0});
  expect(result.capped).toBe(true);expect(result.count).toBe(4998);
  expect(()=>autoLayout({width:30,depth:20},[],{...options,tableRows:4})).toThrow();
  expect(()=>autoLayout({width:30,depth:20},[],{...options,rowGap:-1,spacingMode:'manual'})).toThrow();
});

it('preserves legacy independent-row geometry when opening old projects',()=>{
  const a={...initial,id:'old',name:'old',rowGap:2};
  const project:ProjectFile={version:1,name:'legacy',roof:{width:30,depth:20},obstacles:[],arrays:[a],module:defaultModule,rules:{...options,maxRows:3},wallHeight:.32,solarHour:9,backgroundColor:'#dce5ec',groundColor:'#c7cccb'};
  const loaded=parseProject(JSON.stringify(project));
  expect(geometry(loaded.arrays[0])).toEqual(geometry(a));
  expect(loaded.arrays[0].connectedRows).toBeUndefined();
  expect(()=>parseProject(JSON.stringify({...project,rules:{...options,tableRows:4}}))).toThrow();
});
