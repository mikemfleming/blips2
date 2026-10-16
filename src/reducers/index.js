import {
  STEP_GRID,
  START_GAME,
  STOP_GAME,
  TOGGLE_CELL,
  PAINT_CELLS,
  SELECT_ORGANISM,
  ROTATE_ORGANISM,
  DRAG_ORGANISM,
  TOGGLE_KEY,
  TOGGLE_CREATE_MODE,
  EXIT_CREATE_MODE,
  RESET,
  TOGGLE_MUTE,
  SET_BPM,
  TOGGLE_EFFECT,
  EFFECT_FLAGS,
  DEFAULT_BPM,
  MIN_BPM,
  MAX_BPM,
  INITIAL_DIMENSIONS,
  MAJOR_PENTATONIC,
  MINOR_PENTATONIC,
} from '../constants';

// initial state for synth
import StartAudioContext from 'startaudiocontext';
import Tone from 'tone';
import { createAudio } from '../audio';
import { columnNotes, validNotes } from '../music/arrangement';
const audio = createAudio(Tone);
const { synth, volume } = audio;
StartAudioContext(synth.context, '#root')
  .then(() => console.log('INITIALIZED WEB AUDIO API'))
  .catch(() => console.log('FAILED TO INITIALIZE WEB AUDIO API'));


import Game from '../game';
import { encodeComposition } from '../composition';

const initialState = {
  grid: Game.createGrid(INITIAL_DIMENSIONS, MAJOR_PENTATONIC),
  history: [],
  compositionHex: null,
  compositionLoadError: null,
  currentColumn: -1,
  interval: null,
  dimensions: INITIAL_DIMENSIONS,
  musicBox: {
    keys: [MAJOR_PENTATONIC, MINOR_PENTATONIC],
    currentKey: 0,
    bpm: DEFAULT_BPM,
    effects: EFFECT_FLAGS.spatial,
    mute: false,
  },
  organismDrag: null,
  organismRotation: 0,
  selectedOrganism: null,
  createMode: false,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'STEP_NOTE_LAB': {
      if (!state.noteLabOpen || (action.direction !== -1 && action.direction !== 1)) return state;
      clearInterval(state.interval);
      let grid = state.grid;
      let history = state.history;
      let column = state.currentColumn;
      if (action.direction === 1) {
        column += 1;
        if (column === state.dimensions.columns) {
          history = [...history, grid];
          grid = Game.generateNewGrid(grid, state.dimensions, state.musicBox.keys[state.musicBox.currentKey]);
          column = 0;
        }
      } else if (column > 0) {
        column -= 1;
      } else if (history.length) {
        grid = history[history.length - 1];
        history = history.slice(0, -1);
        column = state.dimensions.columns - 1;
      } else column = 0;
      audio.configure(state.musicBox, grid, column);
      const notes = columnNotes(grid, column, state.musicBox);
      if (notes.length) synth.triggerAttackRelease(notes, Math.min(.2, 15 / state.musicBox.bpm));
      return { ...state, grid, history, currentColumn: column, interval: null,
        selectedOrganism: null, organismDrag: null,
        compositionHex: state.compositionHex || encodeComposition(state.grid, state.musicBox.currentKey) };
    }
    case 'SET_NOTE_LAB_OPEN':
      return { ...state, noteLabOpen: Boolean(action.open) };
    case 'IMPORT_NOTE_MAPPING':
      if (!validNotes(action.notes) || !Number.isInteger(action.maxNotes) || action.maxNotes < 1 || action.maxNotes > 16) return state;
      return { ...state, musicBox: { ...state.musicBox, adminNotes: action.notes.slice(), adminNoteLimit: action.maxNotes } };
    case 'SET_ADMIN_NOTES':
      if (action.notes !== null && !validNotes(action.notes)) return state;
      return { ...state, musicBox: { ...state.musicBox, adminNotes: action.notes } };
    case 'SET_ADMIN_NOTE_LIMIT':
      if (!Number.isInteger(action.limit) || action.limit < 1 || action.limit > 16) return state;
      return { ...state, musicBox: { ...state.musicBox, adminNoteLimit: action.limit } };
    case 'AUDITION_ADMIN_NOTES': {
      const notes = action.row === undefined
        ? columnNotes(state.grid, Math.max(0, state.currentColumn), state.musicBox)
        : Number.isInteger(action.row) && action.row >= 0 && action.row < 32
          ? [state.musicBox.adminNotes && state.musicBox.adminNotes[action.row]] : [];
      if (notes.length && notes.every(Boolean)) synth.triggerAttackRelease(notes, .3);
      return state;
    }
    case TOGGLE_EFFECT: {
      const bit = EFFECT_FLAGS[action.effect];
      if (!bit) return state;
      const musicBox = { ...state.musicBox, effects: (state.musicBox.effects || 0) ^ bit };
      audio.configure(musicBox, state.grid, state.currentColumn);
      return { ...state, musicBox };
    }
    case SET_BPM:
      if (!Number.isInteger(action.bpm) || action.bpm < MIN_BPM || action.bpm > MAX_BPM || action.bpm === state.musicBox.bpm) return state;
      audio.configure({ ...state.musicBox, bpm: action.bpm }, state.grid, state.currentColumn);
      return { ...state, musicBox: { ...state.musicBox, bpm: action.bpm } };
    case DRAG_ORGANISM:
      if (state.interval || !state.selectedOrganism || !action.position
        || !Number.isFinite(action.position.x) || !Number.isFinite(action.position.y)) return state;
      return { ...state, organismDrag: { x: action.position.x, y: action.position.y, drop: Boolean(action.position.drop) } };
    case ROTATE_ORGANISM:
      if (state.interval || (action.direction !== 1 && action.direction !== -1)) return state;
      return { ...state, organismRotation: (state.organismRotation + action.direction + 4) % 4 };
    case SELECT_ORGANISM:
      return { ...state, selectedOrganism: state.interval ? null : action.id, organismDrag: null };
    case START_GAME:
      audio.configure(state.musicBox, state.grid, state.currentColumn);
      return {
        ...state,
        selectedOrganism: null,
        organismDrag: null,
        interval: action.interval,
        compositionHex: state.compositionHex || encodeComposition(state.grid, state.musicBox.currentKey),
      };
    case STOP_GAME:
      return {
        ...state,
        interval: clearInterval(state.interval),
      };
    case PAINT_CELLS: {
      if (state.interval) return state;
      const paintedGrid = state.grid.slice();
      const copiedRows = new Set();
      action.cells.forEach(({ x, y }) => {
        if (!paintedGrid[y] || x < 0 || x >= paintedGrid[y].length || paintedGrid[y][x]) return;
        if (!copiedRows.has(y)) {
          paintedGrid[y] = paintedGrid[y].slice();
          copiedRows.add(y);
        }
        paintedGrid[y][x] = 1;
      });
      return copiedRows.size ? { ...state, grid: paintedGrid } : state;
    }
    case TOGGLE_CELL:
      const newGrid = state.grid.slice();
      newGrid[action.y] = newGrid[action.y].slice();
      newGrid[action.y][action.x] = action.value !== undefined
        ? action.value
        : state.createMode
        ? 1
        : (state.grid[action.y][action.x] + 1) % 2;
      return {
        ...state,
        grid: newGrid,
      };
    case STEP_GRID:
      const nextColumn = (state.currentColumn + 1) % state.dimensions.columns;
      const completedIteration = nextColumn === 0 && state.currentColumn > 0;
      const nextGrid = completedIteration
        ? Game.generateNewGrid(state.grid, state.dimensions, state.musicBox.keys[state.musicBox.currentKey])
        : state.grid;
      const notes = columnNotes(nextGrid, nextColumn, state.musicBox);

      audio.configure(state.musicBox, nextGrid, nextColumn);
      synth.triggerAttackRelease(notes, Math.min(0.2, 15 / state.musicBox.bpm));
      
      return {
        ...state,
        musicBox: {
          ...state.musicBox,
        },
        grid: nextGrid,
        history: completedIteration
          ? [...state.history, state.grid]
          : state.history,
        currentColumn: nextColumn,
      };
    case TOGGLE_KEY:
      return {
        ...state,
        musicBox: {
          ...state.musicBox,
          currentKey: (state.musicBox.currentKey + 1) % state.musicBox.keys.length,
        },
      };
    case TOGGLE_CREATE_MODE:
      return {
        ...state,
        createMode: !state.createMode,
      };
    case EXIT_CREATE_MODE:
      return {
        ...state,
        createMode: false,
      };
    case RESET:
      return {
        ...state,
        grid: Game.createGrid(INITIAL_DIMENSIONS, MAJOR_PENTATONIC),
        history: [],
        selectedOrganism: null,
        organismDrag: null,
        compositionHex: null,
        compositionLoadError: null,
        currentColumn: -1,
        musicBox: {
          ...state.musicBox,
          currentNotes: [],
        },
      };
    case TOGGLE_MUTE:
      volume.mute = !state.musicBox.mute;
      return {
        ...state,
        musicBox: {
          ...state.musicBox,
          mute: !state.musicBox.mute,
        },
      };
    default:
      return state;
  }
};

export default reducer;
