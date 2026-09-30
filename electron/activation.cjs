const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { isAllowedUsername, usernameDigest } = require('./access.cjs');

const activationFile = directory => path.join(directory, 'activation.json');

async function hasLocalActivation(directory, hashes) {
  try {
    const content = await fs.readFile(activationFile(directory), 'utf8');
    if (Buffer.byteLength(content, 'utf8') > 512) return false;
    const record = JSON.parse(content);
    return record?.version === 1 && typeof record.usernameHash === 'string'
      && hashes.includes(record.usernameHash);
  } catch {
    return false;
  }
}

async function saveLocalActivation(directory, username, hashes) {
  if (!isAllowedUsername(username, hashes)) throw new Error('用户名无效');
  await fs.mkdir(directory, { recursive: true });
  const destination = activationFile(directory);
  const temporary = destination + '.' + randomUUID() + '.tmp';
  try {
    await fs.writeFile(temporary, JSON.stringify({ version: 1, usernameHash: usernameDigest(username) }), { flag: 'wx', mode: 0o600 });
    await fs.rename(temporary, destination);
  } finally {
    await fs.unlink(temporary).catch(() => {});
  }
}

module.exports = { hasLocalActivation, saveLocalActivation };
