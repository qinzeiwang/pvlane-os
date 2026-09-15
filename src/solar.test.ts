import { expect, it } from 'vitest';
import { recommendedGap, shadowRatios, winterSun } from './solar';
import { autoLayout } from './auto-layout';
import { corners, footprint, obstacles, overlaps, detect } from './domain';
import { shadowZones, hitsShadow, insideConvex } from './shadow-zones';
const roof = { width: 30, depth: 20 };
const options = { portrait: true, tilt: 20, edge: 0.5, gap: 1, maxColumns: 18 };
it('matches Beijing winter endpoints and bounds intermediate solar directions', () => {
  expect(Math.asin(winterSun(9).y) * 180 / Math.PI).toBeCloseTo(14.0365, 3);
  expect(winterSun(9).x).toBeCloseTo(-winterSun(15).x, 12);
  expect(recommendedGap(2.278, 20, 180)).toBe(2.32);
  for (let t = 9; t <= 15; t += 1 / 60) {
    const s = winterSun(t);
    expect(Math.abs(s.x / s.y)).toBeLessThanOrEqual(shadowRatios.east + 1e-10);
    expect(s.z / s.y).toBeLessThanOrEqual(shadowRatios.north + 1e-10);
  }
});
it('contains obstacle roof projections for the full interval', () => {
  const object = { ...obstacles[0], x: 0, z: 0, height: 1 };
  const zone = shadowZones({ width: 100, depth: 100 }, [object], 0)[0];
  for (let t = 9; t <= 15; t += .05) for (const p of corners(object)) {
    const sun = winterSun(t), x = p.x - sun.x / sun.y, z = p.z - sun.z / sun.y;
    expect(insideConvex({ x, z }, zone.points)).toBe(true);
  }
});
it('rotates full arrays while retaining module orientation and avoids all shadow zones', () => {
  for (const portrait of [true, false]) {
    const result = autoLayout(roof, obstacles, { ...options, portrait });
    const zones = shadowZones(roof, obstacles, .32);
    expect(result.count).toBeGreaterThan(0);
    expect(result.arrays.every(a => a.portrait && a.azimuth === (portrait ? 180 : 270))).toBe(true);
    expect(detect(result.arrays, obstacles, roof)).toEqual([]);
    expect(result.arrays.some(a => zones.some(z => hitsShadow(footprint(a), z)))).toBe(false);
  }
});
it('increasing wall height cannot add panels on the same scan grid', () => {
  const low = autoLayout(roof, [], { ...options, wallHeight: 0 });
  const high = autoLayout(roof, [], { ...options, wallHeight: 2 });
  expect(high.count).toBeLessThan(low.count);
});

it('releases the old bounding-box corners while retaining the fan and original footprint', () => {
  const object = { ...obstacles[0], x: 0, z: 0, width: 2, depth: 2, height: 2, yaw: 0 };
  const zone = shadowZones({ width: 100, depth: 100 }, [object], 0)[0];
  expect(zone.points.length).toBeGreaterThan(4);
  expect(insideConvex({ x: 0, z: 0 }, zone.points)).toBe(true);
  expect(insideConvex({ x: 0, z: -5 }, zone.points)).toBe(true);
  expect(hitsShadow({ x: 5, z: 0, width: .2, depth: .2, yaw: 0 }, zone)).toBe(false);
  expect(hitsShadow({ x: 5, z: -5, width: .2, depth: .2, yaw: 0 }, zone)).toBe(true);
});

it('clips rotated-object shadows to the roof and discards outside shadows', () => {
  const smallRoof = { width: 10, depth: 8 };
  const zones = shadowZones(smallRoof, [{ ...obstacles[0], x: 4, z: 3, height: 5, yaw: .7 }], .32);
  for (const zone of zones) for (const p of zone.points) {
    expect(Math.abs(p.x)).toBeLessThanOrEqual(5 + 1e-8);
    expect(Math.abs(p.z)).toBeLessThanOrEqual(4 + 1e-8);
  }
  expect(shadowZones(smallRoof, [{ ...obstacles[0], x: 1000, z: 1000 }], 0)).toEqual([]);
});
