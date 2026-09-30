import * as T from 'three';
// One 4 x 6 metre slab tile, restrained seams and mottling, in the delivery palette.
export function deliveryConcrete(ground=false){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=768;const ctx=canvas.getContext('2d')!;
 const image=ctx.createImageData(512,768);let seed=71;
 for(let y=0;y<768;y++)for(let x=0;x<512;x++){
  seed=(1664525*seed+1013904223)>>>0;
  const base=ground?169:164,v=base+4*Math.sin(x*.017+y*.01)+3*Math.cos(y*.029)+((seed>>>24)/255-.5)*3;
  const joint=x<2||y<2;const i=(y*512+x)*4;
  image.data[i]=v-(joint?18:0);image.data[i+1]=v+1-(joint?18:0);image.data[i+2]=v-(joint?18:0);image.data[i+3]=255;
 }
 ctx.putImageData(image,0,0);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=8;return map;
}

// Site-sized layers: seams stay metric; stains never repeat once per slab.
export function deliveryGround(width:number,depth:number){
 const size=512,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
 const ctx=canvas.getContext('2d')!,image=ctx.createImageData(size,size);let seed=928031;
 const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 const stains=Array.from({length:32},()=>({x:(rand()-.5)*width,y:(rand()-.5)*depth,rx:.45+rand()*2.35,ry:.35+rand()*1.45,a:rand()*Math.PI*2,d:.04+rand()*.055}));
 const angles=stains.map(s=>({c:Math.cos(s.a),s:Math.sin(s.a)}));
 const cols=Math.ceil(width/4),tones=Array.from({length:cols*Math.ceil(depth/6)},()=> (rand()-.5)*.022);
 const srgb=(v:number)=>255*(1.055*Math.pow(Math.max(.001,v),1/2.4)-.055);
 for(let py=0;py<size;py++)for(let px=0;px<size;px++){
  const x=px/(size-1)*width,y=py/(size-1)*depth,X=x-width/2,Y=y-depth/2;
  let tone=.36+.022*Math.sin(X*.14+Y*.07)+.015*Math.sin(Y*.23-X*.055)+(tones[Math.min(tones.length-1,Math.floor(y/6)*cols+Math.floor(x/4))]??0);
  for(let j=0;j<stains.length;j++){const s=stains[j],a=angles[j],dx=X-s.x,dy=Y-s.y,u=dx*a.c+dy*a.s,v=-dx*a.s+dy*a.c;if((u/s.rx)**2+(v/s.ry)**2>9)continue;tone-=Math.exp(-((u/s.rx)**2+(v/s.ry)**2)*(1+.2*Math.sin(u*2.4+v*1.1)+.12*Math.sin(v*4.1-u))*2)*s.d}
  const joint=Math.min(x%4,4-x%4,y%6,6-y%6);tone-=Math.exp(-((joint/.027)**2))*.085;tone+=(rand()-.5)*.0024;
  const i=(py*size+px)*4;image.data[i]=srgb(tone*1.01);image.data[i+1]=srgb(tone);image.data[i+2]=srgb(tone*.975);image.data[i+3]=255;
 }
 ctx.putImageData(image,0,0);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;return map;
}
