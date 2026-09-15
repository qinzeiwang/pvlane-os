import { describe, it, expect } from "vitest";
import {
  overlaps,
  outsideRoof,
  detect,
  defaultArrays,
  footprint,
  copyArray,
  corners,
  rad,
  obstacles,
  type Rect,
} from "./domain";
const rect = (x = 0, z = 0, width = 2, depth = 2, yaw = 0): Rect => ({
  x,
  z,
  width,
  depth,
  yaw,
});
describe("旋转矩形平面检测", () => {
  it("分离、交叉、完全包含；与顺序无关", () => {
    const a = rect();
    for (const [b, expected] of [
      [rect(3), false],
      [rect(1), true],
      [rect(0, 0, 0.5, 0.5), true],
    ] as const) {
      expect(overlaps(a, b)).toBe(expected);
      expect(overlaps(b, a)).toBe(expected);
    }
  });
  it("边接触/角接触允许，微量实际侵入报警", () => {
    expect(overlaps(rect(), rect(2))).toBe(false);
    expect(overlaps(rect(), rect(2, 2))).toBe(false);
    expect(overlaps(rect(), rect(1.999))).toBe(true);
  });
  it("排除轴对齐外包框的假阳性", () => {
    const a = rect(0, 0, 6, 0.4, rad(45)),
      b = rect(0.6, 0.6, 6, 0.4, rad(45));
    const ac = corners(a),
      bc = corners(b);
    expect(Math.max(...ac.map((p) => p.x))).toBeGreaterThan(
      Math.min(...bc.map((p) => p.x)),
    );
    expect(Math.max(...ac.map((p) => p.z))).toBeGreaterThan(
      Math.min(...bc.map((p) => p.z)),
    );
    expect(overlaps(a, b)).toBe(false);
  });
  it("旋转交叉与旋转边界", () => {
    expect(
      overlaps(rect(0, 0, 6, 0.4, rad(45)), rect(0, 0, 6, 0.4, rad(-45))),
    ).toBe(true);
    expect(outsideRoof(rect(13.7, 0, 2, 2))).toBe(false);
    expect(outsideRoof(rect(13.7, 0, 2, 2, rad(45)))).toBe(true);
  });
  it.each([
    [14, 0],
    [0, 9],
    [-14, 0],
    [0, -9],
  ])("贴边允许，中心 %s,%s", (x, z) => {
    expect(outsideRoof(rect(x, z))).toBe(false);
    expect(
      outsideRoof(
        rect(
          x ? x + Math.sign(x) * 0.001 : 0,
          z ? z + Math.sign(z) * 0.001 : 0,
        ),
      ),
    ).toBe(true);
  });
  it("默认两阵列和障碍物均无冲突", () => {
    expect(detect(defaultArrays())).toEqual([]);
  });
  it("复制件独立且产生预期相互重叠", () => {
    const [a] = defaultArrays(),
      b = copyArray(a, "copy", "复制件");
    b.tilt = 60;
    expect(a.tilt).toBe(20);
    const issues = detect([a, b], []);
    expect(issues).toHaveLength(1);
    expect(issues[0].kind).toBe("array");
    expect(issues[0].ids).toEqual([a.id, b.id]);
  });
  it.each(obstacles)("检测 $name 障碍物，与高度无关", (o) => {
    const [a] = defaultArrays();
    a.x = o.x;
    a.z = o.z;
    expect(
      detect([a]).some((i) => i.kind === "obstacle" && i.ids.includes(o.id)),
    ).toBe(true);
    expect(
      detect([a], [{ ...o, height: 0 }]).some((i) => i.kind === "obstacle"),
    ).toBe(true);
  });
  it("旋转和参数变化立即影响占地，包含排间空地", () => {
    const [a] = defaultArrays();
    a.x = 0;
    a.z = 0;
    const r = footprint(a);
    expect(overlaps(r, rect(0, -0.5, 0.1, 0.1))).toBe(true);
    a.azimuth = 90;
    const c = corners(footprint(a));
    expect(Math.max(...c.map((p) => p.x))).toBeCloseTo(r.depth / 2);
  });
  it("越界与障碍物可同时报告；移开后清除", () => {
    const [a] = defaultArrays();
    a.x = 14;
    a.z = -5;
    expect(detect([a]).some((i) => i.kind === "boundary")).toBe(true);
    a.x = 8;
    expect(detect([a]).some((i) => i.kind === "obstacle")).toBe(true);
    expect(detect(defaultArrays())).toHaveLength(0);
  });
});
