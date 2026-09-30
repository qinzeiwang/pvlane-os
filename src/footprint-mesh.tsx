import {useMemo,useEffect} from 'react';
import {BoxGeometry,PlaneGeometry,Shape,ShapeGeometry,ExtrudeGeometry,ShapeUtils,Vector2} from 'three';
import {corners} from './domain';
import type {Footprint} from './polygon';
export function footprintShape(r:Footprint){return new Shape(corners({...r,x:0,z:0,yaw:0}).map(p=>new Vector2(p.x,-p.z)));}
export function footprintVertices(r:Footprint){const p=corners({...r,x:0,z:0,yaw:0}),q=p.map(v=>new Vector2(v.x,-v.z));return ShapeUtils.triangulateShape(q,[]).flatMap(t=>t.flatMap(i=>[p[i].x,0,p[i].z]));}
export function footprintLines(r:Footprint,y:number){const p=corners({...r,x:0,z:0,yaw:0});return [...p,p[0]].flatMap(v=>[v.x,y,v.z]);}
export function FootprintGeometry({roof,height=0,plane=false}:{roof:Footprint;height?:number;plane?:boolean}){const geometry=useMemo(()=>{if(!roof.outline){const box=height?new BoxGeometry(roof.width,height,roof.depth):new PlaneGeometry(roof.width,roof.depth);if(!height&&!plane)box.rotateX(-Math.PI/2);return box;}const shape=footprintShape(roof);const g=height?new ExtrudeGeometry(shape,{depth:height,bevelEnabled:false}):new ShapeGeometry(shape);if(!height){const uv=g.getAttribute("uv");for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/roof.width+.5,uv.getY(i)/roof.depth+.5);}if(!plane){g.rotateX(-Math.PI/2);if(height)g.translate(0,-height/2,0);}return g;},[roof.width,roof.depth,roof.outline,height,plane]);useEffect(()=>()=>geometry.dispose(),[geometry]);return <primitive object={geometry} attach="geometry"/>;}
