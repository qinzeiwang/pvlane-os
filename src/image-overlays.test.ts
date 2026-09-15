import {expect,it} from 'vitest';
import {corners} from './domain';
import {parseImageOverlays,resizeOverlay,type ImageOverlay} from './image-overlays';
const image:ImageOverlay={id:'photo',name:'photo.png',url:'data:image/png;base64,AAAA',x:8,z:-2,yaw:.65,width:10,depth:6,originalWidth:10,opacity:.5,visible:true};
it('叠加图片等比缩放且固定对角点',()=>{for(let i=0;i<4;i++){const before=corners(image),anchor=before[(i+2)%4],p={x:anchor.x+(before[i].x-anchor.x)*1.8,z:anchor.z+(before[i].z-anchor.z)*1.8},next=resizeOverlay(image,p,i),after=corners(next);expect(next.width/next.depth).toBeCloseTo(10/6);expect(after[(i+2)%4].x).toBeCloseTo(anchor.x);expect(after[(i+2)%4].z).toBeCloseTo(anchor.z);expect(after[i].x).toBeCloseTo(p.x);expect(after[i].z).toBeCloseTo(p.z);}});
it('项目兼容旧文件并校验图片内容和参数',()=>{expect(parseImageOverlays(undefined)).toEqual([]);expect(parseImageOverlays([image])).toEqual([image]);for(const patch of [{url:'https://example.com/a.png'},{opacity:2},{width:-1},{yaw:NaN},{id:'a/b'}])expect(()=>parseImageOverlays([{...image,...patch}])).toThrow();expect(()=>parseImageOverlays([image,image])).toThrow();});
