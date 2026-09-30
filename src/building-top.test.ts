import {expect,it} from 'vitest';
import {autoLayout} from './auto-layout';
import {detect,defaultModule,type Obstacle} from './domain';
import {defaultPitch} from './pitched-roof';
import {buildingTop} from './building-top';
import {newRoof,worldArray,worldObstacle} from './roof-project';
const roof={width:60,depth:40},options={module:{...defaultModule,kind:"standard" as const},portrait:true,tilt:10,edge:.5,gap:.6,maxColumns:10,tableRows:3};
const host:Obstacle={id:'building',name:'附属建筑',x:0,z:0,width:14,depth:12,yaw:.3,height:3,topLayout:{enabled:true,tilt:10,edge:.5}};
it('lays out flat building tops without self collision and preserves world height',()=>{
 const result=autoLayout(roof,[host],options),upper=result.arrays.filter(a=>a.hostObstacleId);
 expect(upper.length).toBeGreaterThan(0);expect(detect(result.arrays,[host],roof)).toEqual([]);
 expect(upper.every(a=>a.elevation===3)).toBe(true);
 const r={...newRoof(),roof,flatHeight:8,obstacles:[host],arrays:result.arrays};
 expect(worldArray(upper[0],r).elevation).toBe(7.5);
 expect(worldArray(upper[0],r).hostObstacleId).toBe(worldObstacle(host,r).id);
 expect(autoLayout(roof,[{...host,topLayout:{...host.topLayout!,enabled:false}}],options).arrays.some(a=>a.hostObstacleId)).toBe(false);
});
it('uses the ridge maximum for flat tops crossing a gable',()=>{
 const pitch={...defaultPitch,kind:'gable' as const};
 expect(buildingTop(roof,pitch,host)).toBe(6);
 const r=autoLayout(roof,[host],{...options,pitch,tableRows:3});
 expect(r.arrays.filter(a=>a.hostObstacleId).every(a=>a.elevation===6&&!a.surface)).toBe(true);
 expect(detect(r.arrays,[host],roof)).toEqual([]);
});
import {parseWorkspace} from './workspace-file';
import {projectStatistics} from './project-statistics';
it('round-trips three-row pitched layouts and flat auxiliary roof parameters',()=>{
 const pitch={...defaultPitch,kind:'gable' as const};
 const layoutOptions={...options,tableRows:3};
 const result=autoLayout(roof,[host],{...layoutOptions,pitch});
 const r={...newRoof(),roof,pitch,moduleSpec:options.module,layoutOptions,obstacles:[host],arrays:result.arrays};
 const saved={version:3,name:'顶部测试',roofs:[r],activeId:r.id,solarHour:11,backgroundColor:'#ffffff',groundColor:'#dddddd'};
 const loaded=parseWorkspace(JSON.stringify(saved)).roofs[0];
 expect(loaded.layoutOptions.tableRows).toBe(3);
 expect(loaded.obstacles[0].topLayout).toEqual(host.topLayout);
 expect(loaded.arrays).toEqual(r.arrays);
 expect(projectStatistics([loaded]).total.count).toBe(result.count);
 expect(()=>parseWorkspace(JSON.stringify({...saved,roofs:[{...r,obstacles:[]}]}))).toThrow('顶部阵列所属建筑无效');
});
it('rejects invalid top settings and detects stale orphan arrays',()=>{
 expect(()=>autoLayout(roof,[{...host,topLayout:{enabled:true,tilt:NaN,edge:.5}}],options)).toThrow();
 const upper=autoLayout(roof,[host],options).arrays.filter(a=>a.hostObstacleId);
 expect(detect(upper,[],roof).every(issue=>issue.kind==='boundary')).toBe(true);
});