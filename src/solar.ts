// Winter-solstice declination by hemisphere, true solar time; default is legacy Beijing.
// Coordinates: X east, Y up, Z south. Geometric sun (no refraction).
const radians = (v: number) => v * Math.PI / 180;
export function winterSun(hour: number, latitude=39.9) {
  const lat = radians(latitude), dec = radians(latitude<0?23.44:-23.44), h = radians((hour - 12) * 15);
  return {
    x: -Math.cos(dec) * Math.sin(h),
    y: Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(h),
    z: Math.sin(lat) * Math.cos(dec) * Math.cos(h) - Math.cos(lat) * Math.sin(dec),
  };
}
const endpoint = winterSun(9);
// For this fixed latitude/date and interval, |east/up| and south/up are
// bounded by their endpoint values. The rectangular bound also covers noon.
export const shadowRatios = { east: Math.abs(endpoint.x / endpoint.y), north: endpoint.z / endpoint.y };
export type SunRay={x:number;y:number;z:number};
export function winterRays(latitude=39.9):SunRay[]{return Array.from({length:25},(_,i)=>winterSun(9+i/4,latitude)).filter(s=>s.y>1e-6);}
export function recommendedGap(length: number, tilt: number, azimuth: number, latitude?:number) {
  const yaw = radians(180 - azimuth);
  const rays=latitude===undefined?undefined:winterRays(latitude);
  const ratio = rays?Math.max(0,...rays.map(s=>Math.abs((Math.sin(yaw)*s.x+Math.cos(yaw)*s.z)/s.y))):Math.abs(Math.sin(yaw))*shadowRatios.east+Math.abs(Math.cos(yaw))*shadowRatios.north;
  // Conservative for any azimuth; round upwards to centimetres.
  return Math.ceil(length * Math.sin(radians(tilt)) * ratio * 100) / 100;
}
