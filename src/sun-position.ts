/** Geometric solar position, Meeus/NOAA Julian-century equations (no weather/refraction).
 * https://gml.noaa.gov/grad/solcalc/calcdetails.html
 * Scene coordinates: X east, Y up, Z south, before drawing north rotation.
 */
export type SunSettings={latitude:number;longitude:number;date:string;time:string;utcOffset:number;locationMode?:'preset'|'manual'|'unresolved'|'ignored';locationName?:string;coordinateSource?:'manual'|'preset'};
export function defaultSunSettings():SunSettings{return {latitude:39.75,longitude:116.03,date:new Date(Date.now()+8*3600000).toISOString().slice(0,10),time:'11:00',utcOffset:8,locationMode:'unresolved'};}
export function validSunSettings(v:unknown):v is SunSettings{
 if(!v||typeof v!=='object')return false;
 const s=v as SunSettings;
 if(s.coordinateSource!==undefined&&!['manual','preset'].includes(s.coordinateSource))return false;
 if(s.locationMode!==undefined&&!['preset','manual','unresolved','ignored'].includes(s.locationMode)||s.locationName!==undefined&&typeof s.locationName!=='string')return false;
 if(!Number.isFinite(s.latitude)||Math.abs(s.latitude)>90||!Number.isFinite(s.longitude)||Math.abs(s.longitude)>180||!Number.isFinite(s.utcOffset)||s.utcOffset< -12||s.utcOffset>14||!/^\d{4}-\d{2}-\d{2}$/.test(s.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time))return false;
 const date=new Date(s.date+'T00:00:00Z');
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===s.date&&date.getUTCFullYear()>=1900&&date.getUTCFullYear()<=2100;
}
export function parseSunSettings(v:unknown):SunSettings{
 if(v===undefined)return defaultSunSettings();
 if(!validSunSettings(v))throw new Error('光照地点或日期时间无效');
 return {...v};
}
/** Meeus/NOAA solar coordinates evaluated at the absolute UTC instant.
 * Geometric elevation: atmospheric refraction is intentionally excluded.
 */
export function sunPosition(settings:SunSettings,northAngle=0){
 const s=parseSunSettings(settings),[hour,minute]=s.time.split(':').map(Number);
 const instant=Date.parse(s.date+'T00:00:00Z')+(hour*60+minute-s.utcOffset*60)*60000;
 const t=(instant/86400000+2440587.5-2451545)/36525,rad=Math.PI/180;
 const l=((280.46646+t*(36000.76983+t*.0003032))%360+360)%360;
 const m=357.52911+t*(35999.05029-.0001537*t),e=.016708634-t*(.000042037+.0000001267*t);
 const c=Math.sin(m*rad)*(1.914602-t*(.004817+.000014*t))+Math.sin(2*m*rad)*(.019993-.000101*t)+Math.sin(3*m*rad)*.000289;
 const omega=125.04-1934.136*t,lambda=(l+c-.00569-.00478*Math.sin(omega*rad))*rad;
 const epsilon=(23+(26+(21.448-t*(46.815+t*(.00059-t*.001813)))/60)/60+.00256*Math.cos(omega*rad))*rad;
 const dec=Math.asin(Math.sin(epsilon)*Math.sin(lambda)),v=Math.tan(epsilon/2)**2;
 const eq=4/rad*(v*Math.sin(2*l*rad)-2*e*Math.sin(m*rad)+4*e*v*Math.sin(m*rad)*Math.cos(2*l*rad)-.5*v*v*Math.sin(4*l*rad)-1.25*e*e*Math.sin(2*m*rad));
 const lat=s.latitude*rad,ha=((hour*60+minute+eq+4*s.longitude-60*s.utcOffset)/4-180)*rad;
 const east=-Math.cos(dec)*Math.sin(ha),up=Math.sin(lat)*Math.sin(dec)+Math.cos(lat)*Math.cos(dec)*Math.cos(ha),south=Math.sin(lat)*Math.cos(dec)*Math.cos(ha)-Math.cos(lat)*Math.sin(dec);
 const north=northAngle*rad;
 return {x:east*Math.cos(north)-south*Math.sin(north),y:up,z:east*Math.sin(north)+south*Math.cos(north),elevation:Math.asin(Math.max(-1,Math.min(1,up)))/rad,azimuth:(Math.atan2(east,-south)/rad+360)%360,daylight:up>0};
}
