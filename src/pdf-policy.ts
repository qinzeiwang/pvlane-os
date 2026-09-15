export function requireSinglePage(count:number){if(count!==1)throw new Error(`仅支持单页 PDF，当前文件有 ${count} 页。请先导出所需图纸为单页 PDF。`);}
