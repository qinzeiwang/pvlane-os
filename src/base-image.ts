import type { Point, Obstacle } from './domain';
export type BaseImage = { northAngle?:number; url: string; width: number; height: number; name: string; pdfSource?: string; metersPerPixel?: number; frame?: { x: number; y: number; width: number; height: number } };
export function imageRect(a: Point, b: Point) { return { x: Math.min(a.x,b.x), y: Math.min(a.z,b.z), width: Math.abs(a.x-b.x), height: Math.abs(a.z-b.z) }; }
export function rectToObstacle(r: {x:number;y:number;width:number;height:number}, base: BaseImage): Obstacle {
  if(!base.frame || !base.metersPerPixel) throw new Error('请先标定并圈定屋面');
  const f=base.frame,k=base.metersPerPixel;
  return {id:crypto.randomUUID(),name:'矩形障碍物',x:(r.x+r.width/2-f.x-f.width/2)*k,z:(r.y+r.height/2-f.y-f.height/2)*k,width:r.width*k,depth:r.height*k,yaw:0,height:1};
}
