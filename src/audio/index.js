// Optional processors are created only while enabled and disposed on bypass.
export const createAudio = (Tone) => {
  const synth = new Tone.PolySynth(16, Tone.Synth);
  const echo = new Tone.FeedbackDelay(0.05, 0.3);
  echo.wet.value = .25;
  const volume = new Tone.Volume(-16);
  volume.mute = false;
  volume.connect(Tone.Master);
  const nodes = {};
  let mask = -1;
  let previousGrid;
  let density = 0;
  const configure = (musicBox, grid, column = -1) => {
    const effects = musicBox.effects || 0;
    const bpm = musicBox.bpm || 75;
    const definitions = {
      spatial: { bit: 1, create: () => new Tone.Panner3D({ panningModel: 'HRTF', rolloffFactor: 0, positionZ: -1.5 }) },
      evolving: { bit: 4, create: () => new Tone.Filter({ frequency: 1200, type: 'lowpass', rolloff: -12, Q: .7 }) },
      chorus: { bit: 8, create: () => new Tone.Chorus({ frequency: .8, delayTime: 3.5, depth: .4, wet: .25 }) },
      phaser: { bit: 8, create: () => new Tone.Phaser({ frequency: .2, octaves: 2, stages: 4, baseFrequency: 400, wet: .2 }) },
      pingPong: { bit: 2, create: () => new Tone.PingPongDelay({ delayTime: 45 / bpm, maxDelayTime: 2, feedback: .28, wet: .25 }) },
    };
    if (effects !== mask) {
      synth.disconnect(); echo.disconnect();
      Object.keys(nodes).forEach(name => nodes[name].disconnect());
      Object.keys(definitions).forEach(name => {
        const definition = definitions[name];
        if (effects & definition.bit) {
          if (!nodes[name]) nodes[name] = definition.create();
        } else if (nodes[name]) {
          nodes[name].dispose(); delete nodes[name];
        }
      });
      const chain = ['spatial','evolving','chorus','phaser'].filter(name => nodes[name]).map(name => nodes[name]);
      chain.push(echo);
      if (nodes.pingPong) chain.push(nodes.pingPong);
      synth.chain(...chain, volume);
      mask = effects;
    }
    if (nodes.pingPong) nodes.pingPong.delayTime.rampTo(45 / bpm, .04);
    if (grid && previousGrid !== grid) {
      density = grid.reduce((count,row) => count + row.reduce((sum,cell) => sum + (cell ? 1 : 0),0),0) / (grid.length * grid[0].length);
      previousGrid = grid;
    }
    if (nodes.evolving) nodes.evolving.frequency.rampTo(700 + 12000 * Math.sqrt(density), .12);
    if (nodes.spatial) {
      const width = grid ? grid[0].length : 32;
      const x = column < 0 ? 0 : 4 * column / (width - 1) - 2;
      nodes.spatial.setPosition(x,0,-1.5);
    }
    volume.mute = Boolean(musicBox.mute);
  };
  configure({effects:0,bpm:75});
  return { synth, volume, configure };
};
