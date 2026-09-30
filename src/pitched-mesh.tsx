import {useMemo,useEffect} from 'react';
import {DoubleSide} from 'three';
import type {SceneSite} from './domain';
import {factorySpec,factoryDoorSide} from './factory-spec';
import {factoryRoofTexture} from './factory-material';
const colors={wall:'#f6f7f6',frame:'#455054',glass:'#293a3d',door:'#a6abaa',canopy:'#b8b8b8',steel:'#9ca6aa'};
export function PitchedMesh({site:r,northAngle=0}:{site:SceneSite;northAngle?:number}){
 const spec=useMemo(()=>factorySpec(r.width,r.depth,r.pitch!,factoryDoorSide(r.pitch!.axis,r.yaw,northAngle)),[r.width,r.depth,r.pitch,r.yaw,northAngle]);
 const texture=useMemo(()=>factoryRoofTexture(spec.length,spec.span),[spec.length,spec.span]);
 useEffect(()=>()=>texture.dispose(),[texture]);
 return <group><mesh castShadow receiveShadow><bufferGeometry onUpdate={g=>g.computeVertexNormals()}><bufferAttribute attach="attributes-position" args={[new Float32Array(spec.roof),3]}/><bufferAttribute attach="attributes-uv" args={[new Float32Array(spec.uv),2]}/></bufferGeometry><meshPhysicalMaterial map={texture} roughness={.39} metalness={.12} clearcoat={.22} clearcoatRoughness={.27} side={DoubleSide}/></mesh><mesh castShadow receiveShadow><bufferGeometry onUpdate={g=>g.computeVertexNormals()}><bufferAttribute attach="attributes-position" args={[new Float32Array(spec.walls),3]}/></bufferGeometry><meshStandardMaterial color={colors.wall} roughness={.83} side={DoubleSide}/></mesh>{spec.boxes.map((b,i)=><mesh key={i} position={b.position} castShadow receiveShadow><boxGeometry args={b.size}/><meshStandardMaterial color={colors[b.material]} roughness={b.material==='glass'?.25:b.material==='canopy'?.72:.83} metalness={b.material==='steel'?.65:0}/></mesh>)}</group>;
}
