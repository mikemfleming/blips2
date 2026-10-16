import styled from 'styled-components';

export const AppContainer = styled.div`
  min-height: 100vh;
  font-size: 1.5rem;
  .about-page { margin: auto; max-width: 40vw; }
  @media (max-width: 960px) { .about-page { max-width: 65vw; } }
  @media (max-width: 768px) { .about-page { max-width: 90vw; } }
`;

export const Workspace = styled.main`
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #fafafa;
`;

export const WorkspaceHeader = styled.header`
  position: absolute;
  z-index: 2;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: clamp(.75rem, 3vw, 2rem);
  padding: clamp(.75rem, 3vw, 2rem);
  pointer-events: none;
  flex-wrap: wrap;
  > * { pointer-events: auto; }
  h1 { margin: 0; font-size: clamp(1.4rem, 4vw, 3rem); white-space: nowrap; }
  @media (max-width: 600px), (max-height: 500px) and (max-width: 960px) {
    flex-direction: column; align-items: stretch; gap: .65rem;
    padding: calc(env(safe-area-inset-top, 0px) + .75rem)
      calc(env(safe-area-inset-right, 0px) + .75rem) .5rem
      calc(env(safe-area-inset-left, 0px) + .75rem);
    > a { align-self: flex-start; }
    h1 { font-size: 1.5rem; line-height: 1.2; }
  }
`;

// from about: pl3 pr3 pt3-l ba bw3
// from grid: ba bw3
export const Box = styled.div`
  height: 40vw;
  @media (max-width: 960px) {
    height: 65vw;
  }
  @media (max-width: 768px) {
    height: 90vw;
  }
  .row {
    height: 6.25%;
  }
  .cell {
    display: inline-block;
    width: 6.25%;
    height: 100%;
    border: 1px solid white;
    background: #F4F4F4;
    &.active {
      background: #111111;
      &.playing { animation: trip .2s infinite; }
    }
  }
  .playing { background: #EEEEEE; }
  @keyframes trip {
    0% { background-color: #9400D3;  }
    20% { background-color: #0000FF; }
    40% { background-color: #00FF00; }
    60% { background-color: #FFFF00; }
    80% { background-color: #FF7F00; }
    100% { background-color: #FF0000; }
  }
`;

export const ControlsContainer = styled.div`
  max-width: 100%;
  flex-wrap: wrap;
  position: relative;
  .tempo-control { position: relative; }
  button.tempo-button { gap: .25rem; }
  .tempo-button span { font-size: .75rem; font-variant-numeric: tabular-nums; }
  .tempo-panel {
    position: absolute; top: calc(100% + .8rem); right: 0; width: 15rem;
    padding: 1rem; border: 1px solid #ddd; border-radius: .5rem;
    background: #fafafa; box-shadow: 0 8px 30px rgba(0,0,0,.12); font-size: .85rem;
  }
  .tempo-panel label { display: block; margin-bottom: .5rem; font-weight: 700; }
  .tempo-panel label span { font-weight: 400; color: #777; }
  .tempo-panel input { width: 100%; margin-bottom: .75rem; accent-color: #9d40d7; }
  .tempo-panel input[type="number"] { padding: .4rem; border: 1px solid #ccc; border-radius: .25rem; }
  @media (max-width: 600px) {
    .tempo-panel { position: fixed; left: 1rem; right: auto; top: 7rem; width: min(15rem, calc(100vw - 2rem)); }
  }
  .tempo-presets { display: flex; justify-content: space-between; }
  .tempo-presets button { font-size: .8rem; }
  .tempo-presets button[aria-pressed="true"] { background: #eee0f7; border-radius: .25rem; }
  .organism-picker { position: relative; }
  .organism-menu {
    position: absolute; top: calc(100% + .8rem); right: 0;
    width: min(21rem, calc(100vw - 1.5rem)); max-height: calc(100dvh - 7rem);
    overflow-y: auto; padding: 1rem; border: 1px solid #ddd;
    border-radius: .5rem; background: rgba(250,250,250,.98);
    box-shadow: 0 8px 30px rgba(0,0,0,.12); color: #111;
  }
  .organism-heading { display: flex; align-items: center; justify-content: space-between;
    font-size: .95rem; font-weight: 700; cursor: grab; touch-action: none; user-select: none;
    padding: .4rem 0; }
  .organism-heading:active { cursor: grabbing; }
  .organism-heading:focus-visible { outline: 2px solid #9d40d7; outline-offset: 3px; }
  .drag-grip { font-size: 1.2rem; color: #777; }
  .organism-menu p { margin: .4rem 0 .8rem; font-size: .75rem; line-height: 1.5; color: #666; }
  .organism-orientation { display: flex; align-items: center; justify-content: space-between; gap: .5rem;
    margin-bottom: .75rem; padding-bottom: .5rem; border-bottom: 1px solid #e5e5e5; font-size: .75rem; color: #666; }
  .organism-orientation strong { display: inline-block; margin-left: .4rem; min-width: 2.5rem; color: #111; font-variant-numeric: tabular-nums; }
  .organism-orientation button { font-size: 1.4rem; border: 1px solid #ddd; border-radius: .3rem; }
  .organism-list { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
  button.organism-card {
    height: auto; min-height: 4rem; justify-content: flex-start; gap: .6rem;
    padding: .6rem; border: 1px solid #ddd; border-radius: .3rem;
    background: white; text-align: left; cursor: grab; touch-action: none; user-select: none;
  }
  button.organism-card:hover { border-color: #9d40d7; background: #f7effd; }
  button.organism-card:active { cursor: grabbing; }
  .organism-thumbnail { width: 2.5rem; height: 2.5rem; flex-shrink: 0; }
  .organism-card strong { display: block; font-size: .8rem; }
  .organism-card small { display: block; margin-top: .25rem; color: #777; font-size: .65rem; }
  .seed-icon { width: 1.25em; height: 1.25em; }
  .share-status { position: absolute; top: calc(100% + .75rem); right: 0;
    font-size: .75rem; white-space: nowrap; color: #555; }

  display: flex;
  align-items: center;
  gap: .65rem;
  flex-shrink: 0;
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0;
    padding: .25rem;
    min-width: 2.25rem;
    height: 2.25rem;
    background: transparent;
    color: #111;
    font-size: 1.1rem;
    cursor: pointer;
  }
  button:disabled { opacity: .35; cursor: default; }
  button:focus-visible { outline: 2px solid #9d40d7; outline-offset: 3px; }


  .toolbar-group { display: flex; align-items: center; gap: .25rem; }
  .composition-tools, .share-tools { border-left: 1px solid #ddd; padding-left: .65rem; }
  > .toolbar-group button, .tempo-button { min-height: 2.25rem; border-radius: .35rem; }
  > .toolbar-group button:hover:not(:disabled) { background: #eee; }
  button.labeled-tool { padding: .4rem .6rem; gap: .4rem; font-size: .85rem; white-space: nowrap; }
  .tool-chevron { color: #777; font-size: .8rem; }
  .bpm-unit { color: #777; font-size: .65rem; }
  .sound-control { position: relative; }
  .template-control { position: relative; }
  .template-panel { position: absolute; top: calc(100% + .75rem); right: 0; width: 21rem;
    max-height: calc(100dvh - 8rem); overflow-y: auto; padding: 1rem;
    border: 1px solid #ddd; border-radius: .5rem; background: #fafafa;
    box-shadow: 0 8px 30px rgba(0,0,0,.12); }
  .template-panel p { font-size: .75rem; color: #777; margin: 0 0 .75rem; }
  .template-panel a { display: block; padding: .7rem .5rem; border-radius: .35rem; color: inherit; text-decoration: none; }
  .template-panel a:hover, .template-panel a:focus-visible { background: #eee; }
  .template-panel strong { display: block; font-size: .85rem; }
  .template-panel small { display: block; margin-top: .3rem; font-size: .75rem; line-height: 1.4; color: #666; }
  .template-panel a > span { display: block; margin-top: .35rem; font-size: .65rem; color: #702aae; }
  .effect-count { display: inline-flex; align-items: center; justify-content: center; width: 1.1rem; height: 1.1rem; border-radius: 50%; font-size: .65rem; background: #e8d8f4; color: #702aae; }
  .sound-panel { position: absolute; top: calc(100% + .75rem); right: 0; width: 21rem;
    max-height: calc(100dvh - 8rem); overflow-y: auto; padding: 1rem;
    border: 1px solid #ddd; border-radius: .5rem; background: #fafafa;
    box-shadow: 0 8px 30px rgba(0,0,0,.12); }
  .panel-label { margin-bottom: .6rem; font-size: .7rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #777; }
  .scale-options { display: flex; padding: .2rem; gap: .2rem; background: #eee; border-radius: .4rem; margin-bottom: 1.25rem; }
  .scale-options button { flex: 1; font-size: .85rem; border-radius: .3rem; }
  .scale-options button[aria-pressed="true"] { background: white; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
  button.sound-effect { width: 100%; height: auto; min-height: 3.5rem; justify-content: space-between;
    text-align: left; gap: .75rem; padding: .65rem .25rem; border-radius: .3rem; }
  .sound-effect strong { display: block; font-size: .85rem; font-weight: 500; }
  .sound-effect small { display: block; margin-top: .3rem; font-size: .7rem; line-height: 1.4; color: #777; }
  .effect-switch { width: 1.8rem; height: 1rem; padding: 2px; border-radius: 1rem; background: #ccc; flex-shrink: 0; }
  .effect-switch > span { display: block; width: .75rem; height: .75rem; border-radius: 50%; background: white; transition: transform .15s; }
  .effect-switch.on { background: #9d40d7; }
  .effect-switch.on > span { transform: translateX(.8rem); }
  .note-admin { border-top: 1px solid #ddd; margin-top: .75rem; padding-top: .5rem; }
  button.admin-toggle { width: 100%; justify-content: space-between; font-size: .85rem; color: #702aae; }
  .note-admin p { font-size: .75rem; line-height: 1.5; color: #666; }
  .admin-fields { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; }
  .note-admin label { display: block; font-size: .75rem; min-width: 0; }
  .note-admin select, .note-admin textarea { display: block; width: 100%; box-sizing: border-box; margin-top: .3rem; padding: .4rem; border: 1px solid #ccc; border-radius: .3rem; background: white; color: #222; font: inherit; }
  .lab-transport { display: flex; align-items: center; gap: .4rem; margin-top: .6rem; padding: .45rem; background: #eee; border-radius: .5rem; }
  .lab-transport button { border-radius: .3rem; min-width: 2rem; background: white; }
  .lab-chord { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; padding: .65rem .4rem .2rem; }
  .lab-chord > span { font-size: .7rem; color: #777; }
  .lab-chord strong { font-size: 1rem; font-weight: 600; color: #702aae; }
  .lab-position { flex: 1; text-align: center; font-size: .8rem; font-variant-numeric: tabular-nums; }
  .lab-position small { display: block; color: #777; font-size: .65rem; margin-top: .2rem; }
  .note-admin .lab-hint { margin: .5rem 0 1rem; font-size: .7rem; color: #777; }
  .lab-wide { grid-column: 1 / -1; }
  .lab-footer { display: flex; align-items: center; justify-content: space-between; margin: .65rem 0; gap: .5rem; }
  .lab-state { font-size: .7rem; color: #777; }
  .lab-footer button.lab-reset, .lab-row-heading button { font-size: .7rem; color: #702aae; padding: .3rem; }
  .lab-advanced { border-top: 1px solid #ddd; padding-top: .7rem; }
  .lab-advanced summary { cursor: pointer; font-size: .8rem; color: #555; padding: .3rem 0; }
  .lab-advanced summary:focus-visible { outline: 2px solid #9d40d7; outline-offset: 3px; }
  .lab-advanced[open] > .admin-fields { margin-top: .8rem; }
  .lab-row-heading { display: flex; align-items: center; justify-content: space-between; margin: 1rem 0 .5rem; font-size: .75rem; font-weight: 600; }
  .note-admin .lab-session { margin: .8rem 0 .15rem; font-size: .65rem; color: #888; }
  .admin-rows { display: grid; grid-template-columns: 1fr 1fr; gap: .3rem .7rem; }
  .admin-rows label { display: flex; align-items: center; gap: .3rem; }
  .admin-rows label > span { width: 1.3rem; flex-shrink: 0; color: #777; }
  .admin-rows select { margin: 0; min-width: 0; }
  .admin-rows button { padding: .25rem; min-width: 1.8rem; }
  .admin-export { margin-top: .75rem; }
  .admin-export textarea { min-height: 5rem; resize: vertical; }
  .note-admin button.lab-import { margin-top: .5rem; padding: .4rem .6rem; background: #eee; border-radius: .3rem; font-size: .75rem; }
  .note-admin p.lab-import-error { position: static; color: #a12828; font-size: .75rem; }

  .mobile-sound-tools { display: none; }
  @media (max-width: 600px), (max-height: 500px) and (max-width: 960px) {
    width: 100%; display: grid; grid-template-columns: 2.75rem minmax(0, 1fr) 2.75rem;
    gap: .2rem; padding: .25rem; border: 1px solid #e5e5e5; border-radius: .75rem;
    background: rgba(250,250,250,.95); box-shadow: 0 3px 16px rgba(0,0,0,.06);
    box-sizing: border-box;
    button { min-width: 2.75rem; min-height: 2.75rem; height: auto; touch-action: manipulation; }
    > .toolbar-group button, .tempo-button { min-height: 2.75rem; }
    .desktop-tools { display: none; }
    .composition-tools { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-left: none; padding-left: 0; min-width: 0; }
    .composition-tools > div { min-width: 0; }
    .share-tools { border-left: none; padding-left: 0; }
    .tool-chevron { display: none; }
    .effect-count { width: .9rem; height: .9rem; font-size: .6rem; flex-shrink: 0; }
    .sound-panel, .template-panel, .organism-menu, .tempo-panel {
      position: fixed; left: calc(env(safe-area-inset-left, 0px) + .75rem);
      right: calc(env(safe-area-inset-right, 0px) + .75rem);
      top: calc(env(safe-area-inset-top, 0px) + 7.5rem); width: auto;
      max-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 8.25rem);
      overflow-y: auto; overscroll-behavior: contain; box-sizing: border-box;
      padding: .85rem; -webkit-overflow-scrolling: touch;
    }
    .organism-menu { max-height: min(48dvh, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 8.25rem)); }
    .organism-heading { min-height: 2.75rem; padding: 0; }
    .organism-thumbnail { width: 2rem; height: 2rem; }
    button.organism-card { padding: .5rem; gap: .4rem; }
    .template-panel a { min-height: 2.75rem; }
    .mobile-sound-tools { display: block; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #ddd; }
    .mobile-playback-row { display: flex; align-items: center; justify-content: space-between; gap: .4rem; }
    .mobile-playback-row button { font-size: .8rem; }
    .tempo-panel { z-index: 1; }
    .tempo-panel input[type="number"] { font-size: 1rem; min-height: 2.75rem; box-sizing: border-box; }
    .tempo-panel input[type="range"] { min-height: 2.75rem; }
    .toolbar-group { gap: .1rem; }
    button.labeled-tool { width: 100%; padding: .4rem .15rem; gap: .2rem; font-size: .72rem; }
    .share-status { top: calc(100% + .25rem); background: #fafafa; padding: .3rem .5rem; border-radius: .3rem; }
  }

`;

export const Sculpture = styled.div`
  position: absolute;
  inset: 0;
  .sculpture-caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 1rem;
    padding: 1rem clamp(.75rem, 3vw, 2rem);
    font-size: .75rem;
    color: #555;
    pointer-events: none;
  }
  .iteration { white-space: nowrap; }
  .touch-hint { display: none; }
  @media (max-width: 768px) {
    .sculpture-caption { flex-direction: column; align-items: stretch; gap: .5rem; }
    .iteration { align-self: flex-end; }
  }
  @media (pointer: coarse) {
    .desktop-hint { display: none; }
    .touch-hint { display: inline; }
  }
  @media (max-width: 600px), (max-height: 500px) and (max-width: 960px) {
    .sculpture-caption { padding: .75rem calc(env(safe-area-inset-right, 0px) + .75rem)
      calc(env(safe-area-inset-bottom, 0px) + .75rem) calc(env(safe-area-inset-left, 0px) + .75rem);
      font-size: .65rem; gap: .3rem; }
    p[role="alert"] { top: calc(env(safe-area-inset-top, 0px) + 8rem); left: 1rem; right: 1rem; font-size: .85rem; }
  }
  p[role="alert"] { position: absolute; top: 6rem; left: 2rem; z-index: 1; }
  canvas { display: block; width: 100%; height: 100%;
    touch-action: none; user-select: none; cursor: grab; }
  canvas:focus-visible { outline: 2px solid #9d40d7; outline-offset: -2px; }
  canvas.editable { cursor: crosshair; }
  canvas.dragging { cursor: grabbing; }
  .playing-note-labels { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden; }
  .playing-note-labels text { fill: #222; font: 11px system-ui, sans-serif; paint-order: stroke; stroke: #fafafa; stroke-width: 3px; stroke-linejoin: round; }

`;

export const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 4vw, 3rem);
  background: rgba(15, 20, 25, .25);
  padding: max(1rem, env(safe-area-inset-top, 0px)) max(1rem, env(safe-area-inset-right, 0px))
    max(1rem, env(safe-area-inset-bottom, 0px)) max(1rem, env(safe-area-inset-left, 0px));
`;

export const AboutPanel = styled.article`
  width: 100%;
  max-width: 40rem;
  max-height: min(70dvh, 36rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: clamp(1.25rem, 3vw, 2rem);
  border-radius: .75rem;
  background: #fafafa;
  box-shadow: 0 16px 64px rgba(0,0,0,.18);
  font-size: 1rem;
  line-height: 1.7;
  .about-heading { display: flex; flex-shrink: 0; align-items: center; justify-content: space-between; gap: 1rem; padding-bottom: .75rem; }
  .about-body { min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding-right: .5rem; }
  .about-body:focus-visible { outline: 2px solid #9d40d7; outline-offset: -2px; }
  .about-body p:first-child { margin-top: 0; }
  h2 { margin: 0; font-size: clamp(1.5rem, 4vw, 2rem); line-height: 1.25; }
  button { border: none; background: transparent; color: #111; font-size: 2rem; cursor: pointer; padding: 0 .25rem; }
  button:focus-visible, a:focus-visible { outline: 2px solid #9d40d7; outline-offset: 3px; }
  p:last-child { margin-bottom: 0; }
  @media (max-width: 600px), (max-height: 500px) and (max-width: 960px) {
    box-sizing: border-box; max-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 2rem);
    padding: 1rem; font-size: .9rem; line-height: 1.6;
    .about-heading { padding-bottom: .5rem; }
    button { min-width: 2.75rem; min-height: 2.75rem; }
  }
`;
