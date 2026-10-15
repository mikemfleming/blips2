import React from 'react';
import { ORGANISMS } from '../organisms';

class OrganismPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false, position: null };
    this.dismiss = this.dismiss.bind(this);
    ['setHeading','beginPanelDrag','movePanel','endPanelDrag','resizePanel','moveWithKeyboard'].forEach(name => {
      this[name] = this[name].bind(this);
    });
  }

  componentDidMount() {
    // Native drag feedback would otherwise display the whole card over the
    // renderer's organism preview. Use a transparent, attached drag image.
    this.dragImage = document.createElement('canvas');
    this.dragImage.width = 1;
    this.dragImage.height = 1;
    this.dragImage.setAttribute('aria-hidden', 'true');
    this.dragImage.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;pointer-events:none;';
    document.body.appendChild(this.dragImage);
    document.addEventListener('mousedown', this.dismiss);
    document.addEventListener('touchstart', this.dismiss);
    document.addEventListener('keydown', this.dismiss);
    document.addEventListener('pointermove', this.movePanel);
    document.addEventListener('pointerup', this.endPanelDrag);
    document.addEventListener('pointercancel', this.endPanelDrag);
    window.addEventListener('resize', this.resizePanel);
  }

  componentWillUnmount() {
    if (this.dragImage) this.dragImage.remove();
    document.removeEventListener('mousedown', this.dismiss);
    document.removeEventListener('touchstart', this.dismiss);
    document.removeEventListener('keydown', this.dismiss);
    document.removeEventListener('pointermove', this.movePanel);
    document.removeEventListener('pointerup', this.endPanelDrag);
    document.removeEventListener('pointercancel', this.endPanelDrag);
    window.removeEventListener('resize', this.resizePanel);
    this.setHeading(null);
  }

  componentDidUpdate(previous, previousState) {
    if (this.props.playing && !previous.playing && this.state.open) this.setState({ open: false });
    if (this.state.open && !previousState.open) this.resizePanel();
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
    if (event.key === 'Escape') {
      this.setState({ open: false });
      this.props.selectOrganism(null);
      this.button.focus();
    } else if (event.type !== 'keydown' && this.root && !this.root.contains(event.target)) {
      this.setState({ open: false });
    }
  }

  render() {
    const { playing, selectOrganism } = this.props;
    return (
      <div className="organism-picker" ref={element => { this.root = element; }}>
        <button type="button" ref={element => { this.button = element; }} aria-label="Conway organisms" title={playing ? 'Pause to add Conway organisms' : 'Conway organisms'} aria-expanded={this.state.open} aria-controls="organism-menu" aria-haspopup="dialog" disabled={playing} onClick={() => this.setState({ open: !this.state.open })}>
          <svg className="seed-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {[[8,2],[14,8],[2,14],[8,14],[14,14]].map(([x,y]) => <rect key={`${x}-${y}`} x={x} y={y} width="5" height="5" rx=".5" />)}
          </svg>
        </button>
        {this.state.open ? (
          <div id="organism-menu" className="organism-menu" role="dialog" aria-label="Conway organisms"
            ref={element => { this.panel = element; }}
            style={this.state.position ? { position: 'fixed', left: this.state.position.x, top: this.state.position.y, right: 'auto' } : undefined}
          >
            <div className="organism-heading" ref={this.setHeading} role="button" tabIndex="0"
              aria-label="Move organism panel" title="Drag to reposition · Arrow keys to move" onKeyDown={this.moveWithKeyboard}>
              <span>Conway organisms</span><span className="drag-grip" aria-hidden="true">⠿</span>
            </div>
            <p>Drag onto the grid, or select then click a square.</p>
            <div className="organism-list">
              {ORGANISMS.map(organism => (
                <button type="button" key={organism.id} className="organism-card" aria-label={`Place ${organism.name}`} title={`Drag ${organism.name} onto the grid`} draggable="true"
                  onClick={() => { selectOrganism(organism.id); this.setState({ open: false }); }}
                  onDragStart={event => {
                    event.dataTransfer.effectAllowed = 'copy';
                    event.dataTransfer.setDragImage(this.dragImage, 0, 0);
                    event.dataTransfer.setData('application/x-blips-organism', organism.id);
                    event.dataTransfer.setData('text/plain', `blips-organism:${organism.id}`);
                    selectOrganism(organism.id);
                  }}
                  onDragEnd={() => { selectOrganism(null); }}
                >
                  <svg viewBox={`-1 -1 ${organism.width+2} ${organism.height+2}`} aria-hidden="true" className="organism-thumbnail">
                    {organism.cells.map(cell => <rect key={`${cell.x}-${cell.y}`} x={cell.x} y={cell.y} width=".85" height=".85" fill="currentColor" />)}
                  </svg>
                  <span><strong>{organism.name}</strong><small>{organism.kind}</small></span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

export default OrganismPicker;
