import {IconArrowForwardUp,IconForbid,IconCheck,IconBuildingWarehouse,IconHome,IconMap,IconDots,IconAdjustmentsHorizontal,IconPointer,IconArrowLeft,IconTrash,IconPlus,IconFolderOpen,IconDeviceFloppy,IconFileText,IconBox,IconSolarPanel,IconLayoutGrid,IconAngle,IconArrowsHorizontal,IconLayoutGridAdd,IconSun,IconStack2,IconX,IconChevronDown,IconArrowBackUp,IconMaximize,IconInfoCircle,IconMenu2} from '@tabler/icons-react';
import type { CSSProperties } from 'react';
import {IconPhotoPlus,IconEye,IconEyeOff,IconPencil} from '@tabler/icons-react';
export const navigation = [
  { title: '基本信息', tone: 'blue', items: [['project', '项目信息', 'file'], ['roof', '建筑屋面', 'roof'], ['obstacles', '障碍物', 'box']] },
  { title: '阵列设计', tone: 'green', items: [['module', '组件选型', 'module'], ['arrays', '阵列参数', 'grid'], ['angle', '倾角与朝向', 'angle'], ['spacing', '间距设置', 'spacing'], ['layout', '自动排布', 'layout']] },
  { title: '日照设置', tone: 'amber', items: [['shadow', '时段与阴影', 'sun']] },
  { title: '场景设置', tone: 'purple', items: [['display', '材质与辅助线', 'layers']] },
];
// Domain-specific symbols follow Tabler's 24px / 2px outline contract.
const roofPaths:Record<string,string>={
 'slope-direction':'M3 17h18v-5Z',
 'panel-orientation':'M3 4h6v10H3z M13 10h8v6h-8z M5 19h12 M15 17l2 2-2 2',
 'start-edge':'M4 4h16 M12 7v13 M8 16l4 4 4-4',
 'module-direction':'M12 3 20 20 12 16 4 20Z',
 'rotate':'M19 9a7 7 0 1 0 0 6 M19 4v5h-5',
 'roof':'M3 10 12 4l9 6 M5 9v11h14V9 M9 20v-6h6v6',
 'flat-roof':'M3 8h18 M5 8v11h14V8',
 'single-roof':'M3 12 21 6 M5 12v7h14V7',
 'gable-roof':'M3 12 12 6l9 6 M5 11v8h14v-8',
 'box':'M3 3h18v18H3z M7 7h10v10H7z',
 'forbidden':'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2 M5 19 19 5',
};
const icons:Record<string,typeof IconHome>={image:IconPhotoPlus,eye:IconEye,'eye-off':IconEyeOff,redo:IconArrowForwardUp,forbidden:IconForbid,check:IconCheck,site:IconMap,more:IconDots,settings:IconAdjustmentsHorizontal,pointer:IconPointer,back:IconArrowLeft,trash:IconTrash,plus:IconPlus,folder:IconFolderOpen,save:IconDeviceFloppy,file:IconFileText,roof:IconBuildingWarehouse,box:IconBox,module:IconSolarPanel,grid:IconLayoutGrid,angle:IconAngle,spacing:IconArrowsHorizontal,layout:IconLayoutGridAdd,sun:IconSun,layers:IconStack2,close:IconX,chevron:IconChevronDown,reset:IconArrowBackUp,frame:IconMaximize,info:IconInfoCircle,menu:IconMenu2};
export function Icon({name,style}:{name:string;style?:CSSProperties}){
 const Component=name==='edit'?IconPencil:roofPaths[name]?undefined:icons[name];
 return Component?<Component className="ui-icon" style={style} size={24} stroke={2} aria-hidden="true"/>:<svg className="ui-icon" style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={roofPaths[name]??roofPaths['flat-roof']}/></svg>;
}
