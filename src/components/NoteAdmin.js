import React from 'react';
import { connect } from 'react-redux';
import { PALETTES, PITCHES, DEFAULT_EXPERIMENT, makeArrangement, rowNotes } from '../music/arrangement';

class NoteAdmin extends React.Component {
  constructor(props) {
    super(props);
    this.state = { ...DEFAULT_EXPERIMENT, open: false };
  }

  change(field, value) {
    const settings = { ...this.state, [field]: value };
    this.setState(settings);
    this.props.setNotes(makeArrangement(settings));
  }

  render() {
    const { notes, active, setNotes, limit, setLimit, audition, column } = this.props;
    const s = this.state;
    return (
      <div className="note-admin">
        <button type="button" className="admin-toggle" aria-expanded={s.open} aria-controls="note-admin-panel" onClick={() => this.setState({ open: !s.open })}>
          Note lab {active ? '•' : ''}<span aria-hidden="true">{s.open ? '−' : '+'}</span>
        </button>
        {s.open ? <div id="note-admin-panel" role="region" aria-label="Note arrangement experiments">
          <p>Change any setting to hear it on the next step. Rows share a pitch across all columns. Row numbers follow grid coordinates, regardless of camera rotation.</p>
          <p role="status">{active ? 'Experimental mapping active' : 'Original mapping active'} · session only. Song links omit these settings.</p>
          <div className="admin-fields">
            <label>Palette<select value={s.palette} onChange={e => this.change('palette', e.target.value)}>{Object.keys(PALETTES).map(id => <option key={id} value={id}>{PALETTES[id].label}</option>)}</select></label>
            <label>Root<select value={s.root} onChange={e => this.change('root', Number(e.target.value))}>{PITCHES.map((pitch, i) => <option key={pitch} value={i}>{pitch}</option>)}</select></label>
            <label>Lowest octave<select value={s.octave} onChange={e => this.change('octave', Number(e.target.value))}>{[2, 3, 4].map(o => <option key={o} value={o}>{o}</option>)}</select></label>
            <label>Octave span<select value={s.octaves} onChange={e => this.change('octaves', Number(e.target.value))}>{[1, 2, 3].map(o => <option key={o} value={o}>{o}</option>)}</select></label>
            <label>Row order<select value={s.order} onChange={e => this.change('order', e.target.value)}>
              <option value="wave">Descending / ascending wave</option><option value="ascending">Ascending, repeat</option><option value="descending">Descending, repeat</option><option value="thirds">Alternate scale degrees, repeat</option>
            </select></label>
            <label>Max distinct notes<select value={limit} onChange={e => setLimit(Number(e.target.value))}>{[1, 2, 3, 4, 6, 8, 12, 16].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
          </div>
          <p>The note limit applies to experiments and keeps the first occupied rows. The wave smooths pitch movement; chord palettes constrain harmony.</p>
          <div className="admin-actions">
            <button type="button" onClick={() => setNotes(makeArrangement(s))}>Apply preset</button>
            <button type="button" onClick={() => setNotes(null)}>Restore original</button>
            <button type="button" onClick={() => audition()}>Hear column {Math.max(0, column) + 1}</button>
          </div>
          <div className="panel-label">Row mapping · edit or tap ▶ to hear</div>
          <div className="admin-rows">
            {notes.map((note, y) => <label key={y}><span>{y + 1}</span><select aria-label={`Row ${y + 1} note`} value={note} onChange={e => { const next = notes.slice(); next[y] = e.target.value; setNotes(next); }}>
              {Array.from({ length: 7 }, (_, o) => PITCHES.map(pitch => pitch + (o + 1))).reduce((all, octave) => all.concat(octave), []).map(n => <option key={n} value={n}>{n}</option>)}
              {!/^[A-G]#?[1-7]$/.test(note) || note.startsWith('E#') ? <option value={note}>{note}</option> : null}
            </select><button type="button" aria-label={`Audition row ${y + 1}: ${note}`} onClick={() => { if (!active) setNotes(notes); audition(y); }}>▶</button></label>)}
          </div>
          <label className="admin-export">Export mapping<textarea readOnly aria-label="Export note arrangement" onFocus={e => e.target.select()} value={JSON.stringify({ notes, maxNotes: limit })} /></label>
        </div> : null}
      </div>
    );
  }
}
export default connect(state => ({
  notes: rowNotes(state.musicBox), active: Boolean(state.musicBox.adminNotes),
  limit: state.musicBox.adminNoteLimit || 16, column: state.currentColumn,
}), dispatch => ({
  setNotes: notes => dispatch({ type: 'SET_ADMIN_NOTES', notes }),
  setLimit: limit => dispatch({ type: 'SET_ADMIN_NOTE_LIMIT', limit }),
  audition: row => dispatch({ type: 'AUDITION_ADMIN_NOTES', row }),
}))(NoteAdmin);
