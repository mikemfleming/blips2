const NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const NATURAL = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const CHORDS = [
  ['major', [0, 4, 7]], ['minor', [0, 3, 7]],
  ['5', [0, 7]], ['sus2', [0, 2, 7]], ['sus4', [0, 5, 7]],
  ['dim', [0, 3, 6]], ['aug', [0, 4, 8]],
  ['7', [0, 4, 7, 10]], ['maj7', [0, 4, 7, 11]], ['m7', [0, 3, 7, 10]],
  ['m(maj7)', [0, 3, 7, 11]], ['m7♭5', [0, 3, 6, 10]], ['dim7', [0, 3, 6, 9]],
  ['6', [0, 4, 7, 9]], ['m6', [0, 3, 7, 9]],
  ['add9', [0, 2, 4, 7]], ['m(add9)', [0, 2, 3, 7]],
  ['9', [0, 2, 4, 7, 10]], ['maj9', [0, 2, 4, 7, 11]], ['m9', [0, 2, 3, 7, 10]],
  ['11', [0, 2, 4, 5, 7, 10]], ['m11', [0, 2, 3, 5, 7, 10]],
  ['13', [0, 2, 4, 7, 9, 10]],
];
const midiFor = note => {
  const match = /^([A-G])([#b]?)([0-9])$/.exec(note);
  if (!match) return null;
  return 12 * (Number(match[3]) + 1) + NATURAL[match[1]] + (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0);
};

// Prefer exact pitch-class matches; for ties, prefer a root in the bass.
// Approximate matches penalize unrelated tones more than omitted chord tones.
export const bestFitChord = notes => {
  const midi = notes.map(midiFor).filter(value => value !== null);
  if (!midi.length) return { label: 'Silence', approximate: false, pitches: [] };
  const bass = Math.min(...midi) % 12;
  const pitches = Array.from(new Set(midi.map(value => value % 12))).sort((a, b) => a - b);
  const names = pitches.map(pitch => NAMES[pitch]);
  if (pitches.length === 1) return { label: NAMES[pitches[0]], approximate: false, pitches: names };
  let best;
  pitches.forEach(root => CHORDS.forEach(([quality, intervals]) => {
    const expected = intervals.map(interval => (root + interval) % 12);
    const extra = pitches.filter(pitch => !expected.includes(pitch)).length;
    const missing = expected.filter(pitch => !pitches.includes(pitch)).length;
    const score = extra * 3 + missing * 2;
    const bassPenalty = root === bass ? 0 : 1;
    if (!best || score < best.score || (score === best.score && bassPenalty < best.bassPenalty)) {
      best = { root, quality, score, bassPenalty };
    }
  }));
  const separator = best.quality === 'major' || best.quality === 'minor' ? ' ' : '';
  const inversion = best.root === bass ? '' : '/' + NAMES[bass];
  return { label: NAMES[best.root] + separator + best.quality + inversion,
    approximate: best.score > 0, pitches: names };
};
