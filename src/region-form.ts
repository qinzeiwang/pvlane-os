import type {RoofDesign} from './roof-project';
import {defaultPitch} from './pitched-roof';
export type RegionForm='flat'|'single'|'gable';
export function applyRegionForm(region:RoofDesign,form:RegionForm):RoofDesign{ if(region.roof.outline&&form!=='flat')throw new Error('多段线轮廓仅支持平屋面'); return {...region,layoutOptions:{...region.layoutOptions,tableRows:Math.min(form==='gable'?6:3,region.layoutOptions.tableRows??1)},pitch:form==='flat'?undefined:{...(region.pitch??defaultPitch),kind:form}}; }
