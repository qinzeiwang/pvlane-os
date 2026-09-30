const { createHash, timingSafeEqual } = require('node:crypto');

function normalizeUsername(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : '';
}
function usernameDigest(value) {
  return createHash('sha256').update(normalizeUsername(value)).digest('hex');
}
function isAllowedUsername(value, hashes) {
  const name = normalizeUsername(value);
  if (!/^PV-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/.test(name)) return false;
  const digest = Buffer.from(usernameDigest(name), 'hex');
  return hashes.some(hash => typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash)
    && timingSafeEqual(digest, Buffer.from(hash, 'hex')));
}
module.exports = { normalizeUsername, usernameDigest, isAllowedUsername };
