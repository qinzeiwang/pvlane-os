import type {RoofDesign} from './roof-project';
import {defaultPitch} from './pitched-roof';
export type RegionForm='flat'|'single'|'gable'|'polygon';
export function applyRegionForm(region:RoofDesign,form:RegionForm):RoofDesign{
 const kind=form==='polygon'?'flat':form;
 if(region.roof.outline&&kind!=='flat')throw new Error('多段线轮廓仅支持平屋面');
 return {
  ...region,
  layoutOptions:{...region.layoutOptions,tableRows:Math.min(kind==='gable'?6:3,region.layoutOptions.tableRows??1)},
  pitch:kind==='flat'?undefined:{...(region.pitch??defaultPitch),kind},
 };
}
