import {it,expect} from 'vitest';
import {cityPresets,matchCity,locationFromAddress,ignoresShadows,winterShadowFactor} from './location-presets';
import {defaultSunSettings,parseSunSettings} from './sun-position';
import {autoLayout,tableSpacing} from './auto-layout';
import {newRoof} from './roof-project';
import {parseWorkspace} from './workspace-file';
it('50个城市参考点及冬至系数合理，不混淆同名城市',()=>{
 expect(cityPresets).toHaveLength(50);expect(new Set(cityPresets.map(c=>c.name)).size).toBe(50);
 expect(matchCity('江苏省苏州市工业园区')!.latitude).toBeCloseTo(31.30,1);
 expect(matchCity('福建省福州市')!.latitude).toBeCloseTo(26.06,1);
 expect(matchCity('长沙')!.latitude).toBeCloseTo(28.20,1);expect(matchCity('海口')!.latitude).toBeCloseTo(20.03,1);
 expect(winterShadowFactor(matchCity('北京')!.latitude)).toBeCloseTo(2.98,2);
 for(const c of cityPresets){expect(c.latitude).toBeGreaterThan(18);expect(c.latitude).toBeLessThan(50);expect(c.longitude).toBeGreaterThan(85);expect(c.longitude).toBeLessThan(130);expect(winterShadowFactor(c.latitude)).toBeGreaterThan(1);}
});
it('空地点、省名、未知和歧义地址不回退北京；唯一城市自动采用',()=>{
 const s=defaultSunSettings();expect(s.locationMode).toBe('unresolved');
 for(const address of ['', '四川省','保定','北京上海','南京路'])expect(locationFromAddress(s,address).locationMode).toBe('unresolved');
 const p=locationFromAddress(s,'广东省广州市白云区');expect(p.locationMode).toBe('preset');expect(p.latitude).toBe(matchCity('广州')!.latitude);
 expect(locationFromAddress(p,'保定').locationMode).toBe('unresolved');
 const m={...s,latitude:30,longitude:100,locationMode:'manual' as const};expect(locationFromAddress(m,'现场一号')).toEqual(m);
 expect(locationFromAddress(m,'广州市现场一号')).toEqual(m);
});
it('不允许通过旧忽略开关绕过阴影校核',()=>{
 const r=newRoof(),opts={...r.layoutOptions,tilt:15,shadowLatitude:39.9,shadowIgnored:true};
 expect(tableSpacing(opts).recommended).toBeGreaterThan(1);
 expect(()=>autoLayout(r.roof,[],opts)).toThrow('不能跳过');
 expect(()=>autoLayout(r.roof,[],{...opts,shadowIgnored:false,shadowLatitude:80})).toThrow('没有有效日照');
});
it('坐标来源与忽略选择随JSON保存，并验证异常字段',()=>{
 for(const mode of ['preset','manual','ignored','unresolved'] as const){
 const r=newRoof(),sun={...defaultSunSettings(),locationMode:mode,locationName:mode==='preset'?'北京':undefined};r.layoutOptions.shadowIgnored=ignoresShadows(sun);
 const p=parseWorkspace(JSON.stringify({version:3,name:'地点测试',sunSettings:sun,roofs:[r],activeId:r.id,solarHour:11,backgroundColor:'#ffffff',groundColor:'#ffffff'}));expect(p.sunSettings).toEqual(mode==='ignored'?{...sun,locationMode:'unresolved'}:sun);expect(p.roofs[0].layoutOptions.shadowIgnored).toBe(ignoresShadows(sun));
 }
 expect(()=>parseSunSettings({...defaultSunSettings(),locationMode:'guess'})).toThrow();
});