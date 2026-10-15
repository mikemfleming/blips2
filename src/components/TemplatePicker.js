import React from 'react';
import { TEMPLATES, templateHref } from '../templates';

class TemplatePicker extends React.Component {
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
      this.setState({ open: false });
      this.button.focus();
    } else if (event.type !== 'keydown' && this.root && !this.root.contains(event.target)) {
      this.setState({ open: false });
    }
  }

  render() {
    return (
      <div className="template-control" ref={element => { this.root = element; }}>
        <button type="button" className="labeled-tool" title="Explore composition templates" aria-expanded={this.state.open} aria-controls="template-panel" ref={element => { this.button = element; }} onClick={() => this.setState({ open: !this.state.open })}>
          Templates <span className="tool-chevron" aria-hidden="true">⌄</span>
        </button>
        {this.state.open ? (
          <div id="template-panel" className="template-panel" role="region" aria-label="Composition templates">
            <div className="panel-label">Start from a seed</div>
            <p>Open a fresh composition, ready to play.</p>
            {TEMPLATES.map(template => (
              <a key={template.id} href={templateHref(template)} title={`Load ${template.name}`}>
                <strong>{template.name}</strong>
                <small>{template.description}</small>
                <span>{template.key ? 'Minor' : 'Major'} · {template.bpm} BPM</span>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
}

export default TemplatePicker;
