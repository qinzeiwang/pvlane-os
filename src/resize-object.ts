import type {Obstacle,Point} from './domain';
/** Move one corner while keeping its opposite corner fixed in the roof frame. */
export function resizeObject(o:Obstacle,p:Point,index:number):Obstacle{
 const c=Math.cos(o.yaw),s=Math.sin(o.yaw),dx=p.x-o.x,dz=p.z-o.z;
 const sx=index===0||index===3?-1:1,sz=index<2?-1:1;
 const ax=-sx*o.width/2,az=-sz*o.depth/2;
 const width=Math.max(.2,Math.min(200,sx*(dx*c-dz*s-ax)));
 const depth=Math.max(.2,Math.min(200,sz*(dx*s+dz*c-az)));
 const cx=ax+sx*width/2,cz=az+sz*depth/2;
 return {...o,width,depth,x:o.x+cx*c+cz*s,z:o.z-cx*s+cz*c};
}
