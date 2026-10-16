// Run with node scripts/check-rendering.js. No browser or audio device required.
const assert = require('assert');
const vm = require('vm');
const babel = require('babel-core');
const React = require('react');
const load = (path, dependencies = {}, globals = {}) => {
  const exports = {};
  vm.runInNewContext(babel.transformFileSync(path, { presets: ['env', 'react', 'stage-3'] }).code, {
    exports, console, ...globals,
    require: name => dependencies[name] || require(name),
  });
  return exports;
};
const rendering = load('src/rendering/sculpture.js');
const constants = load('src/constants/index.js');
const arrangement = load('src/music/arrangement.js');
const organisms = load('src/organisms/index.js');
const composition = load('src/composition/index.js');
const rect = {left:0,top:0,width:800,height:600};
// Project known cell centers then verify the analytic picker in several camera views.
[.2,.65,1.3].forEach(pitch => [0,1,3,5].forEach(yaw => {
  const view = {yaw,pitch,zoom:1};
  const camera = rendering.cameraFor(32,32,10,view);
  [[0,0],[16,16],[31,31]].forEach(([x,y]) => {
    const dx=x+.5-16; const dy=y+.5-16; const dz=5;
    const across=dx*Math.cos(yaw)-dy*Math.sin(yaw);
    const forward=dx*Math.sin(yaw)+dy*Math.cos(yaw);
    const vertical=forward*Math.sin(pitch)-dz*Math.cos(pitch);
    const depth=forward*Math.cos(pitch)+dz*Math.sin(pitch);
    const scale=.36*600/camera.radius*(camera.radius*3)/(camera.radius*3-depth);
    const cell=rendering.pickCell(400+across*scale,300+vertical*scale,rect,32,32,10,view);
    assert.equal(cell.x,x); assert.equal(cell.y,y);
  });
}));
const uploads=[]; const draws=[];
const extension = {vertexAttribDivisorANGLE(){},drawArraysInstancedANGLE(...args){draws.push(args);}};
const gl = new Proxy({
  getExtension:()=>extension, getShaderParameter:()=>true, getProgramParameter:()=>true,
  getAttribLocation:()=>0, getUniformLocation:()=>({}), createBuffer:()=>({}),
  bufferData:(...args)=>uploads.push(['allocate',...args]),
  bufferSubData:(...args)=>uploads.push(['upload',...args]),
}, {get:(target,key)=>key in target?target[key]:()=>({})});
const GPU = load('src/rendering/sculpture.js', {}, {window:{devicePixelRatio:1}}).default;
const renderer = new GPU({getContext:()=>gl,getBoundingClientRect:()=>rect});
const grid=Array.from({length:32},()=>Array(32).fill(1));
const history=[];
renderer.update(grid,history);
assert.equal(renderer.current.count,1024);
const uploadCount=uploads.length;
for(let i=0;i<32;i++) {
  renderer.update(grid,history);
  renderer.draw(rendering.INITIAL_VIEW,i,true,null,i*200);
}
assert.equal(uploads.length,uploadCount,'Playback must not upload geometry');
assert.equal(draws.length,32,'One instanced cube draw per frame for current layer');
const history1=[grid]; renderer.update(grid,history1);
assert.equal(renderer.past.count,1024);
renderer.update(grid,[grid,grid]);
renderer.update(grid,[grid,grid,grid]);
const beforeAppend=uploads.length;
renderer.update(grid,[grid,grid,grid,grid]);
const appended=uploads.slice(beforeAppend).find(item=>item[0]==='upload' && item[2]===3*3072*4);
assert(appended,'History append should upload only the new layer when capacity allows');
renderer.update(grid,[]); assert.equal(renderer.past.count,0);
let chain;
const audioModule=load('src/audio/index.js');
const audioNodes=[];
class Signal {
  constructor(value=0){this.value=value;}
  rampTo(value){this.value=value;}
}
class AudioNode {
  constructor(options={}){this.options=options;this.wet=new Signal();this.frequency=new Signal();this.delayTime=new Signal();audioNodes.push(this);}
  chain(...args){chain=args;} connect(){} disconnect(){} dispose(){this.disposed=true;}
  setPosition(...position){this.position=position;}
}
let lastPlayed;
class Synth extends AudioNode {triggerAttackRelease(notes){lastPlayed=Array.from(notes);}}
class Delay extends AudioNode {}
const fakeTone={PolySynth:Synth,FeedbackDelay:Delay,Volume:AudioNode,Synth,Master:{},Panner3D:AudioNode,Filter:AudioNode,Chorus:AudioNode,Phaser:AudioNode,PingPongDelay:AudioNode};
const reducer=load('src/reducers/index.js', {
  '../constants':constants, '../game':require('../src/game'), '../composition':composition, '../audio':audioModule, '../music/arrangement':arrangement,
  tone:fakeTone,
  startaudiocontext:()=>Promise.resolve(),
}, {clearInterval:()=>null}).default;
const initial=reducer(undefined,{});
const painted=reducer(initial,{type:constants.PAINT_CELLS,cells:[{x:1,y:2},{x:2,y:2},{x:4,y:5}]});
assert.equal(initial.grid[2][1],0);
assert.equal(painted.grid[2][1],1);
assert.equal(painted.grid[2][2],1);
assert.strictEqual(painted.grid[0],initial.grid[0]);
assert.notStrictEqual(painted.grid[2],initial.grid[2]);
assert.strictEqual(reducer(painted,{type:constants.PAINT_CELLS,cells:[{x:1,y:2}]}),painted);
let state=reducer(painted,{type:constants.START_GAME,interval:1});
assert.equal(state.compositionHex.length,257);
const savedHex=state.compositionHex;
assert.strictEqual(reducer(state,{type:constants.PAINT_CELLS,cells:[{x:3,y:3}]}),state);
for(let i=0;i<33;i++) state=reducer(state,{type:constants.STEP_GRID});
assert.strictEqual(state.history[0],painted.grid,'History snapshots should share immutable grid data');
assert.equal(state.compositionHex,savedHex,'Evolution must preserve the initial composition');
state=reducer(state,{type:constants.STOP_GAME});
state=reducer(state,{type:constants.TOGGLE_KEY});
state=reducer(state,{type:constants.TOGGLE_CELL,x:10,y:10});
state=reducer(state,{type:constants.START_GAME,interval:2});
assert.equal(state.compositionHex,savedHex,'Pause, edits, key changes, and resume must retain the initial snapshot');
state=reducer(state,{type:constants.RESET});
assert.equal(state.compositionHex,null);
state=reducer(state,{type:constants.START_GAME,interval:3});
assert.equal(state.compositionHex,'1'+'0'.repeat(256),'A new composition captures the current minor key');
assert.equal(composition.encodeComposition(grid,0),'0'+'f'.repeat(256));
const decodedBits=savedHex.slice(1).split('').map(digit=>parseInt(digit,16).toString(2).padStart(4,'0')).join('');
assert.equal(decodedBits,painted.grid.map(row=>row.join('')).join(''),'Hex must preserve every initial cell, including leading zeroes');
const Grid = load('src/components/Grid.js', {
  react:React,'../styles':{Sculpture:'div'},'../rendering/sculpture':rendering,'../organisms':organisms,
}, {requestAnimationFrame:()=>1,cancelAnimationFrame(){}}).default;
const batches=[];
const component=new Grid({compositionHex:savedHex,grid:initial.grid,history:[],playing:false,currentColumn:-1,paintCells:cells=>batches.push(cells)});
component.renderer={draw(){}};
component.gesture={visited:new Set()};
for(let x=0;x<32;x++) component.paint({x,y:0});
assert.equal(batches.length,0,'Painting should wait for the next animation frame');
component.tick(0);
assert.equal(batches.length,1);
assert.equal(batches[0].length,32);
const html=require('react-dom/server').renderToStaticMarkup(React.createElement(Grid,component.props));
assert.equal((html.match(/<canvas/g)||[]).length,1);
assert(!html.includes('<polygon'));
assert(!html.includes(savedHex));
console.log('Passed: ray picking, instancing, zero playback uploads, incremental history, reset, batched immutable edits, one canvas.');

// Every catalog pattern should behave like its Conway organism when isolated.
const Game = require('../src/game');
const organismGrid = id => {
  const board=Game.createGrid({rows:32,columns:32});
  organisms.organismAt(id,{x:16,y:16},32,32).forEach(({x,y})=>{board[y][x]=1;});
  return board;
};
const evolve = (board,steps) => {
  let next=board;
  for(let i=0;i<steps;i++) next=Game.generateNewGrid(next,{rows:32,columns:32});
  return next;
};
for(const id of ['block','beehive'])assert.equal(JSON.stringify(evolve(organismGrid(id),1)),JSON.stringify(organismGrid(id)));
for(const id of ['blinker','toad','beacon'])assert.equal(JSON.stringify(evolve(organismGrid(id),2)),JSON.stringify(organismGrid(id)));
const glider=organismGrid('glider');
const translated=Game.createGrid({rows:32,columns:32});
glider.forEach((row,y)=>row.forEach((cell,x)=>{if(cell)translated[y+1][x+1]=1;}));
assert.equal(JSON.stringify(evolve(glider,4)),JSON.stringify(translated));
organisms.ORGANISMS.forEach(organism=>{
  for(const anchor of [{x:0,y:0},{x:31,y:31}]) {
    const cells=organisms.organismAt(organism.id,anchor,32,32);
    assert.equal(cells.length,organism.cells.length);
    assert(cells.every(cell=>cell.x>=0&&cell.x<32&&cell.y>=0&&cell.y<32));
  }
});
assert.equal(organisms.organismAt('unknown',{x:10,y:10},32,32).length,0);
let placed=[]; let selection='glider';
const placement=new Grid({grid:initial.grid,history:[],playing:false,selectedOrganism:selection,
  paintCells:cells=>{placed.push(cells);},selectOrganism:id=>{selection=id;}});
placement.schedule=()=>{};
placement.cellAt=()=>({x:31,y:31});
let accepted=false;
placement.drop({clientX:100,clientY:100,dataTransfer:{getData:()=> 'glider'},preventDefault:()=>{accepted=true;}});
assert(accepted); assert.equal(placed.length,1); assert.equal(placed[0].length,5); assert.equal(selection,null);
placement.props={...placement.props,playing:true};
placement.drop({dataTransfer:{getData:()=> 'glider'}});
assert.equal(placed.length,1,'Playback must reject drops');
const selected=reducer(initial,{type:constants.SELECT_ORGANISM,id:'glider'});
assert.equal(selected.selectedOrganism,'glider');
assert.equal(reducer(selected,{type:constants.START_GAME,interval:1}).selectedOrganism,null);
console.log('Passed: organism catalog behavior, complete edge placement, one-batch drops, and playback protection.');
const baseCamera=rendering.cameraFor(32,32,1,rendering.INITIAL_VIEW);
const {yaw,pitch,zoom}=rendering.INITIAL_VIEW;
const across=.5*Math.cos(yaw)-.5*Math.sin(yaw);
const forward=.5*Math.sin(yaw)+.5*Math.cos(yaw);
const vertical=forward*Math.sin(pitch)+.5*Math.cos(pitch);
const depth=forward*Math.cos(pitch)-.5*Math.sin(pitch);
const scale=.36*600*zoom/baseCamera.radius*(baseCamera.radius*3)/(baseCamera.radius*3-depth);
const baseCell=rendering.pickCell(400+across*scale,300+vertical*scale,rect,32,32,1,rendering.INITIAL_VIEW,0);
assert.equal(baseCell.x,16); assert.equal(baseCell.y,16);
console.log('Passed: picking aligns with the grid beneath the current cubes.');
assert.equal(initial.musicBox.bpm,120,'New compositions default to 120 BPM');
assert.equal(initial.musicBox.effects,constants.EFFECT_FLAGS.spatial,'New compositions enable spatial audio');
const faster=reducer(initial,{type:constants.SET_BPM,bpm:150});
assert.equal(faster.musicBox.bpm,150);
assert.strictEqual(faster.grid,initial.grid);
for(const bpm of [0,29,241,75.5])assert.strictEqual(reducer(faster,{type:constants.SET_BPM,bpm}),faster);
assert.strictEqual(reducer(faster,{type:constants.SET_BPM,bpm:150}),faster);
console.log('Passed: tempo updates preserve the grid and reject invalid BPM values.');
let toggled=initial;
for(const effect of ['spatial','pingPong','evolving','modulation'])toggled=reducer(toggled,{type:constants.TOGGLE_EFFECT,effect});
assert.equal(toggled.musicBox.effects,14);
assert.strictEqual(toggled.grid,initial.grid);
assert.strictEqual(reducer(toggled,{type:constants.TOGGLE_EFFECT,effect:'unknown'}),toggled);
for(const effect of ['spatial','pingPong','evolving','modulation'])toggled=reducer(toggled,{type:constants.TOGGLE_EFFECT,effect});
assert.equal(toggled.musicBox.effects,constants.EFFECT_FLAGS.spatial);
const effectStart=audioNodes.length;
const engine=audioModule.createAudio(fakeTone);
assert.equal(audioNodes.length-effectStart,3,'Default sound must create only synth, echo, and volume');
engine.configure({bpm:120,effects:15},grid,0);
const processors=audioNodes.slice(effectStart+3);
assert.equal(processors.length,5);
const spatial=processors.find(node=>node.options.panningModel==='HRTF');
const pingPong=processors.find(node=>node.options.maxDelayTime===2);
const filter=processors.find(node=>node.options.type==='lowpass');
assert.equal(spatial.position[0],-2);
assert.equal(pingPong.delayTime.value,.375);
const bright=filter.frequency.value;
engine.configure({bpm:60,effects:15},initial.grid,31);
assert.equal(spatial.position[0],2);
assert.equal(pingPong.delayTime.value,.75);
assert(filter.frequency.value<bright);
engine.configure({bpm:75,effects:0},initial.grid,0);
assert(processors.every(node=>node.disposed),'Bypassed processors must be disposed');
console.log('Passed: effect toggles, lazy graph creation, spatial motion, tempo-synced echoes, density mapping, and bypass cleanup.');
const blinker=organisms.ORGANISMS.find(item=>item.id==='blinker');
const upright=organisms.rotateOrganism(blinker,1);
assert.equal(upright.width,1); assert.equal(upright.height,3);
assert(upright.cells.every(cell=>cell.x===0));
organisms.ORGANISMS.forEach(organism=>{
  assert.equal(JSON.stringify(organisms.rotateOrganism(organism,4)),JSON.stringify(organism));
  assert.equal(JSON.stringify(organisms.rotateOrganism(organisms.rotateOrganism(organism,1),-1)),JSON.stringify(organism));
  for(let rotation=0;rotation<4;rotation++) {
    const cells=organisms.organismAt(organism.id,{x:31,y:31},32,32,rotation);
    assert.equal(cells.length,organism.cells.length);
    assert(cells.every(cell=>cell.x>=0&&cell.x<32&&cell.y>=0&&cell.y<32));
  }
});
let orientation=reducer(initial,{type:constants.ROTATE_ORGANISM,direction:-1});
assert.equal(orientation.organismRotation,3);
orientation=reducer(orientation,{type:constants.ROTATE_ORGANISM,direction:1});
assert.equal(orientation.organismRotation,0);
orientation=reducer(orientation,{type:constants.ROTATE_ORGANISM,direction:1});
assert.equal(reducer(orientation,{type:constants.SELECT_ORGANISM,id:'glider'}).organismRotation,1);
assert.equal(reducer(orientation,{type:constants.RESET}).organismRotation,1);
const rotatingPlacement=new Grid({grid:initial.grid,history:[],playing:false,selectedOrganism:'blinker',organismRotation:1,paintCells:cells=>{placed=cells;},selectOrganism:()=>{}});
rotatingPlacement.schedule=()=>{};
const preview=rotatingPlacement.previewAt({x:16,y:16});
rotatingPlacement.placeOrganism({x:16,y:16});
assert.equal(JSON.stringify(placed),JSON.stringify(preview));
assert(placed.every(cell=>cell.x===16));
console.log('Passed: clockwise/counterclockwise rotation, four-turn identity, rotated edge placement, persistent angle, and preview/drop agreement.');
const Picker=load('src/components/OrganismPicker.js',{react:React,'../organisms':organisms},{requestAnimationFrame:()=>1,cancelAnimationFrame(){}}).default;
const turns=[];
const picker=new Picker({playing:false,selectedOrganism:'glider',rotate:direction=>turns.push(direction)});
const rotationKey={type:'keydown',key:'r',target:{tagName:'CANVAS'},preventDefault(){}};
picker.dismiss(rotationKey);
picker.dismiss({...rotationKey,key:'R',shiftKey:true});
picker.dismiss({...rotationKey,repeat:true});
picker.dismiss({...rotationKey,target:{tagName:'INPUT'}});
picker.dismiss({...rotationKey,ctrlKey:true});
assert.deepStrictEqual(turns,[1,-1]);
picker.props={...picker.props,playing:true}; picker.dismiss(rotationKey);
assert.equal(turns.length,2);
console.log('Passed: R and Shift+R shortcuts, held-key protection, text-input and playback guards.');
// A pointer-held organism drag must leave keyboard events available for rotation.
const pointerUpdates=[]; let selectedId=null; let dragAngle=0;
const pointerPicker=new Picker({playing:false,selectedOrganism:'blinker',
  selectOrganism:id=>{selectedId=id;},dragOrganism:position=>pointerUpdates.push(position),
  rotate:direction=>{dragAngle=(dragAngle+direction+4)%4;}});
pointerPicker.setState=update=>{pointerPicker.state={...pointerPicker.state,...update};};
const sourceCard={getAttribute:()=> 'blinker',focus(){}};
pointerPicker.root={contains:()=>true,setPointerCapture(){},hasPointerCapture:()=>true,releasePointerCapture(){}};
pointerPicker.beginOrganismDrag({button:0,pointerId:7,clientX:100,clientY:100,target:{closest:()=>sourceCard},preventDefault(){}});
assert.equal(selectedId,'blinker');
pointerPicker.movePanel({pointerId:7,clientX:400,clientY:400});
pointerPicker.flushOrganismDrag();
assert.equal(pointerUpdates.length,1);
pointerPicker.dismiss(rotationKey);
assert.equal(dragAngle,1,'R must rotate while the pointer is still held');
pointerPicker.dismiss({...rotationKey,key:'R',shiftKey:true});
assert.equal(dragAngle,0);
pointerPicker.dismiss(rotationKey);
pointerPicker.endPanelDrag({type:'pointerup',pointerId:7,clientX:400,clientY:400});
assert.equal(pointerUpdates[1].drop,true);
assert.equal(pointerPicker.organismGesture,null);
assert.equal(pointerPicker.state.open,false);
const dragState=reducer(reducer(initial,{type:constants.SELECT_ORGANISM,id:'blinker'}),{type:constants.DRAG_ORGANISM,position:{x:400,y:400}});
assert.equal(dragState.organismDrag.x,400);
assert.equal(reducer(dragState,{type:constants.SELECT_ORGANISM,id:null}).organismDrag,null);
console.log('Passed: pointer-held rotation, counterclockwise rotation, drop signaling, and drag-state cleanup.');
const heldPreview=new Grid({grid:initial.grid,history:[],playing:false,selectedOrganism:'blinker',organismRotation:0});
heldPreview.selected={x:16,y:16}; heldPreview.schedule=()=>{};
const beforeTurn=heldPreview.props;
heldPreview.props={...heldPreview.props,organismRotation:1};
heldPreview.componentDidUpdate(beforeTurn);
assert.equal(heldPreview.preview.length,3);
assert(heldPreview.preview.every(cell=>cell.x===16),'Rotation must update a held preview without another pointer move');
console.log('Passed: stationary pointer preview updates immediately on rotation.');

// Two-finger navigation must not paint or toggle cells when either finger lifts.
let touchToggles = 0;
const touchGrid = new Grid({ grid: initial.grid, history: [], playing: false,
  toggleCell: () => () => { touchToggles += 1; } });
touchGrid.canvas = { setPointerCapture() {}, focus() {}, classList: { add() {}, remove() {}, toggle() {} } };
touchGrid.cellAt = () => ({ x: 4, y: 4 });
touchGrid.schedule = () => {};
const touch = (pointerId, clientX, clientY, type = 'pointermove') => ({ pointerId, clientX, clientY, pointerType: 'touch', button: 0, type });
touchGrid.beginDrag(touch(1, 100, 100, 'pointerdown'));
touchGrid.beginDrag(touch(2, 200, 100, 'pointerdown'));
const beforeTouch = { ...touchGrid.view };
touchGrid.drag(touch(2, 240, 120));
assert(touchGrid.view.zoom > beforeTouch.zoom, 'Spreading fingers zooms the sculpture');
assert(touchGrid.view.yaw > beforeTouch.yaw, 'Moving the midpoint rotates the sculpture');
assert.equal(touchGrid.gesture, null);
assert.equal(touchGrid.pending.size, 0);
touchGrid.endDrag(touch(2, 240, 120, 'pointerup'));
const afterPinch = JSON.stringify(touchGrid.view);
touchGrid.drag(touch(1, 110, 120));
assert.equal(JSON.stringify(touchGrid.view), afterPinch, 'Remaining finger cannot draw or rotate accidentally');
touchGrid.endDrag(touch(1, 110, 120, 'pointerup'));
assert.equal(touchToggles, 0);
assert.equal(touchGrid.touches.size, 0);
touchGrid.beginDrag(touch(3, 100, 100, 'pointerdown'));
touchGrid.endDrag(touch(3, 100, 100, 'pointerup'));
assert.equal(touchToggles, 1, 'Single-finger taps work again after navigation');
console.log('Passed: touch pinch zoom, two-finger rotation, no accidental edits, and gesture cleanup.');

// Experiments must preserve legacy songs and constrain dense columns.
const originalMapping = arrangement.rowNotes(initial.musicBox);
assert.equal(originalMapping[0], 'C6');
assert.equal(originalMapping[16], 'C6');
for (const palette of Object.keys(arrangement.PALETTES)) {
  for (const order of ['ascending','descending','wave','thirds']) {
    const notes = arrangement.makeArrangement({...arrangement.DEFAULT_EXPERIMENT,palette,order});
    assert(arrangement.validNotes(notes));
  }
}
const experiment = arrangement.makeArrangement(arrangement.DEFAULT_EXPERIMENT);
const mapped = reducer(initial,{type:'SET_ADMIN_NOTES',notes:experiment});
assert.equal(arrangement.rowNotes(mapped.musicBox).join(','),experiment.join(','));
assert.strictEqual(reducer(mapped,{type:'SET_ADMIN_NOTES',notes:['invalid']}),mapped);
const limited = reducer(mapped,{type:'SET_ADMIN_NOTE_LIMIT',limit:3});
const dense = Array.from({length:32},()=>[1]);
const sounding = arrangement.columnNotes(dense,0,limited.musicBox);
assert.equal(sounding.length,3);
assert.equal(new Set(sounding).size,3);
const restored = reducer(limited,{type:'SET_ADMIN_NOTES',notes:null});
assert.equal(arrangement.rowNotes(restored.musicBox).join(','),originalMapping.join(','));
assert.equal(arrangement.columnNotes(dense,0,restored.musicBox).length,32);
console.log('Passed: experimental presets, row overrides, validation, voice limits, and restoration.');

reducer({...limited,grid:dense,currentColumn:-1},{type:constants.STEP_GRID});
assert.equal(lastPlayed.join(','),sounding.join(','),'Playback uses experimental mapping and limit');
reducer(limited,{type:'AUDITION_ADMIN_NOTES',row:5});
assert.equal(lastPlayed.join(','),experiment[5],'Row audition uses the edited pitch');

// Label projection must agree with the grid picker across camera rotations.
for (const yaw of [0, .7, 2, 4]) {
  const view = {yaw, pitch:.65, zoom:1};
  const projected = rendering.projectPoint([12.5, 17.5, 2], 800, 600, 32, 32, 2, view);
  const hit = rendering.pickCell(projected.x,projected.y,rect,32,32,2,view);
  assert.equal(hit.x,12);
  assert.equal(hit.y,17);
}
const labelGrid = Array.from({length:32},()=>Array(32).fill(0));
labelGrid[2][4] = 1;
labelGrid[7][4] = 1;
labelGrid[3][5] = 1;
const labeledProps = {...component.props, grid:labelGrid, playing:true, currentColumn:4, noteLabOpen:true, notes:experiment};
const markup = props => require('react-dom/server').renderToStaticMarkup(React.createElement(Grid,props));
const labeledHtml = markup(labeledProps);
assert.equal((labeledHtml.match(/<text /g)||[]).length,2,'Only occupied cubes in the playing column get labels');
assert(labeledHtml.includes('Row 3, column 5: ' + experiment[2]));
assert(labeledHtml.includes('Row 8, column 5: ' + experiment[7]));
assert(!labeledHtml.includes('Y axis row notes'));
assert(markup({...labeledProps,playing:false}).includes('Playing column cube notes'),'Paused steps retain labels');
assert(!markup({...labeledProps,noteLabOpen:false}).includes('Playing column cube notes'));
assert.equal((markup({...labeledProps,currentColumn:5}).match(/<text /g)||[]).length,1);
assert.equal(reducer(initial,{type:'SET_NOTE_LAB_OPEN',open:true}).noteLabOpen,true);
assert.equal(reducer(initial,{type:'SET_NOTE_LAB_OPEN',open:false}).noteLabOpen,false);
console.log('Passed: cube-label projection, playing-column filtering, and lab visibility.');

// Manual stepping uses the playback timeline and can return to the previous generation.
let stepped = reducer({...painted,noteLabOpen:true}, {type:'STEP_NOTE_LAB',direction:1});
assert.equal(stepped.currentColumn,0);
assert.equal(stepped.interval,null);
assert(stepped.compositionHex);
const firstGrid = stepped.grid;
for (let i=0; i<32; i++) stepped = reducer(stepped,{type:'STEP_NOTE_LAB',direction:1});
assert.equal(stepped.currentColumn,0);
assert.equal(stepped.history.length,1);
const nextGeneration = stepped.grid;
stepped = reducer(stepped,{type:'STEP_NOTE_LAB',direction:-1});
assert.strictEqual(stepped.grid,firstGrid);
assert.equal(stepped.currentColumn,31);
assert.equal(stepped.history.length,0);
stepped = reducer(stepped,{type:'STEP_NOTE_LAB',direction:1});
assert.equal(JSON.stringify(stepped.grid),JSON.stringify(nextGeneration));
const firstStep = reducer({...painted,noteLabOpen:true,currentColumn:0,interval:12},{type:'STEP_NOTE_LAB',direction:-1});
assert.equal(firstStep.currentColumn,0);
assert.equal(firstStep.interval,null);
assert.strictEqual(reducer(initial,{type:'STEP_NOTE_LAB',direction:1}),initial);
const NoteLab = load('src/components/NoteAdmin.js',{
  react:React,'react-redux':{connect:()=>component=>component},'../music/arrangement':arrangement,'../music/chord':load('src/music/chord.js'),
}).default;
const directions=[];
const lab = new NoteLab({step:direction=>directions.push(direction)});
lab.state.open=true;
const arrow = (key, extra={}) => ({key,target:{tagName:'BUTTON'},preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...extra});
const stepArrow = arrow('ArrowRight');
lab.keyDown(stepArrow);
assert(stepArrow.prevented && stepArrow.stopped);
lab.keyDown(arrow('ArrowLeft'));
lab.keyDown(arrow('ArrowRight',{target:{tagName:'SELECT'}}));
lab.keyDown(arrow('ArrowRight',{target:{tagName:'TEXTAREA'}}));
lab.keyDown(arrow('ArrowRight',{repeat:true}));
lab.keyDown(arrow('ArrowRight',{metaKey:true}));
lab.state.open=false;
lab.keyDown(arrow('ArrowRight'));
assert.equal(directions.join(','),'1,-1');
console.log('Passed: manual timeline stepping, generation rewind, pause, labels, and keyboard guards.');

const mappingJson = JSON.stringify({notes:experiment,maxNotes:5});
const parsedMapping = arrangement.parseMapping(mappingJson);
const importedMapping = reducer(mapped,{type:'IMPORT_NOTE_MAPPING',...parsedMapping});
assert.equal(importedMapping.musicBox.adminNotes.join(','),experiment.join(','));
assert.equal(importedMapping.musicBox.adminNoteLimit,5);
assert.strictEqual(importedMapping.grid,mapped.grid);
assert.strictEqual(importedMapping.history,mapped.history);
assert.equal(importedMapping.currentColumn,mapped.currentColumn);
for (const invalid of ['{', 'null', '{}', JSON.stringify({notes:experiment,maxNotes:0}), JSON.stringify({notes:experiment,maxNotes:17}), JSON.stringify({notes:experiment,maxNotes:2.5}), JSON.stringify({notes:experiment.slice(1),maxNotes:4}), JSON.stringify({notes:Array(32).fill('Q3'),maxNotes:4})]) {
  assert.throws(()=>arrangement.parseMapping(invalid));
}
assert.strictEqual(reducer(importedMapping,{type:'IMPORT_NOTE_MAPPING',notes:experiment,maxNotes:0}),importedMapping);
assert.strictEqual(reducer(importedMapping,{type:'IMPORT_NOTE_MAPPING',notes:['C4'],maxNotes:4}),importedMapping);
const importedLab = new NoteLab({importMapping:mapping=>{assert.equal(mapping.maxNotes,5);}});
importedLab.setState = update => { importedLab.state = {...importedLab.state,...update}; };
importedLab.state.importText=mappingJson;
importedLab.importMapping();
assert.equal(importedLab.state.importStatus,'Mapping imported.');
assert.equal(importedLab.state.importText,'');
importedLab.state.importText='broken';
importedLab.importMapping();
assert(importedLab.state.importError);
assert.equal(importedLab.state.importStatus,'');
console.log('Passed: mapping import round trip, note limits, invalid JSON, atomic validation, and feedback.');

const chords = load('src/music/chord.js');
assert.equal(chords.bestFitChord([]).label,'Silence');
assert.equal(chords.bestFitChord(['C3','C5']).label,'C');
assert.equal(chords.bestFitChord(['C3','E4','G4','C5']).label,'C major');
assert.equal(chords.bestFitChord(['E3','G4','C5']).label,'C major/E');
assert.equal(chords.bestFitChord(['A3','C4','E4','G4']).label,'Am7');
assert.equal(chords.bestFitChord(['C3','E4','G4','A4']).label,'C6');
assert.equal(chords.bestFitChord(['C3','D4','G4']).label,'Csus2');
assert.equal(chords.bestFitChord(['C3','E#4','G4']).label,'Csus4');
assert.equal(chords.bestFitChord(['Bb3','D4','F4']).label,'B♭ major');
assert(chords.bestFitChord(['C3','C#4','D4','F#4']).approximate);
const chordLimited = {...initial.musicBox,adminNotes:Array(32).fill('G4'),adminNoteLimit:1};
assert.equal(chords.bestFitChord(arrangement.columnNotes(dense,0,chordLimited)).label,'G');
console.log('Passed: chord names, inversions, octave duplicates, enharmonics, best fits, silence, and note limits.');
