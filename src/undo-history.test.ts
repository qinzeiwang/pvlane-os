import {expect,it} from 'vitest';
import {UndoHistory} from './undo-history';
it('输入和拖动按交互合并，独立操作不合并',()=>{
 const h=new UndoHistory(0,(a,b)=>a===b),drag={};
 h.record(1,drag);h.record(2,drag);h.record(3,drag);expect(h.past).toEqual([0]);
 h.record(4,{});expect(h.undo()).toBe(3);expect(h.undo()).toBe(0);
 expect(h.redo()).toBe(3);expect(h.redo()).toBe(4);
});
it('撤销后新操作清空重做，重复值和选择不产生历史',()=>{
 const h=new UndoHistory({n:0,selected:'a'},(a,b)=>a.n===b.n);
 h.record({n:0,selected:'b'});expect(h.past).toHaveLength(0);
 h.record({n:1,selected:'b'});expect(h.undo()).toEqual({n:0,selected:'b'});
 h.record({n:2,selected:'b'});expect(h.redo()).toBeUndefined();
});
it('新项目清空历史且限制快照数量',()=>{
 const h=new UndoHistory(0,(a,b)=>a===b,3);
 for(let i=1;i<=5;i++)h.record(i);
 expect(h.past).toEqual([2,3,4]);h.reset(9);expect(h.undo()).toBeUndefined();expect(h.redo()).toBeUndefined();expect(h.present).toBe(9);
});
