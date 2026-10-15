import { encodeCompositionCode } from '../composition/url';

// Patterns are placed on the same 32 × 32 wrapping board used by the app.
const stamp = (grid, x, y, rows) => rows.forEach((row, dy) => {
  row.split('').forEach((cell, dx) => { if (cell === 'O') grid[y + dy][x + dx] = 1; });
});

const definitions = [
  {
    id: 'still-life-garden', name: 'Still-life garden',
    description: 'Blocks, boats and beehives build steady columns of harmony.',
    key: 0, bpm: 75, effects: 8,
    patterns: [[6, 7, ['OO', 'OO']], [15, 12, ['.OO.', 'O..O', '.OO.']], [23, 21, ['OO.', 'O.O', '.O.']]],
  },
  {
    id: 'pulsar', name: 'Pulsar',
    description: 'A three-generation oscillator pulses in a symmetric rhythm.',
    key: 1, bpm: 120, effects: 2,
    patterns: [[9, 9, [
      '..OOO...OOO..', '.............', 'O....O.O....O', 'O....O.O....O',
      'O....O.O....O', '..OOO...OOO..', '.............', '..OOO...OOO..',
      'O....O.O....O', 'O....O.O....O', 'O....O.O....O', '.............', '..OOO...OOO..',
    ]]],
  },
  {
    id: 'glider-parade', name: 'Glider parade',
    description: 'Three gliders travel diagonally and wrap around the board.',
    key: 0, bpm: 105, effects: 1,
    patterns: [[5, 5, ['.O.', '..O', 'OOO']], [17, 5, ['.O.', '..O', 'OOO']], [5, 21, ['.O.', '..O', 'OOO']]],
  },
  {
    id: 'r-pentomino', name: 'R-pentomino',
    description: 'Five cells unfold into a busy, unpredictable sculpture.',
    key: 1, bpm: 90, effects: 4,
    patterns: [[14, 14, ['.OO', 'OO.', '.O.']]],
  },
  {
    id: 'acorn', name: 'Acorn',
    description: 'Seven cells spark sprawling growth and shifting melodies.',
    key: 1, bpm: 135, effects: 6,
    patterns: [[12, 14, ['.O.....', '...O...', 'OO..OOO']]],
  },
];

export const TEMPLATES = definitions.map(template => {
  const grid = Array.from({ length: 32 }, () => Array(32).fill(0));
  template.patterns.forEach(([x, y, rows]) => stamp(grid, x, y, rows));
  return { ...template, code: encodeCompositionCode(grid, template.key, template.bpm, template.effects) };
});

// Query-only links retain the hosting path, including GitHub Pages subdirectories.
export const templateHref = template => `?c=${template.code}#/`;
