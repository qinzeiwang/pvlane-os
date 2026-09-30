import {describe,it,expect} from 'vitest';
import {sunPosition,parseSunSettings,validSunSettings,type SunSettings} from './sun-position';
import {parseWorkspace} from './workspace-file';
import {newRoof} from './roof-project';
const beijing:SunSettings={latitude:39.75,longitude:116.03,date:'2026-06-21',time:'11:00',utcOffset:8};
describe('地点与日期时间光照',()=>{
 it('与 NREL SPA 示例方向接近（近似模型容差半度）',()=>{
  const sun=sunPosition({latitude:39.742476,longitude:-105.1786,date:'2003-10-17',time:'12:30',utcOffset:-7});
  expect(Math.abs(sun.elevation-39.872)).toBeLessThan(.5);expect(Math.abs(sun.azimuth-194.34)).toBeLessThan(.5);
 });
 it('夏季太阳更高，上午在东侧、下午在西侧，夜间无直射',()=>{
  expect(sunPosition(beijing).elevation).toBeGreaterThan(sunPosition({...beijing,date:'2026-12-21'}).elevation+40);
  expect(sunPosition({...beijing,time:'09:00'}).x).toBeGreaterThan(0);
  expect(sunPosition({...beijing,time:'15:00'}).x).toBeLessThan(0);
  expect(sunPosition({...beijing,time:'00:00'}).daylight).toBe(false);
 });
 it('时区换算和北向旋转一致',()=>{
  const a=sunPosition(beijing),b=sunPosition({...beijing,time:'03:00',utcOffset:0}),c=sunPosition(beijing,90);
  expect(Math.abs(a.elevation-b.elevation)).toBeLessThan(.05);
  expect(c.x).toBeCloseTo(-a.z,10);expect(c.z).toBeCloseTo(a.x,10);expect(c.y).toBe(a.y);
  expect(a.x*a.x+a.y*a.y+a.z*a.z).toBeCloseTo(1,10);
 });
 it('拒绝坏日期和越界值，支持闰年及负经纬度',()=>{
  for(const patch of [{date:'2026-02-29'},{date:'2026-04-31'},{time:'24:00'},{latitude:91},{longitude:181},{utcOffset:15},{latitude:NaN}])expect(()=>parseSunSettings({...beijing,...patch})).toThrow();
  expect(validSunSettings({...beijing,date:'2028-02-29',latitude:-33,longitude:-70})).toBe(true);
 });
 it('保存重开保留光照，旧项目兼容且不修改排布',()=>{
  const roof=newRoof(),p={version:3,name:'光照',roofs:[roof],activeId:roof.id,solarHour:11,backgroundColor:'#ffffff',groundColor:'#dddddd'};
  const reopened=parseWorkspace(JSON.stringify({...p,sunSettings:beijing}));
  expect(reopened.sunSettings).toEqual(beijing);expect(reopened.roofs[0].arrays).toEqual(roof.arrays);
  expect(validSunSettings(parseSunSettings(parseWorkspace(JSON.stringify(p)).sunSettings))).toBe(true);
  expect(()=>parseWorkspace(JSON.stringify({...p,sunSettings:{...beijing,date:'bad'}}))).toThrow();
 });
});