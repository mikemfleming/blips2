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

export const rotateOrganism = (organism, turns = 0) => {
  let rotated = { ...organism, cells: organism.cells.map(cell => ({ ...cell })) };
  const count = ((turns % 4) + 4) % 4;
  for (let turn = 0; turn < count; turn += 1) {
    rotated = {
      ...rotated, width: rotated.height, height: rotated.width,
      cells: rotated.cells.map(cell => ({ x: rotated.height - 1 - cell.y, y: cell.x })),
    };
  }
  return rotated;
};

export const organismAt = (id, anchor, rows, columns, turns = 0) => {
  const original = ORGANISMS.find(item => item.id === id);
  const organism = original ? rotateOrganism(original, turns) : null;
  if (!organism || !anchor || organism.width > columns || organism.height > rows) return [];
  const x = Math.max(0, Math.min(columns - organism.width, anchor.x - Math.floor(organism.width / 2)));
  const y = Math.max(0, Math.min(rows - organism.height, anchor.y - Math.floor(organism.height / 2)));
  return organism.cells.map(cell => ({ x: cell.x + x, y: cell.y + y }));
};
