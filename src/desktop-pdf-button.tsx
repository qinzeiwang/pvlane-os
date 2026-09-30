import { useState } from 'react';

export function DesktopPdfButton({html,name,onError}:{html:string;name:string;onError:(message:string)=>void}) {
  const [busy,setBusy] = useState(false);
  if (!window.pvlaneDesktop) return null;
  return <button disabled={busy} onClick={async()=>{
    setBusy(true);onError('');
    try { await window.pvlaneDesktop!.exportPdf(html,`${name}-方案报告.pdf`); }
    catch(error) { onError(error instanceof Error?error.message:'PDF 保存失败'); }
    finally { setBusy(false); }
  }}>{busy?'正在导出 PDF…':'保存 PDF…'}</button>;
}
