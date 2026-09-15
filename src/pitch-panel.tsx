import type { RoofPitch } from './pitched-roof';
export function PitchPanel({value:p,onChange}:{value:RoofPitch;onChange:(p:RoofPitch)=>void}){
 return <div className="compact-rules pitch-rows">
 <svg viewBox="0 -8 250 116" style={{width:'100%',height:70,gridColumn:'1 / -1'}} aria-label="屋面边位示意">
 <rect x="45" y="18" width="160" height="64" fill="#eef3f1" stroke="#70968a" strokeWidth="5" strokeLinejoin="miter"/>
 {([['z',-1,45,18,205,18,'A'],['x',1,205,18,205,82,'B'],['z',1,45,82,205,82,'C'],['x',-1,45,18,45,82,'D']] as const).map(([axis,high,x1,y1,x2,y2,label])=><g key={label}>{p.kind==='single'&&p.axis===axis&&p.high===high&&<line x1={x1} y1={y1} x2={x2} y2={y2} stroke={p.kind==='single'&&p.axis===axis&&p.high===high?'#df8c35':'#70968a'} strokeWidth="5" strokeLinecap="square"/>}<text x={(x1+x2)/2+(axis==='x'?high*15:0)} y={(y1+y2)/2+(axis==='z'?high*15:0)} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#314e45">{label}</text></g>)}
 {p.kind==='gable'&&<line x1={p.axis==='z'?45:125} y1={p.axis==='z'?50:18} x2={p.axis==='z'?205:125} y2={p.axis==='z'?50:82} stroke="#df8c35" strokeWidth="3"/>}
 </svg>
 {p.kind==='single'?<label className="rule-row"><span>高边</span><select aria-label="坡屋面高边" value={`${p.axis}:${p.high}`} onChange={e=>{const [axis,high]=e.target.value.split(':');onChange({...p,axis:axis as 'x'|'z',high:Number(high) as 1|-1});}}><option value="z:-1">边 A</option><option value="z:1">边 C</option><option value="x:-1">边 D</option><option value="x:1">边 B</option></select></label>:<label className="rule-row"><span>居中屋脊</span><select aria-label="屋脊方向" value={p.axis} onChange={e=>onChange({...p,axis:e.target.value as 'x'|'z'})}><option value="z">平行边 A</option><option value="x">垂直边 A</option></select></label>}
 <label className="rule-row"><span>坡度 %</span><input aria-label="屋面坡度 %" type="number" min="0" max="100" step="1" value={p.percent} onChange={e=>{const n=Number(e.target.value);if(n>=0&&n<=100)onChange({...p,percent:n});}}/></label>
 <label className="rule-row"><span>低檐高 m</span><input aria-label="低檐高 m" type="number" min="1" max="100" step="0.1" value={p.eave} onChange={e=>{const n=Number(e.target.value);if(n>=1&&n<=100)onChange({...p,eave:n});}}/></label>
 </div>;
}
