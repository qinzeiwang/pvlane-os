import { afterEach, describe, expect, it, vi } from 'vitest';
import { bindPointer } from './domain';

afterEach(()=>vi.unstubAllGlobals());

function setup() {
  vi.stubGlobal('window',new EventTarget());
  const captured = new Set<number>();
  const canvas = Object.assign(new EventTarget(), {
    style: {cursor:''},
    setPointerCapture:(id:number)=>captured.add(id),
    hasPointerCapture:(id:number)=>captured.has(id),
    releasePointerCapture:(id:number)=>captured.delete(id),
  });
  let panMode=false;
  const api={point:(x:number,y:number)=>({x,z:y}),hit:()=> 'array',position:()=>({x:0,z:0}),
    select:vi.fn(),move:vi.fn(),mode:()=> 'top' as const,panMode:()=>panMode,orbit:vi.fn(),pan:vi.fn(),zoom:vi.fn()};
  const bind=()=>bindPointer(canvas as unknown as HTMLCanvasElement,api);
  const pointer=(type:string,x=0,y=0,button=0)=>canvas.dispatchEvent(Object.assign(new Event(type,{cancelable:true}),{pointerId:1,clientX:x,clientY:y,button}));
  return {canvas,api,bind,pointer,setPan:(value:boolean)=>{panMode=value;}};
}

describe('画布选择与平移模式',()=>{
  it('默认左键选择并移动组件，结束后恢复箭头',()=>{
    const s=setup(),dispose=s.bind();
    expect(s.canvas.style.cursor).toBe('default');
    s.pointer('pointerdown');s.pointer('pointermove',10,20);s.pointer('pointerup');
    expect(s.api.select).toHaveBeenCalledWith('array');
    expect(s.api.move).toHaveBeenCalledWith('array',10,20);
    expect(s.api.pan).not.toHaveBeenCalled();
    expect(s.canvas.style.cursor).toBe('default');dispose();
  });
  it('显式开启平移才用小手，退出会取消拖动并恢复选择',()=>{
    const s=setup();s.setPan(true);let dispose=s.bind();
    expect(s.canvas.style.cursor).toBe('grab');
    s.pointer('pointerdown');s.pointer('pointermove',10,20);
    expect(s.api.pan).toHaveBeenCalledWith(-10,-20);
    expect(s.api.select).not.toHaveBeenCalled();
    s.setPan(false);dispose();dispose=s.bind();
    expect(s.canvas.hasPointerCapture(1)).toBe(false);
    expect(s.canvas.style.cursor).toBe('default');
    s.pointer('pointermove',20,30);expect(s.api.pan).toHaveBeenCalledTimes(1);
    s.pointer('pointerdown');s.pointer('pointerup');expect(s.api.select).toHaveBeenCalledWith('array');dispose();
  });
  it('中键临时平移不改变默认选择模式',()=>{
    const s=setup(),dispose=s.bind();
    s.pointer('pointerdown',0,0,1);s.pointer('pointermove',10,20);s.pointer('pointerup');
    expect(s.api.pan).toHaveBeenCalledWith(-10,-20);
    expect(s.canvas.style.cursor).toBe('default');
    s.pointer('pointerdown');expect(s.api.select).toHaveBeenCalledWith('array');dispose();
  });
});
