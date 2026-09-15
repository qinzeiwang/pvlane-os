import { describe, it, expect } from "vitest";
import { geometry, initial, valid, rad } from "./domain";
describe("独立业务几何", () => {
  it("默认数量、容量和净距", () => {
    const g = geometry(initial);
    expect(g.panels).toHaveLength(18);
    expect(g.panels.length * 0.55).toBeCloseTo(9.9);
    expect(g.width).toBeCloseTo(6 * 1.134 + 5 * 0.02);
    expect(g.depth).toBeCloseTo(3 * 2.278 * Math.cos(rad(20)) + 2);
    expect(g.panels[6].z - g.panels[0].z - g.l * Math.cos(g.tilt)).toBeCloseTo(
      1,
    );
  });
  it.each([0, 20, 60])("倾角 %s：每排下缘固定、中心固定", (tilt) => {
    const g = geometry({ ...initial, tilt });
    for (const p of g.panels)
      expect(p.y - (g.l * Math.sin(g.tilt)) / 2).toBeCloseTo(0.3);
    expect(g.panels[0].z + g.panels.at(-1)!.z).toBeCloseTo(0);
    expect(g.panels[0].x + g.panels.at(-1)!.x).toBeCloseTo(0);
  });
  it.each([
    [0, 0, -1],
    [90, 1, 0],
    [180, 0, 1],
    [270, -1, 0],
  ])("方位角 %s 的水平法线", (azimuth, x, z) => {
    const g = geometry({ ...initial, azimuth });
    expect(Math.sin(g.yaw)).toBeCloseTo(x);
    expect(Math.cos(g.yaw)).toBeCloseTo(z);
  });
  it("横装、单片、50 块", () => {
    const single = geometry({
      ...initial,
      rows: 1,
      columns: 1,
      portrait: false,
      tilt: 0,
    });
    expect(single.width).toBe(2.278);
    expect(single.depth).toBe(1.134);
    expect(single.panels[0]).toEqual({ x: 0, y: 0.3, z: 0 });
    expect(
      geometry({ ...initial, rows: 5, columns: 10 }).panels.length * 0.55,
    ).toBeCloseTo(27.5);
  });
  it("拒绝异常参数", () => {
    for (const p of [
      { rows: 0 },
      { columns: 1.5 },
      { tilt: 61 },
      { x: NaN },
      { rows: 100, columns: 100 },
    ])
      expect(valid({ ...initial, ...p })).toBe(false);
  });
});
