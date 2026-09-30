import type {RoofPitch} from './pitched-roof';
export type FactoryBox={name:string;position:[number,number,number];size:[number,number,number];material:'wall'|'frame'|'glass'|'door'|'canopy'|'steel'};
export function factoryDoorSide(axis:'x'|'z',yaw=0,northAngle=0):1|-1{
 const angle=yaw+northAngle*Math.PI/180;
 return (axis==='x'?-Math.sin(angle):Math.cos(angle))>=-1e-8?1:-1;
}
export function factorySpec(width:number,depth:number,pitch:RoofPitch,doorSide:1|-1=1){
 const swapped=pitch.axis==='x',length=swapped?depth:width,span=swapped?width:depth,eave=pitch.eave-3.5,slope=pitch.percent/100;
 const point=(x:number,y:number,z:number):[number,number,number]=>swapped?[z,y,-x]:[x,y,z];
 const height=(z:number)=>eave+(pitch.kind==='gable'?span/2-Math.abs(z):span/2+pitch.high*z)*slope;
 const boxes:FactoryBox[]=[],walls:number[]=[],roof:number[]=[],uv:number[]=[];
 function box(name:string,x:number,y:number,z:number,w:number,h:number,d:number,material:FactoryBox['material']){boxes.push({name,position:point(x,y,z),size:swapped?[d,h,w]:[w,h,d],material})}
 function quad(target:number[],a:number[],b:number[],c:number[],d:number[]){target.push(...a,...b,...c,...a,...c,...d)}
 const zs=pitch.kind==='gable'?[-span/2-.2,0,span/2+.2]:[-span/2-.2,span/2+.2];
 for(let j=1;j<zs.length;j++){
  const a=zs[j-1],b=zs[j];quad(roof,point(-length/2-.25,height(a)+.025,a),point(-length/2-.25,height(b)+.025,b),point(length/2+.25,height(b)+.025,b),point(length/2+.25,height(a)+.025,a));
  uv.push(0,(a+span/2+.2)/(span+.4),0,(b+span/2+.2)/(span+.4),1,(b+span/2+.2)/(span+.4),0,(a+span/2+.2)/(span+.4),1,(b+span/2+.2)/(span+.4),1,(a+span/2+.2)/(span+.4));
 }
 // End walls are split at the ridge; long facades below have real openings.
 for(const side of [-1,1])for(let j=1;j<zs.length;j++){
  const a=Math.max(-span/2,zs[j-1]),b=Math.min(span/2,zs[j]);
  quad(walls,point(side*length/2,-3.5,a),point(side*length/2,-3.5,b),point(side*length/2,height(b),b),point(side*length/2,height(a),a));
 }
 let doorCount=0;
 for(const side of [-1,1]){
  const top=height(side*span/2),h=top+3.5,bays=Math.max(1,Math.floor(length/8)),bay=length/bays;
  const count=length>=32?3:length>=16?2:1,doorBays=new Set(Array.from({length:count},(_,i)=>Math.min(bays-1,Math.floor((i+.5)*bays/count))));
  const openings:{a:number;b:number;c:number;d:number;door:boolean}[]=[];
  for(let i=0;i<bays;i++){
   const x=-length/2+(i+.5)*bay,isDoor=side===doorSide&&doorBays.has(i),w=Math.min(isDoor?5:4.2,bay*.68),bottom=isDoor?-3.5:-3.5+h*.23,oh=isDoor?Math.min(4.2,h*.66):Math.min(1.15,h*.19);
   openings.push({a:x-w/2,b:x+w/2,c:bottom,d:bottom+oh,door:isDoor});
   if(h>5)openings.push({a:x-bay*.43,b:x+bay*.43,c:-3.5+h*.78,d:-3.5+h*.90,door:false});
  }
  const xs=[-length/2+.12,length/2-.12,...openings.flatMap(o=>[o.a,o.b])].sort((a,b)=>a-b),ys=[-3.5,top,...openings.flatMap(o=>[o.c,o.d])].sort((a,b)=>a-b);
  for(let i=1;i<xs.length;i++)for(let j=1;j<ys.length;j++){
   const x=(xs[i-1]+xs[i])/2,y=(ys[j-1]+ys[j])/2,w=xs[i]-xs[i-1],h=ys[j]-ys[j-1];
   if(w<.001||h<.001||openings.some(o=>x>o.a&&x<o.b&&y>o.c&&y<o.d))continue;
   box('Factory wall',x,y,side*(span/2-.12),w,h,.24,'wall');
  }
  for(const o of openings){
   const x=(o.a+o.b)/2,y=(o.c+o.d)/2,w=o.b-o.a,h=o.d-o.c;
   box(o.door?'Factory door':'Factory window',x,y,side*(span/2-.16),w,h,.045,o.door?'door':'glass');
   for(const xx of [o.a,o.b])box('Opening jamb',xx,y,side*(span/2-.10),.07,h,.24,'frame');
   for(const yy of [o.c,o.d])box('Opening sill',x,yy,side*(span/2-.10),w,.06,.24,'frame');
   if(o.door){
    doorCount++;for(let yy=o.c+.20;yy<o.d;yy+=.20)box('Roller slat',x,yy,side*(span/2-.12),w,.012,.025,'steel');
    box('Grey canopy',x,o.d+.22,side*(span/2+.7),w+.6,.06,1.6,'canopy');
    box('Canopy folded lip',x,o.d+.16,side*(span/2+1.5),w+.6,.12,.045,'canopy');
    for(const xx of [o.a-.3,o.b+.3])box('Canopy return',xx,o.d+.17,side*(span/2+.7),.04,.10,1.6,'canopy');
   }else{
    for(let xx=o.a+.9;xx<o.b;xx+=.9)box('Window mullion',xx,y,side*(span/2-.1),.035,h,.06,'steel');
    box('Window transom',x,y,side*(span/2-.1),w,.035,.06,'steel');
   }
  }
 }
 return {roof,uv,walls,boxes,length:length+.5,span:span+.4,doorCount};
}
export type FactorySpec=ReturnType<typeof factorySpec>;
