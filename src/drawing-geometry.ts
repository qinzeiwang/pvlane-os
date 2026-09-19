import { corners, type Point, type Rect } from './domain';
import type { BaseImage } from './base-image';
export function snapAxis(a:Point,b:Point,angleDegrees=2):Point {
 const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d<1e-6)return b;
 const limit=Math.sin(angleDegrees*Math.PI/180);
 if(Math.abs(dz)/d<=limit)return {...b,z:a.z};
 if(Math.abs(dx)/d<=limit)return {...b,x:a.x};
 return b;
}
export function rectangleFromThree(a:Point,b:Point,c:Point):Rect|null {
 const dx=b.x-a.x,dz=b.z-a.z,width=Math.hypot(dx,dz);if(width<1e-6)return null;
 const nx=-dz/width,nz=dx/width,d=(c.x-a.x)*nx+(c.z-a.z)*nz;
 if(Math.abs(d)<1e-6)return null;
 return {x:(a.x+b.x)/2+nx*d/2,z:(a.z+b.z)/2+nz*d/2,width,depth:Math.abs(d),yaw:-Math.atan2(dz,dx)};
}
export function imageToWorld(p:Point,b:BaseImage):Point {const k=b.metersPerPixel!;return {x:(p.x-b.width/2)*k,z:(p.z-b.height/2)*k};}
export function worldToImage(p:Point,b:BaseImage):Point {const k=b.metersPerPixel!;return {x:p.x/k+b.width/2,z:p.z/k+b.height/2};}
export function metricRect(r:Rect,b:BaseImage):Rect {return {...r,...imageToWorld(r,b),width:r.width*b.metersPerPixel!,depth:r.depth*b.metersPerPixel!};}
export function containsRect(outer:Rect,inner:Rect){const c=Math.cos(outer.yaw),s=Math.sin(outer.yaw);return corners(inner).every(p=>{const x=p.x-outer.x,z=p.z-outer.z;return Math.abs(x*c-z*s)<=outer.width/2+1e-7&&Math.abs(x*s+z*c)<=outer.depth/2+1e-7;});}
