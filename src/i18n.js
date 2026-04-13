/**
 * i18n.js — Japanese / English UI strings
 */

export const translations = {
  ja: {
    title: 'Base64 ツール',
    subtitle: 'エンコード / デコード',
    modeText: 'テキスト',
    modeFile: 'ファイル',
    inputLabel: '入力',
    outputLabel: '出力',
    encode: 'エンコード',
    decode: 'デコード',
    autoDetect: '自動判定',
    urlSafe: 'URL-safe (RFC 4648)',
    lineWrap: '行折り返し (76文字)',
    copy: 'コピー',
    download: 'ダウンロード',
    clear: 'クリア',
    swap: '↕ 入れ替え',
    dropZone: 'ファイルをドロップ、またはクリックして選択',
    dropZoneActive: 'ドロップしてください',
    fileInfo: 'ファイル: ',
    sizeLabel: 'サイズ比較',
    originalSize: '元のサイズ',
    encodedSize: 'Base64 サイズ',
    overhead: 'オーバーヘッド',
    previewLabel: '画像プレビュー',
    copied: 'コピーしました！',
    errorInvalidBase64: '無効な Base64 文字列です',
    errorDecodeUTF8: 'UTF-8 のデコードに失敗しました（バイナリデータかもしれません）',
    themeToggle: 'テーマ切替',
    langToggle: 'EN',
    detected: '検出',
    detectedEncode: '→ エンコード',
    detectedDecode: '→ デコード',
    bytes: 'バイト',
    chars: '文字',
  },
  en: {
    title: 'Base64 Tool',
    subtitle: 'Encode / Decode',
    modeText: 'Text',
    modeFile: 'File',
    inputLabel: 'Input',
    outputLabel: 'Output',
    encode: 'Encode',
    decode: 'Decode',
    autoDetect: 'Auto-detect',
    urlSafe: 'URL-safe (RFC 4648)',
    lineWrap: 'Line wrap (76 chars)',
    copy: 'Copy',
    download: 'Download',
    clear: 'Clear',
    swap: '↕ Swap',
    dropZone: 'Drop a file here, or click to select',
    dropZoneActive: 'Drop it!',
    fileInfo: 'File: ',
    sizeLabel: 'Size comparison',
    originalSize: 'Original size',
    encodedSize: 'Base64 size',
    overhead: 'Overhead',
    previewLabel: 'Image preview',
    copied: 'Copied!',
    errorInvalidBase64: 'Invalid Base64 string',
    errorDecodeUTF8: 'Failed to decode as UTF-8 (may be binary data)',
    themeToggle: 'Toggle theme',
    langToggle: 'JA',
    detected: 'Detected',
    detectedEncode: '→ Encode',
    detectedDecode: '→ Decode',
    bytes: 'bytes',
    chars: 'chars',
  },
};

export class I18n {
  constructor(lang = 'en') {
    this.lang = lang;
  }

  t(key) {
    return translations[this.lang][key] ?? key;
  }

  toggle() {
    this.lang = this.lang === 'en' ? 'ja' : 'en';
  }

  applyAll(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });
    document.documentElement.lang = this.lang;
  }
}
