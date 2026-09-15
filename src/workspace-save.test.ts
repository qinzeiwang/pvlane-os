import { afterEach,expect,it,vi } from 'vitest';
import { downloadWorkspace,type WorkspaceFile } from './workspace-file';
const project={name:'测试方案',version:3,roofs:[]} as unknown as WorkspaceFile;
afterEach(()=>vi.unstubAllGlobals());
it('选择位置后写入完整 JSON，关闭成功才返回文件名',async()=>{
 const write=vi.fn().mockResolvedValue(undefined),close=vi.fn().mockResolvedValue(undefined);
 const picker=vi.fn().mockResolvedValue({name:'方案.json',createWritable:async()=>({write,close})});
 vi.stubGlobal('window',{showSaveFilePicker:picker});
 expect(await downloadWorkspace(project)).toBe('方案.json');
 expect(picker.mock.calls[0][0].suggestedName).toBe('测试方案.json');
 expect(JSON.parse(await write.mock.calls[0][0].text())).toEqual(project);
 expect(close).toHaveBeenCalledOnce();
});
it('取消位置选择不写文件',async()=>{
 vi.stubGlobal('window',{showSaveFilePicker:async()=>{throw new DOMException('取消','AbortError');}});
 expect(await downloadWorkspace(project)).toBeNull();
});
it('写入失败不会报告保存成功',async()=>{
 vi.stubGlobal('window',{showSaveFilePicker:async()=>({createWritable:async()=>({write:async()=>{throw new Error('磁盘写入失败');},close:vi.fn()})})});
 await expect(downloadWorkspace(project)).rejects.toThrow('磁盘写入失败');
});
it('不支持选择位置时明确提示，不静默下载',async()=>{
 vi.stubGlobal('window',{});await expect(downloadWorkspace(project)).rejects.toThrow('选择保存位置');
});
