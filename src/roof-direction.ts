import type {RoofPitch} from './pitched-roof';
export function turnPitch(p:RoofPitch):RoofPitch{
 if(p.kind==='gable')return {...p,axis:p.axis==='x'?'z':'x'};
 return {...p,axis:p.axis==='x'?'z':'x',high:p.axis==='z'?-p.high as 1|-1:p.high};
}
export function pitchSegments(width:number,depth:number,p:RoofPitch):number[][]{
 if(p.kind==='gable')return [p.axis==='z'?[-width*.4,0,width*.4,0]:[0,-depth*.4,0,depth*.4]];
 const length=4.5,widthOfArrow=.65;
 const map=(u:number,v:number)=>p.axis==='z'?[u,v*-p.high]:[v*-p.high,u];
 const high=map(0,-length/2),low=map(0,length/2),corner=map(widthOfArrow,-length/2);
 return [[...high,...low],[...low,...corner],[...corner,...high]];
}
