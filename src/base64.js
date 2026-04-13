/**
 * base64.js — Manual Base64 implementation (no atob/btoa)
 * Supports standard and URL-safe (RFC 4648) variants, UTF-8 text, and file bytes.
 */

export const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export const BASE64_URL_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// Build reverse lookup tables
function buildLookup(alpha) {
  const table = new Uint8Array(128).fill(255);
  for (let i = 0; i < 64; i++) table[alpha.charCodeAt(i)] = i;
  return table;
}

const LOOKUP_STD = buildLookup(BASE64_ALPHABET);
const LOOKUP_URL = buildLookup(BASE64_URL_ALPHABET);

/**
 * Encode a Uint8Array to a Base64 string.
 * @param {Uint8Array} bytes
 * @param {boolean} urlSafe - use URL-safe alphabet (- and _)
 * @returns {string}
 */
export function encode(bytes, urlSafe = false) {
  const alpha = urlSafe ? BASE64_URL_ALPHABET : BASE64_ALPHABET;
  let result = '';
  const len = bytes.length;

  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;

    const c1 = b1 >> 2;
    const c2 = ((b1 & 0x03) << 4) | (b2 >> 4);
    const c3 = ((b2 & 0x0f) << 2) | (b3 >> 6);
    const c4 = b3 & 0x3f;

    result += alpha[c1];
    result += alpha[c2];

    if (i + 1 < len) {
      result += alpha[c3];
    } else {
      result += urlSafe ? '' : '=';
    }

    if (i + 2 < len) {
      result += alpha[c4];
    } else {
      result += urlSafe ? '' : '=';
    }
  }
  return result;
}

/**
 * Decode a Base64 string to a Uint8Array.
 * Accepts standard and URL-safe input (auto-detects).
 * @param {string} str
 * @returns {Uint8Array}
 */
export function decode(str) {
  // Strip whitespace and padding
  const clean = str.replace(/[\s=]/g, '');
  if (clean.length === 0) return new Uint8Array(0);

  // Detect alphabet
  const hasUrl = /[-_]/.test(clean);
  const lookup = hasUrl ? LOOKUP_URL : LOOKUP_STD;

  // Max output length (may be slightly over due to stripped padding)
  const maxOut = Math.ceil((clean.length * 3) / 4);
  const out = new Uint8Array(maxOut);
  let outIdx = 0;

  for (let i = 0; i < clean.length; i += 4) {
    const c1 = lookup[clean.charCodeAt(i)] ?? 0;
    const c2 = i + 1 < clean.length ? (lookup[clean.charCodeAt(i + 1)] ?? 0) : 0;
    const c3 = i + 2 < clean.length ? (lookup[clean.charCodeAt(i + 2)] ?? 0) : 0;
    const c4 = i + 3 < clean.length ? (lookup[clean.charCodeAt(i + 3)] ?? 0) : 0;

    out[outIdx++] = (c1 << 2) | (c2 >> 4);
    if (i + 2 < clean.length) out[outIdx++] = ((c2 & 0x0f) << 4) | (c3 >> 2);
    if (i + 3 < clean.length) out[outIdx++] = ((c3 & 0x03) << 6) | c4;
  }

  return out.slice(0, outIdx);
}

/**
 * Encode a UTF-8 string to Base64.
 * @param {string} text
 * @param {boolean} urlSafe
 * @returns {string}
 */
export function encodeText(text, urlSafe = false) {
  const bytes = new TextEncoder().encode(text);
  return encode(bytes, urlSafe);
}

/**
 * Decode a Base64 string to a UTF-8 string.
 * @param {string} str
 * @returns {string}
 */
export function decodeText(str) {
  const bytes = decode(str);
  return new TextDecoder().decode(bytes);
}

/**
 * Heuristic: is this string likely Base64-encoded?
 * @param {string} str
 * @returns {boolean}
 */
export function isBase64(str) {
  const s = str.replace(/[\s\r\n]/g, '');
  if (s.length === 0) return false;

  // Standard base64: must be multiple of 4, contain only base64 chars+padding
  if (/^[A-Za-z0-9+/]+=?=?$/.test(s) && s.length % 4 === 0 && s.length >= 4) return true;

  // URL-safe base64 (no padding): must contain - or _ to distinguish from plain text
  if (/^[A-Za-z0-9\-_]+$/.test(s) && (s.includes('-') || s.includes('_'))) {
    return s.length >= 4;
  }

  return false;
}

/**
 * Convert URL-safe Base64 to standard Base64 (adds padding).
 * @param {string} str
 * @returns {string}
 */
export function urlSafeToStandard(str) {
  // First strip any existing whitespace/padding
  const stripped = str.replace(/[\s=]/g, '');
  const s = stripped.replace(/-/g, '+').replace(/_/g, '/');
  const rem = s.length % 4;
  const pad = rem === 0 ? 0 : 4 - rem;
  return s + '='.repeat(pad);
}

/**
 * Convert standard Base64 to URL-safe Base64 (removes padding).
 * @param {string} str
 * @returns {string}
 */
export function standardToUrlSafe(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Wrap a Base64 string at a given column width (default 76, MIME).
 * @param {string} str
 * @param {number} width
 * @returns {string}
 */
export function wrap(str, width = 76) {
  if (width <= 0 || str.length <= width) return str;
  const lines = [];
  for (let i = 0; i < str.length; i += width) {
    lines.push(str.slice(i, i + width));
  }
  return lines.join('\n');
}

/**
 * Remove all whitespace from a Base64 string.
 * @param {string} str
 * @returns {string}
 */
export function unwrap(str) {
  return str.replace(/[\s\r\n]/g, '');
}
