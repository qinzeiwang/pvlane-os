import {type Rect,overlaps} from './domain';
import {type RoofDesign,roofRect,toLocal,toWorld} from './roof-project';
import {containsRect} from './drawing-geometry';
export function reshapeRegion(roofs:RoofDesign[],id:string,rect:Rect){
 const old=roofs.find(r=>r.id===id);if(!old)throw new Error('区域不存在');
 if(rect.width<2||rect.depth<2||rect.width>200||rect.depth>200)throw new Error('区域边长需在 2–200m 之间');
 if(roofs.some(r=>r.id!==id&&overlaps(roofRect(r),rect)))throw new Error('与其他区域重叠');
 const next={...old,x:rect.x,z:rect.z,yaw:rect.yaw,roof:{width:rect.width,depth:rect.depth},layoutSignature:'',layoutMessage:'轮廓已修改，待更新布置'};
 next.obstacles=old.obstacles.map(o=>({...o,...toLocal(toWorld(o,old),next),yaw:o.yaw+old.yaw-next.yaw}));
 if(next.obstacles.some(o=>!containsRect({x:0,z:0,yaw:0,...next.roof},o)))throw new Error('新轮廓未包含原有障碍物或禁布区，请先调整它们');
 next.arrays=old.arrays.map(a=>({...a,...toLocal(toWorld(a,old),next),azimuth:a.azimuth+(next.yaw-old.yaw)*180/Math.PI}));
 next.previous=null;
 return roofs.map(r=>r.id===id?next:r);
}
