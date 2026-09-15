// Beijing representative latitude, winter-solstice declination, true solar time.
// Coordinates: X east, Y up, Z south. Geometric sun (no refraction).
const radians = (v: number) => v * Math.PI / 180;
export function winterSun(hour: number) {
  const lat = radians(39.9), dec = radians(-23.44), h = radians((hour - 12) * 15);
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
export function recommendedGap(length: number, tilt: number, azimuth: number) {
  const yaw = radians(180 - azimuth);
  const ratio = Math.abs(Math.sin(yaw)) * shadowRatios.east + Math.abs(Math.cos(yaw)) * shadowRatios.north;
  // Conservative for any azimuth; round upwards to centimetres.
  return Math.ceil(length * Math.sin(radians(tilt)) * ratio * 100) / 100;
}
