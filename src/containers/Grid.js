import React from 'react';
import { connect } from 'react-redux';

import GridComponent from '../components/Grid';
import { PAINT_CELLS, SELECT_ORGANISM, TOGGLE_CELL } from '../constants';

const Grid = ({ grid, history, compositionHex, compositionLoadError, notes, currentColumn, playing, selectedOrganism, selectOrganism, toggleCell, paintCells }) => (
  <GridComponent
    grid={grid}
    history={history}
    compositionHex={compositionHex}
    compositionLoadError={compositionLoadError}
    notes={notes}
    currentColumn={currentColumn}
    playing={playing}
    selectedOrganism={selectedOrganism}
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
  notes: state.musicBox.keys[state.musicBox.currentKey],
  currentColumn: state.currentColumn,
  playing: Boolean(state.interval),
  selectedOrganism: state.selectedOrganism,
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
