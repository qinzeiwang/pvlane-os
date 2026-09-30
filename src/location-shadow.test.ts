import {it,expect} from 'vitest';
import reference from '../test-fixtures/solar-spa-reference.json';
import {sunPosition,type SunSettings} from './sun-position';
import {shadowZones,insideConvex} from './shadow-zones';
import {pitchedShadowZones} from './pitched-shadow-zones';
import {winterRays,recommendedGap} from './solar';
import {autoLayout} from './auto-layout';
import {corners,type Obstacle} from './domain';
import {newRoof,toWorld,geographicYaw} from './roof-project';
import {layoutSignatureFor} from './layout-state';
const settings:SunSettings={latitude:39.75,longitude:116.03,utcOffset:8,date:'2026-06-21',time:'09:00'};
const roof={width:100,depth:100},object:Obstacle={id:'o',name:'设备',x:0,z:0,yaw:0,width:2,depth:2,height:3};
it('72个独立SPA样本：六地点、南北半球、三季节与昼夜，方向误差小于0.03度',()=>{
 let worst=0;for(const r of reference.cases){const s=sunPosition(r.settings);const az=Math.abs(((s.azimuth-r.azimuth+540)%360)-180);worst=Math.max(worst,az,Math.abs(s.elevation-r.elevation));expect(az,r.name+JSON.stringify(r.settings)).toBeLessThan(.03);expect(Math.abs(s.elevation-r.elevation)).toBeLessThan(.03);}console.log('SPA reference maximum angular error:',worst.toFixed(6),'deg');
});
it('平屋面投影满足高度/tan太阳高度，夜晚不产生直射阴影',()=>{
 const sun=sunPosition(settings),zone=shadowZones(roof,[object],0,0,[sun])[0];for(const p of corners(object))expect(insideConvex({x:p.x-object.height*sun.x/sun.y,z:p.z-object.height*sun.z/sun.y},zone.points)).toBe(true);
 const shift=object.height*Math.hypot(sun.x,sun.z)/sun.y;expect(shift).toBeCloseTo(object.height/Math.tan(sun.elevation*Math.PI/180),10);
 expect(shadowZones(roof,[object],0,0,[sunPosition({...settings,time:'00:00'})])).toEqual([]);
});
it('经度、纬度、日期时间改变会改变平屋面和坡屋面的投影',()=>{
 const base=shadowZones(roof,[object],0,0,[sunPosition(settings)]),pitch={kind:'gable' as const,axis:'z' as const,high:-1 as const,percent:10,eave:5};
 for(const patch of [{longitude:90},{latitude:23},{date:'2026-12-21'},{time:'15:00'}]){const s=sunPosition({...settings,...patch});expect(shadowZones(roof,[object],0,0,[s])).not.toEqual(base);expect(pitchedShadowZones(roof,[object],pitch,0,[s])).not.toEqual(pitchedShadowZones(roof,[object],pitch,0,[sunPosition(settings)]));}
 expect(pitchedShadowZones(roof,[object],pitch,0,[sunPosition({...settings,time:'00:00'})])).toEqual([]);
});
it('北向与屋面旋转后2D投影方向和3D太阳向量一致',()=>{
 const r={...newRoof(),x:0,z:0,yaw:.4,northAngle:90,roof};const sun=sunPosition(settings),sceneSun=sunPosition(settings,90),zone=shadowZones(roof,[object],0,geographicYaw(r),[sun])[0];const points=zone.points.map(p=>toWorld(p,r));
 const centroid=points.reduce((a,p)=>({x:a.x+p.x/points.length,z:a.z+p.z/points.length}),{x:0,z:0});expect(centroid.x*sceneSun.x+centroid.z*sceneSun.z).toBeLessThan(0);
});
it('冬至校核随所在地纬度更新，南半球用六月冬至方向，布置签名随纬度过期',()=>{
 expect(recommendedGap(4,10,180,23)).toBeLessThan(recommendedGap(4,10,180,40));expect(winterRays(-33)[12].z).toBeLessThan(0);expect(winterRays(80)).toEqual([]);expect(()=>autoLayout(roof,[object],{...newRoof().layoutOptions,shadowLatitude:80})).toThrow('冬至没有有效日照');
 const r=newRoof();expect(layoutSignatureFor(r,.5)).not.toBe(layoutSignatureFor({...r,layoutOptions:{...r.layoutOptions,shadowLatitude:23}},.5));
 const opts={...r.layoutOptions,module:r.moduleSpec,wallHeight:0};expect(autoLayout(roof,[object],{...opts,shadowLatitude:23}).arrays).not.toEqual(autoLayout(roof,[object],{...opts,shadowLatitude:40}).arrays);
});