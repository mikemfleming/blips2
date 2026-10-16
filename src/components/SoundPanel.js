import React from 'react';
import TempoControl from './TempoControl';
import NoteAdmin from './NoteAdmin';

const EFFECTS = [
  { id: 'spatial', bit: 1, label: 'Spatial audio', hint: 'Position notes across the stereo field' },
  { id: 'pingPong', bit: 2, label: 'Ping-pong delay', hint: 'Tempo-synced echoes, alternating left and right' },
  { id: 'evolving', bit: 4, label: 'Evolving filter', hint: 'Let population density shape the brightness' },
  { id: 'modulation', bit: 8, label: 'Chorus / phaser', hint: 'Add width and slow movement' },
];

class SoundPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false, position: null };
    ['setHeading', 'beginPanelDrag', 'movePanel', 'endPanelDrag', 'resizePanel', 'moveWithKeyboard'].forEach(name => {
      this[name] = this[name].bind(this);
    });
    this.dismiss = this.dismiss.bind(this);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.dismiss);
    document.addEventListener('touchstart', this.dismiss);
    document.addEventListener('keydown', this.dismiss);
    document.addEventListener('pointermove', this.movePanel);
    document.addEventListener('pointerup', this.endPanelDrag);
    document.addEventListener('pointercancel', this.endPanelDrag);
    window.addEventListener('resize', this.resizePanel);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.dismiss);
    document.removeEventListener('touchstart', this.dismiss);
    document.removeEventListener('keydown', this.dismiss);
    document.removeEventListener('pointermove', this.movePanel);
    document.removeEventListener('pointerup', this.endPanelDrag);
    document.removeEventListener('pointercancel', this.endPanelDrag);
    window.removeEventListener('resize', this.resizePanel);
    this.setHeading(null);
  }

  componentDidUpdate() {
    this.resizePanel();
  }

  setHeading(element) {
    if (this.heading) this.heading.removeEventListener('pointerdown', this.beginPanelDrag);
    this.heading = element;
    if (element) element.addEventListener('pointerdown', this.beginPanelDrag);
    else this.panelDrag = null;
  }

  boundedPosition(x, y) {
    const rect = this.panel.getBoundingClientRect();
    return {
      x: Math.max(8, Math.min(x, window.innerWidth - rect.width - 8)),
      y: Math.max(8, Math.min(y, window.innerHeight - rect.height - 8)),
    };
  }

  beginPanelDrag(event) {
    if (event.button !== 0 || this.panelDrag) return;
    event.preventDefault();
    const rect = this.panel.getBoundingClientRect();
    this.panelDrag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    this.heading.setPointerCapture(event.pointerId);
    this.heading.focus();
    this.setState({ position: this.boundedPosition(rect.left, rect.top) });
  }

  movePanel(event) {
    if (!this.panelDrag || event.pointerId !== this.panelDrag.pointerId) return;
    const drag = this.panelDrag;
    this.setState({ position: this.boundedPosition(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y) });
  }

  endPanelDrag(event) {
    if (this.panelDrag && event.pointerId === this.panelDrag.pointerId) this.panelDrag = null;
  }

  resizePanel() {
    if (!this.panel || !this.state.position) return;
    const position = this.boundedPosition(this.state.position.x, this.state.position.y);
    if (position.x !== this.state.position.x || position.y !== this.state.position.y) this.setState({ position });
  }

  moveWithKeyboard(event) {
    const direction = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] }[event.key];
    if (!direction) return;
    event.preventDefault();
    const rect = this.panel.getBoundingClientRect();
    this.setState({ position: this.boundedPosition(rect.left + direction[0]*16, rect.top + direction[1]*16) });
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
          <div id="sound-panel" className="sound-panel" role="region" aria-label="Sound settings"
            ref={element => { this.panel = element; }}
            style={this.state.position ? { position: 'fixed', left: this.state.position.x, top: this.state.position.y, right: 'auto' } : undefined}>
            <div className="organism-heading" ref={this.setHeading} role="button" tabIndex="0"
              aria-label="Move sound panel" title="Drag to reposition · Arrow keys to move" onKeyDown={this.moveWithKeyboard}>
              <span>Sound</span><span className="drag-grip" aria-hidden="true">⠿</span>
            </div>
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
            <NoteAdmin />
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
