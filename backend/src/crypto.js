/**
 * AES-256-GCM field-level encryption for sensitive PII (SSN, DOB).
 * Encrypted values are stored as: enc:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 * Plain values (legacy) are returned as-is.
 */
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_ENV = process.env.ENCRYPTION_KEY;

// Derive a 32-byte key from the env var (or fallback for dev — CHANGE IN PROD)
const KEY = KEY_ENV
  ? Buffer.from(KEY_ENV, 'hex')
  : crypto.scryptSync('lcs-dev-key-change-in-prod', 'lcs-salt', 32);

function encrypt(plaintext) {
  if (!plaintext) return plaintext;
  if (typeof plaintext !== 'string') return plaintext;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(value) {
  if (!value || typeof value !== 'string') return value;
  if (!value.startsWith('enc:')) return value; // legacy plaintext
  const [, ivHex, authTagHex, ciphertextHex] = value.split(':');
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext) + decipher.final('utf8');
  } catch {
    return '[decryption error]';
  }
}

module.exports = { encrypt, decrypt };
