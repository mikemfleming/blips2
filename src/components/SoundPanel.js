import React from 'react';
import TempoControl from './TempoControl';

const EFFECTS = [
  { id: 'spatial', bit: 1, label: 'Spatial audio', hint: 'Position notes across the stereo field' },
  { id: 'pingPong', bit: 2, label: 'Ping-pong delay', hint: 'Tempo-synced echoes, alternating left and right' },
  { id: 'evolving', bit: 4, label: 'Evolving filter', hint: 'Let population density shape the brightness' },
  { id: 'modulation', bit: 8, label: 'Chorus / phaser', hint: 'Add width and slow movement' },
];

class SoundPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
    this.dismiss = this.dismiss.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.dismiss);
    document.addEventListener('touchstart', this.dismiss);
    document.addEventListener('keydown', this.dismiss);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.dismiss);
    document.removeEventListener('touchstart', this.dismiss);
    document.removeEventListener('keydown', this.dismiss);
  }

  dismiss(event) {
    if (event.key === 'Escape' && this.state.open) {
      this.setState({ open: false }); this.button.focus();
    } else if (event.type !== 'keydown' && this.root && !this.root.contains(event.target)) this.setState({ open: false });
  }

  render() {
    const { isMajorKey, toggleKey, effects = 0, toggleEffect, isMuted, toggleMute, reset, playing, bpm, setBpm } = this.props;
    const activeCount = EFFECTS.filter(effect => effects & effect.bit).length;
    return (
      <div className="sound-control" ref={element => { this.root = element; }}>
        <button type="button" className="labeled-tool" aria-label="Sound" title="Scale and audio effects" aria-expanded={this.state.open} aria-controls="sound-panel" ref={element => { this.button = element; }} onClick={() => this.setState({ open: !this.state.open })}>
          <span>Sound</span>{activeCount ? <span className="effect-count">{activeCount}</span> : null}<span className="tool-chevron" aria-hidden="true">⌄</span>
        </button>
        {this.state.open ? (
          <div id="sound-panel" className="sound-panel" role="region" aria-label="Sound settings">
            <div className="panel-label">Pentatonic scale</div>
            <div className="scale-options" role="group" aria-label="Pentatonic scale">
              <button type="button" aria-label="Major pentatonic" title="Use the major pentatonic scale" aria-pressed={isMajorKey} onClick={() => { if (!isMajorKey) toggleKey(); }}>Major</button>
              <button type="button" aria-label="Minor pentatonic" title="Use the minor pentatonic scale" aria-pressed={!isMajorKey} onClick={() => { if (isMajorKey) toggleKey(); }}>Minor</button>
            </div>
            <div className="panel-label">Effects</div>
            {EFFECTS.map(effect => (
              <button type="button" key={effect.id} className="sound-effect" aria-label={effect.label} aria-pressed={Boolean(effects & effect.bit)} title={effect.hint} onClick={() => toggleEffect(effect.id)}>
                <span><strong>{effect.label}</strong><small>{effect.hint}</small></span>
                <span className={`effect-switch ${effects & effect.bit ? 'on' : ''}`} aria-hidden="true"><span /></span>
              </button>
            ))}
            <div className="mobile-sound-tools">
              <div className="panel-label">Playback</div>
              <div className="mobile-playback-row">
                <TempoControl bpm={bpm} setBpm={setBpm} />
                <button type="button" aria-label={isMuted ? 'Unmute' : 'Mute'} title={isMuted ? 'Unmute audio' : 'Mute audio'} onClick={toggleMute}>{isMuted ? 'Unmute' : 'Mute'}</button>
                <button type="button" aria-label="Clear grid" title="Clear composition" disabled={playing} onClick={reset}>Clear</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

export default SoundPanel;
