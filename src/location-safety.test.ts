import {it,expect} from 'vitest';
import {coordinateDistance,locationMismatch,locationFromAddress,restoreProjectLocation,matchCity,LOCATION_DISTANCE_WARNING_KM} from './location-presets';
import {defaultSunSettings,validSunSettings} from './sun-position';
import {shadowNotice} from './shadow-notice';
import {newRoof} from './roof-project';
import {layoutSignatureFor} from './layout-state';
import {parseWorkspace} from './workspace-file';
const manual={...defaultSunSettings(),latitude:39.9075,longitude:116.3972,locationMode:'manual' as const};
const obstacle={id:'tower',name:'气楼',x:0,z:0,width:3,depth:8,height:2,yaw:0};
it('旧忽略项目没有可靠地点时必须补填，有城市或明确坐标时恢复校核',()=>{
 const legacy={...defaultSunSettings(),locationMode:'ignored' as const};
 expect(restoreProjectLocation(legacy,'未收录地点').locationMode).toBe('unresolved');
 expect(restoreProjectLocation(legacy,'北京市').locationMode).toBe('preset');
 expect(restoreProjectLocation(undefined,'广州市').locationMode).toBe('preset');
 expect(restoreProjectLocation(undefined,'').locationMode).toBe('unresolved');
});
it('旧忽略项目有明确手动坐标时恢复强制校核，坐标优先级保留',()=>{
 const ignored={...manual,locationMode:'ignored' as const,coordinateSource:'manual' as const};expect(restoreProjectLocation(ignored).locationMode).toBe('manual');
 expect(locationFromAddress(ignored,'广州市')).toEqual(ignored);
 const r=newRoof();const p=parseWorkspace(JSON.stringify({version:3,name:'保存测试',address:'北京市',sunSettings:ignored,roofs:[r],activeId:r.id,solarHour:11,backgroundColor:'#ffffff',groundColor:'#ffffff'}));
 expect(locationFromAddress(p.sunSettings!,'上海市')).toEqual({...ignored,locationMode:'manual'});
});
it('地点与坐标过远只提示，手动坐标优先，近距离和未知地点不误报',()=>{
 const mismatch=locationMismatch(manual,'广东省广州市');expect(mismatch!.distance).toBeGreaterThan(1800);expect(mismatch!.message).toContain('仍以经纬度计算');
 expect(locationFromAddress(manual,'广州市')).toEqual(manual);expect(locationMismatch(manual,'北京市')).toBeUndefined();expect(locationMismatch(manual,'未知项目')).toBeUndefined();
 expect(locationMismatch({...manual,locationMode:'ignored'},'广州')).toBeUndefined();expect(LOCATION_DISTANCE_WARNING_KM).toBe(200);
 expect(locationMismatch({...manual,latitude:40.1},'北京')).toBeUndefined();
});
it('球面距离在日期变更线及对跖点有限，不以角度差直接代替距离',()=>{
 expect(coordinateDistance({latitude:0,longitude:179},{latitude:0,longitude:-179})).toBeCloseTo(222.39,1);
 expect(coordinateDistance({latitude:0,longitude:0},{latitude:0,longitude:180})).toBeCloseTo(20015.09,1);
 expect(coordinateDistance(manual,manual)).toBe(0);
});
it('平屋面、双坡气楼/障碍物明确警告；纯禁布区不当作遮光物',()=>{
 const flat=newRoof('平顶楼');const gable={...newRoof('双坡厂房'),pitch:{kind:'gable' as const,axis:'z' as const,high:1 as const,percent:10,eave:6},obstacles:[obstacle]};
 for(const r of [flat,gable])for(const mode of ['unresolved','ignored'] as const){const notice=shadowNotice({...manual,locationMode:mode},[r]);expect(notice!.title).toBe('未完成阴影校核');expect(notice!.text).toContain(r.name);}
 expect(shadowNotice({...manual,locationMode:'ignored'},[{...gable,obstacles:[{...obstacle,kind:'keepout',height:0}]}])).toBeUndefined();
 expect(shadowNotice({...manual,locationMode:'ignored'},[{...gable,obstacles:[]}])).toBeUndefined();
 expect(shadowNotice({...manual,locationMode:'ignored'},[])).toBeUndefined();
});
it('完成有效校核后警告消失，新增障碍物、改变纬度、极夜及旧布置均提醒',()=>{
 const r=newRoof('平顶楼');r.layoutOptions={...r.layoutOptions,shadowLatitude:manual.latitude,shadowIgnored:false};r.layoutSignature=layoutSignatureFor(r,.5);
 expect(shadowNotice(manual,[r])).toBeUndefined();
 expect(shadowNotice(manual,[{...r,obstacles:[obstacle]}])!.text).toContain('需要更新');
 expect(shadowNotice({...manual,latitude:23},[r])).toBeDefined();
 expect(shadowNotice({...manual,latitude:80},[r])!.text).toContain('无有效日照');
 expect(shadowNotice(manual,[{...r,layoutSignature:''}])).toBeDefined();
});
it('有效0经纬度和南半球可保存，越界、填反和不完整数据拒绝，不修改原坐标',()=>{
 for(const p of [{latitude:0,longitude:0},{latitude:-33.86,longitude:151.2}])expect(validSunSettings({...manual,...p})).toBe(true);
 for(const p of [{latitude:116,longitude:39},{latitude:91},{longitude:181},{latitude:NaN},{longitude:undefined},{latitude:''}])expect(validSunSettings({...manual,...p})).toBe(false);
 const r=newRoof();const p={version:3,name:'北京项目',address:'广州市',sunSettings:manual,roofs:[r],activeId:r.id,solarHour:11,backgroundColor:'#ffffff',groundColor:'#ffffff'};
 const reopened=parseWorkspace(JSON.stringify(p));expect(reopened.sunSettings).toEqual(manual);expect(locationMismatch(reopened.sunSettings!,reopened.address!)!.city).toBe('广州');
 expect(()=>parseWorkspace(JSON.stringify({...p,sunSettings:{...manual,latitude:116}}))).toThrow();expect(matchCity('北京市上海市')).toBeUndefined();
});