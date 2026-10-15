// Standard B3/S23 patterns; coordinates follow LifeWiki's usual diagrams.
const pattern = (id, name, kind, rows) => ({
  id, name, kind, width: rows[0].length, height: rows.length,
  cells: rows.reduce((cells,row,y) => cells.concat(row.split('').reduce((live,cell,x) =>
    cell === 'O' ? live.concat([{x,y}]) : live, [])), []),
});

export const ORGANISMS = [
  pattern('glider', 'Glider', 'Spaceship', ['.O.','..O','OOO']),
  pattern('blinker', 'Blinker', 'Oscillator', ['OOO']),
  pattern('toad', 'Toad', 'Oscillator', ['.OOO','OOO.']),
  pattern('beacon', 'Beacon', 'Oscillator', ['OO..','OO..','..OO','..OO']),
  pattern('block', 'Block', 'Still life', ['OO','OO']),
  pattern('beehive', 'Beehive', 'Still life', ['.OO.','O..O','.OO.']),
];

export const organismAt = (id, anchor, rows, columns) => {
  const organism = ORGANISMS.find(item => item.id === id);
  if (!organism || !anchor || organism.width > columns || organism.height > rows) return [];
  const x = Math.max(0, Math.min(columns - organism.width, anchor.x - Math.floor(organism.width / 2)));
  const y = Math.max(0, Math.min(rows - organism.height, anchor.y - Math.floor(organism.height / 2)));
  return organism.cells.map(cell => ({ x: cell.x + x, y: cell.y + y }));
};
