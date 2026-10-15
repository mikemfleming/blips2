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
  > * { pointer-events: auto; }
  h1 { margin: 0; font-size: clamp(1.4rem, 4vw, 3rem); white-space: nowrap; }
  @media (max-width: 380px) { gap: .35rem; padding: .5rem; h1 { font-size: 1.1rem; } }
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
  position: relative;
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
  .organism-list { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; }
  button.organism-card {
    height: auto; min-height: 4rem; justify-content: flex-start; gap: .6rem;
    padding: .6rem; border: 1px solid #ddd; border-radius: .3rem;
    background: white; text-align: left; cursor: grab;
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
  gap: clamp(.2rem, 1vw, .65rem);
  flex-shrink: 0;
  button {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0;
    padding: .25rem;
    min-width: 1.75rem;
    height: 2rem;
    background: transparent;
    color: #111;
    font-size: clamp(1rem, 2.5vw, 1.5rem);
    cursor: pointer;
  }
  button:disabled { opacity: .35; cursor: default; }
  button:focus-visible { outline: 2px solid #9d40d7; outline-offset: 3px; }


  .key-visualizer {
    display: flex;
    align-items: center;
    justify-content: space-around;
    border: .2rem solid #111111;
    width: clamp(4rem, 10vw, 6rem);
    height: 2rem;
    background: white;

    .bouncey-ball {
      height: 10px;
      width: 10px;
      border-radius: 100%;
      background: #111111;

      &.bouncing {
        &.major { animation: bounce .5s ease-in-out infinite, major-phase .5s ease-in-out infinite; }
        &.minor { animation: bounce .5s ease-in-out infinite, minor-phase .5s ease-in-out infinite; }
        &:nth-child(1) { animation-delay: .1s; }
        &:nth-child(2) { animation-delay: .2s; }
        &:nth-child(3) { animation-delay: .3s; }
        &:nth-child(4) { animation-delay: .4s; }
        &:nth-child(5) { animation-delay: .5s; }
      }
    }

    &:hover { cursor: pointer; }

    &:active {
      background: #111111;

      .bouncey-ball {
        background: #F4F4F4;

        &.bouncing {
          &.major { animation: bounce .5s ease-in-out infinite; }
          &.minor { animation: bounce .5s ease-in-out infinite; }
          &:nth-child(1) { animation-delay: .1s; }
          &:nth-child(2) { animation-delay: .2s; }
          &:nth-child(3) { animation-delay: .3s; }
          &:nth-child(4) { animation-delay: .4s; }
          &:nth-child(5) { animation-delay: .5s; }
        }
      }
    }
  }

  @media (max-width: 380px) {
    gap: .15rem;
    button { min-width: 1.5rem; padding: .15rem; }
    .key-visualizer { width: 3.5rem; }
  }

  @keyframes bounce {
    25% { transform: translateY(5px); }
    75% { transform: translateY(-5px); }
  }

  @keyframes major-phase {
    0% { background: #FF0000; }
    50% { background: #FF7F00; }
    75% { background: #FFFF00; }
    100% { background: #FF0000; }
  }

  @keyframes minor-phase {
    0% { background: #0000FF; }
    50% { background: #4B0082; }
    75% { background: #9400D3; }
    100% { background: #0000FF; }
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
  @media (max-width: 768px) {
    .sculpture-caption { flex-direction: column; align-items: stretch; gap: .5rem; }
    .iteration { align-self: flex-end; }
  }
  p[role="alert"] { position: absolute; top: 6rem; left: 2rem; z-index: 1; }
  canvas { display: block; width: 100%; height: 100%;
    touch-action: none; user-select: none; cursor: crosshair; }
  canvas:focus-visible { outline: 2px solid #9d40d7; outline-offset: -2px; }
  canvas.dragging { cursor: grabbing; }
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
`;
