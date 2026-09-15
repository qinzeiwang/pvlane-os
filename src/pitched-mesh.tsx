import { useMemo } from 'react';
import { DoubleSide } from 'three';
import { roofHeight } from './pitched-roof';
import type { SceneSite } from './domain';
export function PitchedMesh({site:r}:{site:SceneSite}){
 const vertices=useMemo(()=>{
  const p=r.pitch!,xs=p.kind==='gable'&&p.axis==='x'?[-r.width/2,0,r.width/2]:[-r.width/2,r.width/2],zs=p.kind==='gable'&&p.axis==='z'?[-r.depth/2,0,r.depth/2]:[-r.depth/2,r.depth/2];
  const data:number[]=[];
  const point=(x:number,z:number)=>[x,roofHeight(r,p,x,z),z];
  const quad=(a:number[],b:number[],c:number[],d:number[])=>data.push(...a,...b,...c,...a,...c,...d);
  for(let i=1;i<xs.length;i++)for(let j=1;j<zs.length;j++)quad(point(xs[i-1],zs[j-1]),point(xs[i-1],zs[j]),point(xs[i],zs[j]),point(xs[i],zs[j-1]));
  for(const z of [zs[0],zs[zs.length-1]])for(let i=1;i<xs.length;i++)quad(point(xs[i-1],z),point(xs[i],z),[xs[i],-3.5,z],[xs[i-1],-3.5,z]);
  for(const x of [xs[0],xs[xs.length-1]])for(let j=1;j<zs.length;j++)quad(point(x,zs[j-1]),point(x,zs[j]),[x,-3.5,zs[j]],[x,-3.5,zs[j-1]]);
  return new Float32Array(data);
 },[r.width,r.depth,r.pitch]);
 return <mesh castShadow receiveShadow><bufferGeometry onUpdate={g=>g.computeVertexNormals()}><bufferAttribute attach="attributes-position" args={[vertices,3]}/></bufferGeometry><meshStandardMaterial color="#b6c0bd" roughness={.7} metalness={.12} side={DoubleSide}/></mesh>;
}
