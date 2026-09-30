export const MAX_ROOF_SIDE = 200;
export const MIN_ROOF_SIDE = 2;
export const validRoofSize = (r:{width:number;depth:number}) => [r.width,r.depth].every(v=>Number.isFinite(v)&&v>=MIN_ROOF_SIDE&&v<=MAX_ROOF_SIDE);
