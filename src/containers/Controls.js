import React from 'react';
import { connect } from 'react-redux';

import { PERIOD_MS, SELECT_ORGANISM, TOGGLE_KEY, START_GAME, STOP_GAME, STEP_GRID, RESET, TOGGLE_MUTE } from '../constants';

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
    if (!event.repeat) (this.props.playing ? this.props.stop : this.props.start)();
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
    return <ControlsComponent {...this.props} share={this.share} shareStatus={this.state.shareStatus} />;
  }
}

const mapStateToProps = state => ({
  composition: { grid: state.grid, musicBox: state.musicBox, compositionHex: state.compositionHex },
  notesToPlay: state.musicBox.currentNotes,
  keys: state.musicBox.keys,
  playing: Boolean(state.interval),
  isMajorKey: state.musicBox.currentKey === 0,
  isMuted: state.musicBox.mute,
});

const mapDispatchToProps = dispatch => ({
  toggleKey: index => dispatch({ type: TOGGLE_KEY, index }),
  start: () => dispatch({
    type: START_GAME,
    interval: setInterval(() => dispatch({ type: STEP_GRID }), PERIOD_MS),
  }),
  stop: () => dispatch({ type: STOP_GAME }),
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
