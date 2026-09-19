import { corners, type Obstacle, type Rect, type Point } from './domain';
import { winterSun } from './solar';
export type ShadowZone = { id: string; name: string; points: Point[]; elevation?:number; topOnly?:boolean };
export function parapets(roof: { width: number; depth: number }, height: number): Obstacle[] {
  if(height<=0)return [];
  return [
    [0, -roof.depth / 2 + .1, roof.width, .2],
    [0, roof.depth / 2 - .1, roof.width, .2],
    [-roof.width / 2 + .1, 0, .2, roof.depth - .4],
    [roof.width / 2 - .1, 0, .2, roof.depth - .4],
  ].map(([x, z, width, depth], i) => ({ id: `wall-${i}`, name: ['北女儿墙','南女儿墙','西女儿墙','东女儿墙'][i], x, z, width, depth, yaw: 0, height }));
}
const EPS = 1e-8;
const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
export function convexHull(points: Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.z - b.z).filter((p, i, all) => !i || Math.abs(p.x - all[i - 1].x) > EPS || Math.abs(p.z - all[i - 1].z) > EPS);
  if (sorted.length < 3) return sorted;
  const half = (list: Point[]) => {
    const result: Point[] = [];
    for (const p of list) {
      while (result.length >= 2 && cross(result[result.length - 2], result[result.length - 1], p) <= EPS) result.pop();
      result.push(p);
    }
    return result.slice(0, -1);
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}
export function insideConvex(p: Point, points: Point[]) {
  return points.length >= 3 && points.every((a, i) => cross(a, points[(i + 1) % points.length], p) >= -EPS);
}
// Sutherland-Hodgman clipping; clipping a convex hull retains convexity.
export function clipRoof(points: Point[], roof: { width: number; depth: number }) {
  for (const [axis, sign, bound] of [['x', 1, roof.width / 2], ['x', -1, roof.width / 2], ['z', 1, roof.depth / 2], ['z', -1, roof.depth / 2]] as const) {
    const result: Point[] = [];
    points.forEach((a, i) => {
      const b = points[(i + 1) % points.length], da = bound - sign * a[axis], db = bound - sign * b[axis];
      if (da >= 0) result.push(a);
      if ((da >= 0) !== (db >= 0)) {
        const t = da / (da - db);
        result.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
      }
    });
    points = result;
  }
  return convexHull(points);
}
export function hitsShadow(rect: Rect, zone: ShadowZone) {
  const a = corners(rect), b = zone.points;
  if (b.length < 3) return false;
  for (const poly of [a, b]) for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const length = Math.hypot(q.x - p.x, q.z - p.z);
    if (length < EPS) continue;
    const nx = -(q.z - p.z) / length, nz = (q.x - p.x) / length;
    const ap = a.map(v => v.x * nx + v.z * nz), bp = b.map(v => v.x * nx + v.z * nz);
    if (Math.min(Math.max(...ap), Math.max(...bp)) - Math.max(Math.min(...ap), Math.min(...bp)) <= EPS) return false;
  }
  return true;
}
export function shadowZones(roof: { width: number; depth: number }, objects: Obstacle[], wallHeight: number, roofYaw = 0): ShadowZone[] {
  return [...objects.filter(o=>o.kind!=="keepout"), ...parapets(roof, wallHeight)].flatMap(o => {
    const base = corners(o);
    const projected = [9, 15].flatMap(hour => {
      const worldSun = winterSun(hour), c=Math.cos(roofYaw), s=Math.sin(roofYaw);
      const sun={x:worldSun.x*c-worldSun.z*s,y:worldSun.y,z:worldSun.x*s+worldSun.z*c};
      return base.map(p => ({ x: p.x - o.height * sun.x / sun.y, z: p.z - o.height * sun.z / sun.y }));
    });
    // Endpoint top-corner projections plus original footprint form the sector-like hull.
    // Valid for the fixed Beijing winter interval; intermediate rays lie in this hull.
    const points = clipRoof(convexHull([...base, ...projected]), roof);
    if (points.length < 3) return [];
    return [{ id: `shadow-${o.id}`, name: `${o.name}时段阴影包络`, points }];
  });
}
