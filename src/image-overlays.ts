import {corners,type Point} from './domain';
export type ImageOverlay={id:string;name:string;url:string;x:number;z:number;yaw:number;width:number;depth:number;originalWidth:number;opacity:number;visible:boolean};
export function parseImageOverlays(raw:unknown):ImageOverlay[]{
 if(raw===undefined)return [];
 if(!Array.isArray(raw)||raw.length>8)throw new Error('叠加图片最多 8 张');
 let bytes=0;const ids=new Set<string>();
 for(const item of raw){const o=item as ImageOverlay;if(!o||typeof o.id!=='string'||!o.id||o.id.includes('/')||ids.has(o.id)||typeof o.name!=='string'||o.name.length>200||typeof o.url!=='string'||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(o.url)||![o.x,o.z,o.yaw,o.width,o.depth,o.originalWidth,o.opacity].every(Number.isFinite)||Math.abs(o.x)>100000||Math.abs(o.z)>100000||o.width<.1||o.depth<.1||o.width>10000||o.depth>10000||o.originalWidth<=0||o.opacity<0||o.opacity>1||typeof o.visible!=='boolean')throw new Error('叠加图片数据无效');ids.add(o.id);bytes+=o.url.length;}
 if(bytes>40000000)throw new Error('叠加图片数据总量过大');return raw as ImageOverlay[];
}
export function resizeOverlay(o:ImageOverlay,p:Point,index:number):ImageOverlay{
 const points=corners(o),anchor=points[(index+2)%4],corner=points[index],dx=corner.x-anchor.x,dz=corner.z-anchor.z;
 const scale=Math.max(Math.max(.1/o.width,.1/o.depth),Math.min(Math.min(10000/o.width,10000/o.depth),((p.x-anchor.x)*dx+(p.z-anchor.z)*dz)/(dx*dx+dz*dz)));
 return {...o,width:o.width*scale,depth:o.depth*scale,x:anchor.x+dx*scale/2,z:anchor.z+dz*scale/2};
}
