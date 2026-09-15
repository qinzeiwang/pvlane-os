import {expect,it} from 'vitest';
import {catalogFromModules,parseModuleCatalog} from './module-library';
import {newRoof} from './roof-project';
import {parseWorkspace} from './workspace-file';
import {autoLayout} from './auto-layout';
import {layoutSignatureFor} from './layout-state';

it('旧项目按完整规格合并，保留相同功率的不同尺寸及功率',()=>{
 const spec=newRoof().moduleSpec;
 const items=catalogFromModules([spec,{...spec},{...spec,width:1.2},{...spec,power:650}]);
 expect(items).toHaveLength(3);
});
it('拒绝空白名称、重复标识和缺失规格',()=>{
 const item=catalogFromModules([newRoof().moduleSpec])[0];
 for(const invalid of [[null],[{...item,spec:undefined}],[{...item,name:' '}],[item,item]])expect(()=>parseModuleCatalog(invalid,[])).toThrow();
});
it('组件库和区域关联可保存重开，修改规格保留旧布置并提示更新',()=>{
 const r=newRoof(),moduleCatalog=catalogFromModules([r.moduleSpec]);r.moduleId=moduleCatalog[0].id;
 r.arrays=autoLayout(r.roof,[],{...r.layoutOptions,module:r.moduleSpec}).arrays;r.layoutSignature=layoutSignatureFor(r,.5);
 const oldArrays=structuredClone(r.arrays),oldSignature=r.layoutSignature;
 moduleCatalog[0].spec.power=650;r.moduleSpec={...moduleCatalog[0].spec};
 const p={version:3,name:'组件库测试',roofs:[r],moduleCatalog,activeId:r.id,globalEdge:.5,solarHour:9,backgroundColor:'#dce5ec',groundColor:'#c7cccb'};
 const loaded=parseWorkspace(JSON.stringify(p));
 expect(loaded.moduleCatalog).toEqual(moduleCatalog);expect(loaded.roofs[0].moduleSpec.power).toBe(650);
 expect(loaded.roofs[0].arrays).toEqual(oldArrays);expect(layoutSignatureFor(loaded.roofs[0],.5)).not.toBe(oldSignature);
 expect(()=>parseWorkspace(JSON.stringify({...p,moduleCatalog:[{...moduleCatalog[0],spec:{...r.moduleSpec,power:700}}]}))).toThrow('不一致');
});
