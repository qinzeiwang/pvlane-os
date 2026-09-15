import { standardPitchedLayout } from './standard-pitched-layout';
import { validLayoutOptions } from './layout-validation';
import { type RoofPitch } from './pitched-roof';
import { recommendedGap } from './solar';
import { shadowZones, hitsShadow } from './shadow-zones';
import { geometry, initial, overlaps, defaultModule, validModule, type ModuleSpec, type Obstacle, type PVArray } from './domain';

export type LayoutOptions = {
  pitch?: RoofPitch;
  direction?: number; portrait: boolean; tilt: number; edge: number; gap: number; maxColumns: number;
  roofYaw?: number; limit?: number; wallHeight?: number; module?: ModuleSpec; tableRows?: number;
  spacingMode?: 'solar' | 'manual'; rowGap?: number;
  // Legacy file fields, unused by the connected-table layout.
  maxRows?: number; arrayGapY?: number;
};
export const layoutDirection=(o:Pick<LayoutOptions,'direction'|'portrait'>)=>o.direction??(o.portrait?0:1);
export function tableSpacing(options: LayoutOptions) {
  const module = options.module ?? defaultModule;
  const rows = options.tableRows ?? 1;
  const slopeLength = rows * module.length + (rows - 1) * module.gap;
  const recommended = recommendedGap(slopeLength, options.tilt, ((180+90*layoutDirection(options))%360) - (options.roofYaw ?? 0)*180/Math.PI);
  const requested = options.rowGap ?? 0;
  const actual = options.spacingMode === 'manual' ? requested : Math.max(requested, recommended);
  return { recommended, actual, shortened: actual < recommended };
}

// Scan whole connected table strips; an obstacle excludes all rows in that strip.
export function autoLayout(roof: { width: number; depth: number }, obstacles: Obstacle[], options: LayoutOptions) {
  if(!validLayoutOptions(options))throw new Error('排布规则无效：倾角 0–60°、边距和左右通道 0–20 m、前后间距 0–100 m');
  if(options.pitch)return standardPitchedLayout(roof,obstacles,options);
  if (![roof.width, roof.depth, options.tilt, options.edge, options.gap, options.maxColumns].every(Number.isFinite) || roof.width <= 0 || roof.depth <= 0 || options.edge < 0 || options.gap < 0 || options.tilt < 0 || options.tilt > 60 || !Number.isInteger(options.maxColumns) || options.maxColumns < 1 || options.maxColumns > 100) throw new Error('排布参数无效');
  if(!Number.isFinite(options.roofYaw??0)||!Number.isInteger(options.limit??5000)||(options.limit??5000)<0||(options.limit??5000)>5000)throw new Error('屋面角度或项目数量上限无效');
  const module = options.module ?? defaultModule, rows = options.tableRows ?? 1;
  if (!validModule(module) || !Number.isInteger(rows) || rows < 1 || rows > 3 || !Number.isFinite(options.rowGap ?? 0) || (options.rowGap ?? 0) < 0 || !['solar', 'manual'].includes(options.spacingMode ?? 'solar')) throw new Error('组件或连排规则无效');
  const q=layoutDirection(options);if(!Number.isInteger(q)||q<0||q>3)throw new Error('组件朝向无效');
  const turned=q%2===1,azimuth=(180+90*q)%360,angle=q*Math.PI/2;
  const spacing = tableSpacing(options), rowGap = spacing.actual;
  const forbidden = shadowZones(roof, obstacles, options.wallHeight ?? 0.32, options.roofYaw ?? 0);
  const localRoof = turned ? { width: roof.depth, depth: roof.width } : roof;
  const local = (x: number, z: number) => ({x:x*Math.cos(angle)-z*Math.sin(angle),z:x*Math.sin(angle)+z*Math.cos(angle)});
  const template = { ...initial, module, rows, connectedRows: true, columns: 1, portrait: true, tilt: options.tilt, azimuth, rowGap };
  const arrays: PVArray[] = [];
  let count = 0;
  const right = localRoof.width / 2 - options.edge, bottom = localRoof.depth / 2 - options.edge;
  for (let top = -localRoof.depth / 2 + options.edge; top < bottom;) {
    let bandRows=rows;
    while(bandRows>0&&top+geometry({...template,rows:bandRows}).depth>bottom+1e-7)bandRows--;
    if(!bandRows)break;
    const bandTemplate={...template,rows:bandRows},g=geometry(bandTemplate),z=top+g.depth/2;
    top+=g.depth+rowGap;
    let run: number[] = [],runRows=bandRows,runZ=z;
    const flush = () => {
      if (!run.length) return;
      arrays.push({ ...bandTemplate, rows:runRows, id: `auto-${arrays.length + 1}`, name: `阵列 ${arrays.length + 1}`, ...local((run[0] + run[run.length - 1]) / 2, runZ), columns: run.length });
      run = [];
    };
    let column = 0;
    for (let x = -localRoof.width / 2 + options.edge + g.w / 2; x + g.w / 2 <= right + 1e-7;) {
      let chosen=bandRows,chosenZ=z;
      for(;chosen>0;chosen--){
        const depth=geometry({...bandTemplate,rows:chosen}).depth;
        chosenZ=z-g.depth/2+depth/2;
        const candidate={...local(x,chosenZ),width:g.w,depth,yaw:g.yaw};
        if(!obstacles.some(o=>overlaps(candidate,o))&&!forbidden.some(zone=>hitsShadow(candidate,zone)))break;
      }
      if(!chosen)flush();
      else {
        if(count+chosen>(options.limit??5000)){flush();return {arrays,count,rowGap,...spacing,capped:true};}
        if(run.length&&chosen!==runRows)flush();
        runRows=chosen;runZ=chosenZ;run.push(x);count+=chosen;
      }
      column++;
      const endGroup = column % options.maxColumns === 0;
      if (endGroup) flush();
      x += g.w + (endGroup ? options.gap : module.gap);
    }
    flush();
  }
  return { arrays, count, rowGap, ...spacing, capped: false };
}
