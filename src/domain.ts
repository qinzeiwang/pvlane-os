export type ModuleSpec = { kind?: "standard"; width: number; length: number; power: number; gap: number };
export const defaultModule: ModuleSpec = { kind:"standard", width: 1.134, length: 2.278, power: 550, gap: .02 };
export const validModule = (m: ModuleSpec) => (m.kind===undefined||["standard"].includes(m.kind)) && [m.width,m.length,m.power,m.gap].every(Number.isFinite) && m.width >= .2 && m.width <= 5 && m.length >= .2 && m.length <= 5 && m.power > 0 && m.power <= 2000 && m.gap >= 0 && m.gap <= 2;
export type Params = {
  elevation?:number;
  surface?: { sx:number; sz:number; height:number };
  module?: ModuleSpec;
  x: number;
  z: number;
  rows: number;
  columns: number;
  tilt: number;
  azimuth: number;
  portrait: boolean;
  rowGap?: number;
  // Omitted in legacy projects: those rows retain their independent tilt.
  connectedRows?: boolean;
};
export const initial: Params = {
  x: 0,
  z: 0,
  rows: 3,
  columns: 6,
  tilt: 20,
  azimuth: 180,
  portrait: true,
};
export const rad = (n: number) => (n * Math.PI) / 180;
export function geometry(p: Params) {
  const m = p.module ?? defaultModule;
  const w = p.portrait ? m.width : m.length, l = p.portrait ? m.length : m.width;
  if(p.surface){
    const {sx,sz,height}=p.surface;
    const kx=1/Math.sqrt(1+sx*sx),kz=1/Math.sqrt(1+sz*sz);
    const width=(p.columns*w+(p.columns-1)*m.gap)*kx;
    const depth=(p.rows*l+(p.rows-1)*m.gap)*kz;
    const panels=Array.from({length:p.rows*p.columns},(_,i)=>{
      const x=((i%p.columns)*(w+m.gap)-(p.columns-1)*(w+m.gap)/2)*kx;
      const z=(Math.floor(i/p.columns)*(l+m.gap)-(p.rows-1)*(l+m.gap)/2)*kz;
      return {x,z,y:height+.045+sx*x+sz*z};
    });
    return {w,l,width,depth,panels,yaw:rad(180-p.azimuth),tilt:-Math.atan(sz),roll:Math.atan(sx)};
  }
  const depth = l * Math.cos(rad(p.tilt)),
    width = p.columns * w + (p.columns - 1) * m.gap;
  const slopeLength = p.rows * l + (p.rows - 1) * m.gap;
  const totalDepth = p.connectedRows ? slopeLength * Math.cos(rad(p.tilt)) : p.rows * depth + (p.rows - 1) * (p.rowGap ?? 1);
  const panels = Array.from({ length: p.rows * p.columns }, (_, i) => ({
    x: (i % p.columns) * (w + m.gap) - (width - w) / 2,
    y: (p.elevation??0) + 0.3 + (p.connectedRows ? slopeLength - Math.floor(i / p.columns) * (l + m.gap) - l / 2 : l / 2) * Math.sin(rad(p.tilt)),
    z: p.connectedRows ? (Math.floor(i / p.columns) * (l + m.gap) + l / 2 - slopeLength / 2) * Math.cos(rad(p.tilt)) : Math.floor(i / p.columns) * (depth + (p.rowGap ?? 1)) - (totalDepth - depth) / 2,
  }));
  return {
    w,
    l,
    width,
    depth: totalDepth,
    panels,
    yaw: rad(180 - p.azimuth),
    tilt: rad(p.tilt),
    roll: 0,
  };
}
export function valid(p: Params) {
  return (
    [p.x, p.z, p.rows, p.columns, p.tilt, p.azimuth].every(Number.isFinite) &&
    ((p as unknown as {mounting?:unknown}).mounting===undefined) &&
    (!p.surface || [p.surface.sx,p.surface.sz,p.surface.height].every(Number.isFinite) && Math.abs(p.surface.sx)<=1 && Math.abs(p.surface.sz)<=1) &&
    typeof p.portrait === "boolean" &&
    (p.connectedRows === undefined || typeof p.connectedRows === 'boolean') &&
    (!p.module || validModule(p.module)) &&
    Number.isInteger(p.rows) &&
    Number.isInteger(p.columns) &&
    (p.rowGap === undefined || (Number.isFinite(p.rowGap) && p.rowGap >= 0)) &&
    p.rows > 0 &&
    p.columns > 0 &&
    p.rows * p.columns <= 5000 &&
    p.tilt >= 0 &&
    p.tilt <= 60
  );
}
export type PVArray = Params & { id: string; name: string };
export type Point = { x: number; z: number };
export type Rect = Point & { width: number; depth: number; yaw: number };
export type Obstacle = Rect & { kind?:"obstacle"|"keepout"; baseHeight?:number; id: string; name: string; height: number };
export const roof = { width: 30, depth: 20 };
export const obstacles: Obstacle[] = [
  {
    id: "equipment",
    name: "设备基础",
    x: 8,
    z: -5,
    width: 4,
    depth: 3,
    yaw: 0,
    height: 2,
  },
  {
    id: "skylight",
    name: "天窗",
    x: -9,
    z: 5,
    width: 3,
    depth: 2,
    yaw: rad(-20),
    height: 0.6,
  },
];
export const defaultArrays = (): PVArray[] => [
  { ...initial, rowGap: 2.32, id: "array-1", name: "阵列 01", x: -5, z: -2 },
  { ...initial, rowGap: 2.32, id: "array-2", name: "阵列 02", x: 5, z: 3 },
];
export function footprint(p: Params): Rect {
  const g = geometry(p);
  return { x: p.x, z: p.z, width: g.width, depth: g.depth, yaw: g.yaw };
}
export function corners(r: Rect): Point[] {
  const c = Math.cos(r.yaw),
    s = Math.sin(r.yaw);
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([a, b]) => {
    const x = (a * r.width) / 2,
      z = (b * r.depth) / 2;
    return { x: r.x + x * c + z * s, z: r.z - x * s + z * c };
  });
}
const EPS = 1e-7; // metres; touching edges are allowed, not positive-area overlap.
export function overlaps(a: Rect, b: Rect): boolean {
  const ac = corners(a),
    bc = corners(b);
  for (const r of [a, b])
    for (const axis of [
      { x: Math.cos(r.yaw), z: -Math.sin(r.yaw) },
      { x: Math.sin(r.yaw), z: Math.cos(r.yaw) },
    ]) {
      const ap = ac.map((p) => p.x * axis.x + p.z * axis.z),
        bp = bc.map((p) => p.x * axis.x + p.z * axis.z);
      if (
        Math.min(Math.max(...ap), Math.max(...bp)) -
          Math.max(Math.min(...ap), Math.min(...bp)) <=
        EPS
      )
        return false;
    }
  return true;
}
export const outsideRoof = (r: Rect, boundary = roof) =>
  corners(r).some(
    (p) =>
      Math.abs(p.x) > boundary.width / 2 + EPS ||
      Math.abs(p.z) > boundary.depth / 2 + EPS,
  );
export type Issue = {
  kind: "boundary" | "array" | "obstacle";
  ids: string[];
  text: string;
};
export function detect(
  arrays: PVArray[],
  objects: Obstacle[] = obstacles,
  boundary = roof,
): Issue[] {
  const rects = arrays.map(footprint),
    issues: Issue[] = [];
  arrays.forEach((a, i) => {
    if (outsideRoof(rects[i], boundary))
      issues.push({
        kind: "boundary",
        ids: [a.id],
        text: `${a.name} 超出屋面边界`,
      });
    objects.forEach((o) => {
      if (overlaps(rects[i], o))
        issues.push({
          kind: "obstacle",
          ids: [a.id, o.id],
          text: `${a.name} 与${o.name}占地重叠`,
        });
    });
    for (let j = i + 1; j < arrays.length; j++)
      if (overlaps(rects[i], rects[j]))
        issues.push({
          kind: "array",
          ids: [a.id, arrays[j].id],
          text: `${a.name} 与${arrays[j].name}占地重叠`,
        });
  });
  return issues;
}
export function copyArray(a: PVArray, id: string, name: string): PVArray {
  return { ...a, id, name, x: a.x + 1 };
}
export type Mode = "top" | "3d";
export type SceneSite = Rect & {markerPitch?:import("./pitched-roof").RoofPitch;id:string;name:string;wallHeight:number;flatHeight?:number; pitch?:import("./pitched-roof").RoofPitch};
export type ViewProps = {
  onCaptureReady?:(capture:(()=>string)|null)=>void;
  onDrawingView?:(v:{x:number;y:number;width:number;height:number;viewportHeight?:number})=>void;
  restoreDrawingView?:{x:number;y:number;width:number;height:number;viewportHeight?:number};
  sites?: SceneSite[];
  focus?: Point;
  imageOverlays?:import('./image-overlays').ImageOverlay[];
  editingOverlay?:boolean;selectedOverlayId?:string|null;
  baseImage?: import("./base-image").BaseImage;
  wallHeight?: number;
  solarHour?: number;
  shadowZones?: import("./shadow-zones").ShadowZone[];
  showShadows?: boolean;
  roof?: typeof roof;
  obstacles?: Obstacle[];
  visual?: import("./render-options").VisualOptions;
  arrays: PVArray[];
  selectedId: string | null;
  selectedObjectId?:string|null;
  editingObject?:boolean;
  selectedSiteId?:string;
  showPitchMarker?:boolean;
  layoutMarker?:import('./layout-direction').LayoutMarker;
  onEditObject?:(id:string)=>void;
  onObjectMenu?:(id:string,x:number,y:number)=>void;
  issues: Issue[];
  mode: Mode;
  navigationMode?:'select'|'pan';
  viewCommand?:{id:number;factor:number};
  onSelect: (id: string | null) => void;
  onMove: (id: string, x: number, z: number) => void;
  reset: number;
};
export const viewStart = (aspect: number) => ({
  x: 0,
  z: 0,
  span: Math.max(28, 36 / aspect),
  distance: Math.max(43, 34 / aspect),
  yaw: 0.65,
  pitch: 0.85,
});
export type CameraView = ReturnType<typeof viewStart>;
export const orbitPosition = (v: CameraView) => ({
  x: v.x + v.distance * Math.cos(v.pitch) * Math.sin(v.yaw),
  y: v.distance * Math.sin(v.pitch),
  z: v.z + v.distance * Math.cos(v.pitch) * Math.cos(v.yaw),
});
export function orbit(v: CameraView, dx: number, dy: number) {
  v.yaw -= dx * 0.006;
  v.pitch = Math.max(0.12, Math.min(1.48, v.pitch + dy * 0.006));
}
export function zoomView(v: CameraView, f: number) {
  v.span = Math.max(5, Math.min(2000, v.span * f));
  v.distance = Math.max(8, Math.min(3000, v.distance * f));
}
// Fixed north-up orthographic view. Engine adapters supply ray/roof intersections.
export function bindPointer(
  canvas: HTMLCanvasElement,
  api: {
    point: (x: number, y: number) => { x: number; z: number } | null;
    hit: (x: number, y: number) => string | null;
    position: (id: string) => Point;
    select: (id: string | null) => void;
    move: (id: string, x: number, z: number) => void;
    mode: () => Mode;
    panMode?:()=>boolean;
    orbit: (dx: number, dy: number) => void;
    pan: (x: number, z: number) => void;
    zoom: (factor: number) => void;
    edit?:(id:string)=>void;
    context?:(id:string,x:number,y:number)=>void;
  },
) {
  let drag: {
    id: number;
    kind: "move" | "pan" | "orbit";
    arrayId: string | null;
    mouse: Point;
    mode: Mode;
    start: { x: number; z: number };
    origin: { x: number; z: number };
  } | null = null;
  const end = () => {
    if (drag && canvas.hasPointerCapture(drag.id))
      canvas.releasePointerCapture(drag.id);
    drag = null;
    canvas.style.cursor = "grab";
  };
  const down = (e: PointerEvent) => {
    if (drag || ![0, 1].includes(e.button)) return;
    const kind =
      e.button === 1 || api.panMode?.() ? "pan" : api.mode() === "3d" ? "orbit" : "move";
    const p = api.point(e.clientX, e.clientY);
    if (!p && kind !== "orbit") return;
    const arrayId = kind === "move" ? api.hit(e.clientX, e.clientY) : null;
    if (kind === "move") {
      api.select(arrayId);
      if (!arrayId) return;
    }
    e.preventDefault();
    drag = {
      id: e.pointerId,
      kind,
      arrayId,
      mode: api.mode(),
      mouse: { x: e.clientX, z: e.clientY },
      start: p ?? { x: 0, z: 0 },
      origin: arrayId ? api.position(arrayId) : { x: 0, z: 0 },
    };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = "grabbing";
  };
  const move = (e: PointerEvent) => {
    if (!drag || drag.id !== e.pointerId) return;
    if (drag.mode !== api.mode()) {
      end();
      return;
    }
    if (drag.kind === "orbit") {
      api.orbit(e.clientX - drag.mouse.x, e.clientY - drag.mouse.z);
      drag.mouse = { x: e.clientX, z: e.clientY };
      return;
    }
    const p = api.point(e.clientX, e.clientY);
    if (!p) return;
    if (drag.kind === "move")
      api.move(
        drag.arrayId!,
        drag.origin.x + p.x - drag.start.x,
        drag.origin.z + p.z - drag.start.z,
      );
    else api.pan(drag.start.x - p.x, drag.start.z - p.z);
  };
  const wheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!drag)
      api.zoom(Math.exp(Math.max(-200, Math.min(200, e.deltaY)) * 0.001));
  };
  const context = (e: MouseEvent) => {e.preventDefault();if(api.mode()==='top'){const id=api.hit(e.clientX,e.clientY);if(id)api.context?.(id,e.clientX,e.clientY);}};
  const doubleClick=(e:MouseEvent)=>{if(api.mode()==='top'){const id=api.hit(e.clientX,e.clientY);if(id&&!id.startsWith('@p/')&&!id.startsWith('@d/')&&!id.startsWith('@i/')){end();api.edit?.(id);}}};
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  canvas.addEventListener("lostpointercapture", end);
  canvas.addEventListener("wheel", wheel, { passive: false });
  canvas.addEventListener("contextmenu", context);
  canvas.addEventListener('dblclick',doubleClick);
  window.addEventListener("blur", end);
  return Object.assign(
    () => {
      end();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", end);
      canvas.removeEventListener("pointercancel", end);
      canvas.removeEventListener("lostpointercapture", end);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("contextmenu", context);
      canvas.removeEventListener('dblclick',doubleClick);
      window.removeEventListener("blur", end);
    },
    { cancel: end },
  );
}
