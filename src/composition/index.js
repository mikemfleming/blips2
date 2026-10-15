// One key digit (0 major, 1 minor), followed by the grid in row-major order.
// Each cell is one bit, most significant bit first; leading zeroes are retained.
export const encodeComposition = (grid, key) => {
  let hex = key.toString(16);
  let nibble = 0;
  let bits = 0;
  grid.forEach(row => row.forEach(cell => {
    nibble = (nibble << 1) | (cell ? 1 : 0);
    bits += 1;
    if (bits === 4) {
      hex += nibble.toString(16);
      nibble = 0;
      bits = 0;
    }
  }));
  if (bits) hex += (nibble << (4 - bits)).toString(16);
  return hex;
};
