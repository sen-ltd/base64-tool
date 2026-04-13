/**
 * main.js — DOM wiring and event handling for Base64 Tool
 */

import {
  encode,
  decode,
  encodeText,
  decodeText,
  isBase64,
  wrap,
  unwrap,
} from './base64.js';
import { I18n } from './i18n.js';

// ─── State ───────────────────────────────────────────────────────────────────

const state = {
  mode: 'text',       // 'text' | 'file'
  direction: 'encode', // 'encode' | 'decode'
  autoDetect: false,
  urlSafe: false,
  lineWrap: false,
  fileBytes: null,
  fileName: '',
  fileType: '',
};

const i18n = new I18n(navigator.language.startsWith('ja') ? 'ja' : 'en');

// ─── Element helpers ──────────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ─── DOM references ───────────────────────────────────────────────────────────

const inputArea  = $('#input-area');
const textOutput = $('#text-output');
const fileOutput = $('#file-output');
const encodeBtn  = $('#btn-encode');
const decodeBtn  = $('#btn-decode');
const autoBtn    = $('#btn-auto');
const modeText   = $('#mode-text');
const modeFile   = $('#mode-file');
const optUrlSafe = $('#opt-url-safe');
const optWrap    = $('#opt-wrap');
const btnCopy    = $('#btn-copy');
const btnDownload = $('#btn-download');
const btnClear   = $('#btn-clear');
const btnSwap    = $('#btn-swap');
const btnTheme   = $('#btn-theme');
const btnLang    = $('#btn-lang');
const dropZone   = $('#drop-zone');
const fileInput  = $('#file-input');
const fileInfo   = $('#file-info');
const textPanel  = $('#text-panel');
const filePanel  = $('#file-panel');
const sizePanel  = $('#size-panel');
const sizeOriginal = $('#size-original');
const sizeEncoded  = $('#size-encoded');
const sizeOverhead = $('#size-overhead');
const imagePreview = $('#image-preview');
const previewImg   = $('#preview-img');
const statusMsg    = $('#status-msg');
const autoIndicator = $('#auto-indicator');

// Current output area (changes with mode)
function outputArea() {
  return state.mode === 'text' ? textOutput : fileOutput;
}

// ─── Render ───────────────────────────────────────────────────────────────────

function render() {
  // Mode buttons
  modeText.classList.toggle('active', state.mode === 'text');
  modeFile.classList.toggle('active', state.mode === 'file');

  // Direction buttons
  encodeBtn.classList.toggle('active', state.direction === 'encode');
  decodeBtn.classList.toggle('active', state.direction === 'decode');
  autoBtn.classList.toggle('active', state.autoDetect);

  // Options
  optUrlSafe.checked = state.urlSafe;
  optWrap.checked = state.lineWrap;

  // Panel visibility
  textPanel.classList.toggle('hidden', state.mode !== 'text');
  filePanel.classList.toggle('hidden', state.mode !== 'file');

  // Auto-indicator
  autoIndicator.classList.toggle('hidden', !state.autoDetect);
}

// ─── Process ──────────────────────────────────────────────────────────────────

function process() {
  clearError();

  if (state.mode === 'text') {
    processText();
  } else {
    processFile();
  }
}

function processText() {
  const input = inputArea.value;
  if (!input.trim()) {
    outputArea().value = '';
    hideSizePanel();
    return;
  }

  let dir = state.direction;

  if (state.autoDetect) {
    const clean = unwrap(input);
    dir = isBase64(clean) ? 'decode' : 'encode';
    updateAutoIndicator(dir);
  }

  try {
    let output;
    if (dir === 'encode') {
      output = encodeText(input, state.urlSafe);
      if (state.lineWrap) output = wrap(output);
      showSizeComparison(new TextEncoder().encode(input).length, output.replace(/\s/g, '').length);
    } else {
      const clean = unwrap(input);
      output = decodeText(clean);
      const decoded = decode(clean);
      showSizeComparison(decoded.length, clean.length);
    }
    outputArea().value = output;
    hideImagePreview();
  } catch (err) {
    showError(dir === 'decode' ? i18n.t('errorInvalidBase64') : err.message);
    outputArea().value = '';
  }
}

function processFile() {
  if (!state.fileBytes) {
    outputArea().value = '';
    hideSizePanel();
    return;
  }

  let output = encode(state.fileBytes, state.urlSafe);
  if (state.lineWrap) output = wrap(output);

  const dataUrl = `data:${state.fileType};base64,${encode(state.fileBytes, false)}`;

  outputArea().value = dataUrl;
  showSizeComparison(state.fileBytes.length, output.length);

  // Image preview
  if (state.fileType.startsWith('image/')) {
    previewImg.src = dataUrl;
    imagePreview.classList.remove('hidden');
  } else {
    hideImagePreview();
  }
}

// ─── Size panel ───────────────────────────────────────────────────────────────

function showSizeComparison(originalBytes, encodedChars) {
  sizeOriginal.textContent = `${originalBytes.toLocaleString()} ${i18n.t('bytes')}`;
  sizeEncoded.textContent  = `${encodedChars.toLocaleString()} ${i18n.t('chars')}`;
  const oh = originalBytes > 0
    ? (((encodedChars - originalBytes) / originalBytes) * 100).toFixed(1)
    : '0.0';
  sizeOverhead.textContent = `+${oh}%`;
  sizePanel.classList.remove('hidden');
}

function hideSizePanel() {
  sizePanel.classList.add('hidden');
}

// ─── Image preview ────────────────────────────────────────────────────────────

function hideImagePreview() {
  imagePreview.classList.add('hidden');
  previewImg.src = '';
}

// ─── Auto-detect indicator ────────────────────────────────────────────────────

function updateAutoIndicator(dir) {
  autoIndicator.textContent = i18n.t(dir === 'decode' ? 'detectedDecode' : 'detectedEncode');
}

// ─── Status / errors ─────────────────────────────────────────────────────────

function showError(msg) {
  statusMsg.textContent = msg;
  statusMsg.className = 'status-msg error';
}

function showSuccess(msg) {
  statusMsg.textContent = msg;
  statusMsg.className = 'status-msg success';
  setTimeout(() => { statusMsg.textContent = ''; statusMsg.className = 'status-msg'; }, 2000);
}

function clearError() {
  statusMsg.textContent = '';
  statusMsg.className = 'status-msg';
}

// ─── File handling ────────────────────────────────────────────────────────────

function handleFile(file) {
  state.fileName = file.name;
  state.fileType = file.type || 'application/octet-stream';
  fileInfo.textContent = i18n.t('fileInfo') + file.name + ` (${(file.size / 1024).toFixed(1)} KB)`;

  const reader = new FileReader();
  reader.onload = (e) => {
    state.fileBytes = new Uint8Array(e.target.result);
    process();
  };
  reader.readAsArrayBuffer(file);
}

// ─── Download ────────────────────────────────────────────────────────────────

function download() {
  const content = outputArea().value;
  if (!content) return;

  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = (state.fileName ? state.fileName + '.b64' : 'output.b64');
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Copy ────────────────────────────────────────────────────────────────────

async function copyOutput() {
  const content = outputArea().value;
  if (!content) return;
  try {
    await navigator.clipboard.writeText(content);
    showSuccess(i18n.t('copied'));
  } catch {
    outputArea().select();
    document.execCommand('copy');
    showSuccess(i18n.t('copied'));
  }
}

// ─── Theme ───────────────────────────────────────────────────────────────────

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  localStorage.setItem('b64-theme', html.getAttribute('data-theme'));
}

function loadTheme() {
  const saved = localStorage.getItem('b64-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// ─── Event listeners ─────────────────────────────────────────────────────────

encodeBtn.addEventListener('click', () => {
  state.direction = 'encode';
  state.autoDetect = false;
  render();
  process();
});

decodeBtn.addEventListener('click', () => {
  state.direction = 'decode';
  state.autoDetect = false;
  render();
  process();
});

autoBtn.addEventListener('click', () => {
  state.autoDetect = !state.autoDetect;
  if (state.autoDetect) render();
  else render();
  process();
});

modeText.addEventListener('click', () => {
  state.mode = 'text';
  state.fileBytes = null;
  render();
  process();
});

modeFile.addEventListener('click', () => {
  state.mode = 'file';
  render();
  process();
});

optUrlSafe.addEventListener('change', () => {
  state.urlSafe = optUrlSafe.checked;
  process();
});

optWrap.addEventListener('change', () => {
  state.lineWrap = optWrap.checked;
  process();
});

inputArea.addEventListener('input', () => {
  process();
});

btnCopy.addEventListener('click', copyOutput);
btnDownload.addEventListener('click', download);
btnClear.addEventListener('click', () => {
  inputArea.value = '';
  textOutput.value = '';
  fileOutput.value = '';
  state.fileBytes = null;
  fileInfo.textContent = '';
  hideSizePanel();
  hideImagePreview();
  clearError();
  autoIndicator.classList.add('hidden');
});

btnSwap.addEventListener('click', () => {
  if (state.mode !== 'text') return;
  const tmp = inputArea.value;
  inputArea.value = outputArea().value;
  outputArea().value = tmp;
  process();
});

btnTheme.addEventListener('click', toggleTheme);

btnLang.addEventListener('click', () => {
  i18n.toggle();
  btnLang.textContent = i18n.t('langToggle');
  i18n.applyAll();
  process(); // refresh size labels
});

// Drop zone
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('active');
  dropZone.querySelector('[data-i18n="dropZone"]').textContent = i18n.t('dropZoneActive');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('active');
  dropZone.querySelector('[data-i18n="dropZone"]').textContent = i18n.t('dropZone');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('active');
  dropZone.querySelector('[data-i18n="dropZone"]').textContent = i18n.t('dropZone');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) handleFile(file);
});

// ─── Init ────────────────────────────────────────────────────────────────────

loadTheme();
i18n.applyAll();
btnLang.textContent = i18n.t('langToggle');
render();
