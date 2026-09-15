import {expect,it} from 'vitest';
import {newRoof,geographicYaw,roofFromPrevious} from './roof-project';
import {projectStatistics} from './project-statistics';
import {autoLayout,tableSpacing} from './auto-layout';
import {layoutSignatureFor} from './layout-state';
import {shadowZones} from './shadow-zones';
it('图纸右侧为北时修正报告朝向、日照与阴影，保留原绘图坐标',()=>{
 const r=newRoof();r.moduleSpec.kind='standard';r.arrays=autoLayout(r.roof,[],{...r.layoutOptions,module:r.moduleSpec}).arrays;
 const rotated={...r,northAngle:90};
 expect(rotated.arrays).toBe(r.arrays);expect(geographicYaw(rotated)).toBeCloseTo(Math.PI/2);
 expect(layoutSignatureFor(rotated,.5)).not.toBe(layoutSignatureFor(r,.5));
 expect(tableSpacing({...r.layoutOptions,roofYaw:geographicYaw(rotated)}).actual).not.toBe(tableSpacing(r.layoutOptions).actual);
 expect(shadowZones(r.roof,[],.3,geographicYaw(rotated))).not.toEqual(shadowZones(r.roof,[],.3,0));
 expect(roofFromPrevious(rotated,'新增').northAngle).toBe(90);
});
