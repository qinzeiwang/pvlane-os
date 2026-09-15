/** Immutable snapshots; one interaction token merges typing or dragging into one step. */
export class UndoHistory<T>{
 past:T[]=[];future:T[]=[];private group:unknown=null;
 constructor(public present:T,private equal:(a:T,b:T)=>boolean,private limit=50){}
 record(next:T,group:unknown=null){
  if(this.equal(this.present,next)){this.present=next;return false;}
  if(group===null||group!==this.group){this.past.push(this.present);if(this.past.length>this.limit)this.past.shift();}
  this.present=next;this.group=group;this.future=[];return true;
 }
 undo(){const next=this.past.pop();if(next===undefined)return;this.future.push(this.present);this.present=next;this.group=null;return next;}
 redo(){const next=this.future.pop();if(next===undefined)return;this.past.push(this.present);this.present=next;this.group=null;return next;}
 reset(next:T){this.present=next;this.past=[];this.future=[];this.group=null;}
}
