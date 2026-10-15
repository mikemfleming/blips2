import React from 'react';
import { ControlsContainer } from '../styles';
import OrganismPicker from './OrganismPicker';
import TempoControl from './TempoControl';
import SoundPanel from './SoundPanel';
import TemplatePicker from './TemplatePicker';

const Controls = props => (
  <ControlsContainer aria-label="Playback controls">
    <div className="toolbar-group">
      <button type="button" aria-label={props.playing ? 'Pause' : 'Play'} title={props.playing ? 'Pause (Space)' : 'Play (Space)'} aria-keyshortcuts="Space" onClick={props.playing ? props.stop : props.start}>
        <i aria-hidden="true" className={`fas ${props.playing ? 'fa-pause' : 'fa-play'}`} />
      </button>
      <div className="desktop-tools toolbar-group">
        <button type="button" aria-label="Clear grid" title={props.playing ? 'Pause to clear the composition' : 'Clear composition'} disabled={props.playing} onClick={props.reset}>
          <i aria-hidden="true" className="fas fa-times" />
        </button>
        <button type="button" aria-label={props.isMuted ? 'Unmute' : 'Mute'} title={props.isMuted ? 'Unmute audio' : 'Mute audio'} aria-pressed={props.isMuted} onClick={props.toggleMute}>
          <i aria-hidden="true" className={`fas ${props.isMuted ? 'fa-volume-off' : 'fa-volume-up'}`} />
        </button>
        <TempoControl bpm={props.bpm} setBpm={props.setBpm} />
      </div>
    </div>
    <div className="toolbar-group composition-tools">
      <SoundPanel {...props} />
      <OrganismPicker playing={props.playing} selectOrganism={props.selectOrganism} selectedOrganism={props.selectedOrganism} rotation={props.organismRotation} rotate={props.rotateOrganism} dragOrganism={props.dragOrganism} />
      <TemplatePicker />
    </div>
    <div className="toolbar-group share-tools">
      <button type="button" aria-label="Copy song seed URL" title="Copy song seed URL" onClick={props.share}>
        <svg className="seed-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 21v-9M12 15C5 15 3 10 3 5c6 0 9 3 9 8M12 11c0-5 3-8 9-8 0 6-3 9-9 9" />
        </svg>
      </button>
    </div>
    <span className="share-status" role="status" aria-live="polite">{props.shareStatus}</span>
  </ControlsContainer>
);

export default Controls;
