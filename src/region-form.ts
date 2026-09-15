import type {RoofDesign} from './roof-project';
import {defaultPitch} from './pitched-roof';
export type RegionForm='flat'|'single'|'gable';
export function applyRegionForm(region:RoofDesign,form:RegionForm):RoofDesign{ return {...region,pitch:form==='flat'?undefined:{...(region.pitch??defaultPitch),kind:form}}; }
