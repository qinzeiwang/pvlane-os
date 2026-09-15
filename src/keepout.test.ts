import {it,expect} from 'vitest';
import {autoLayout} from './auto-layout';
import {detect,footprint,overlaps,type Obstacle} from './domain';
import {shadowZones} from './shadow-zones';
import {defaultPitch} from './pitched-roof';
import {newRoof} from './roof-project';
import {parseWorkspace} from './workspace-file';
const roof={width:30,depth:20};
const zone:Obstacle={id:'keepout',name:'禁布区 1',kind:'keepout',x:0,z:0,width:8,depth:8,yaw:.3,height:0};
const options={portrait:true,tilt:20,edge:.5,gap:1,maxColumns:18};
for(const pitch of [undefined,defaultPitch])it(`禁布区阻止自动布置，模式 ${pitch?.kind??'flat'}`,()=>{
 const r=autoLayout(roof,[zone],{...options,pitch});expect(r.count).toBeGreaterThan(0);
 expect(r.arrays.every(a=>!overlaps(footprint(a),zone))).toBe(true);
 expect(detect(r.arrays,[zone],roof)).toEqual([]);
});
it('禁布区没有阴影，但已有阵列进入时报告冲突',()=>{
 expect(shadowZones(roof,[zone],0)).toEqual(shadowZones(roof,[],0));
 const a=autoLayout(roof,[],{...options,pitch:defaultPitch}).arrays.find(a=>overlaps(footprint(a),zone))!;
 expect(a).toBeDefined();expect(detect([a],[zone],roof).some(i=>i.ids.includes(zone.id))).toBe(true);
});
it('项目保存重载保留零高度禁布区，拒绝未知类别',()=>{
 const r=newRoof();r.obstacles=[zone];
 const p={version:3,name:'测试',roofs:[r],activeId:r.id,solarHour:9,backgroundColor:'#ffffff',groundColor:'#ffffff'};
 expect(parseWorkspace(JSON.stringify(p)).roofs[0].obstacles[0]).toEqual(zone);
 expect(()=>parseWorkspace(JSON.stringify({...p,roofs:[{...r,obstacles:[{...zone,kind:'unknown'}]}]}))).toThrow();
});
