import {
  STEP_GRID,
  START_GAME,
  STOP_GAME,
  TOGGLE_CELL,
  PAINT_CELLS,
  SELECT_ORGANISM,
  TOGGLE_KEY,
  TOGGLE_CREATE_MODE,
  EXIT_CREATE_MODE,
  RESET,
  TOGGLE_MUTE,
  INITIAL_DIMENSIONS,
  MAJOR_PENTATONIC,
  MINOR_PENTATONIC,
} from '../constants';

// initial state for synth
import StartAudioContext from 'startaudiocontext';
import Tone from 'tone';
const synth = new Tone.PolySynth(16, Tone.Synth);
const echo = new Tone.FeedbackDelay(0.05, 0.3);
echo.wet.value = 0.25;
const volume = new Tone.Volume(-16);
synth.chain(echo, volume, Tone.Master);
volume.mute = false;
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
    mute: false,
  },
  selectedOrganism: null,
  createMode: false,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case SELECT_ORGANISM:
      return { ...state, selectedOrganism: state.interval ? null : action.id };
    case START_GAME:
      return {
        ...state,
        selectedOrganism: null,
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
      const notes = nextGrid.map((row, y) => {
        const key = state.musicBox.keys[state.musicBox.currentKey];
        return {
          active: row[nextColumn],
          note: key[y % key.length],
        };
      }).filter(blip => blip.active)
      .map(blip => blip.note);

      synth.triggerAttackRelease(notes, 0.2);
      
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
