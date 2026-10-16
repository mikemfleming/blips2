import React from 'react';
import { connect } from 'react-redux';
import { bestFitChord } from '../music/chord';
import { PALETTES, PITCHES, DEFAULT_EXPERIMENT, makeArrangement, rowNotes, parseMapping, columnNotes } from '../music/arrangement';

class NoteAdmin extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ...DEFAULT_EXPERIMENT, open: false, importText: '', importError: '', importStatus: '' };
    this.keyDown = this.keyDown.bind(this);
  }

  componentDidMount() {
    window.addEventListener('keydown', this.keyDown, true);
  }

  keyDown(event) {
    if (!this.state.open || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const target = event.target;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
      || (target.closest && target.closest('[aria-modal="true"], .organism-heading')))) return;
    const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!direction) return;
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) this.props.step(direction);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.keyDown, true);
    this.props.setOpen(false);
  }

  toggleOpen() {
    const open = !this.state.open;
    this.setState({ open });
    this.props.setOpen(open);
  }

  change(field, value) {
    const settings = { ...this.state, [field]: value };
    this.setState(settings);
    this.props.setNotes(makeArrangement(settings));
  }

  importMapping() {
    try {
      const mapping = parseMapping(this.state.importText);
      this.props.importMapping(mapping);
      this.setState({ importText: '', importError: '', importStatus: 'Mapping imported.' });
    } catch (error) {
      this.setState({ importError: error.message, importStatus: '' });
    }
  }

  render() {
    const { notes, active, setNotes, limit, setLimit, audition, column, step, iteration, chord } = this.props;
    const s = this.state;
    return (
      <div className="note-admin">
        <button type="button" className="admin-toggle" aria-expanded={s.open} aria-controls="note-admin-panel" onClick={() => this.toggleOpen()}>
          Note lab {active ? '•' : ''}<span aria-hidden="true">{s.open ? '−' : '+'}</span>
        </button>
        {s.open ? <div id="note-admin-panel" role="region" aria-label="Note arrangement experiments">
          <div className="lab-transport" role="group" aria-label="Step through composition">
            <button type="button" aria-label="Previous column" title="Previous column (←)" aria-keyshortcuts="ArrowLeft" disabled={iteration === 1 && column <= 0} onClick={() => step(-1)}>←</button>
            <span className="lab-position" role="status">Column {column < 0 ? '—' : column + 1}<small>Generation {iteration}</small></span>
            <button type="button" aria-label="Next column" title="Next column (→)" aria-keyshortcuts="ArrowRight" onClick={() => step(1)}>→</button>
          </div>
          {chord ? <div className="lab-chord" aria-label="Current column chord" title={chord.pitches.length ? `Notes: ${chord.pitches.join(', ')}. ${chord.approximate ? 'Closest chord match; some tones differ.' : 'Exact pitch-class match.'}` : 'No notes in this column'}>
            <span>{chord.approximate ? 'Best fit' : 'Chord'}</span><strong>{chord.label}</strong>
          </div> : null}
          <p className="lab-hint">← / → to step · Changes apply as you play</p>
          <div className="admin-fields">
            <label>Scale<select value={s.palette} onChange={e => this.change('palette', e.target.value)}>{Object.keys(PALETTES).map(id => <option key={id} value={id}>{PALETTES[id].label}</option>)}</select></label>
            <label>Root<select value={s.root} onChange={e => this.change('root', Number(e.target.value))}>{PITCHES.map((pitch, i) => <option key={pitch} value={i}>{pitch}</option>)}</select></label>
            <label className="lab-wide">Arrangement<select value={s.order} onChange={e => this.change('order', e.target.value)}>
              <option value="wave">Wave · down and back</option><option value="ascending">Ascending</option><option value="descending">Descending</option><option value="thirds">Alternating scale degrees</option>
            </select></label>
          </div>
          <div className="lab-footer">
            <span className="lab-state" role="status">{active ? 'Custom mapping' : 'Original mapping'}</span>
            <button type="button" className="lab-reset" onClick={() => setNotes(active ? null : makeArrangement(s))}>{active ? 'Restore original' : 'Try preset'}</button>
          </div>
          <details className="lab-advanced">
            <summary>Advanced</summary>
            <div className="admin-fields">
            <label>Lowest octave<select value={s.octave} onChange={e => this.change('octave', Number(e.target.value))}>{[2, 3, 4].map(o => <option key={o} value={o}>{o}</option>)}</select></label>
            <label>Octave span<select value={s.octaves} onChange={e => this.change('octaves', Number(e.target.value))}>{[1, 2, 3].map(o => <option key={o} value={o}>{o}</option>)}</select></label>
              <label className="lab-wide">Max simultaneous notes<select value={limit} onChange={e => setLimit(Number(e.target.value))}>{Array.from({ length: 16 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}</select></label>
            </div>
            <p>Note limits apply to custom mappings, keeping the first occupied rows.</p>
            <div className="lab-row-heading"><span>Individual rows</span><button type="button" onClick={() => setNotes(makeArrangement(s))}>Reset to preset</button></div>
          <div className="admin-rows">
            {notes.map((note, y) => <label key={y}><span>{y + 1}</span><select aria-label={`Row ${y + 1} note`} value={note} onChange={e => { const next = notes.slice(); next[y] = e.target.value; setNotes(next); }}>
              {Array.from({ length: 7 }, (_, o) => PITCHES.map(pitch => pitch + (o + 1))).reduce((all, octave) => all.concat(octave), []).map(n => <option key={n} value={n}>{n}</option>)}
              {!/^[A-G]#?[1-7]$/.test(note) || note.startsWith('E#') ? <option value={note}>{note}</option> : null}
            </select><button type="button" aria-label={`Audition row ${y + 1}: ${note}`} onClick={() => { if (!active) setNotes(notes); audition(y); }}>▶</button></label>)}
          </div>
            <label className="admin-export">Import mapping
              <textarea aria-label="Import note arrangement" placeholder="Paste exported JSON" value={s.importText} aria-invalid={Boolean(s.importError)} aria-describedby={s.importError ? 'mapping-import-error' : undefined}
                onChange={e => this.setState({ importText: e.target.value, importError: '', importStatus: '' })} />
            </label>
            <button type="button" className="lab-import" disabled={!s.importText.trim()} onClick={() => this.importMapping()}>Import mapping</button>
            {s.importError ? <p id="mapping-import-error" className="lab-import-error" role="alert">{s.importError}</p> : null}
            {s.importStatus ? <p role="status">{s.importStatus}</p> : null}
            <label className="admin-export">Export mapping<textarea readOnly aria-label="Export note arrangement" onFocus={e => e.target.select()} value={JSON.stringify({ notes, maxNotes: limit })} /></label>
          </details>
          <p className="lab-session">Session only · Custom mappings aren’t saved in song links.</p>
        </div> : null}
      </div>
    );
  }
}
export default connect(state => ({
  chord: state.noteLabOpen && state.currentColumn >= 0
    ? bestFitChord(columnNotes(state.grid, state.currentColumn, state.musicBox)) : null,
  notes: rowNotes(state.musicBox), active: Boolean(state.musicBox.adminNotes),
  limit: state.musicBox.adminNoteLimit || 16, column: state.currentColumn, iteration: state.history.length + 1,
}), dispatch => ({
  importMapping: mapping => dispatch({ type: 'IMPORT_NOTE_MAPPING', ...mapping }),
  step: direction => dispatch({ type: 'STEP_NOTE_LAB', direction }),
  setOpen: open => dispatch({ type: 'SET_NOTE_LAB_OPEN', open }),
  setNotes: notes => dispatch({ type: 'SET_ADMIN_NOTES', notes }),
  setLimit: limit => dispatch({ type: 'SET_ADMIN_NOTE_LIMIT', limit }),
  audition: row => dispatch({ type: 'AUDITION_ADMIN_NOTES', row }),
}))(NoteAdmin);
