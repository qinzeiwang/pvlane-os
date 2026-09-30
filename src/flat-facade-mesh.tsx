import {useMemo} from 'react';
import {flatFacade} from './flat-facade';
export function FlatFacade({width,depth,height,yaw,northAngle}:{width:number;depth:number;height:number;yaw:number;northAngle:number}){
 const spec=useMemo(()=>flatFacade(width,depth,height,yaw,northAngle),[width,depth,height,yaw,northAngle]);
 return <group position={[0,-3.5,0]}>{spec.boxes.map((b,i)=><mesh key={i} position={b.position} castShadow receiveShadow><boxGeometry args={b.size}/><meshStandardMaterial color={b.material==='frame'?'#434b4d':b.material==='door'?'#34484e':'#425c65'} roughness={b.material==='frame'?.55:.24} metalness={.15}/></mesh>)}</group>;
}
