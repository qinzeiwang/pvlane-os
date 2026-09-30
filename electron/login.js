const form = document.getElementById('login');
const button = document.getElementById('submit');
const error = document.getElementById('error');
const firstUse = document.getElementById('first-use');
const username = document.getElementById('username');
let activated = false;
const licenseDialog = document.getElementById('license-dialog');
document.getElementById('license-close').addEventListener('click', () => licenseDialog.close());
for (const link of document.querySelectorAll('[data-license]')) link.addEventListener('click', async () => {
  const chinese = link.dataset.license === 'zh';
  document.getElementById('license-title').textContent = chinese ? '中文许可说明' : 'English License';
  document.getElementById('license-text').textContent = '正在读取…';
  licenseDialog.showModal();
  try {
    const response = await fetch(chinese ? '/license-zh.md' : '/license-en.md');
    if (!response.ok) throw new Error();
    document.getElementById('license-text').textContent = await response.text();
  } catch { document.getElementById('license-text').textContent = '无法读取许可条款，请重新启动程序'; }
});

window.pvlaneDesktop.status().then(result => {
  activated = result.activated;
  firstUse.hidden = activated;
  username.required = !activated;
  button.disabled = false;
  if (!activated) username.focus();
}).catch(() => { error.textContent = '无法读取本机验证状态，请关闭程序后重试'; });

form.addEventListener('submit', async event => {
  event.preventDefault(); button.disabled = true; error.textContent = '';
  try {
    if (!activated) {
      const result = await window.pvlaneDesktop.activate(username.value);
      if (!result.ok) { error.textContent = result.message; button.disabled = false; return; }
      activated = true;
    }
    await window.pvlaneDesktop.enter();
  } catch { error.textContent = '无法进入工作台，请关闭程序后重试'; button.disabled = false; }
});
