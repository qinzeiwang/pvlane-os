const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { usernameDigest } = require('./access.cjs');
const { hasLocalActivation, saveLocalActivation } = require('./activation.cjs');

const user = 'PV-ABCD-EFGH-JKLM';
const hashes = [usernameDigest(user)];

test('first successful activation survives restart without storing the username', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'pvlane-activation-'));
  try {
    assert.equal(await hasLocalActivation(directory, hashes), false);
    await saveLocalActivation(directory, user.toLowerCase(), hashes);
    assert.equal(await hasLocalActivation(directory, hashes), true);
    assert.equal(await hasLocalActivation(directory, [usernameDigest('PV-WXYZ-2345-6789')]), false);
    const record = await fs.readFile(path.join(directory, 'activation.json'), 'utf8');
    assert.equal(record.includes(user), false);
    assert.equal(record.includes(user.toLowerCase()), false);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

test('invalid names and malformed local state cannot unlock the app', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'pvlane-activation-'));
  try {
    await assert.rejects(saveLocalActivation(directory, 'PV-ABCD-EFGH-JKLN', hashes));
    assert.equal(await hasLocalActivation(directory, hashes), false);
    await fs.writeFile(path.join(directory, 'activation.json'), '{not json');
    assert.equal(await hasLocalActivation(directory, hashes), false);
    await fs.writeFile(path.join(directory, 'activation.json'), JSON.stringify({ version: 2, usernameHash: hashes[0] }));
    assert.equal(await hasLocalActivation(directory, hashes), false);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
