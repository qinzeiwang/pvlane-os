const { app, BrowserWindow, Menu, dialog, ipcMain, protocol, session } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { isAllowedUsername } = require('./access.cjs');
const { hasLocalActivation, saveLocalActivation } = require('./activation.cjs');

protocol.registerSchemesAsPrivileged([{ scheme: 'pvlane', privileges: {
  standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, codeCache: true,
} }]);
app.setName('PVLANE Offline');
app.setPath('userData', path.join(app.getPath('appData'), 'PVLANE-Offline'));
const origin = 'pvlane://app';
let mainWindow, activated = false, authorized = false, hashes = [], lastAttempt = 0, saving = false;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.bcmap': 'application/octet-stream' };
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' data: blob:; worker-src 'self' blob:; frame-src 'self' about: blob:; object-src 'none'; base-uri 'none'; form-action 'none'";

function trusted(event, requireAuth = true) {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== event.sender.mainFrame
    || !event.senderFrame.url.startsWith(origin + '/') || (requireAuth && !authorized)) throw new Error('访问未授权');
}
function safeName(value, extension) {
  const clean = String(value || 'PVLANE').replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').slice(0,100);
  return clean.toLowerCase().endsWith(extension) ? clean : clean + extension;
}
function validateText(value, limit) {
  if (typeof value !== 'string' || Buffer.byteLength(value, 'utf8') > limit) throw new Error('文件内容无效或超过大小限制');
}
async function atomicWrite(destination, content) {
  const temporary = destination + '.pvlane-' + require('node:crypto').randomUUID() + '.tmp';
  try { await fs.writeFile(temporary, content, { flag: 'wx' }); await fs.rename(temporary, destination); }
  finally { await fs.unlink(temporary).catch(() => {}); }
}

async function start() {
  hashes = JSON.parse(await fs.readFile(path.join(__dirname, 'allowed-users.json'), 'utf8')).hashes;
  if (!Array.isArray(hashes) || hashes.length !== 20) throw new Error('离线用户名配置无效');
  activated = await hasLocalActivation(app.getPath('userData'), hashes);
  protocol.handle('pvlane', async request => {
    try {
      const url = new URL(request.url);
      if (url.host !== 'app' || request.method !== 'GET') return new Response('Forbidden', { status: 403 });
      const resource = decodeURIComponent(url.pathname);
      const loginFiles = { '/login.html': 'login.html', '/login.css': 'login.css', '/login.js': 'login.js', '/logo.svg': 'logo.svg' };
      const licenseFiles = { '/license-en.md': 'LICENSE.md', '/license-zh.md': 'LICENSE.zh-CN.md' };
      const loginFile = loginFiles[resource];
      const licenseFile = licenseFiles[resource];
      if (!loginFile && !licenseFile && !authorized) return new Response('Unauthorized', { status: 401 });
      const root = loginFile ? __dirname : licenseFile ? app.getAppPath() : path.join(app.getAppPath(), 'dist');
      const target = path.resolve(root, loginFile || licenseFile || '.' + (resource === '/' ? '/index.html' : resource));
      if (!target.startsWith(root + path.sep)) return new Response('Forbidden', { status: 403 });
      return new Response(await fs.readFile(target), { headers: {
        'Content-Type': path.extname(target) === '.md' ? 'text/plain; charset=utf-8' : mime[path.extname(target)] || 'application/octet-stream',
        'Content-Security-Policy': csp, 'X-Content-Type-Options': 'nosniff',
      } });
    } catch { return new Response('Not found', { status: 404 }); }
  });
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (_request, callback) => callback({ cancel: true }));
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  ipcMain.handle('desktop:status', event => {
    trusted(event, false);
    return { activated };
  });
  ipcMain.handle('desktop:activate', async (event, username) => {
    trusted(event, false);
    const now = Date.now();
    if (now - lastAttempt < 500) return { ok: false, message: '请稍候再试' };
    lastAttempt = now;
    if (!isAllowedUsername(username, hashes)) return { ok: false, message: '用户名无效，请使用分配给你的用户名' };
    await saveLocalActivation(app.getPath('userData'), username, hashes);
    activated = true;
    return { ok: true };
  });
  ipcMain.handle('desktop:enter', event => {
    trusted(event, false);
    if (!activated) throw new Error('请先输入有效的用户名');
    authorized = true;
    setImmediate(() => mainWindow.loadURL(origin + '/index.html'));
    return true;
  });
  ipcMain.handle('desktop:save', async (event, payload) => {
    trusted(event);
    if (saving) throw new Error('请先完成当前保存');
    if (!payload || !['project', 'report'].includes(payload.kind)) throw new Error('不支持的文件类型');
    validateText(payload.content, 120000000);
    if (payload.kind === 'project') JSON.parse(payload.content);
    const ext = payload.kind === 'project' ? '.json' : '.html';
    saving = true;
    try {
      const result = await dialog.showSaveDialog(mainWindow, { title: payload.kind === 'project' ? '保存光伏项目' : '保存方案报告', defaultPath: path.join(app.getPath('documents'), safeName(payload.suggestedName, ext)), filters: [{ name: payload.kind === 'project' ? '光伏项目 JSON' : '方案报告 HTML', extensions: [ext.slice(1)] }] });
      if (result.canceled || !result.filePath) return null;
      await atomicWrite(result.filePath, payload.content);
      return path.basename(result.filePath);
    } finally { saving = false; }
  });
  ipcMain.handle('desktop:pdf', async (event, payload) => {
    trusted(event);
    if (saving) throw new Error('请先完成当前保存');
    validateText(payload?.html, 120000000);
    saving = true;
    let printWindow;
    try {
      const result = await dialog.showSaveDialog(mainWindow, { title: '保存 PDF 报告', defaultPath: path.join(app.getPath('documents'), safeName(payload.name, '.pdf')), filters: [{ name: 'PDF 报告', extensions: ['pdf'] }] });
      if (result.canceled || !result.filePath) return null;
      const printSession = session.fromPartition('pvlane-print');
      printSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (_r, callback) => callback({ cancel: true }));
      printWindow = new BrowserWindow({ show: false, webPreferences: { session: printSession, sandbox: true, contextIsolation: true, nodeIntegration: false, javascript: false } });
      printWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
      await printWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(payload.html));
      const pdf = await printWindow.webContents.printToPDF({ landscape: true, printBackground: true, pageSize: 'A4', preferCSSPageSize: true });
      await atomicWrite(result.filePath, pdf);
      return path.basename(result.filePath);
    } finally { printWindow?.destroy(); saving = false; }
  });
  Menu.setApplicationMenu(null);
  mainWindow = new BrowserWindow({ title: 'PVLANE · 离线版', width: 1440, height: 960, minWidth: 1024, minHeight: 720, backgroundColor: '#f7f7f8',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), sandbox: true, contextIsolation: true, nodeIntegration: false, devTools: !app.isPackaged, spellcheck: false } });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => { if (url !== origin + '/index.html' && url !== origin + '/login.html') event.preventDefault(); });
  await mainWindow.loadURL(origin + '/login.html');
  mainWindow.show();
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.show(); mainWindow.focus(); } });
  app.whenReady().then(start).catch(error => { dialog.showErrorBox('PVLANE 无法启动', error.message); app.quit(); });
  app.on('window-all-closed', () => app.quit());
}
