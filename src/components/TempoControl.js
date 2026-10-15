import React from 'react';
import { MIN_BPM, MAX_BPM } from '../constants';

class TempoControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false, draft: String(props.bpm) };
    this.dismiss = this.dismiss.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.dismiss);
    document.addEventListener('touchstart', this.dismiss);
    document.addEventListener('keydown', this.dismiss);
  }

  componentDidUpdate(previous) {
    if (previous.bpm !== this.props.bpm) this.setState({ draft: String(this.props.bpm) });
  }

  commitTempo() {
    const bpm = Number(this.state.draft);
    if (Number.isInteger(bpm) && bpm >= MIN_BPM && bpm <= MAX_BPM) this.props.setBpm(bpm);
    else this.setState({ draft: String(this.props.bpm) });
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.dismiss);
    document.removeEventListener('touchstart', this.dismiss);
    document.removeEventListener('keydown', this.dismiss);
  }

  dismiss(event) {
    if (event.key === 'Escape' && this.state.open) {
      this.setState({ open: false });
      this.button.focus();
    } else if (event.type !== 'keydown' && this.root && !this.root.contains(event.target)) this.setState({ open: false });
  }

  render() {
    const { bpm, setBpm } = this.props;
    return (
      <div className="tempo-control" ref={element => { this.root = element; }}>
        <button type="button" className="tempo-button" ref={element => { this.button = element; }}
          title={`Speed: ${bpm} BPM`} aria-label={`Speed: ${bpm} BPM`} aria-expanded={this.state.open} aria-controls="tempo-panel"
          onClick={() => this.setState({ open: !this.state.open })}>
          <svg className="seed-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" />
          </svg>
          <span>{bpm} <span className="bpm-unit">BPM</span></span>
        </button>
        {this.state.open ? (
          <div id="tempo-panel" className="tempo-panel">
            <label htmlFor="tempo-value">Tempo <span>BPM</span></label>
            <input id="tempo-value" aria-label="Tempo in BPM" type="number" min={MIN_BPM} max={MAX_BPM} step="1" value={this.state.draft} onChange={event => this.setState({ draft: event.target.value })} onBlur={() => this.commitTempo()} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); this.commitTempo(); } }} />
            <input aria-label="Adjust tempo" type="range" min={MIN_BPM} max={MAX_BPM} step="1" value={bpm} onChange={event => setBpm(Number(event.target.value))} />
            <div className="tempo-presets">
              {[60,75,90,120,150].map(value => <button key={value} type="button" aria-pressed={bpm === value} onClick={() => setBpm(value)}>{value}</button>)}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

export default TempoControl;
