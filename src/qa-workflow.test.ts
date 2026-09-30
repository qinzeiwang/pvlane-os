import {expect,it} from 'vitest';
import {autoLayout} from './auto-layout';
import {detect,valid,footprint,type Obstacle} from './domain';
import {shadowZones,hitsShadow} from './shadow-zones';
import {pitchedShadowZones} from './pitched-shadow-zones';
import {topShadowZones} from './building-top';
import {winterRays} from './solar';
import {newRoof,totals,projectBounds,type RoofDesign} from './roof-project';
import {defaultPitch} from './pitched-roof';
import {layoutSignatureFor,needsLayoutUpdate} from './layout-state';
import {parseWorkspace,type WorkspaceFile} from './workspace-file';
import {defaultSunSettings} from './sun-position';
import {schemeReport} from './scheme-report';

const edge=.5;
const obstacles:Obstacle[]=[
 {id:'o',name:'障碍物',x:-8,z:0,width:3,depth:4,height:2,yaw:.2},
 {id:'k',name:'禁布区',kind:'keepout',x:9,z:8,width:4,depth:5,height:0,yaw:0},
 {id:'b',name:'气楼',x:0,z:-6,width:12,depth:8,height:3,yaw:0,topLayout:{enabled:true,tilt:10,edge:.5}},
];
function calculate(r:RoofDesign){
 const out=autoLayout(r.roof,r.obstacles,{...r.layoutOptions,pitch:r.pitch,module:r.moduleSpec,wallHeight:r.wallHeight,roofYaw:r.yaw});
 r.arrays=out.arrays;r.layoutSignature=layoutSignatureFor(r,edge);return out;
}
function workspace(roofs:RoofDesign[],latitude:number):WorkspaceFile{return {version:3,name:'QA完整流程',roofs,activeId:roofs[0].id,globalEdge:edge,solarHour:11,backgroundColor:'#ffffff',groundColor:'#dddddd',sunSettings:{...defaultSunSettings(),locationMode:'manual',latitude}};}

for(const kind of ['flat','single','gable'] as const)for(const axis of ['x','z'] as const)for(const latitude of [23,40,-34])for(const direction of [0,1,2,3]){
 it(`完整链路 ${kind}/${axis}/纬度${latitude}/朝向${direction}`,()=>{
  const r=newRoof('完整链路屋面');r.roof={width:48,depth:36};r.yaw=.3;
  if(kind!=='flat')r.pitch={...defaultPitch,kind,axis};
  r.obstacles=structuredClone(obstacles);r.layoutOptions={...r.layoutOptions,tableRows:kind==='gable'?6:3,direction,portrait:direction%2===0,shadowLatitude:latitude,shadowIgnored:false};
  const out=calculate(r);expect(out.count).toBeGreaterThan(0);expect(out.count).toBe(totals([r]).count);
  expect(r.arrays.every(valid)).toBe(true);expect(detect(r.arrays,r.obstacles,r.roof)).toEqual([]);
  const rays=winterRays(latitude),zones=r.pitch?pitchedShadowZones(r.roof,r.obstacles,r.pitch,r.yaw,rays):shadowZones(r.roof,r.obstacles,r.wallHeight,r.yaw,rays);
  for(const a of r.arrays){const forbidden=a.hostObstacleId?topShadowZones(r.roof,r.pitch,r.obstacles,r.obstacles.find(o=>o.id===a.hostObstacleId)!,r.yaw,rays):zones;expect(forbidden.some(z=>hitsShadow(footprint(a),z))).toBe(false);}
  const loaded=parseWorkspace(JSON.stringify(workspace([r],latitude)));
  expect(totals(loaded.roofs)).toEqual(totals([r]));expect(loaded.roofs[0].arrays).toEqual(JSON.parse(JSON.stringify(r.arrays)));
  expect(needsLayoutUpdate(loaded.roofs[0],edge)).toBe(false);
  const html=schemeReport('完整流程',loaded.roofs,edge,'data:image/png;base64,AAAA','',loaded.sunSettings);
  expect(html).toContain(totals([r]).capacity.toFixed(2));expect(html).not.toContain('NaN');
  const changed=loaded.roofs[0];changed.obstacles[0].width+=1;
  expect(needsLayoutUpdate(changed,edge)).toBe(true);expect(()=>schemeReport('修改后',loaded.roofs,edge,'data:image/png;base64,AAAA')).toThrow();
  calculate(changed);const reopened=parseWorkspace(JSON.stringify(loaded));expect(needsLayoutUpdate(reopened.roofs[0],edge)).toBe(false);
 });
}
it('凹多边形、多屋面、变更组件后重新计算和保存重开',()=>{
 const a=newRoof('凹多边形');a.roof={width:40,depth:30,outline:[{x:-20,z:-15},{x:20,z:-15},{x:20,z:0},{x:0,z:0},{x:0,z:15},{x:-20,z:15}]};
 const b=newRoof('双坡');b.x=70;b.pitch={...defaultPitch,kind:'gable'};b.layoutOptions.tableRows=6;
 for(const r of [a,b]){r.layoutOptions={...r.layoutOptions,shadowLatitude:40,shadowIgnored:false};calculate(r);expect(detect(r.arrays,r.obstacles,r.roof)).toEqual([]);}
 a.moduleSpec={...a.moduleSpec,power:620,width:1.2,length:2.4};expect(needsLayoutUpdate(a,edge)).toBe(true);calculate(a);
 const p=parseWorkspace(JSON.stringify(workspace([a,b],40)));expect(totals(p.roofs)).toEqual(totals([a,b]));expect(p.roofs.every(r=>!needsLayoutUpdate(r,edge))).toBe(true);
});
it('空项目边界有限，容量上限和极小屋面不会生成半个组件或无效数',()=>{
 expect(projectBounds([])).toEqual({x:0,z:0,width:0,depth:0});
 const r=newRoof();r.roof={width:200,depth:200};r.layoutOptions={...r.layoutOptions,tilt:0,wallHeight:0,shadowLatitude:23,tableRows:3,spacingMode:'manual',rowGap:0};
 for(const limit of [0,1,2,3,4999,5000]){const out=autoLayout(r.roof,[],{...r.layoutOptions,module:r.moduleSpec,limit});expect(out.count).toBeLessThanOrEqual(limit);expect(out.arrays.every(valid)).toBe(true);expect(out.count).toBe(totals([{...r,arrays:out.arrays}]).count);}
 const tiny=autoLayout({width:2,depth:2},[],{...r.layoutOptions,edge:1});expect(tiny.count).toBe(0);expect(tiny.arrays).toEqual([]);
});
