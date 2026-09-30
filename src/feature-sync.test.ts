import {expect,it} from 'vitest';
import {autoLayout} from './auto-layout';
import {newRoof} from './roof-project';
import {parseWorkspace} from './workspace-file';
import {defaultSunSettings} from './sun-position';
import {layoutSignatureFor,needsLayoutUpdate} from './layout-state';
import {polygonRect,footprintArea} from './polygon';
import {projectStatistics} from './project-statistics';
import {schemeReport} from './scheme-report';
import {type Obstacle} from './domain';

const host:Obstacle={id:'tower',name:'气楼',x:0,z:0,width:12,depth:10,yaw:.2,height:3,topLayout:{enabled:true,tilt:10,edge:.5}};
it('保存后重新打开保留坐标、顶部组件、完成状态及报告装机量',()=>{
 const sunSettings={...defaultSunSettings(),latitude:23.1291,longitude:113.2644,locationMode:'manual' as const,coordinateSource:'manual' as const};
 const r={...newRoof(),roof:{width:60,depth:40},obstacles:[host]};
 r.layoutOptions={...r.layoutOptions,shadowLatitude:sunSettings.latitude,shadowIgnored:false};
 r.arrays=autoLayout(r.roof,r.obstacles,r.layoutOptions).arrays;r.layoutSignature=layoutSignatureFor(r,.5);
 const p=parseWorkspace(JSON.stringify({version:3,name:'回归验证',sunSettings,roofs:[r],activeId:r.id,solarHour:9,backgroundColor:'#ffffff',groundColor:'#dddddd'}));
 expect(p.sunSettings).toEqual(sunSettings);expect(p.roofs[0].arrays.some(a=>a.hostObstacleId===host.id)).toBe(true);
 expect(needsLayoutUpdate(p.roofs[0],.5)).toBe(false);
 const stats=projectStatistics(p.roofs);expect(stats.total.count).toBe(r.arrays.reduce((n,a)=>n+a.rows*a.columns,0));
 expect(schemeReport(p.name,p.roofs,.5,'data:image/png;base64,AAAA','',p.sunSettings)).toContain('所在地冬至');
});
it('附属建筑越出凹多边形屋面不能生成越界顶部组件',()=>{
 const roof=polygonRect([{x:-20,z:-15},{x:20,z:-15},{x:20,z:0},{x:0,z:0},{x:0,z:15},{x:-20,z:15}]);
 expect(()=>autoLayout(roof,[{...host,x:10,z:7}],newRoof().layoutOptions)).toThrow('附属建筑须完整位于所属屋面内');
 const r={...newRoof(),roof};expect(projectStatistics([r]).total.roofArea).toBe(footprintArea(roof));
});
it('极夜和未确认地点不能绕过布置校核',()=>{
 const r=newRoof();expect(()=>autoLayout(r.roof,[],{...r.layoutOptions,shadowIgnored:true})).toThrow('不能跳过');
 expect(()=>autoLayout(r.roof,[],{...r.layoutOptions,shadowLatitude:80})).toThrow('没有有效日照');
});
it('读取项目拒绝非法附属建筑参数、非有限高度和非法纬度',()=>{
 const r={...newRoof(),obstacles:[host]};const p={version:3,name:'test',roofs:[r],activeId:r.id,solarHour:9,backgroundColor:'#ffffff',groundColor:'#dddddd'};
 expect(()=>parseWorkspace(JSON.stringify({...p,roofs:[{...r,obstacles:[{...host,topLayout:{...host.topLayout,edge:-1}}]}]}))).toThrow('顶部参数无效');
 expect(()=>parseWorkspace(JSON.stringify({...p,sunSettings:{...defaultSunSettings(),latitude:91}}))).toThrow();
 const arrays=autoLayout(r.roof,r.obstacles,r.layoutOptions).arrays;
 expect(()=>parseWorkspace(JSON.stringify({...p,roofs:[{...r,arrays:arrays.map(a=>({...a,elevation:Infinity}))}]}))).toThrow('阵列数据无效');
});
