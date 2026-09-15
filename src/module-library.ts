import {defaultModule,type ModuleSpec,validModule} from './domain';

export type ModuleCatalogItem={id:string;name:string;spec:ModuleSpec};
export const standardModuleId='module-standard-default';

export function defaultModuleCatalog():ModuleCatalogItem[]{
 return [
  {id:standardModuleId,name:`标准组件 ${defaultModule.power} Wp`,spec:{...defaultModule,kind:'standard'}},
 ];
}

export const sameModule=(a:ModuleSpec,b:ModuleSpec)=>
 (a.kind??'standard')===(b.kind??'standard')&&a.power===b.power&&a.length===b.length&&a.width===b.width&&a.gap===b.gap;

export function catalogFromModules(modules:ModuleSpec[]):ModuleCatalogItem[]{
 const result:ModuleCatalogItem[]=[];
 for(const spec of modules){
  if(result.some(item=>sameModule(item.spec,spec)))continue;
  const kind=spec.kind??'standard';
  result.push({id:`module-${result.length+1}`,name:`标准组件 ${spec.power} Wp`,spec:{...spec,kind}});
 }
 return result.length?result:defaultModuleCatalog();
}

export function parseModuleCatalog(value:unknown,fallback:ModuleSpec[]):ModuleCatalogItem[]{
 if(value===undefined)return catalogFromModules(fallback);
 if(!Array.isArray(value)||!value.length||value.length>50)throw new Error('组件库数量无效');
 const items=value as ModuleCatalogItem[];
 if(new Set(items.map(item=>item?.id)).size!==items.length)throw new Error('组件库标识重复');
 for(const item of items){
  if(!item||typeof item.id!=='string'||!item.id||item.id.includes('/')||typeof item.name!=='string'||!item.name.trim()||item.name.length>80||!item.spec||!validModule(item.spec))throw new Error('组件库参数无效');
 }
 return items.map(item=>({...item,name:item.name.trim(),spec:{...item.spec,kind:item.spec.kind??'standard'}}));
}
