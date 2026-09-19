import {it,expect} from 'vitest';
import {autoLayout} from './auto-layout';
import {defaultModule,footprint} from './domain';
import {pitchedShadowZones} from './pitched-shadow-zones';
import {newRoof} from './roof-project';
import {layoutSignatureFor,needsLayoutUpdate} from './layout-state';
import {hitsShadow} from './shadow-zones';

for(const kind of ['single','gable'] as const)for(const yaw of [0,.7])it(`${kind} rotation ${yaw}: every array clears displayed shadow`,()=>{
 const roof={width:30,depth:24},pitch={kind,axis:'z' as const,high:-1 as const,percent:20,eave:5};
 const obstacles=[{id:'o',name:'obstacle',x:0,z:0,width:4,depth:4,yaw:.3,height:3}];
 const zones=pitchedShadowZones(roof,obstacles,pitch,yaw);
 const result=autoLayout(roof,obstacles,{pitch,module:defaultModule,roofYaw:yaw,portrait:true,tilt:10,edge:.5,gap:.6,rowGap:.6,maxColumns:12,tableRows:3});
 expect(result.count).toBeGreaterThan(0);expect(zones.length).toBeGreaterThan(0);
 for(const array of result.arrays)for(const zone of zones)expect(hitsShadow(footprint(array),zone)).toBe(false);
});

it('旧坡屋面排布会提示更新，当前签名保持有效',()=>{
 const r=newRoof();r.pitch={kind:'single',axis:'z',high:-1,percent:20,eave:5};
 const signature=layoutSignatureFor(r,.5),old=JSON.parse(signature);delete old.pitchedShadowRevision;
 r.layoutSignature=JSON.stringify(old);expect(needsLayoutUpdate(r,.5)).toBe(true);
 r.layoutSignature=signature;expect(needsLayoutUpdate(r,.5)).toBe(false);
});
