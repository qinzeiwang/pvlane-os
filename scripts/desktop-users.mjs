import { randomInt } from 'node:crypto';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
const { usernameDigest } = createRequire(import.meta.url)('../electron/access.cjs');
const dir = path.resolve('.desktop-private');
await mkdir(dir, { recursive: true });
try { await access(path.join(dir, 'allowed-users.json')); console.log('Existing usernames preserved. See .desktop-private/usernames.txt'); }
catch {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const users = new Set();
  while (users.size < 20) users.add('PV-' + Array.from({length:3}, () => Array.from({length:4}, () => alphabet[randomInt(alphabet.length)]).join('')).join('-'));
  await writeFile(path.join(dir, 'usernames.txt'), 'PVLANE 离线版用户名（仅分发人保管）\n每位使用者只分配一个用户名；不要将整张表随程序分发。\n\n' + [...users].map((u,i) => `${String(i+1).padStart(2,'0')}. ${u}`).join('\n') + '\n', { flag:'wx' });
  await writeFile(path.join(dir, 'allowed-users.json'), JSON.stringify({ hashes:[...users].map(usernameDigest) },null,2) + '\n', { flag:'wx' });
  console.log('Generated 20 usernames in .desktop-private/usernames.txt');
}
