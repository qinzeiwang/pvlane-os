import { describe, it, expect } from "vitest";
import { Vector3 as TV, Matrix4 as TM } from "three";
import {
  Vector3 as BV,
  Matrix as BM,
  Quaternion as BQ,
} from "@babylonjs/core/Maths/math.vector";
import { geometry, initial, rad, corners, footprint } from "./domain";
describe("两引擎实际矩阵与业务坐标一致", () => {
  it.each([0, 90, 180, 225, 270])(
    "方位 %s° / 多倾角：法线、下缘和占地",
    (azimuth) => {
      for (const tilt of [0, 20, 60]) {
        const a = { ...initial, x: 3, z: -4, azimuth, tilt },
          g = geometry(a),
          tTilt = new TM().makeRotationX(g.tilt),
          tYaw = new TM().makeRotationY(g.yaw);
        const bTilt = BM.Identity(),
          bYaw = BM.Identity();
        BQ.RotationAxis(BV.Right(), g.tilt).toRotationMatrix(bTilt);
        BQ.RotationAxis(BV.Up(), g.yaw).toRotationMatrix(bYaw);
        const tn = new TV(0, 1, 0).applyMatrix4(tTilt).applyMatrix4(tYaw),
          bn = BV.TransformNormal(BV.TransformNormal(BV.Up(), bTilt), bYaw);
        expect(tn.x).toBeCloseTo(Math.sin(rad(azimuth)) * Math.sin(g.tilt));
        expect(tn.z).toBeCloseTo(-Math.cos(rad(azimuth)) * Math.sin(g.tilt));
        expect(bn.x).toBeCloseTo(tn.x);
        expect(bn.y).toBeCloseTo(tn.y);
        expect(bn.z).toBeCloseTo(tn.z);
        const points: { x: number; z: number }[] = [];
        for (const panel of g.panels)
          for (const x of [-g.w / 2, g.w / 2])
            for (const z of [-g.l / 2, g.l / 2]) {
              const t = new TV(x, 0, z)
                .applyMatrix4(tTilt)
                .add(new TV(panel.x, panel.y, panel.z))
                .applyMatrix4(tYaw)
                .add(new TV(a.x, 0, a.z));
              const b = BV.TransformCoordinates(
                BV.TransformCoordinates(new BV(x, 0, z), bTilt).add(
                  new BV(panel.x, panel.y, panel.z),
                ),
                bYaw,
              ).add(new BV(a.x, 0, a.z));
              expect(b.x).toBeCloseTo(t.x, 5);
              expect(b.y).toBeCloseTo(t.y, 5);
              expect(b.z).toBeCloseTo(t.z, 5);
              if (z > 0) expect(t.y).toBeCloseTo(0.3);
              points.push(t);
            }
        const border = corners(footprint(a));
        for (const key of ["x", "z"] as const) {
          expect(Math.max(...points.map((p) => p[key]))).toBeCloseTo(
            Math.max(...border.map((p) => p[key])),
          );
          expect(Math.min(...points.map((p) => p[key]))).toBeCloseTo(
            Math.min(...border.map((p) => p[key])),
          );
        }
      }
    },
  );
});
