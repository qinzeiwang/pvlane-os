import type { Point, Obstacle } from './domain';
export type BaseImage = { blank?:boolean; northAngle?:number; url: string; width: number; height: number; name: string; pdfSource?: string; metersPerPixel?: number; frame?: { x: number; y: number; width: number; height: number } };
const transparentPixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
export function blankDrawing():BaseImage{return {blank:true,url:transparentPixel,name:'无底图画布',width:10000,height:10000,metersPerPixel:.25,northAngle:0};}
export function blankDrawingInitialView(base:BaseImage){
  const k=base.metersPerPixel??.25,width=200/k,height=100/k;
  return {x:(base.width-width)/2,y:(base.height-height)/2,width,height};
}
export function imageRect(a: Point, b: Point) { return { x: Math.min(a.x,b.x), y: Math.min(a.z,b.z), width: Math.abs(a.x-b.x), height: Math.abs(a.z-b.z) }; }
export function rectToObstacle(r: {x:number;y:number;width:number;height:number}, base: BaseImage): Obstacle {
  if(!base.frame || !base.metersPerPixel) throw new Error('请先标定并圈定屋面');
  const f=base.frame,k=base.metersPerPixel;
  return {id:crypto.randomUUID(),name:'矩形障碍物',x:(r.x+r.width/2-f.x-f.width/2)*k,z:(r.y+r.height/2-f.y-f.height/2)*k,width:r.width*k,depth:r.height*k,yaw:0,height:1};
}
