import {it,expect} from 'vitest';
import {newRoof} from './roof-project';
import {initial} from './domain';
import {layoutSignatureFor,needsLayoutUpdate} from './layout-state';
import {parseWorkspace} from './workspace-file';
import {schemeReport,reportReadiness} from './scheme-report';
function fixture(){const r=newRoof('屋面 A');r.arrays=[{...initial,id:'a',name:'a',module:r.moduleSpec}];r.layoutSignature=layoutSignatureFor(r,.5);return r;}
it('保存打开保留完成和待更新状态',()=>{
 const r=fixture();const p={version:3,name:'项目',roofs:[r],activeId:r.id,globalEdge:.5,solarHour:9,backgroundColor:'#ffffff',groundColor:'#dddddd'};
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
