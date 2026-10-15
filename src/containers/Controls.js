import React from 'react';
import { connect } from 'react-redux';

import { DEFAULT_BPM, SET_BPM, TOGGLE_EFFECT, SELECT_ORGANISM, ROTATE_ORGANISM, DRAG_ORGANISM, TOGGLE_KEY, START_GAME, STOP_GAME, STEP_GRID, RESET, TOGGLE_MUTE } from '../constants';

import ControlsComponent from '../components/Controls';
import { createShareUrl, copyShareUrl, isPlaybackShortcut } from '../composition/share';

class Controls extends React.Component {
  constructor(props) {
    super(props);
    this.state = { shareStatus: '' };
    this.mounted = false;
    this.keyDown = this.keyDown.bind(this);
    this.share = this.share.bind(this);
    this.pauseWhenAway = this.pauseWhenAway.bind(this);
    this.visibilityChanged = this.visibilityChanged.bind(this);
  }

  componentDidMount() {
    this.mounted = true;
    window.addEventListener('keydown', this.keyDown, true);
    window.addEventListener('blur', this.pauseWhenAway);
    window.addEventListener('pagehide', this.pauseWhenAway);
    document.addEventListener('visibilitychange', this.visibilityChanged);
  }

  componentDidUpdate(previous) {
    if (this.props.suspended && !previous.suspended) this.pauseWhenAway();
    else if (!this.props.suspended && this.props.playing && this.props.bpm !== previous.bpm) {
      this.props.start(this.props.bpm, this.props.interval);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    window.removeEventListener('keydown', this.keyDown, true);
    window.removeEventListener('blur', this.pauseWhenAway);
    window.removeEventListener('pagehide', this.pauseWhenAway);
    document.removeEventListener('visibilitychange', this.visibilityChanged);
    this.pauseWhenAway();
    clearTimeout(this.statusTimeout);
  }

  pauseWhenAway() {
    if (this.props.playing) this.props.stop();
  }

  visibilityChanged() {
    if (document.hidden) this.pauseWhenAway();
  }

  keyDown(event) {
    if (event.defaultPrevented || !isPlaybackShortcut(event)) return;
    event.preventDefault();
    if (!event.repeat) {
      if (this.props.playing) this.props.stop();
      else this.props.start(this.props.bpm, this.props.interval);
    }
  }

  showShareStatus(message) {
    if (!this.mounted) return;
    clearTimeout(this.statusTimeout);
    this.setState({ shareStatus: message });
    this.statusTimeout = setTimeout(() => this.setState({ shareStatus: '' }), 3500);
  }

  share() {
    try {
      const url = createShareUrl(this.props.composition, window.location.href);
      copyShareUrl(url).then(() => this.showShareStatus('Link copied'))
        .catch(() => this.showShareStatus('Could not copy link. Try again.'));
    } catch (error) {
      this.showShareStatus('Could not copy link. Try again.');
    }
  }

  render() {
    return <ControlsComponent {...this.props} start={() => this.props.start(this.props.bpm, this.props.interval)} share={this.share} shareStatus={this.state.shareStatus} />;
  }
}

const mapStateToProps = state => ({
  composition: { grid: state.grid, musicBox: state.musicBox, compositionHex: state.compositionHex },
  notesToPlay: state.musicBox.currentNotes,
  keys: state.musicBox.keys,
  playing: Boolean(state.interval),
  interval: state.interval,
  bpm: state.musicBox.bpm,
  effects: state.musicBox.effects,
  organismRotation: state.organismRotation,
  selectedOrganism: state.selectedOrganism,
  isMajorKey: state.musicBox.currentKey === 0,
  isMuted: state.musicBox.mute,
});

const mapDispatchToProps = dispatch => ({
  toggleKey: index => dispatch({ type: TOGGLE_KEY, index }),
  start: (bpm = DEFAULT_BPM, previousInterval) => {
    clearInterval(previousInterval);
    dispatch({
      type: START_GAME,
      interval: setInterval(() => dispatch({ type: STEP_GRID }), 60000 / (bpm * 4)),
    });
  },
  toggleEffect: effect => dispatch({ type: TOGGLE_EFFECT, effect }),
  setBpm: bpm => dispatch({ type: SET_BPM, bpm }),
  stop: () => dispatch({ type: STOP_GAME }),
  dragOrganism: position => dispatch({ type: DRAG_ORGANISM, position }),
  rotateOrganism: direction => dispatch({ type: ROTATE_ORGANISM, direction }),
  selectOrganism: id => dispatch({ type: SELECT_ORGANISM, id }),
  reset: () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('c');
    window.history.replaceState(window.history.state, '', url.toString());
    dispatch({ type: RESET });
  },
  toggleMute: () => dispatch({ type: TOGGLE_MUTE }),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Controls);
