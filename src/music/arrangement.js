export const PALETTES = {
  majorPentatonic: { label: 'Major pentatonic', intervals: [0, 2, 4, 7, 9] },
  minorPentatonic: { label: 'Minor pentatonic', intervals: [0, 3, 5, 7, 10] },
  majorChord: { label: 'Major triad', intervals: [0, 4, 7] },
  minorChord: { label: 'Minor triad', intervals: [0, 3, 7] },
  fifths: { label: 'Root and fifth', intervals: [0, 7] },
  major: { label: 'Major scale', intervals: [0, 2, 4, 5, 7, 9, 11] },
  dorian: { label: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
};
export const PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const DEFAULT_EXPERIMENT = { palette: 'majorPentatonic', root: 0, octave: 3, octaves: 3, order: 'wave' };
export const noteName = midi => PITCHES[midi % 12] + (Math.floor(midi / 12) - 1);
export const validNotes = notes => Array.isArray(notes) && notes.length === 32
  && notes.every(note => typeof note === 'string' && /^[A-G](#|b)?[1-7]$/.test(note));
export const makeArrangement = ({ palette, root, octave, octaves, order }) => {
  const intervals = PALETTES[palette].intervals;
  let pool = [];
  for (let o = 0; o < octaves; o += 1) intervals.forEach(interval => pool.push(12 * (octave + o + 1) + root + interval));
  pool.push(12 * (octave + octaves + 1) + root);
  if (order === 'thirds') {
    // Visit alternate scale degrees, then fill the remaining degrees.
    pool = pool.filter((_, i) => i % 2 === 0).concat(pool.filter((_, i) => i % 2));
  }
  return Array.from({ length: 32 }, (_, y) => {
    let index = y % pool.length;
    if (order === 'wave') {
      const phase = y % (2 * (pool.length - 1));
      index = phase < pool.length ? phase : 2 * (pool.length - 1) - phase;
    }
    if (order === 'descending' || order === 'wave') index = pool.length - 1 - index;
    return noteName(pool[index]);
  });
};
export const rowNotes = musicBox => musicBox.adminNotes || Array.from({ length: 32 }, (_, y) => {
  const key = musicBox.keys[musicBox.currentKey];
  return key[y % key.length];
});
export const columnNotes = (grid, column, musicBox) => {
  const mapping = rowNotes(musicBox);
  const notes = grid.map((row, y) => row[column] ? mapping[y] : null).filter(Boolean);
  if (!musicBox.adminNotes) return notes;
  return Array.from(new Set(notes)).slice(0, musicBox.adminNoteLimit || 16);
};
