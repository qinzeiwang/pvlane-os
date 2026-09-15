import {expect,it} from 'vitest';
import {autoLayout,layoutDirection,tableSpacing} from './auto-layout';
import {defaultModule,detect} from './domain';
import {newRoof,worldArray} from './roof-project';
import {panelOrientation} from './project-statistics';
import {layoutMarker} from './layout-direction';
import {recommendedGap} from './solar';
it('四个朝向的布置、间距、报告法线和画布箭头一致',()=>{
 const r={...newRoof(),yaw:.3};
 for(let direction=0;direction<4;direction++){
 const options={...r.layoutOptions,direction,tilt:20,wallHeight:0,module:{...defaultModule,kind:'standard' as const},roofYaw:r.yaw};
 const result=autoLayout(r.roof,[],options);expect(result.count).toBeGreaterThan(0);expect(detect(result.arrays,[],r.roof)).toEqual([]);
 const expected=((180+90*direction-r.yaw*180/Math.PI)%360+360)%360;
 for(const a of result.arrays)expect(panelOrientation(worldArray(a,r)).azimuth).toBeCloseTo(expected);
 expect(tableSpacing(options).actual).toBe(recommendedGap(defaultModule.length,20,expected));
 const marker=layoutMarker({...r,layoutOptions:options})!,[x,z,bx,bz]=marker.segments[0];
 expect((Math.atan2(bx-x,-(bz-z))*180/Math.PI+360)%360).toBeCloseTo(expected);
 }
 expect(layoutDirection({portrait:true})).toBe(0);expect(layoutDirection({portrait:false})).toBe(1);
});
