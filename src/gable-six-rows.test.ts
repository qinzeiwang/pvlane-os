import {it,expect} from 'vitest';
import {autoLayout} from './auto-layout';
import {newRoof} from './roof-project';
import {defaultPitch} from './pitched-roof';
import {parseWorkspace} from './workspace-file';
import {defaultSunSettings} from './sun-position';
import {applyRegionForm} from './region-form';
import {validLayoutOptions} from './layout-validation';
it('calculates, saves and reopens six-row gable arrays in both axes and orientations',()=>{
 for(const axis of ['x','z'] as const)for(const portrait of [true,false]){
 const pitch={...defaultPitch,kind:'gable' as const,axis};const r={...newRoof(),roof:{width:60,depth:50},pitch};
 r.layoutOptions={...r.layoutOptions,portrait,tableRows:6,shadowLatitude:30};
 r.arrays=autoLayout(r.roof,[],{...r.layoutOptions,pitch}).arrays;
 expect(r.arrays.some(a=>a.rows===6)).toBe(true);expect(r.arrays.every(a=>a.rows<=6)).toBe(true);
 const p=parseWorkspace(JSON.stringify({version:3,name:'six rows',sunSettings:{...defaultSunSettings(),latitude:30,longitude:120,locationMode:'manual',coordinateSource:'manual'},roofs:[r],activeId:r.id,solarHour:9,backgroundColor:'#ffffff',groundColor:'#dddddd'}));
 expect(p.roofs[0].layoutOptions.tableRows).toBe(6);expect(p.roofs[0].arrays).toEqual(JSON.parse(JSON.stringify(r.arrays)));
 }
});
it('rejects seven rows and prevents six rows on flat or single roofs',()=>{
 const r=newRoof(),o={...r.layoutOptions,tableRows:6};
 expect(validLayoutOptions({...o,pitch:{...defaultPitch,kind:'gable'}})).toBe(true);
 for(const pitch of [undefined,{...defaultPitch,kind:'single' as const}])expect(()=>autoLayout(r.roof,[],{...o,pitch})).toThrow();
 expect(()=>autoLayout(r.roof,[],{...o,tableRows:7,pitch:{...defaultPitch,kind:'gable'}})).toThrow();
 const six={...r,layoutOptions:o,pitch:{...defaultPitch,kind:'gable' as const}};
 expect(applyRegionForm(six,'flat').layoutOptions.tableRows).toBe(3);expect(applyRegionForm(six,'single').layoutOptions.tableRows).toBe(3);
 const file={version:3,name:'invalid',roofs:[{...six,pitch:undefined}],activeId:r.id,solarHour:9,backgroundColor:'#ffffff',groundColor:'#dddddd'};
 expect(()=>parseWorkspace(JSON.stringify(file))).toThrow('排布规则无效');
});
