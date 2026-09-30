import cities from './city-presets.json';
import {defaultSunSettings,type SunSettings} from './sun-position';
export const cityPresets=cities;
/** Match named cities only; a province or an ambiguous address is not a city. */
export function matchCity(address:string){
 const normalized=address.trim().replace(/\s/g,'');
 const matches=cities.filter(c=>new RegExp(c.name+'(?!路|街|大道|镇|村)').test(normalized));
 return matches.length===1?matches[0]:undefined;
}
export function locationFromAddress(value:SunSettings,address:string):SunSettings{
 if(value.locationMode===undefined||value.locationMode==='manual'||value.coordinateSource==='manual')return value;
 const city=matchCity(address);
 if(city)return {...value,latitude:city.latitude,longitude:city.longitude,utcOffset:8,locationMode:'preset',coordinateSource:'preset',locationName:city.name};
 return {...value,locationMode:'unresolved',locationName:undefined};
}
/** Older files may have disabled shadows. Only explicit coordinates/presets can restore calculation. */
export function restoreProjectLocation(value:SunSettings|undefined,address=''):SunSettings{
 const s=value??defaultSunSettings();
 if(s.locationMode!=='ignored')return s.locationMode==='unresolved'?locationFromAddress(s,address):s;
 if(s.coordinateSource==='manual')return {...s,locationMode:'manual'};
 const city=matchCity(address)||((s.coordinateSource==='preset'&&s.locationName)?matchCity(s.locationName):undefined);
 if(city)return {...s,latitude:city.latitude,longitude:city.longitude,locationMode:'preset',coordinateSource:'preset',locationName:city.name,utcOffset:8};
 return {...s,locationMode:'unresolved',coordinateSource:undefined,locationName:undefined};
}
export const locationResolved=(s:SunSettings)=>s.locationMode!=='unresolved'&&s.locationMode!=='ignored';
export const ignoresShadows=(s:SunSettings)=>s.locationMode==='ignored'||s.locationMode==='unresolved';
/** Advisory screening threshold, not a regulatory or city boundary. */
export const LOCATION_DISTANCE_WARNING_KM=200;
export function coordinateDistance(a:{latitude:number;longitude:number},b:{latitude:number;longitude:number}){
 const rad=Math.PI/180,lat=(b.latitude-a.latitude)*rad,lon=(b.longitude-a.longitude)*rad;
 const h=Math.sin(lat/2)**2+Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(lon/2)**2;
 return 6371*2*Math.asin(Math.sqrt(Math.max(0,Math.min(1,h))));
}
export function locationMismatch(s:SunSettings,address:string){
 if(!locationResolved(s))return undefined;
 const city=matchCity(address);if(!city)return undefined;
 const distance=coordinateDistance(s,city);
 return distance>LOCATION_DISTANCE_WARNING_KM?{city:city.name,distance,message:`经纬度与${city.name}参考点相距约 ${Math.round(distance)} km，超过 ${LOCATION_DISTANCE_WARNING_KM} km 提醒阈值。请核对地点、经纬度顺序和正负号；仍以经纬度计算，不自动覆盖。`}:undefined;
}
export function winterShadowFactor(latitude:number){
 const p=latitude*Math.PI/180;
 return (.707*Math.tan(p)+.4338)/(.707-.4338*Math.tan(p));
}
export function locationNote(s:SunSettings){
 if(!locationResolved(s))return '必填：请输入可识别的城市地点，或填写完整经纬度。未收录的地点必须补充经纬度，阴影校核不能跳过。';
 return `${s.locationMode==='preset'?`${s.locationName}城市预设`:'已设经纬度'} · 经度 ${s.longitude.toFixed(4)}°，纬度 ${s.latitude.toFixed(4)}°。${s.locationMode==='preset'?'按城市参考坐标计算阴影，项目精确位置可手动修改。':''}`;
}
