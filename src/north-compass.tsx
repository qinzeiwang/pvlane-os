export function Compass({angle=0,onClick}:{angle?:number;onClick?:()=>void}){
 const rad=angle*Math.PI/180;
 return <button className="north-compass" aria-label="查看或修改北方向" title="北方向 · 点击修改" onClick={onClick}><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="34" r="24" fill="white" fillOpacity=".72" stroke="#cad8e1"/><g transform={`rotate(${angle} 32 34)`}><path d="M32 16 24 43 32 38Z" fill="#397fae"/><path d="M32 16 40 43 32 38Z" fill="#8eb8d5"/></g><text x={32+27*Math.sin(rad)} y={37-27*Math.cos(rad)} textAnchor="middle" fill="#355569" fontSize="10" fontFamily="Segoe UI">N</text></svg></button>;
}
