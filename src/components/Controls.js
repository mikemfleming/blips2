import React from 'react';
import { ControlsContainer } from '../styles';
import OrganismPicker from './OrganismPicker';

const Controls = ({ playing, stop, start, reset, toggleMute, toggleKey, isMajorKey, isMuted, share, shareStatus, selectOrganism }) => (
  <ControlsContainer aria-label="Playback controls">
    <button type="button" aria-label={playing ? 'Pause' : 'Play'} title={playing ? 'Pause (Space)' : 'Play (Space)'} aria-keyshortcuts="Space" onClick={playing ? stop : start}>
      <i aria-hidden="true" className={`fas ${playing ? 'fa-pause' : 'fa-play'}`} />
    </button>
    <button type="button" aria-label="Clear grid" title={playing ? 'Pause to clear the composition' : 'Clear composition'} disabled={playing} onClick={reset}>
      <i aria-hidden="true" className="fas fa-times" />
    </button>
    <button type="button" aria-label={isMuted ? 'Unmute' : 'Mute'} title={isMuted ? 'Unmute audio' : 'Mute audio'} aria-pressed={isMuted} onClick={toggleMute}>
      <i aria-hidden="true" className={`fas ${isMuted ? 'fa-volume-off' : 'fa-volume-up'}`} />
    </button>
    <button
      type="button"
      className="key-visualizer"
      aria-label={`${isMajorKey ? 'Major' : 'Minor'} pentatonic. Switch to ${isMajorKey ? 'minor' : 'major'}`}
      title={`${isMajorKey ? 'Major' : 'Minor'} pentatonic · Switch to ${isMajorKey ? 'minor' : 'major'}`}
      onClick={toggleKey}
    >
      {[0, 1, 2, 3, 4].map(index => (
        <span key={index} aria-hidden="true" className={`bouncey-ball ${playing ? 'bouncing' : ''} ${isMajorKey ? 'major' : 'minor'}`} />
      ))}
    </button>
    <button type="button" aria-label="Copy song seed URL" title="Copy song seed URL" onClick={share}>
      <svg className="seed-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21v-9M12 15C5 15 3 10 3 5c6 0 9 3 9 8M12 11c0-5 3-8 9-8 0 6-3 9-9 9" />
      </svg>
    </button>
    <OrganismPicker playing={playing} selectOrganism={selectOrganism} />
    <span className="share-status" role="status" aria-live="polite">{shareStatus}</span>
  </ControlsContainer>
);

export default Controls;
