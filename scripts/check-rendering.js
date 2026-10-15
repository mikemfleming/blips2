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
class Synth {chain(...args){chain=args;} triggerAttackRelease(){}}
class Delay {constructor(){this.wet={};}}
const reducer=load('src/reducers/index.js', {
  '../constants':constants, '../game':require('../src/game'), '../composition':composition,
  tone:{PolySynth:Synth,FeedbackDelay:Delay,Volume:class{},Synth,Master:{}},
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
const scale=.36*600/baseCamera.radius*(baseCamera.radius*3)/(baseCamera.radius*3-depth);
const baseCell=rendering.pickCell(400+across*scale,300+vertical*scale,rect,32,32,1,rendering.INITIAL_VIEW,0);
assert.equal(baseCell.x,16); assert.equal(baseCell.y,16);
console.log('Passed: picking aligns with the grid beneath the current cubes.');
