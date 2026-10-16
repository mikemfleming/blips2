import React from 'react';
import { connect } from 'react-redux';

import GridComponent from '../components/Grid';
import { rowNotes } from '../music/arrangement';
import { PAINT_CELLS, SELECT_ORGANISM, TOGGLE_CELL } from '../constants';

const Grid = ({ grid, history, compositionHex, compositionLoadError, notes, noteLabOpen, currentColumn, playing, selectedOrganism, organismRotation, organismDrag, selectOrganism, toggleCell, paintCells }) => (
  <GridComponent
    grid={grid}
    history={history}
    compositionHex={compositionHex}
    compositionLoadError={compositionLoadError}
    notes={notes}
    noteLabOpen={noteLabOpen}
    currentColumn={currentColumn}
    playing={playing}
    selectedOrganism={selectedOrganism}
    organismRotation={organismRotation}
    organismDrag={organismDrag}
    selectOrganism={selectOrganism}
    toggleCell={toggleCell}
    paintCells={paintCells}
  />
);

const mapStateToProps = state => ({
  grid: state.grid,
  history: state.history,
  compositionHex: state.compositionHex,
  compositionLoadError: state.compositionLoadError,
  notes: rowNotes(state.musicBox),
  noteLabOpen: Boolean(state.noteLabOpen),
  currentColumn: state.currentColumn,
  playing: Boolean(state.interval),
  selectedOrganism: state.selectedOrganism,
  organismRotation: state.organismRotation,
  organismDrag: state.organismDrag,
});

const mapDispatchToProps = dispatch => ({
  toggleCell: (x, y, value) => () => dispatch({ type: TOGGLE_CELL, x, y, value }),
  selectOrganism: id => dispatch({ type: SELECT_ORGANISM, id }),
  paintCells: cells => dispatch({ type: PAINT_CELLS, cells }),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Grid);
