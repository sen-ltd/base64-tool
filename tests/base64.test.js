/**
 * base64.test.js — Tests for Base64 implementation
 * Run: node --test tests/base64.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  encode,
  decode,
  encodeText,
  decodeText,
  isBase64,
  wrap,
  unwrap,
  urlSafeToStandard,
  standardToUrlSafe,
  BASE64_ALPHABET,
  BASE64_URL_ALPHABET,
} from '../src/base64.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bytes(...vals) {
  return new Uint8Array(vals);
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

// ─── Alphabet constants ───────────────────────────────────────────────────────

describe('alphabets', () => {
  it('BASE64_ALPHABET has 64 chars', () => {
    assert.equal(BASE64_ALPHABET.length, 64);
  });

  it('BASE64_URL_ALPHABET has 64 chars', () => {
    assert.equal(BASE64_URL_ALPHABET.length, 64);
  });

  it('URL alphabet uses - and _ instead of + and /', () => {
    assert.ok(BASE64_URL_ALPHABET.includes('-'));
    assert.ok(BASE64_URL_ALPHABET.includes('_'));
    assert.ok(!BASE64_URL_ALPHABET.includes('+'));
    assert.ok(!BASE64_URL_ALPHABET.includes('/'));
  });
});

// ─── Known test vectors ────────────────────────────────────────────────────────

describe('known vectors (RFC 4648)', () => {
  const vectors = [
    ['',       ''],
    ['f',      'Zg=='],
    ['fo',     'Zm8='],
    ['foo',    'Zm9v'],
    ['foob',   'Zm9vYg=='],
    ['fooba',  'Zm9vYmE='],
    ['foobar', 'Zm9vYmFy'],
    ['Man',    'TWFu'],
  ];

  for (const [text, expected] of vectors) {
    it(`encode("${text}") === "${expected}"`, () => {
      const enc = encode(new TextEncoder().encode(text));
      assert.equal(enc, expected);
    });

    it(`decode("${expected}") round-trips to "${text}"`, () => {
      if (expected === '') return; // empty
      const dec = decode(expected);
      assert.equal(new TextDecoder().decode(dec), text);
    });
  }
});

// ─── encode ───────────────────────────────────────────────────────────────────

describe('encode', () => {
  it('empty input returns empty string', () => {
    assert.equal(encode(new Uint8Array(0)), '');
  });

  it('single byte produces 4 chars with 2 padding', () => {
    const enc = encode(bytes(0x00));
    assert.equal(enc.length, 4);
    assert.equal(enc.slice(-2), '==');
  });

  it('two bytes produce 4 chars with 1 padding', () => {
    const enc = encode(bytes(0x00, 0x00));
    assert.equal(enc.length, 4);
    assert.equal(enc.slice(-1), '=');
  });

  it('three bytes produce 4 chars with no padding', () => {
    const enc = encode(bytes(0x00, 0x00, 0x00));
    assert.equal(enc.length, 4);
    assert.ok(!enc.includes('='));
  });

  it('four bytes produce 8 chars', () => {
    assert.equal(encode(bytes(1, 2, 3, 4)).length, 8);
  });

  it('all zeros encodes correctly', () => {
    assert.equal(encode(bytes(0)), 'AA==');
    assert.equal(encode(bytes(0, 0)), 'AAA=');
    assert.equal(encode(bytes(0, 0, 0)), 'AAAA');
  });

  it('max byte value (255) encodes correctly', () => {
    assert.equal(encode(bytes(255)), '/w==');
  });
});

// ─── decode ───────────────────────────────────────────────────────────────────

describe('decode', () => {
  it('empty string returns empty array', () => {
    const dec = decode('');
    assert.equal(dec.length, 0);
  });

  it('decodes padded input', () => {
    const dec = decode('AA==');
    assert.ok(arraysEqual(dec, bytes(0)));
  });

  it('decodes 1-pad input', () => {
    const dec = decode('AAA=');
    assert.ok(arraysEqual(dec, bytes(0, 0)));
  });

  it('decodes no-pad input', () => {
    const dec = decode('AAAA');
    assert.ok(arraysEqual(dec, bytes(0, 0, 0)));
  });

  it('decode(encode(x)) round-trips', () => {
    const original = new Uint8Array([1, 2, 3, 100, 200, 255, 0, 128]);
    const enc = encode(original);
    const dec = decode(enc);
    assert.ok(arraysEqual(original, dec));
  });

  it('ignores whitespace in input', () => {
    const dec = decode('Zm9v\nYmFy');
    assert.equal(new TextDecoder().decode(dec), 'foobar');
  });
});

// ─── URL-safe ─────────────────────────────────────────────────────────────────

describe('URL-safe encoding', () => {
  it('uses - instead of +', () => {
    // byte 0xFB produces + in standard
    const enc = encode(bytes(0xfb, 0xef), true);
    assert.ok(enc.includes('-'));
    assert.ok(!enc.includes('+'));
  });

  it('uses _ instead of /', () => {
    // byte 0xFF produces / in standard
    const enc = encode(bytes(0xff), true);
    assert.ok(!enc.includes('/'));
  });

  it('no padding in URL-safe mode', () => {
    const enc = encode(bytes(0x00), true); // normally 'AA=='
    assert.ok(!enc.includes('='));
  });

  it('decode auto-detects URL-safe input', () => {
    const original = bytes(0xfb, 0xef, 0xbe);
    const urlEnc = encode(original, true);
    const dec = decode(urlEnc);
    assert.ok(arraysEqual(original, dec));
  });

  it('urlSafeToStandard converts - to + and _ to /', () => {
    // 'a-b_cdef' length=8, divisible by 4 → no extra padding
    assert.equal(urlSafeToStandard('a-b_cdef'), 'a+b/cdef');
    // 6-char input needs 2 padding chars
    assert.equal(urlSafeToStandard('a-b_cd'), 'a+b/cd==');
  });

  it('standardToUrlSafe converts characters', () => {
    assert.equal(standardToUrlSafe('a+b/c=='), 'a-b_c');
  });
});

// ─── encodeText / decodeText ──────────────────────────────────────────────────

describe('encodeText / decodeText', () => {
  it('round-trips ASCII text', () => {
    const text = 'Hello, World!';
    assert.equal(decodeText(encodeText(text)), text);
  });

  it('round-trips Japanese text', () => {
    const text = 'こんにちは世界';
    assert.equal(decodeText(encodeText(text)), text);
  });

  it('round-trips emoji', () => {
    const text = 'Base64 🚀 encoding';
    assert.equal(decodeText(encodeText(text)), text);
  });

  it('encodes known ASCII: "Hello" → "SGVsbG8="', () => {
    assert.equal(encodeText('Hello'), 'SGVsbG8=');
  });
});

// ─── isBase64 ─────────────────────────────────────────────────────────────────

describe('isBase64', () => {
  it('detects valid standard base64', () => {
    assert.ok(isBase64('Zm9vYmFy'));
    assert.ok(isBase64('SGVsbG8='));
    assert.ok(isBase64('AA=='));
  });

  it('detects valid URL-safe base64', () => {
    assert.ok(isBase64('a-b_cdef'));
  });

  it('returns false for empty string', () => {
    assert.ok(!isBase64(''));
  });

  it('returns false for plain text', () => {
    assert.ok(!isBase64('hello'));
  });

  it('returns false for odd-length non-url-safe strings', () => {
    assert.ok(!isBase64('abc'));
  });
});

// ─── wrap / unwrap ────────────────────────────────────────────────────────────

describe('wrap', () => {
  it('wraps at 76 chars by default', () => {
    const long = 'A'.repeat(100);
    const wrapped = wrap(long);
    const lines = wrapped.split('\n');
    assert.ok(lines.every(l => l.length <= 76));
  });

  it('wraps at custom width', () => {
    const long = 'A'.repeat(20);
    const wrapped = wrap(long, 8);
    const lines = wrapped.split('\n');
    assert.ok(lines.every(l => l.length <= 8));
    assert.equal(lines.length, 3); // 20 chars / 8 = 3 lines
  });

  it('does not wrap short strings', () => {
    const short = 'SGVsbG8=';
    assert.equal(wrap(short), short);
  });

  it('returns unchanged if width <= 0', () => {
    const s = 'AAAA';
    assert.equal(wrap(s, 0), s);
  });
});

describe('unwrap', () => {
  it('removes newlines', () => {
    assert.equal(unwrap('AB\nCD\nEF'), 'ABCDEF');
  });

  it('removes spaces and tabs', () => {
    assert.equal(unwrap('AB CD\tEF'), 'ABCDEF');
  });

  it('is inverse of wrap', () => {
    const original = 'A'.repeat(200);
    assert.equal(unwrap(wrap(original)), original);
  });
});

// ─── Large input ──────────────────────────────────────────────────────────────

describe('large input', () => {
  it('round-trips 10 KB of random-ish data', () => {
    const data = new Uint8Array(10240);
    for (let i = 0; i < data.length; i++) data[i] = (i * 37 + 13) % 256;
    const enc = encode(data);
    const dec = decode(enc);
    assert.ok(arraysEqual(data, dec));
  });
});
