
export const STEP_GRID = 'STEP_GRID';
export const START_GAME = 'START_GAME';
export const STOP_GAME = 'STOP_GAME';
export const TOGGLE_CELL = 'TOGGLE_CELL';
export const PAINT_CELLS = 'PAINT_CELLS';
export const SELECT_ORGANISM = 'SELECT_ORGANISM';
export const ROTATE_ORGANISM = 'ROTATE_ORGANISM';
export const DRAG_ORGANISM = 'DRAG_ORGANISM';
export const TOGGLE_KEY = 'TOGGLE_KEY';
export const TOGGLE_CREATE_MODE = 'TOGGLE_CREATE_MODE';
export const EXIT_CREATE_MODE = 'EXIT_CREATE_MODE';
export const RESET = 'RESET';
export const TOGGLE_MUTE = 'TOGGLE_MUTE';
export const SET_BPM = 'SET_BPM';
export const TOGGLE_EFFECT = 'TOGGLE_EFFECT';
export const EFFECT_FLAGS = { spatial: 1, pingPong: 2, evolving: 4, modulation: 8 };
export const DEFAULT_BPM = 120;
export const MIN_BPM = 30;
export const MAX_BPM = 240;

export const PERIOD_MS = 60000 / (DEFAULT_BPM * 4);
export const INITIAL_DIMENSIONS = { rows: 32, columns: 32 };
export const MAJOR_PENTATONIC = ['C6', 'A5', 'G5', 'E5', 'D5', 'C5', 'A4', 'G4', 'E4', 'D4', 'C4', 'A3', 'G3', 'E3', 'D3', 'C3'];
export const MINOR_PENTATONIC = ['C6', 'A#5', 'G5', 'E#5', 'D#5', 'C5', 'A#4', 'G4', 'E#4', 'D#4', 'C4', 'A#3', 'G3', 'E#3', 'D#3', 'C3'];
