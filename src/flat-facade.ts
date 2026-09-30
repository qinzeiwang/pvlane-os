export type FacadeBox={position:[number,number,number];size:[number,number,number];material:'frame'|'glass'|'door'};
// Local coordinates: x/z plan, y measured above ground. North angle follows the project convention.
export function flatFacade(width:number,depth:number,height:number,yaw=0,northAngle=0){
 const angle=yaw+northAngle*Math.PI/180, south=[-Math.sin(angle),Math.cos(angle)];
 const faces=[{axis:'z',side:1,score:south[1]},{axis:'x',side:1,score:south[0]},{axis:'z',side:-1,score:-south[1]},{axis:'x',side:-1,score:-south[0]}] as const;
 const entrance=[...faces].sort((a,b)=>b.score-a.score)[0];
 const floors=Math.max(1,Math.round(height/3.3)),floorHeight=height/floors,boxes:FacadeBox[]=[];
 for(const face of faces){
  const length=face.axis==='z'?width:depth,extent=face.axis==='z'?depth:width;
  const doorWidth=Math.min(2.4,length*.45),doorHeight=Math.min(2.7,floorHeight*.82);
  const add=(along:number,y:number,w:number,h:number,offset:number,t:number,material:FacadeBox['material'])=>boxes.push({position:face.axis==='z'?[along,y,face.side*(extent/2+offset)]:[face.side*(extent/2+offset),y,along],size:face.axis==='z'?[w,h,t]:[t,h,w],material});
  if(face===entrance){add(0,doorHeight/2,doorWidth,doorHeight,.03,.06,'frame');add(0,doorHeight/2,doorWidth-.14,doorHeight-.12,.07,.025,'door');add(0,doorHeight/2,.05,doorHeight,.09,.025,'frame');}
  const bays=Math.max(1,Math.floor(length/3.6)),spacing=length/bays,ww=Math.min(1.8,spacing*.55),wh=Math.min(1.5,floorHeight*.45);
  for(let level=0;level<floors;level++)for(let bay=0;bay<bays;bay++){
   const along=(bay+.5)*spacing-length/2,y=level*floorHeight+floorHeight*.55;
   if(face===entrance&&level===0&&Math.abs(along)<(doorWidth+ww)/2+.25)continue;
   add(along,y,ww+.12,wh+.12,.035,.07,'frame');add(along,y,ww,wh,.08,.025,'glass');add(along,y,.04,wh,.10,.025,'frame');
  }
 }
 return {floors,floorHeight,entrance:{axis:entrance.axis,side:entrance.side},boxes};
}
