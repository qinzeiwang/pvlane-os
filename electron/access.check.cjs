const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedUsername, usernameDigest } = require('./access.cjs');
const user = 'PV-ABCD-EFGH-JKLM';
test('only allocated names activate, ignoring case and surrounding spaces', () => {
  const hashes = [usernameDigest(user)];
  assert.equal(isAllowedUsername(user, hashes), true);
  assert.equal(isAllowedUsername('  pv-abcd-efgh-jklm  ', hashes), true);
  for (const invalid of ['', null, {}, 'PV-ABCD-EFGH-JKLN', 'qinzeiwang', user + 'X']) assert.equal(isAllowedUsername(invalid, hashes), false);
});
test('malformed authorization data fails closed', () => {
  assert.equal(isAllowedUsername(user, ['oops', 'x'.repeat(64), null]), false);
});
