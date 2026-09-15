import { PitchedMesh } from './pitched-mesh';
import { winterSun } from "./solar";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as T from "three";
import { Sky } from "three/addons/objects/Sky.js";
import { geometry, initial, type PVArray } from "./domain";

// Synthetic material study: no product photograph, remote texture or model required.
function panelTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const c = canvas.getContext("2d")!;
  c.fillStyle = "#263c4e";
  c.fillRect(0, 0, 512, 1024);
  for (let row = 0; row < 12; row++)
    for (let col = 0; col < 6; col++) {
      const x = col * 84 + 5,
        y = row * 84 + 9,
        w = 79,
        h = 78;
      c.fillStyle = `rgb(${17 + ((row + col) % 3)},${39 + ((row * 3 + col) % 5)},${61 + ((row + col * 2) % 7)})`;
      c.beginPath();
      c.roundRect(x, y, w, h, 5);
      c.fill();
      c.strokeStyle = "rgba(138,168,188,.32)";
      c.lineWidth = 0.7;
      for (let k = 1; k < 13; k++) {
        c.beginPath();
        c.moveTo(x + 2, y + (k * h) / 13);
        c.lineTo(x + w - 2, y + (k * h) / 13);
        c.stroke();
      }
      c.strokeStyle = "rgba(176,195,211,.60)";
      c.lineWidth = 0.95;
      for (let k = 1; k <= 3; k++) {
        c.beginPath();
        c.moveTo(x + (k * w) / 4, y + 2);
        c.lineTo(x + (k * w) / 4, y + h - 2);
        c.stroke();
      }
    }
  const t = new T.CanvasTexture(canvas);
  t.colorSpace = T.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function roofTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d")!,
    data = ctx.createImageData(512, 512);
  let seed = 47;
  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const n = ((seed >>> 24) / 255) * 12;
    data.data[i] = 140 + n;
    data.data[i + 1] = 142 + n;
    data.data[i + 2] = 136 + n;
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  ctx.strokeStyle = "rgba(90,96,91,.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 510, 510);
  const map = new T.CanvasTexture(c);
  map.colorSpace = T.SRGBColorSpace;
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.anisotropy = 4;
  return map;
}
export const thousandPanels = (): PVArray[] =>
  Array.from({ length: 10 }, (_, i) => ({
    ...initial,
    id: `stress-${i}`,
    name: `测试阵列 ${i + 1}`,
    rows: 10,
    columns: 10,
    x: ((i % 5) - 2) * 19,
    z: (Math.floor(i / 5) - 0.5) * 38,
  }));
type Instance = { matrix: T.Matrix4 };
const matrix = (
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  q = new T.Quaternion(),
) =>
  new T.Matrix4().compose(new T.Vector3(x, y, z), q, new T.Vector3(sx, sy, sz));
function instanceData(arrays: PVArray[]) {
  const frames: Instance[] = [],
    portrait: Instance[] = [],
    landscape: Instance[] = [],
    steel: Instance[] = [],
    pads: Instance[] = [];
  for (const a of arrays) {
    const g = geometry(a),
      tilt = new T.Quaternion().setFromEuler(new T.Euler(g.tilt,0,g.roll)),
      root = matrix(
        a.x,
        0,
        a.z,
        1,
        1,
        1,
        new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), g.yaw),
      );
    for (const p of g.panels) {
      const local = new T.Matrix4().compose(
          new T.Vector3(p.x, p.y, p.z),
          tilt,
          new T.Vector3(1, 1, 1),
        ),
        world = root.clone().multiply(local);
      frames.push({
        matrix: world.clone().multiply(matrix(0, 0, 0, g.w, 0.035, g.l)),
      });
      // Horizontal UVs rotate with orientation instead of stretching the cell pattern.
      const glassRotation = new T.Quaternion().setFromAxisAngle(
        new T.Vector3(1, 0, 0),
        -Math.PI / 2,
      );
      const glass = world
        .clone()
        .multiply(
          matrix(0, 0.022, 0, g.w - 0.034, g.l - 0.034, 1, glassRotation),
        );
      (a.portrait ? portrait : landscape).push({ matrix: glass });
      if(a.surface)continue;
      for (const z of [-g.l * 0.32, g.l * 0.32])
        steel.push({
          matrix: world
            .clone()
            .multiply(matrix(0, -0.054, z, g.w + 0.018, 0.045, 0.065)),
        });
      for (const x of [-g.w * 0.34, g.w * 0.34])
      for (const z of [-g.l * 0.32, g.l * 0.32]) {
          const target = new T.Vector3(x, -0.08, z).applyMatrix4(local),
            h = Math.max(0.08, target.y - (a.elevation??0) - 0.09);
          steel.push({
            matrix: root
              .clone()
              .multiply(
                matrix(target.x, (a.elevation??0) + 0.09 + h / 2, target.z, 0.045, h, 0.045),
              ),
          });
          pads.push({
            matrix: root
              .clone()
              .multiply(matrix(target.x, (a.elevation??0) + 0.045, target.z, 0.24, 0.09, 0.28)),
          });
        }
    }
  }
  return { frames, portrait, landscape, steel, pads };
}
function Instances({
  data,
  shape = "box",
  material,
  shadow = true,
}: {
  data: Instance[];
  shape?: "box" | "plane";
  material: T.Material;
  shadow?: boolean;
}) {
  const ref = useRef<T.InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    data.forEach((v, i) => ref.current!.setMatrixAt(i, v.matrix));
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [data]);
  if (!data.length) return null;
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, data.length]}
      material={material}
      castShadow={shadow}
      receiveShadow
    >
      {shape === "box" ? (
        <boxGeometry args={[1, 1, 1]} />
      ) : (
        <planeGeometry args={[1, 1]} />
      )}
    </instancedMesh>
  );
}
export function RealisticScene({
  arrays,
  stress,
  solarHour = 9, northAngle=0,
  backgroundColor = "#dce5ec",
  groundColor = "#c7cccb",
  wallHeight = 0.32,
  roof,
  obstacles,
  sites,
  focus = {x:0,z:0},
}: {
  sites?: import("./domain").SceneSite[];
  focus?: {x:number;z:number};
  arrays: PVArray[];
  stress: boolean;
  solarHour?: number; northAngle?:number;
  backgroundColor?: string;
  groundColor?: string;
  wallHeight?: number;
  roof: { width: number; depth: number };
  obstacles: import("./domain").Obstacle[];
}) {
  const { gl, scene, invalidate } = useThree();
  const span = stress ? 200 : roof.width,
    depth = stress ? 200 : roof.depth;
  const sourceSun=winterSun(solarHour),north=northAngle*Math.PI/180;
  const sun={...sourceSun,x:sourceSun.x*Math.cos(north)-sourceSun.z*Math.sin(north),z:sourceSun.x*Math.sin(north)+sourceSun.z*Math.cos(north)};
  const center=stress?{x:0,z:0}:focus;
  const lightTarget=useMemo(()=>new T.Object3D(),[]);
  lightTarget.position.set(center.x,0,center.z);
  const surfaces:import("./domain").SceneSite[]=stress||!sites?[{id:"roof",name:"屋面",x:0,z:0,yaw:0,width:span,depth,wallHeight}]:sites;
  const data = useMemo(() => instanceData(arrays), [arrays]);
  const resources = useMemo(() => {
    const cells = panelTexture(),
      horizontal = cells.clone();
    horizontal.needsUpdate = true;
    horizontal.center.set(0.5, 0.5);
    horizontal.rotation = Math.PI / 2;
    const roofMap = roofTexture();
    const glass = (map: T.Texture) =>
      new T.MeshPhysicalMaterial({
        map,
        color: "#e0eaf0",
        roughness: 0.28,
        metalness: 0.16,
        clearcoat: 0.45,
        clearcoatRoughness: 0.25,
        envMapIntensity: 0.45,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      });
    return {
      cells,
      horizontal,
      roofMap,
      glass: glass(cells),
      glassHorizontal: glass(horizontal),
      aluminum: new T.MeshStandardMaterial({
        color: "#aeb8bf",
        metalness: 0.82,
        roughness: 0.3,
      }),
      steel: new T.MeshStandardMaterial({
        color: "#8e9caa",
        metalness: 0.72,
        roughness: 0.42,
      }),
      pad: new T.MeshStandardMaterial({ color: "#767b77", roughness: 0.93 }),
    };
  }, []);
  useEffect(
    () => () => {
      Object.values(resources).forEach((v) => v.dispose());
    },
    [resources],
  );
  useLayoutEffect(() => {
    resources.roofMap.repeat.set(span / 4, depth / 4);
  }, [resources, span, depth]);
  useEffect(() => {
    const sky = new Sky(),
      envScene = new T.Scene();
    sky.scale.setScalar(450);
    const u = sky.material.uniforms;
    u.turbidity.value = 5;
    u.rayleigh.value = 1.5;
    u.mieCoefficient.value = 0.005;
    u.mieDirectionalG.value = 0.8;
    u.sunPosition.value.set(sun.x, sun.y, sun.z);
    envScene.add(sky);
    const generator = new T.PMREMGenerator(gl),
      target = generator.fromScene(envScene, 0.04, 0.1, 1000);
    const old = scene.environment;
    scene.environment = target.texture;
    scene.environmentIntensity = 0.5;
    invalidate();
    return () => {
      scene.environment = old;
      scene.environmentIntensity = 1;
      target.dispose();
      generator.dispose();
      sky.geometry.dispose();
      sky.material.dispose();
    };
  }, [gl, scene, invalidate, solarHour,northAngle]);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    invalidate();
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl, invalidate, arrays, stress, obstacles, span, depth, solarHour,northAngle, wallHeight, sites]);
  useEffect(() => { invalidate(); }, [backgroundColor, groundColor, invalidate]);
  const extent = Math.max(span, depth) * 0.8,
    lightScale = Math.max(1, Math.max(span, depth) / 30);
  return (
    <>
      <color attach="background" args={[backgroundColor]} />
      <fog
        attach="fog"
        args={[backgroundColor, Math.max(span,depth)*3, Math.max(span,depth)*8]}
      />
      <hemisphereLight args={["#dbeafd", "#807766", 0.8]} />
      <primitive object={lightTarget}/>
      <directionalLight
        target={lightTarget}
        color="#fff0db"
        intensity={2.6}
        position={[center.x + sun.x * 60 * lightScale, sun.y * 60 * lightScale, center.z + sun.z * 60 * lightScale]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={1}
        shadow-camera-far={100 * lightScale}
        shadow-bias={-0.00015}
        shadow-normalBias={0.025}
      />
      <mesh
        position={[center.x, -3.55, center.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[Math.max(600,span*4), Math.max(600,depth*4)]} />
        <meshStandardMaterial color={groundColor} roughness={1} />
      </mesh>
      {surfaces.map(r=><group key={r.id} position={[r.x,0,r.z]} rotation={[0,r.yaw,0]}>
        {r.pitch?<PitchedMesh site={r}/>:<><mesh position={[0,(r.flatHeight??3.5)/2-3.5,0]} castShadow receiveShadow><boxGeometry args={[r.width,r.flatHeight??3.5,r.depth]}/><meshStandardMaterial color="#c3c1b8" roughness={.9}/></mesh>
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,(r.flatHeight??3.5)-3.5+.001,0]} receiveShadow><planeGeometry args={[r.width,r.depth]}/><meshStandardMaterial map={resources.roofMap} roughness={.93} bumpMap={resources.roofMap} bumpScale={.015}/></mesh>
        {[[0,-r.depth/2-.1,r.width+.4,.2],[0,r.depth/2+.1,r.width+.4,.2],[-r.width/2-.1,0,.2,r.depth],[r.width/2+.1,0,.2,r.depth]].map(([x,z,w,d],i)=><mesh key={i} position={[x,(r.flatHeight??3.5)-3.5+r.wallHeight/2,z]} castShadow receiveShadow><boxGeometry args={[w,Math.max(.001,r.wallHeight),d]}/><meshStandardMaterial color="#b9bebc" roughness={.8}/></mesh>)}
      </>} </group>)}
      <Instances data={data.frames} material={resources.aluminum} />
      <Instances
        data={data.portrait}
        shape="plane"
        material={resources.glass}
        shadow={false}
      />
      <Instances
        data={data.landscape}
        shape="plane"
        material={resources.glassHorizontal}
        shadow={false}
      />
      <Instances data={data.steel} material={resources.steel} />
      <Instances data={data.pads} material={resources.pad} />
      {!stress &&
        obstacles.filter(o=>o.kind!=="keepout").map((o) => (
          <group key={o.id} position={[o.x, o.baseHeight??0, o.z]} rotation={[0, o.yaw, 0]}>
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[o.width + 0.18, 0.2, o.depth + 0.18]} />
              <meshStandardMaterial color="#8d938e" roughness={0.9} />
            </mesh>
            <mesh position={[0, o.height / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[o.width, o.height, o.depth]} />
              <meshStandardMaterial
                color={o.id !== "skylight" ? "#d7d9d5" : "#4c5d65"}
                metalness={0.25}
                roughness={0.55}
              />
            </mesh>
            {o.id !== "skylight" ? (
              <>
                <mesh position={[0, o.height + 0.025, 0]} castShadow>
                  <boxGeometry args={[o.width + 0.1, 0.05, o.depth + 0.1]} />
                  <meshStandardMaterial
                    color="#a1acae"
                    metalness={0.65}
                    roughness={0.35}
                  />
                </mesh>
                {Array.from({ length: 9 }, (_, i) => (
                  <mesh
                    key={i}
                    position={[0, o.height * (0.2 + i * 0.075), o.depth / 2 + 0.015]}
                  >
                    <boxGeometry args={[o.width * 0.72, 0.035, 0.04]} />
                    <meshStandardMaterial
                      color="#58666c"
                      metalness={0.4}
                      roughness={0.55}
                    />
                  </mesh>
                ))}
              </>
            ) : (
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, o.height + 0.008, 0]}
              >
                <planeGeometry args={[o.width - 0.12, o.depth - 0.12]} />
                <meshPhysicalMaterial
                  color="#426774"
                  metalness={0.3}
                  roughness={0.2}
                  clearcoat={0.7}
                  envMapIntensity={0.7}
                />
              </mesh>
            )}
          </group>
        ))}
    </>
  );
}
