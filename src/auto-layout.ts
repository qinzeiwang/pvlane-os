import {validLayoutOptions} from './layout-validation';
import {polygonContains,validOutline,type Footprint} from './polygon';
import {buildingContext} from './building-top';
import { standardPitchedLayout } from './standard-pitched-layout';
import { type RoofPitch } from './pitched-roof';
import { recommendedGap,winterRays } from './solar';
import { shadowZones, hitsShadow } from './shadow-zones';
import { corners, outsideRoof, geometry, initial, overlaps, defaultModule, validModule, type ModuleSpec, type Obstacle, type PVArray } from './domain';

export type LayoutOptions = {
  shadowLatitude?:number;
  shadowIgnored?:boolean;
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
  const recommended = recommendedGap(slopeLength, options.tilt, ((180+90*layoutDirection(options))%360) - (options.roofYaw ?? 0)*180/Math.PI,options.shadowLatitude);
  const requested = options.rowGap ?? 0;
  const actual = options.spacingMode === 'manual' ? requested : Math.max(requested, recommended);
  return { recommended, actual, shortened: actual < recommended };
}

// Scan whole connected table strips; an obstacle excludes all rows in that strip.
function baseAutoLayout(roof: Footprint, obstacles: Obstacle[], options: LayoutOptions) {
  if(options.pitch)return standardPitchedLayout(roof,obstacles,options);
  if (![roof.width, roof.depth, options.tilt, options.edge, options.gap, options.maxColumns].every(Number.isFinite) || roof.width <= 0 || roof.depth <= 0 || options.edge < 0 || options.gap < 0 || options.tilt < 0 || options.tilt > 60 || !Number.isInteger(options.maxColumns) || options.maxColumns < 1 || options.maxColumns > 100) throw new Error('排布参数无效');
  if(!Number.isFinite(options.roofYaw??0)||!Number.isInteger(options.limit??5000)||(options.limit??5000)<0||(options.limit??5000)>5000)throw new Error('屋面角度或项目数量上限无效');
  const module = options.module ?? defaultModule, rows = options.tableRows ?? 1;
  if (!validModule(module) || !Number.isInteger(rows) || rows < 1 || rows > 3 || !Number.isFinite(options.rowGap ?? 0) || (options.rowGap ?? 0) < 0 || !['solar', 'manual'].includes(options.spacingMode ?? 'solar')) throw new Error('组件或连排规则无效');
  const q=layoutDirection(options);if(!Number.isInteger(q)||q<0||q>3)throw new Error('组件朝向无效');
  const turned=q%2===1,azimuth=(180+90*q)%360,angle=q*Math.PI/2;
  const spacing = tableSpacing(options), rowGap = spacing.actual;
  const forbidden = shadowZones(roof, obstacles, options.wallHeight ?? 0.32, options.roofYaw ?? 0,winterRays(options.shadowLatitude));
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
        if((!roof.outline||polygonContains(roof.outline,corners(candidate),options.edge))&&!obstacles.some(o=>overlaps(candidate,o))&&!forbidden.some(zone=>hitsShadow(candidate,zone)))break;
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

// Child roof panels remain in the owning roof's array list so all reports count them once.
export function autoLayout(roof:Footprint,obstacles:Obstacle[],options:LayoutOptions){
 if(!validLayoutOptions(options))throw new Error('排布规则无效');
 if(!validOutline(roof))throw new Error('屋面轮廓无效');
 if(options.shadowIgnored)throw new Error('必须填写项目地点或经纬度，阴影校核不能跳过');
 for(const o of obstacles)if(o.topLayout&&(!Number.isFinite(o.topLayout.tilt)||o.topLayout.tilt<0||o.topLayout.tilt>60||!Number.isFinite(o.topLayout.edge)||o.topLayout.edge<0||o.topLayout.edge>20))throw new Error("附属建筑顶部参数无效");
 if(roof.outline&&options.pitch)throw new Error("多段线轮廓仅支持平屋面");
 if(options.shadowLatitude!==undefined&&(!Number.isFinite(options.shadowLatitude)||Math.abs(options.shadowLatitude)>90||!winterRays(options.shadowLatitude).length))throw new Error('所在地冬至没有有效日照，需另定校核时段；当前自动校核不适用');
 const result=baseAutoLayout(roof,obstacles,options);
 const arrays=[...result.arrays];let count=result.count,capped=!!result.capped;const limit=options.limit??5000;
 for(const host of obstacles.filter(o=>o.kind!=='keepout'&&o.topLayout?.enabled)){
  if(outsideRoof(host,roof))throw new Error('附属建筑须完整位于所属屋面内');
  const ctx=buildingContext(roof,options.pitch,obstacles,host),top=host.topLayout!;
  if(count>=limit){capped=true;break;}
  const upper=baseAutoLayout(host,ctx.objects,{...options,pitch:undefined,wallHeight:0,tilt:top.tilt,edge:top.edge,tableRows:Math.min(3,options.tableRows??1),roofYaw:(options.roofYaw??0)+host.yaw,limit:limit-count});
  const c=Math.cos(host.yaw),s=Math.sin(host.yaw);
  for(const a of upper.arrays)arrays.push({...a,id:`top-${host.id}-${a.id}`,name:`${host.name} 顶部 ${a.name}`,hostObstacleId:host.id,x:host.x+a.x*c+a.z*s,z:host.z-a.x*s+a.z*c,azimuth:a.azimuth-host.yaw*180/Math.PI,elevation:ctx.height+(a.elevation??0),...(a.surface?{surface:{...a.surface,height:a.surface.height+ctx.height}}:{})});
  count+=upper.count;capped=capped||!!upper.capped;
 }
 return {...result,arrays,count,capped};
}
