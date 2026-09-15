import {it,expect} from 'vitest';
import {autoLayout} from './auto-layout';
import {defaultPitch} from './pitched-roof';
import {defaultModule,detect} from './domain';
it('标准组件在三种屋面均可布置',()=>{for(const pitch of [undefined,defaultPitch,{...defaultPitch,kind:'gable' as const}]){const roof={width:30,depth:20};const r=autoLayout(roof,[],{portrait:true,tilt:15,edge:.5,gap:.6,maxColumns:4,tableRows:3,pitch,module:defaultModule});expect(r.count).toBeGreaterThan(0);expect(detect(r.arrays,[],roof)).toEqual([]);expect(r.arrays.every(a=>a.rows<=3)).toBe(true);}});
