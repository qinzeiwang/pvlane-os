import { afterEach, expect, it, vi } from 'vitest';
import { downloadWorkspace, type WorkspaceFile } from './workspace-file';
import { downloadScheme } from './scheme-report';
afterEach(()=>vi.unstubAllGlobals());
it('desktop project save passes complete JSON and preserves cancellation',async()=>{
  const saveFile=vi.fn().mockResolvedValue('方案.json');
  vi.stubGlobal('window',{pvlaneDesktop:{saveFile}});
  const workspace={name:'方案',version:3,roofs:[]} as unknown as WorkspaceFile;
  expect(await downloadWorkspace(workspace)).toBe('方案.json');
  expect(saveFile).toHaveBeenCalledWith('project','方案.json',JSON.stringify(workspace));
  saveFile.mockResolvedValue(null);
  expect(await downloadWorkspace(workspace)).toBeNull();
});
it('desktop report save distinguishes success, cancellation, and write failure',async()=>{
  const saveFile=vi.fn().mockResolvedValue('报告.html');
  vi.stubGlobal('window',{pvlaneDesktop:{saveFile}});
  expect(await downloadScheme('<html>报告</html>','方案')).toBe(true);
  expect(saveFile).toHaveBeenCalledWith('report','方案-方案报告.html','<html>报告</html>');
  saveFile.mockResolvedValue(null);
  expect(await downloadScheme('html','方案')).toBe(false);
  saveFile.mockRejectedValue(new Error('磁盘写入失败'));
  await expect(downloadScheme('html','方案')).rejects.toThrow('磁盘写入失败');
});
