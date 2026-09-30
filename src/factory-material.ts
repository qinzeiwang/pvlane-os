import * as T from 'three';
export function factoryRoofTexture(length:number,span:number){
 const w=2048,h=512,canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(w,h),tones=[-.17,.12,.23,-.12,-.20,.15,.24,-.08],base=[.075,.29,.53];
 const bands=Array.from({length:w},(_,i)=>{const x=(i+.5)/w*length;const phase=(x/.25)%1;return 1+.25*Math.cos(phase*Math.PI*2)-.25*Math.exp(-(((phase-.27)/.085)**2))+tones[Math.floor(x/6)%8]});
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const X=(x+.5)/w*length,Z=(y+.5)/h*span,value=bands[x]+.065*Math.sin((X-length/2)*.12+(Z-span/2)*.10)-Math.exp(-(((Z%5)/.035)**2))*.075;
  const i=(y*w+x)*4;for(let k=0;k<3;k++){const v=Math.min(1,Math.max(0,base[k]*value));pixels.data[i+k]=255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055)}pixels.data[i+3]=255;
 }
 ctx.putImageData(pixels,0,0);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;return map;
}
