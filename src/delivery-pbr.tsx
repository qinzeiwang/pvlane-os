import {useMemo,useEffect} from 'react';
import {useLoader,useThree} from '@react-three/fiber';
import * as T from 'three';
import wallColor from '../assets/render-materials/concrete-wall/basecolor.jpg';
import wallRough from '../assets/render-materials/concrete-wall/roughness.jpg';
import wallNormal from '../assets/render-materials/concrete-wall/normal_gl.jpg';
// Share uploaded texture maps. Per-material UV uniforms retain metric scale without
// cloning three 2K textures for every wall face and parapet.
export function DeliveryPbr({width,height,attach='material'}:{kind:'wall';width:number;height:number;attach?:string}){
 const {invalidate}=useThree();
 const source=useLoader(T.TextureLoader,[wallColor,wallRough,wallNormal]);
 const maps=useMemo(()=>source.map((t,i)=>{const color=i===0?T.SRGBColorSpace:T.NoColorSpace;if(t.wrapS!==T.RepeatWrapping||t.colorSpace!==color||t.anisotropy!==8){t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=color;t.anisotropy=8;t.needsUpdate=true;}return t}),[source]);
 // Texture loading suspends the scene. Request another frame after React has
 // revealed it; an immediate demand frame can run while it is still hidden.
 useEffect(()=>{invalidate();const frame=requestAnimationFrame(()=>invalidate());return()=>cancelAnimationFrame(frame);},[maps,invalidate]);
 return <meshStandardMaterial key={width+','+height} attach={attach} map={maps[0]} roughnessMap={maps[1]} normalMap={maps[2]} normalScale={new T.Vector2(.25,.25)} roughness={.95} customProgramCacheKey={()=>'metric-concrete-wall'} onBeforeCompile={shader=>{
 shader.uniforms.wallRepeat={value:new T.Vector2(width/2.71,height/2.71)};
 shader.vertexShader='uniform vec2 wallRepeat;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\nvMapUv *= wallRepeat;\nvNormalMapUv *= wallRepeat;\nvRoughnessMapUv *= wallRepeat;');
 shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb=vec3(dot(diffuseColor.rgb,vec3(0.2126,0.7152,0.0722)));');
 }}/>;
}
export function DeliveryWall({width,height,depth}:{width:number;height:number;depth:number}){
 return <>{[depth,depth,width,width,width,width].map((w,i)=><DeliveryPbr key={i} attach={`material-${i}`} kind="wall" width={w} height={i===2||i===3?depth:height}/>)}</>;
}
