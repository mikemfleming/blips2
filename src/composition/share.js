import { encodeCompositionCode } from './url';

export const createShareUrl = (state, href) => {
  let grid = state.grid;
  let key = state.musicBox.currentKey;
  // After first Play, share the saved starting pattern rather than its evolution.
  if (state.compositionHex) {
    key = parseInt(state.compositionHex[0], 16);
    const bits = state.compositionHex.slice(1).split('')
      .map(digit => parseInt(digit, 16).toString(2).padStart(4, '0')).join('');
    grid = Array.from({ length: 32 }, (_, y) => Array.from({ length: 32 }, (unused, x) => Number(bits[y * 32 + x])));
  }
  const url = new URL(href);
  url.searchParams.set('c', encodeCompositionCode(grid, key, state.musicBox.bpm, state.musicBox.effects));
  url.hash = '/';
  return url.toString();
};

export const isPlaybackShortcut = event =>
  (event.code === 'Space' || event.key === ' ')
  && !event.ctrlKey && !event.metaKey && !event.altKey
  && !(event.target && (event.target.isContentEditable
    || (event.target.closest && event.target.closest('[aria-modal="true"]'))
    || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)));

export const copyShareUrl = (text) => {
  const fallback = () => {
    const active = document.activeElement;
    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(input);
    try {
      input.select();
      if (!document.execCommand('copy')) throw new Error('Copy failed');
    } finally {
      document.body.removeChild(input);
      if (active && active.focus) active.focus();
    }
  };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(fallback);
    }
  } catch (error) {
    // Fall back for browser contexts that deny the Clipboard API.
  }
  return Promise.resolve().then(fallback);
};
