import {expect, it} from 'vitest';
import {autoLayout} from './auto-layout';
import {newRoof} from './roof-project';
import {defaultPitch} from './pitched-roof';
import {parseWorkspace} from './workspace-file';

for(const kind of ['flat','single','gable'] as const){
  it(`${kind}: rejects unsavable layout rules before calculating`,()=>{
    const r=newRoof();
    if(kind!=='flat')r.pitch={...defaultPitch,kind};
    for(const patch of [{gap:21},{edge:21},{rowGap:101},{tilt:61},{gap:NaN},{maxColumns:1.5}]){
      r.layoutOptions={...newRoof().layoutOptions,...patch};
      expect(()=>autoLayout(r.roof,[],{...r.layoutOptions,pitch:r.pitch})).toThrow('排布规则无效');
      expect(()=>parseWorkspace(JSON.stringify({version:3,name:'边界测试',roofs:[r],activeId:r.id,solarHour:9,backgroundColor:'#ffffff',groundColor:'#dddddd'}))).toThrow('排布规则无效');
    }
  });
  it(`${kind}: accepted boundary parameters survive project roundtrip`,()=>{
    const r=newRoof();
    if(kind!=='flat')r.pitch={...defaultPitch,kind};
    r.layoutOptions={...r.layoutOptions,gap:20,rowGap:100};
    r.arrays=autoLayout(r.roof,[],{...r.layoutOptions,pitch:r.pitch,module:r.moduleSpec}).arrays;
    const restored=parseWorkspace(JSON.stringify({version:3,name:'边界测试',roofs:[r],activeId:r.id,solarHour:9,backgroundColor:'#ffffff',groundColor:'#dddddd'}));
    expect(restored.roofs[0].arrays).toEqual(r.arrays);
    expect(restored.roofs[0].layoutOptions).toEqual(r.layoutOptions);
  });
}
