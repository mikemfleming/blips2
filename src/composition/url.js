import { Inflate, deflateRaw } from 'pako';

const ROWS = 32;
const COLUMNS = 32;
const BYTE_LENGTH = 129;
const MAX_CODE_LENGTH = 1024;
const INVALID = 'Invalid composition link. Starting with an empty grid.';

const toBase64url = bytes => btoa(String.fromCharCode(...bytes))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64url = value => {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) throw new Error(INVALID);
  const text = value.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(text + '='.repeat((4 - text.length % 4) % 4)), char => char.charCodeAt(0));
  if (toBase64url(bytes) !== value) throw new Error(INVALID);
  return bytes;
};

// Fixed wire format: 128 grid bytes, MSB first in row-major order, then key 0/1.
// 'd' = raw DEFLATE, 'r' = uncompressed. No server lookup or browser storage.
export const encodeCompositionCode = (grid, key) => {
  if (grid.length !== ROWS || grid.some(row => row.length !== COLUMNS) || (key !== 0 && key !== 1)) throw new Error(INVALID);
  const bytes = new Uint8Array(BYTE_LENGTH);
  grid.forEach((row, y) => row.forEach((cell, x) => {
    const bit = y * COLUMNS + x;
    if (cell) bytes[bit >> 3] |= 1 << (7 - bit % 8);
  }));
  bytes[128] = key;
  const compressed = deflateRaw(bytes, { level: 9 });
  return compressed.length < bytes.length
    ? `d${toBase64url(compressed)}`
    : `r${toBase64url(bytes)}`;
};

export const decodeCompositionCode = code => {
  if (typeof code !== 'string' || code.length < 2 || code.length > MAX_CODE_LENGTH) throw new Error(INVALID);
  const payload = fromBase64url(code.slice(1));
  let bytes;
  if (code[0] === 'r') {
    bytes = payload;
  } else if (code[0] === 'd') {
    // Limit output while inflating; a URL can never allocate an unbounded grid.
    const inflater = new Inflate({ raw: true, chunkSize: BYTE_LENGTH + 1 });
    const chunks = [];
    let length = 0;
    inflater.onData = chunk => {
      length += chunk.length;
      if (length > BYTE_LENGTH) throw new Error(INVALID);
      chunks.push(chunk);
    };
    inflater.push(payload, true);
    if (inflater.err || !inflater.ended || inflater.strm.avail_in !== 0 || length !== BYTE_LENGTH) throw new Error(INVALID);
    bytes = new Uint8Array(BYTE_LENGTH);
    let offset = 0;
    chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.length; });
  } else {
    throw new Error(INVALID);
  }
  if (bytes.length !== BYTE_LENGTH || bytes[128] > 1) throw new Error(INVALID);
  const grid = Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLUMNS }, (unused, x) => {
    const bit = y * COLUMNS + x;
    return (bytes[bit >> 3] >> (7 - bit % 8)) & 1;
  }));
  return { grid, key: bytes[128] };
};

export const loadCompositionFromSearch = (state, search) => {
  try {
    const params = new URLSearchParams(search);
    if (!params.has('c')) return state;
    if (params.getAll('c').length !== 1) throw new Error(INVALID);
    const { grid, key } = decodeCompositionCode(params.get('c'));
    return {
      ...state,
      grid,
      history: [],
      currentColumn: -1,
      interval: null,
      compositionHex: null,
      compositionLoadError: null,
      musicBox: { ...state.musicBox, currentKey: key },
    };
  } catch (error) {
    return { ...state, compositionLoadError: INVALID };
  }
};
