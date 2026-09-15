import {it,expect} from 'vitest';
import {newRoof} from './roof-project';
import {applyRegionForm} from './region-form';
it('三种屋面形式保持标准组件与原参数',()=>{const r=newRoof();for(const form of ['flat','single','gable'] as const){const next=applyRegionForm(r,form);expect(next.pitch?.kind).toBe(form==='flat'?undefined:form);expect(next.moduleSpec).toEqual(r.moduleSpec);}});
