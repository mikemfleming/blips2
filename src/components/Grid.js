import React from 'react';
import { Sculpture } from '../styles';
import { organismAt, ORGANISMS } from '../organisms';
import SculptureRenderer, { INITIAL_VIEW, clamp, pickCell } from '../rendering/sculpture';

class GridComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.view = { ...INITIAL_VIEW };
    this.pending = new Map();
    this.selected = null;
    this.preview = [];
    this.gesture = null;
    this.frame = null;
    this.keyboardCell = { x: 0, y: 0 };
    ['beginDrag','drag','endDrag','wheel','tick','resize','keyDown','contextLost','contextRestored','dragOver','drop','dragLeave'].forEach(name => {
      this[name] = this[name].bind(this);
    });
  }

  componentDidMount() {
    this.initialize();
    const canvas = this.canvas;
    canvas.addEventListener('pointerdown', this.beginDrag);
    canvas.addEventListener('pointermove', this.drag);
    canvas.addEventListener('pointerup', this.endDrag);
    canvas.addEventListener('pointercancel', this.endDrag);
    canvas.addEventListener('lostpointercapture', this.endDrag);
    canvas.addEventListener('wheel', this.wheel, { passive: false });
    canvas.addEventListener('webglcontextlost', this.contextLost);
    canvas.addEventListener('webglcontextrestored', this.contextRestored);
    window.addEventListener('resize', this.resize);
  }

  componentDidUpdate(previous) {
    if (this.props.playing && !previous.playing) {
      this.pending.clear();
      this.gesture = null;
    }
    if (previous.grid !== this.props.grid || previous.history !== this.props.history) {
      if (this.props.currentColumn === -1 && previous.history !== this.props.history) this.pending.clear();
      if (this.renderer) this.renderer.update(this.props.grid, this.props.history);
    }
    if (previous.selectedOrganism !== this.props.selectedOrganism) {
      this.preview = this.props.selectedOrganism ? this.previewAt(this.selected) : [];
    }
    this.schedule();
  }

  componentWillUnmount() {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture','wheel','webglcontextlost','webglcontextrestored'].forEach((name,i) => {
      this.canvas.removeEventListener(name, [this.beginDrag,this.drag,this.endDrag,this.endDrag,this.endDrag,this.wheel,this.contextLost,this.contextRestored][i]);
    });
    window.removeEventListener('resize', this.resize);
    if (this.renderer) this.renderer.dispose();
  }

  initialize() {
    try {
      this.renderer = new SculptureRenderer(this.canvas);
      this.renderer.update(this.props.grid, this.props.history);
      if (this.state.error) this.setState({ error: null });
      this.schedule();
    } catch (error) {
      this.setState({ error: error.message });
    }
  }

  contextLost(event) {
    event.preventDefault();
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.renderer = null;
    this.setState({ error: 'Graphics paused. Waiting for the browser to restore the graphics context.' });
  }

  contextRestored() { this.initialize(); }
  resize() { this.schedule(); }

  schedule() {
    if (this.renderer && this.frame === null) this.frame = requestAnimationFrame(this.tick);
  }

  tick(time) {
    this.frame = null;
    if (!this.renderer) return;
    if (this.pending.size && !this.props.playing) {
      const cells = Array.from(this.pending.values());
      this.pending.clear();
      this.props.paintCells(cells);
    }
    this.renderer.draw(this.view, this.props.currentColumn, this.props.playing, this.selected, time, this.props.playing ? [] : this.preview);
    // Only playback animation needs continuous frames. Edits and camera changes request one.
    if (this.props.playing) this.schedule();
  }

  cellAt(x, y) {
    const { grid, history } = this.props;
    const rect = this.canvas.getBoundingClientRect();
    const height = history.length + 1;
    const top = pickCell(x,y,rect,grid.length,grid[0].length,height,this.view);
    if (top && grid[top.y][top.x]) return top;
    return pickCell(x,y,rect,grid.length,grid[0].length,height,this.view,height - 1);
  }

  previewAt(cell) {
    return organismAt(this.props.selectedOrganism, cell, this.props.grid.length, this.props.grid[0].length);
  }

  placeOrganism(cell, id = this.props.selectedOrganism) {
    if (this.props.playing || !cell) return;
    const cells = organismAt(id, cell, this.props.grid.length, this.props.grid[0].length);
    if (!cells.length) return;
    this.props.paintCells(cells);
    this.props.selectOrganism(null);
    this.preview = [];
    this.schedule();
  }

  dragOver(event) {
    if (this.props.playing || !this.props.selectedOrganism) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    this.selected = this.cellAt(event.clientX,event.clientY);
    this.preview = this.previewAt(this.selected);
    this.schedule();
  }

  drop(event) {
    if (this.props.playing) return;
    const id = event.dataTransfer.getData('application/x-blips-organism');
    if (!ORGANISMS.some(organism => organism.id === id)) return;
    event.preventDefault();
    this.placeOrganism(this.cellAt(event.clientX,event.clientY), id);
  }

  dragLeave() {
    this.preview = [];
    this.schedule();
  }

  paint(cell) {
    if (!cell || this.props.playing) return;
    const key = `${cell.x}-${cell.y}`;
    if (this.gesture.visited.has(key)) return;
    this.gesture.visited.add(key);
    if (!this.props.grid[cell.y][cell.x]) this.pending.set(key,cell);
    this.schedule();
  }

  beginDrag(event) {
    if (event.button !== 0 || this.gesture) return;
    if (!this.props.playing && this.props.selectedOrganism) {
      this.placeOrganism(this.cellAt(event.clientX,event.clientY));
      return;
    }
    const cell = this.props.playing ? null : this.cellAt(event.clientX,event.clientY);
    this.gesture = { x:event.clientX, y:event.clientY, lastX:event.clientX, lastY:event.clientY,
      yaw:this.view.yaw, pitch:this.view.pitch, pointerId:event.pointerId,
      cell, moved:false, visited:new Set() };
    this.canvas.focus();
    this.canvas.setPointerCapture(event.pointerId);
  }

  drag(event) {
    const gesture = this.gesture;
    if (!gesture) {
      this.selected = this.props.playing ? null : this.cellAt(event.clientX,event.clientY);
      this.preview = this.props.selectedOrganism ? this.previewAt(this.selected) : [];
      this.schedule();
      return;
    }
    if (gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.x; const dy = event.clientY - gesture.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) gesture.moved = true;
    if (gesture.moved && gesture.cell) {
      this.paint(gesture.cell);
      const samples = Math.max(1,Math.ceil(Math.hypot(event.clientX-gesture.lastX,event.clientY-gesture.lastY)/3));
      for (let i=1; i<=samples; i+=1) this.paint(this.cellAt(
        gesture.lastX+(event.clientX-gesture.lastX)*i/samples,
        gesture.lastY+(event.clientY-gesture.lastY)*i/samples,
      ));
    } else if (gesture.moved) {
      this.view.yaw = gesture.yaw + dx*.008;
      this.view.pitch = clamp(gesture.pitch+dy*.008,.15,1.4);
      this.selected = null;
      this.canvas.classList.add('dragging');
    }
    gesture.lastX=event.clientX; gesture.lastY=event.clientY;
    this.schedule();
  }

  endDrag(event) {
    const gesture=this.gesture;
    if (!gesture || gesture.pointerId!==event.pointerId) return;
    if (event.type==='pointerup') {
      this.drag(event);
      if (gesture.cell && !gesture.moved && !this.props.playing) this.props.toggleCell(gesture.cell.x,gesture.cell.y)();
    }
    this.gesture=null;
    this.canvas.classList.remove('dragging');
    this.schedule();
  }

  wheel(event) {
    event.preventDefault();
    this.view.zoom=clamp(this.view.zoom*(event.deltaY>0?.9:1.1),.4,3);
    this.schedule();
  }

  keyDown(event) {
    const cell=this.keyboardCell;
    const movement={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if (movement) {
      event.preventDefault();
      cell.x=clamp(cell.x+movement[0],0,this.props.grid[0].length-1);
      cell.y=clamp(cell.y+movement[1],0,this.props.grid.length-1);
      this.selected={...cell};
      this.preview=this.props.selectedOrganism ? this.previewAt(cell) : [];
      this.schedule();
    } else if (!this.props.playing && event.key==='Enter') {
      event.preventDefault();
      if (this.props.selectedOrganism) this.placeOrganism(cell);
      else this.props.toggleCell(cell.x,cell.y)();
    }
  }

  render() {
    return (
      <Sculpture>
        <div className="sculpture-caption">
          <span>{this.props.selectedOrganism ? 'Place organism on the grid · Escape to cancel' : 'Drag squares to draw · Drag background to rotate · Scroll to zoom'}</span>
          <span className="iteration">Iteration {this.props.history.length+1}</span>
        </div>
        {this.state.error || this.props.compositionLoadError ? (
          <p role="alert">{this.state.error || this.props.compositionLoadError}</p>
        ) : null}
        <canvas
          ref={element=>{this.canvas=element;}}
          tabIndex="0"
          role="group"
          aria-label="Interactive 3D sequencer. Use arrow keys to select a square, Enter to toggle it. Space to play or pause."
          onKeyDown={this.keyDown}
          onDragOver={this.dragOver}
          onDrop={this.drop}
          onDragLeave={this.dragLeave}
          onMouseLeave={this.dragLeave}
        />
      </Sculpture>
    );
  }
}

export default GridComponent;
