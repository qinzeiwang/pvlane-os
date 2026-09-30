import type {Point} from './domain';
export type Footprint={width:number;depth:number;outline?:Point[]};
const eps=1e-7;
export const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
export const signedArea=(p:Point[])=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.z-b.x*a.z;},0)/2;
export const footprintArea=(r:Footprint)=>r.outline?Math.abs(signedArea(r.outline)):r.width*r.depth;
export function segmentDistance(p:Point,a:Point,b:Point){const dx=b.x-a.x,dz=b.z-a.z,k=dx*dx+dz*dz,t=k?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/k)):0;return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);}
export function insidePolygon(p:Point,poly:Point[]){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j],b=poly[i];if(segmentDistance(p,a,b)<eps)return true;if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)inside=!inside;}return inside;}
const intersects=(a:Point,b:Point,c:Point,d:Point)=>cross(a,b,c)*cross(a,b,d)<-eps&&cross(c,d,a)*cross(c,d,b)<-eps;
export function polygonContains(outer:Point[],inner:Point[],margin=0){
 if(!inner.every(p=>insidePolygon(p,outer)))return false;
 for(let i=0;i<inner.length;i++){const a=inner[i],b=inner[(i+1)%inner.length];if(!insidePolygon({x:(a.x+b.x)/2,z:(a.z+b.z)/2},outer))return false;
 for(let j=0;j<outer.length;j++){const c=outer[j],d=outer[(j+1)%outer.length];if(intersects(a,b,c,d))return false;if(margin>0&&Math.min(segmentDistance(a,c,d),segmentDistance(b,c,d),segmentDistance(c,a,b),segmentDistance(d,a,b))<margin-eps)return false;}}
 return true;
}
export function validOutline(r:Footprint){const p=r.outline;if(p===undefined)return true;if(!Array.isArray(p)||p.length<3||p.length>64||p.some(v=>!v||!Number.isFinite(v.x)||!Number.isFinite(v.z)||Math.abs(v.x)>r.width/2+eps||Math.abs(v.z)>r.depth/2+eps)||Math.abs(signedArea(p))<1)return false;
 for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if(Math.hypot(a.x-b.x,a.z-b.z)<.05)return false;for(let j=i+1;j<p.length;j++){if(j===i+1||(i===0&&j===p.length-1))continue;const c=p[j],d=p[(j+1)%p.length];if(intersects(a,b,c,d)||Math.min(segmentDistance(a,c,d),segmentDistance(b,c,d),segmentDistance(c,a,b),segmentDistance(d,a,b))<eps)return false;}}
 return true;
}
export function polygonRect(points:Point[]){const xs=points.map(p=>p.x),zs=points.map(p=>p.z),x=(Math.min(...xs)+Math.max(...xs))/2,z=(Math.min(...zs)+Math.max(...zs))/2;const r={x,z,yaw:0,width:Math.max(...xs)-Math.min(...xs),depth:Math.max(...zs)-Math.min(...zs),outline:points.map(p=>({x:p.x-x,z:p.z-z}))};if(!validOutline(r))throw new Error('轮廓需至少三个点，不能交叉、重叠或过小');return r;}

export function polygonsOverlap(a:Point[],b:Point[]){
 const strict=(p:Point,poly:Point[])=>insidePolygon(p,poly)&&poly.every((v,i)=>segmentDistance(p,v,poly[(i+1)%poly.length])>eps);
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)if(intersects(a[i],a[(i+1)%a.length],b[j],b[(j+1)%b.length]))return true;
 for(const [poly,other] of [[a,b],[b,a]]){if(poly.some(p=>strict(p,other)))return true;const sign=Math.sign(signedArea(poly));for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dx=q.x-p.x,dz=q.z-p.z,l=Math.hypot(dx,dz);const probe={x:(p.x+q.x)/2-sign*dz/l*1e-5,z:(p.z+q.z)/2+sign*dx/l*1e-5};if(strict(probe,poly)&&strict(probe,other))return true;}}
 return false;
}
/** Interior point with clearance, also used to keep direction markers off concave notches. */
export function footprintCenter(r:Footprint){if(!r.outline)return {x:0,z:0};let best={x:0,z:0},clearance=-1;for(let i=0;i<25;i++)for(let j=0;j<25;j++){const p={x:r.width*((i+.5)/25-.5),z:r.depth*((j+.5)/25-.5)};if(!insidePolygon(p,r.outline))continue;const d=Math.min(...r.outline.map((a,k)=>segmentDistance(p,a,r.outline![(k+1)%r.outline!.length])));if(d>clearance){clearance=d;best=p;}}return best;}
