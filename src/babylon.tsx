import { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  FreeCamera,
  Camera,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
  Matrix,
  Quaternion,
  type LinesMesh,
} from "@babylonjs/core";
import {
  bindPointer,
  geometry,
  obstacles,
  viewStart,
  orbitPosition,
  orbit,
  zoomView,
  type ViewProps,
} from "./domain";
import {
  outline,
  direction,
  roofGrid,
  centerAxes,
  northArrow,
} from "./visuals";
type Entry = {
  node: TransformNode;
  mat: StandardMaterial;
  outline: LinesMesh;
  arrow: LinesMesh;
  signature: string;
};
type Runtime = { sync: (p: ViewProps) => void; reset: () => void };
export default function BabylonView(props: ViewProps) {
  const canvas = useRef<HTMLCanvasElement>(null),
    runtime = useRef<Runtime | null>(null),
    latest = useRef(props);
  latest.current = props;
  useEffect(() => {
    const el = canvas.current!,
      engine = new Engine(el, true, { stencil: true }, false);
    engine.setHardwareScalingLevel(1);
    const scene = new Scene(engine);
    scene.useRightHandedSystem = true;
    scene.clearColor = Color4.FromHexString("#edf2f5ff");
    const camera = new FreeCamera("view", new Vector3(0, 60, 0), scene);
    camera.minZ = 0.1;
    camera.maxZ = 500;
    camera.fov = Math.PI / 4;
    let view = viewStart(el.clientWidth / Math.max(1, el.clientHeight));
    const fit = () => {
      const aspect = el.clientWidth / Math.max(1, el.clientHeight);
      if (latest.current.mode === "top") {
        camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        camera.orthoLeft = (-view.span * aspect) / 2;
        camera.orthoRight = (view.span * aspect) / 2;
        camera.orthoTop = view.span / 2;
        camera.orthoBottom = -view.span / 2;
        camera.position.set(view.x, 60, view.z);
        camera.upVector.set(0, 0, -1);
      } else {
        camera.mode = Camera.PERSPECTIVE_CAMERA;
        const p = orbitPosition(view);
        camera.position.set(p.x, p.y, p.z);
        camera.upVector.set(0, 1, 0);
      }
      camera.setTarget(new Vector3(view.x, 0, view.z));
      camera.getViewMatrix(true);
      camera.getProjectionMatrix(true);
    };
    fit();
    new HemisphericLight("sky", Vector3.Up(), scene).intensity = 0.75;
    new DirectionalLight("sun", new Vector3(10, -25, 15), scene).intensity =
      0.7;
    const material = (name: string, color: string) => {
      const m = new StandardMaterial(name, scene);
      m.diffuseColor = Color3.FromHexString(color);
      m.specularColor = Color3.Black();
      return m;
    };
    const lines = (
      name: string,
      points: number[],
      color: string,
      segments = false,
    ) => {
      const v: Vector3[] = [];
      for (let i = 0; i < points.length; i += 3)
        v.push(new Vector3(points[i], points[i + 1], points[i + 2]));
      const m = segments
        ? MeshBuilder.CreateLineSystem(
            name,
            {
              lines: Array.from({ length: v.length / 2 }, (_, i) => [
                v[i * 2],
                v[i * 2 + 1],
              ]),
            },
            scene,
          )
        : MeshBuilder.CreateLines(name, { points: v }, scene);
      m.color = Color3.FromHexString(color);
      m.isPickable = false;
      return m;
    };
    const roof = MeshBuilder.CreateBox(
      "roof",
      { width: 30, height: 0.3, depth: 20 },
      scene,
    );
    roof.position.y = -0.15;
    const roofMaterial = material("roof-mat", "#d4dde3");
    roofMaterial.disableLighting = true;
    roofMaterial.emissiveColor = Color3.FromHexString("#d4dde3");
    roof.material = roofMaterial;
    lines("grid", roofGrid, "#bdcbd5", true);
    lines("axes", centerAxes, "#7c98ad", true);
    lines("roof-border", outline(30, 20, 0.02), "#70899b");
    lines("north", northArrow, "#435f71");
    obstacles.forEach((o) => {
      const parent = new TransformNode(o.id, scene);
      parent.position.set(o.x, 0, o.z);
      parent.rotationQuaternion = Quaternion.RotationAxis(Vector3.Up(), o.yaw);
      const box = MeshBuilder.CreateBox(
        o.name,
        { width: o.width, height: o.height, depth: o.depth },
        scene,
      );
      box.parent = parent;
      box.position.y = o.height / 2;
      box.material = material(`${o.id}-mat`, "#c6935b");
      lines(
        `${o.id}-outline`,
        outline(o.width, o.depth, o.height + 0.01),
        "#805422",
      ).parent = parent;
    });
    const entries = new Map<string, Entry>();
    const dispose = (e: Entry) => {
      e.node.dispose();
      e.mat.dispose();
    };
    const sync = (p: ViewProps) => {
      for (const [id, e] of entries)
        if (!p.arrays.some((a) => a.id === id)) {
          dispose(e);
          entries.delete(id);
        }
      for (const a of p.arrays) {
        const signature = [a.rows, a.columns, a.tilt, a.portrait].join("|");
        let e = entries.get(a.id);
        if (!e || e.signature !== signature) {
          if (e) dispose(e);
          const g = geometry(a),
            node = new TransformNode(a.id, scene),
            mat = material(`${a.id}-mat`, "#285f80");
          for (const [i, panel] of g.panels.entries()) {
            const m = MeshBuilder.CreateBox(
              `${a.id}-panel-${i}`,
              { width: g.w, height: 0.035, depth: g.l },
              scene,
            );
            m.parent = node;
            m.position.set(panel.x, panel.y, panel.z);
            m.rotationQuaternion = Quaternion.RotationAxis(
              Vector3.Right(),
              g.tilt,
            );
            m.material = mat;
            m.metadata = { arrayId: a.id };
          }
          const border = lines(
              `${a.id}-outline`,
              outline(g.width, g.depth),
              "#db8b22",
            ),
            arrow = lines(`${a.id}-arrow`, direction(g.depth), "#be7313");
          border.parent = node;
          arrow.parent = node;
          e = { node, mat, outline: border, arrow, signature };
          entries.set(a.id, e);
        }
        e.node.position.set(a.x, 0, a.z);
        e.node.rotationQuaternion = Quaternion.RotationAxis(
          Vector3.Up(),
          Math.PI - (a.azimuth * Math.PI) / 180,
        );
        const conflict = p.issues.some((i) => i.ids.includes(a.id)),
          selected = p.selectedId === a.id,
          color = Color3.FromHexString(
            conflict ? "#bb4c42" : selected ? "#285f80" : "#4b7187",
          );
        e.mat.disableLighting = p.mode === "top";
        e.mat.diffuseColor = color;
        e.mat.emissiveColor = p.mode === "top" ? color : Color3.Black();
        e.outline.setEnabled(selected || conflict);
        e.outline.color = Color3.FromHexString(
          conflict ? "#cc392c" : "#db8b22",
        );
        e.arrow.color = Color3.FromHexString(conflict ? "#cc392c" : "#be7313");
      }
    };
    const reset = () => {
      unbind.cancel();
      view = viewStart(el.clientWidth / Math.max(1, el.clientHeight));
      fit();
    };
    runtime.current = { sync, reset };
    sync(latest.current);
    const coords = (x: number, y: number) => {
      const r = el.getBoundingClientRect();
      return { x: x - r.left, y: y - r.top };
    };
    const unbind = bindPointer(el, {
      mode: () => latest.current.mode,
      point: (x, y) => {
        const s = coords(x, y),
          ray = scene.createPickingRay(s.x, s.y, Matrix.Identity(), camera);
        if (Math.abs(ray.direction.y) < 1e-8) return null;
        const t = -ray.origin.y / ray.direction.y;
        if (t < 0 || !Number.isFinite(t)) return null;
        return {
          x: ray.origin.x + t * ray.direction.x,
          z: ray.origin.z + t * ray.direction.z,
        };
      },
      hit: (x, y) => {
        const s = coords(x, y);
        return scene.pick(s.x, s.y)?.pickedMesh?.metadata?.arrayId ?? null;
      },
      position: (id) => latest.current.arrays.find((a) => a.id === id)!,
      select: (id) => latest.current.onSelect(id),
      move: (id, x, z) => latest.current.onMove(id, x, z),
      pan: (x, z) => {
        view.x += x;
        view.z += z;
        fit();
      },
      orbit: (dx, dy) => {
        orbit(view, dx, dy);
        fit();
      },
      zoom: (f) => {
        zoomView(view, f);
        fit();
      },
    });
    const observer = new ResizeObserver(() => {
      engine.resize();
      fit();
    });
    observer.observe(el);
    engine.runRenderLoop(() => scene.render());
    return () => {
      unbind();
      observer.disconnect();
      runtime.current = null;
      scene.dispose();
      engine.dispose();
    };
  }, []);
  useEffect(() => {
    runtime.current?.sync(props);
  }, [props.arrays, props.selectedId, props.issues, props.mode]);
  useEffect(() => {
    runtime.current?.reset();
  }, [props.mode, props.reset]);
  return <canvas ref={canvas} aria-label="Babylon.js 布置与三维画布" />;
}
