'use strict';

const crypto = require('node:crypto');

const SCRYPT_KEYLEN = 64;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, SCRYPT_KEYLEN).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  try {
    const actual = crypto.scryptSync(String(password), salt, SCRYPT_KEYLEN);
    const expected = Buffer.from(String(expectedHash), 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function newToken() {
  return crypto.randomBytes(32).toString('hex');
}

function randomPassword() {
  return crypto.randomBytes(24).toString('base64url');
}

module.exports = { hashPassword, verifyPassword, newToken, randomPassword };
