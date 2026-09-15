import {Icon} from './workbench-ui';
import type { Obstacle } from './domain';

function NumberField({ label, value, min = -500, max = 500, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (value: number) => void }) {
  return <label>{label}<input aria-label={label} key={value} type="number" step="0.1" min={min} max={max} defaultValue={Number(value.toFixed(3))} onBlur={e => {
    const next = Number(e.target.value);
    if (e.target.value.trim() && Number.isFinite(next) && next >= min && next <= max) onChange(next);
    else e.target.value = String(value);
  }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} /></label>;
}

export function SitePanel({ section = "roof", roof, obstacles, onRoof, onObstacles, onSelect, disabled, selectedId }: {
  selectedId?:string;
  section?: "roof" | "obstacles" | "keepout";
  onSelect?: (id: string) => void;
  roof: { width: number; depth: number }; obstacles: Obstacle[];
  onRoof: (roof: { width: number; depth: number }) => void;
  onObstacles: (objects: Obstacle[]) => void; disabled: boolean;
}) {
  const keepout=section==='keepout', noun=keepout?'禁布区':'障碍物';
  const visible=obstacles.filter(o=>(o.kind==='keepout')===keepout&&(!selectedId||o.id===selectedId));
  const update = (id: string, patch: Partial<Obstacle>) => onObstacles(obstacles.map(o => o.id === id ? { ...o, ...patch } : o));
  return <section className="site-settings"><h2>{section === "roof" ? "屋面尺寸" : "障碍物管理"}</h2><fieldset disabled={disabled}>
    <div hidden={section !== "roof"}><div className="fields">
      <NumberField label="屋面宽 m" value={roof.width} min={2} max={200} onChange={width => onRoof({ ...roof, width })} />
      <NumberField label="屋面长 m" value={roof.depth} min={2} max={200} onChange={depth => onRoof({ ...roof, depth })} />
    </div>
    <button type="button" className="help-icon" aria-label="沿圈选边方向量取宽长 · 2–200 m；修改尺寸后需重新布置。" title="沿圈选边方向量取宽长 · 2–200 m；修改尺寸后需重新布置。"><Icon name="info"/></button></div>
    <details id={keepout?"keepout-settings":"obstacle-settings"} hidden={section === "roof"} open><summary>障碍物 · {obstacles.length} 个</summary>
      {visible.map(o => <details key={o.id} onFocus={() => onSelect?.(o.id)} open={o.id !== "equipment" && o.id !== "skylight"}><summary onClick={() => onSelect?.(o.id)}>{o.name}{!keepout&&` · 高 ${o.height} m`}</summary>
        <label>名称<input aria-label={`${noun}名称`} value={o.name} maxLength={40} onChange={e => update(o.id, { name: e.target.value })} /></label>
        <div className="fields">
          {([['x', '障碍物中心 X / 东 m', -500], ['z', '障碍物中心 Z / 南 m', -500], ['width', '障碍物宽 m', 0.2], ['depth', '障碍物长 m', 0.2], ['height', '障碍物高 m', 0.2]] as const).filter(([key])=>!keepout||key!=='height').map(([key, label, min]) => <NumberField key={key} label={label.replace("障碍物",noun)} value={o[key]} min={min} max={key === 'height' ? 30 : 500} onChange={value => update(o.id, { [key]: value })} />)}
          <NumberField label={`${noun}旋转 °`} value={o.yaw * 180 / Math.PI} min={-360} max={360} onChange={value => update(o.id, { yaw: value * Math.PI / 180 })} />
        </div>
        <button onClick={() => onObstacles(obstacles.filter(item => item.id !== o.id))}>删除此{noun}</button>
      </details>)}
      <button hidden={!!selectedId} disabled={obstacles.length >= 100} onClick={() => onObstacles([...obstacles, { id: crypto.randomUUID(), kind:keepout?"keepout":"obstacle", name: `${noun} ${visible.length + 1}`, x: 0, z: 0, width: 2, depth: 2, height: keepout?0:1, yaw: 0 }])}>添加矩形{noun}</button>
      <button hidden={keepout} type="button" className="help-icon" aria-label="高度从屋面算起；Enter / 移开焦点生效。" title="高度从屋面算起；Enter / 移开焦点生效。"><Icon name="info"/></button>
    </details>
  </fieldset><hr /></section>;
}
