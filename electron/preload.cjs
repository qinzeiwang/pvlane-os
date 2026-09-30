const { contextBridge, ipcRenderer } = require('electron');

if (process.isMainFrame) {
  contextBridge.exposeInMainWorld('pvlaneDesktop', Object.freeze({
    status: () => ipcRenderer.invoke('desktop:status'),
    activate: username => ipcRenderer.invoke('desktop:activate', username),
    enter: () => ipcRenderer.invoke('desktop:enter'),
    saveFile: (kind, suggestedName, content) => ipcRenderer.invoke('desktop:save', { kind, suggestedName, content }),
    exportPdf: (html, name) => ipcRenderer.invoke('desktop:pdf', { html, name }),
  }));
}
