import {defaultSunSettings} from './sun-position';
import {it,expect} from 'vitest';
import {newRoof} from './roof-project';
import {initial} from './domain';
import {layoutSignatureFor,needsLayoutUpdate} from './layout-state';
import {parseWorkspace} from './workspace-file';
import {schemeReport,reportReadiness} from './scheme-report';
function fixture(){const r=newRoof('屋面 A');r.arrays=[{...initial,id:'a',name:'a',module:r.moduleSpec}];r.layoutSignature=layoutSignatureFor(r,.5);return r;}
it('保存打开保留完成和待更新状态',()=>{
 const r=fixture();const sunSettings={...defaultSunSettings(),locationMode:'manual' as const};r.layoutOptions={...r.layoutOptions,shadowLatitude:sunSettings.latitude,shadowIgnored:false};r.layoutSignature=layoutSignatureFor(r,.5);const p={sunSettings,version:3,name:'项目',roofs:[r],activeId:r.id,globalEdge:.5,solarHour:9,backgroundColor:'#ffffff',groundColor:'#dddddd'};
 expect(needsLayoutUpdate(parseWorkspace(JSON.stringify(p)).roofs[0],.5)).toBe(false);
 r.moduleSpec={...r.moduleSpec,power:560};expect(needsLayoutUpdate(parseWorkspace(JSON.stringify(p)).roofs[0],.5)).toBe(true);
});
it('报告包含三维图与屋面合计，并转义用户名称',()=>{
 const r=fixture();const html=schemeReport('<script>test</script>',[r],.5,'data:image/png;base64,AAAA');
 expect(html).not.toContain('<script>test');expect(html).toContain('&lt;script&gt;');expect(html).toContain('三维布置效果');expect(html).toContain('屋面明细与项目合计');expect(html).not.toMatch(/发电量|轻质|车棚|25年/);expect(html).toContain('9.90');
});
it('报告阻止旧容量和未布置区域被当成完成方案',()=>{
 const r=fixture();r.layoutOptions={...r.layoutOptions,gap:3};expect(reportReadiness([r],.5)).toEqual(['屋面 A']);
 expect(()=>schemeReport('a',[r],.5,'data:image/png;base64,AAAA')).toThrow();expect(reportReadiness([newRoof()],.5)).toHaveLength(1);
});

it('旧项目缺少地点时保留阵列但要求重新校核',()=>{const r=fixture();const p={version:3,name:'旧项目',roofs:[r],activeId:r.id,solarHour:9,backgroundColor:'#ffffff',groundColor:'#dddddd'};const restored=parseWorkspace(JSON.stringify(p));expect(restored.roofs[0].arrays).toEqual(r.arrays);expect(needsLayoutUpdate(restored.roofs[0],.5)).toBe(true);expect(restored.sunSettings?.locationMode).toBe('unresolved');});
it('手动移动、复制造成冲突时不能生成完成报告',()=>{
 const r=fixture();r.arrays[0].x=100;
 expect(needsLayoutUpdate(r,.5)).toBe(false);expect(reportReadiness([r],.5)).toEqual([r.name]);
 expect(()=>schemeReport('越界',[r],.5,'data:image/png;base64,AAAA')).toThrow('占地冲突');
 r.arrays[0].x=0;r.arrays.push({...r.arrays[0],id:'copy'});expect(reportReadiness([r],.5)).toEqual([r.name]);
 r.arrays.pop();expect(reportReadiness([r],.5)).toEqual([]);
 const other={...fixture(),id:'other',name:'其他屋面'};expect(reportReadiness([r,other],.5)).toEqual([r.name,other.name]);
});

it('即使布置签名是最新的，新增障碍物冲突仍阻止报告',()=>{
 const r=fixture(),a=r.arrays[0];
 r.obstacles=[{id:'new-obstacle',name:'新增障碍物',kind:'obstacle',x:a.x,z:a.z,width:2,depth:2,height:1,yaw:0}];
 r.layoutSignature=layoutSignatureFor(r,.5);
 expect(needsLayoutUpdate(r,.5)).toBe(false);
 expect(reportReadiness([r],.5)).toEqual([r.name]);
 expect(()=>schemeReport('冲突',[r],.5,'data:image/png;base64,AAAA')).toThrow('占地冲突');
 r.obstacles=[];r.layoutSignature=layoutSignatureFor(r,.5);
 expect(reportReadiness([r],.5)).toEqual([]);
});
