import {projectStatistics} from './project-statistics';
import {needsLayoutUpdate} from './layout-state';
import type {RoofDesign} from './roof-project';
export const escapeHtml=(v:unknown)=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function reportReadiness(roofs:RoofDesign[],edge:number){return roofs.filter(r=>needsLayoutUpdate(r,edge)).map(r=>r.name);}
export function schemeReport(name:string,roofs:RoofDesign[],edge:number,picture:string,address=""){
 if(!roofs.length||reportReadiness(roofs,edge).length)throw new Error('请先完成所有屋面布置并更新参数');
 if(!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(picture))throw new Error('三维图像尚未准备好');
 const {regions,total}=projectStatistics(roofs),e=escapeHtml,f=(n:number)=>n.toFixed(2);
 const cells=(r:typeof total)=>`<td>${f(r.roofArea)}</td><td>${r.count}</td><td>${f(r.capacity)}</td><td>${f(r.occupiedArea)}</td>`;
 return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(name)} · 装机量报告</title><style>body{font:14px/1.6 "Segoe UI","Microsoft YaHei",sans-serif;color:#29343d;max-width:1100px;margin:36px auto;padding:0 24px}header{display:flex;justify-content:space-between;border-bottom:1px solid #dce2e7;padding-bottom:14px}.brand{font-family:Bahnschrift,sans-serif;letter-spacing:2px;color:#284b42;font-weight:600}h1{font-size:25px}h2{font-size:18px;margin-top:28px}img{width:100%;max-height:480px;object-fit:contain}table{width:100%;border-collapse:collapse;font-size:13px}td,th{padding:10px;border-bottom:1px solid #dce2e7;text-align:right}td:first-child,th:first-child{text-align:left}thead,tfoot{background:#eef3f0}tfoot{font-weight:600}small{color:#667085}button{padding:8px 14px}@media print{button{display:none}body{margin:0;padding:0}thead{display:table-header-group}tr,img{break-inside:avoid}@page{size:A4 landscape;margin:15mm}}</style><header><span class="brand">PVLANE</span><button onclick="window.print()">打印 / 保存为 PDF</button></header><h1>${e(name)} · 装机量报告</h1>${address?`<p>${e(address)}</p>`:''}<p>${e(new Date().toLocaleDateString('zh-CN'))}</p><h2>三维布置效果</h2><img alt="当前三维方案视图" src="${picture}"><h2>屋面明细与项目合计</h2><table><thead><tr><th>屋面</th><th>屋面面积 ㎡</th><th>光伏数量 块</th><th>光伏装机量 kWp</th><th>光伏占用面积 ㎡</th></tr></thead><tbody>${regions.map(r=>`<tr><td>${e(r.name)}</td>${cells(r)}</tr>`).join('')}</tbody><tfoot><tr><td>合计</td>${cells(total)}</tr></tfoot></table><p><small>屋面面积按坡面展开面积计算，包含障碍物和禁布区所在范围；光伏占用面积为组件投影到屋面上的面积合计，不含组件间隙和检修通道。数量与装机量按当前布置统计。此报告用于前期方案估算。</small></p></html>`;
}
export async function downloadScheme(html:string,name:string){
 const picker=(window as unknown as {showSaveFilePicker?:(options:unknown)=>Promise<{createWritable:()=>Promise<{write:(data:Blob)=>Promise<void>;close:()=>Promise<void>}>}>}).showSaveFilePicker;
 if(!picker)throw new Error('当前浏览器不支持选择保存位置，请在 Chrome 或 Edge 中下载报告。');
 try{
  const handle=await picker.call(window,{suggestedName:(name.replace(/[\\/:*?"<>|]/g,'_')||'光伏方案')+'-方案报告.html',types:[{description:'方案报告 HTML',accept:{'text/html':['.html']}}],excludeAcceptAllOption:true});
  const file=await handle.createWritable();await file.write(new Blob([html],{type:'text/html;charset=utf-8'}));await file.close();return true;
 }catch(e){if(e instanceof DOMException&&e.name==='AbortError')return false;throw e;}
}
