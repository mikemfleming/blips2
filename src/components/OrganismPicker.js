import React from 'react';
import { ORGANISMS, rotateOrganism } from '../organisms';

class OrganismPicker extends React.Component {
  constructor(props) {
    super(props);
    this.state = { open: false, position: null };
    this.dismiss = this.dismiss.bind(this);
    ['setHeading','beginPanelDrag','movePanel','endPanelDrag','resizePanel','moveWithKeyboard','beginOrganismDrag','flushOrganismDrag','cancelOrganismDrag'].forEach(name => {
      this[name] = this[name].bind(this);
    });
  }

  componentDidMount() {
    this.root.addEventListener('pointerdown', this.beginOrganismDrag);
    this.root.addEventListener('lostpointercapture', this.cancelOrganismDrag);
    window.addEventListener('blur', this.cancelOrganismDrag);
    document.addEventListener('mousedown', this.dismiss);
    document.addEventListener('touchstart', this.dismiss);
    document.addEventListener('keydown', this.dismiss);
    document.addEventListener('pointermove', this.movePanel);
    document.addEventListener('pointerup', this.endPanelDrag);
    document.addEventListener('pointercancel', this.endPanelDrag);
    window.addEventListener('resize', this.resizePanel);
  }

  componentWillUnmount() {
    if (this.dragFrame) cancelAnimationFrame(this.dragFrame);
    this.root.removeEventListener('pointerdown', this.beginOrganismDrag);
    this.root.removeEventListener('lostpointercapture', this.cancelOrganismDrag);
    window.removeEventListener('blur', this.cancelOrganismDrag);
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
    if (this.props.playing && !previous.playing) { this.cancelOrganismDrag(); this.setState({ open: false }); }
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
    if (this.organismGesture) {
      const gesture = this.organismGesture;
      if (event.pointerId !== gesture.pointerId) return;
      gesture.currentX = event.clientX; gesture.currentY = event.clientY;
      if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 4) gesture.moved = true;
      if (gesture.moved && !this.dragFrame) this.dragFrame = requestAnimationFrame(this.flushOrganismDrag);
      return;
    }
    if (!this.panelDrag || event.pointerId !== this.panelDrag.pointerId) return;
    const drag = this.panelDrag;
    this.setState({ position: this.boundedPosition(drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y) });
  }

  endPanelDrag(event) {
    if (this.organismGesture && event.pointerId === this.organismGesture.pointerId) {
      const gesture = this.organismGesture;
      this.organismGesture = null;
      if (this.dragFrame) cancelAnimationFrame(this.dragFrame);
      this.dragFrame = null;
      if (event.type === 'pointerup') {
        gesture.moved = gesture.moved || Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 4;
        if (gesture.moved) this.props.dragOrganism({ x: event.clientX, y: event.clientY, drop: true });
        else { this.props.selectOrganism(gesture.id); this.setState({ open: false }); }
      } else this.props.selectOrganism(null);
      return;
    }
    if (this.panelDrag && event.pointerId === this.panelDrag.pointerId) this.panelDrag = null;
  }

  beginOrganismDrag(event) {
    const card = event.target.closest && event.target.closest('[data-organism]');
    if (!card || !this.root.contains(card) || event.button !== 0 || this.props.playing || this.organismGesture) return;
    event.preventDefault();
    const id = card.getAttribute('data-organism');
    this.organismGesture = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY,
      currentX: event.clientX, currentY: event.clientY, moved: false };
    card.focus();
    this.root.setPointerCapture(event.pointerId);
    this.props.selectOrganism(id);
  }

  flushOrganismDrag() {
    this.dragFrame = null;
    const gesture = this.organismGesture;
    if (gesture && gesture.moved) this.props.dragOrganism({ x: gesture.currentX, y: gesture.currentY });
  }

  cancelOrganismDrag() {
    if (!this.organismGesture) return;
    const { pointerId } = this.organismGesture;
    this.organismGesture = null;
    if (this.dragFrame) cancelAnimationFrame(this.dragFrame);
    this.dragFrame = null;
    if (this.root.hasPointerCapture(pointerId)) this.root.releasePointerCapture(pointerId);
    this.props.selectOrganism(null);
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
    const target = event.target;
    const editing = target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
      || (target.closest && target.closest('[aria-modal="true"]')));
    if (event.type === 'keydown' && (event.key || '').toLowerCase() === 'r'
      && !editing && !event.ctrlKey && !event.metaKey && !event.altKey
      && !this.props.playing && (this.state.open || this.props.selectedOrganism)) {
      event.preventDefault();
      if (!event.repeat) this.props.rotate(event.shiftKey ? -1 : 1);
      return;
    }
    if (event.key === 'Escape') {
      this.cancelOrganismDrag();
      this.setState({ open: false });
      this.props.selectOrganism(null);
      if (this.state.open) this.button.focus();
    } else if (event.type !== 'keydown' && this.root && !this.root.contains(event.target)) {
      this.setState({ open: false });
    }
  }

  render() {
    const { playing, selectOrganism, rotation = 0, rotate } = this.props;
    return (
      <div className="organism-picker" ref={element => { this.root = element; }}>
        <button type="button" ref={element => { this.button = element; }} className="labeled-tool" aria-label="Conway organisms" title={playing ? 'Pause to add Conway organisms' : 'Conway organisms'} aria-expanded={this.state.open} aria-controls="organism-menu" aria-haspopup="dialog" disabled={playing} onClick={() => this.setState({ open: !this.state.open })}>
          <span>Organisms</span><span className="tool-chevron" aria-hidden="true">⌄</span>
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
            <div className="organism-orientation">
              <span>Orientation <strong aria-live="polite">{rotation * 90}°</strong></span>
              <button type="button" aria-label="Rotate organism clockwise" title="Rotate 90° clockwise (R) · Counterclockwise (Shift+R)" aria-keyshortcuts="R Shift+R" onClick={() => rotate(1)}>↻</button>
            </div>
            <div className="organism-list">
              {ORGANISMS.map(original => rotateOrganism(original, rotation)).map(organism => (
                <button type="button" key={organism.id} className="organism-card" aria-label={`Place ${organism.name}`} title={`Drag ${organism.name} onto the grid`} data-organism={organism.id} draggable="false"
                  onClick={event => { if (event.detail === 0) { selectOrganism(organism.id); this.setState({ open: false }); } }}
                  onDragStart={event => event.preventDefault()}
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
