import React from 'react';
import { ModalBackdrop, AboutPanel } from '../styles';

class About extends React.Component {
  constructor(props) {
    super(props);
    this.keyDown = this.keyDown.bind(this);
  }

  componentDidMount() {
    this.previousFocus = document.activeElement;
    this.closeButton.focus();
    window.addEventListener('keydown', this.keyDown, true);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.keyDown, true);
    const target = this.previousFocus && this.previousFocus !== document.body
      ? this.previousFocus : document.querySelector('header a');
    // Wait for the workspace to stop being inert before restoring focus.
    requestAnimationFrame(() => { if (target && target.isConnected) target.focus(); });
  }

  keyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.props.onClose();
    } else if (event.key === 'Tab') {
      const focusable = this.panel.querySelectorAll('button, a[href], [tabindex="0"]');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
  }

  render() {
    return (
      <ModalBackdrop onMouseDown={event => { if (event.target === event.currentTarget) this.props.onClose(); }}>
        <AboutPanel role="dialog" aria-modal="true" aria-labelledby="about-title" innerRef={element => { this.panel = element; }}>
          <div className="about-heading">
            <h2 id="about-title">Blips of Life 2</h2>
            <button type="button" aria-label="Close explainer" title="Close explainer (Esc)" ref={element => { this.closeButton = element; }} onClick={this.props.onClose}>×</button>
          </div>
          <div className="about-body" tabIndex="0" role="region" aria-label="About the project">
        <p>
          <em>Blips of Life 2</em> is a browser-based experiment in cellular automata,
          generative music, and spatial memory, built on{' '}
          <a className="link dim blue near-black" target="_blank" rel="noopener noreferrer" href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life">Conway&apos;s Game of Life</a>.
          The <a className="link dim blue near-black" target="_blank" rel="noopener noreferrer" href="https://mikemfleming.github.io/blips/#/">original Blips</a> mapped a two-dimensional cellular state onto a pentatonic
          sequencer. This version makes the evolution itself a persistent visual object.
        </p>
        <p>
          The grid expands from 16 × 16 to 32 × 32, with time steps on x,
          pentatonic pitches on y, and successive generations on z. Each completed
          sequencer pass becomes an immutable layer beneath the current state.
          The resulting 3D sculpture records births, survival, and extinction across
          generations rather than replacing each frame with the next.
        </p>
        <p>
          Doubling both grid dimensions quadruples the cells per layer. To support
          the larger grid and accumulating history, WebGL instancing replaces
          individual SVG faces with a shared cube mesh and per-instance coordinates.
          History stays in GPU buffers, with new layers appended as needed;
          playback highlighting uses shader uniforms without rebuilding geometry.
          Pointer rays intersect the editable plane for picking, and drawing updates
          are batched once per animation frame.
        </p>
        <p>
          A composition&apos;s seed is its initial grid and major/minor key, captured
          on first playback. The grid occupies 1,024 bits; the key adds one bit of
          information, stored in a final byte for a 129-byte payload. Sharing uses
          raw DEFLATE when it reduces size, otherwise uncompressed bytes, followed
          by Base64url encoding and a format prefix. The query parameter contains
          the complete starting state, so links reconstruct compositions without
          a database or server-side lookup. Life&apos;s deterministic rules reproduce
          the same evolution from that starting state, provided it is left unmodified.
        </p>
          </div>
        </AboutPanel>
      </ModalBackdrop>
    );
  }
}

export default About;
