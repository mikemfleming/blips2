const assert = require('assert');
const vm = require('vm');
const babel = require('babel-core');
const zlib = require('zlib');
const exportsForUrl = {};
vm.runInNewContext(babel.transformFileSync('src/composition/url.js', { presets: ['env','stage-3'] }).code, {
  exports: exportsForUrl, require, atob, btoa, URLSearchParams,
});
const { encodeCompositionCode, decodeCompositionCode, loadCompositionFromSearch } = exportsForUrl;
const sample = 'dY2CgBDQwMDA4MDAwHiDbBEYA';
const { grid, key } = decodeCompositionCode(sample);
assert.equal(key, 1);
const live = [];
grid.forEach((row,y) => row.forEach((cell,x) => { if (cell) live.push([x,y]); }));
assert.deepStrictEqual(live, [[16,15],[17,16],[15,17],[16,17],[17,17]]);
const equalGrid = (a,b) => assert.equal(JSON.stringify(a), JSON.stringify(b));
for (const currentKey of [0,1]) {
  const encoded = encodeCompositionCode(grid, currentKey);
  const decoded = decodeCompositionCode(encoded);
  equalGrid(decoded.grid,grid);
  assert.equal(decoded.key,currentKey);
}
const empty = Array.from({length:32},()=>Array(32).fill(0));
const full = Array.from({length:32},()=>Array(32).fill(1));
let seed = 123456789;
const random = Array.from({length:32},()=>Array.from({length:32},()=>{
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  return seed >>> 31;
}));
[empty, full, random].forEach(pattern => equalGrid(decodeCompositionCode(encodeCompositionCode(pattern,0)).grid,pattern));
assert.equal(encodeCompositionCode(random,0)[0],'r','Incompressible patterns use raw fallback');
const raw = new Uint8Array(129);
raw[128] = 1;
const rawCode = 'r' + Buffer.from(raw).toString('base64url');
assert.equal(decodeCompositionCode(rawCode).key,1);
const invalidKey = Buffer.alloc(129); invalidKey[128]=2;
const codeFor = bytes => 'd'+zlib.deflateRawSync(bytes).toString('base64url');
const malformed = ['', 'd', 'xAAA', 'd!!!', 'rA', sample.slice(0,-2), rawCode+'A', codeFor(invalidKey), codeFor(Buffer.alloc(128)), codeFor(Buffer.alloc(130)), codeFor(Buffer.alloc(65536)), 'r'+'A'.repeat(1024)];
malformed.forEach(code => assert.throws(()=>decodeCompositionCode(code), undefined,code));
const baseState = { grid:empty, history:[], currentColumn:-1, interval:null, compositionHex:null, musicBox:{currentKey:0,mute:false} };
assert.strictEqual(loadCompositionFromSearch(baseState,''),baseState);
assert.strictEqual(loadCompositionFromSearch(baseState,'?other=1'),baseState);
const loaded = loadCompositionFromSearch(baseState,'?c='+sample);
equalGrid(loaded.grid,grid);
assert.equal(loaded.musicBox.currentKey,1);
assert.equal(loaded.interval,null);
assert.equal(loaded.currentColumn,-1);
assert.equal(loaded.history.length,0);
assert.equal(loaded.compositionHex,null,'Initial snapshot is captured on first Play');
['?c=invalid','?c=','?c='+sample+'&c='+sample].forEach(search=>{
  const invalid=loadCompositionFromSearch(baseState,search);
  assert(invalid.compositionLoadError);
  assert.strictEqual(invalid.grid,baseState.grid);
});
console.log('Passed: exact shared glider, both keys, lossless compressed/raw round trips, startup state, malformed and oversized codes.');

const sharing = {};
vm.runInNewContext(babel.transformFileSync('src/composition/share.js', { presets: ['env','stage-3'] }).code, {
  exports: sharing, URL, require: name => name === './url' ? exportsForUrl : require(name),
});
const sharedUrl = new URL(sharing.createShareUrl(loaded, 'https://example.com/music/?c=old#/about'));
assert.equal(sharedUrl.pathname,'/music/');
assert.equal(sharedUrl.hash,'#/');
assert.equal(sharedUrl.searchParams.getAll('c').length,1);
equalGrid(decodeCompositionCode(sharedUrl.searchParams.get('c')).grid,grid);
assert.equal(decodeCompositionCode(sharedUrl.searchParams.get('c')).key,1);
const savedHex = '1'+Array.from({length:256},(_,i)=>{
  let nibble=0;
  for(let bit=0;bit<4;bit++)nibble=(nibble<<1)|grid[Math.floor((i*4+bit)/32)][(i*4+bit)%32];
  return nibble.toString(16);
}).join('');
const evolvedState={...loaded,grid:empty,compositionHex:savedHex,musicBox:{currentKey:0}};
const sharedInitial=decodeCompositionCode(new URL(sharing.createShareUrl(evolvedState,'https://example.com/')).searchParams.get('c'));
equalGrid(sharedInitial.grid,grid);
assert.equal(sharedInitial.key,1,'Sharing must preserve the original key after it changes during playback');
assert(sharing.isPlaybackShortcut({code:'Space',target:{tagName:'CANVAS'}}));
assert(sharing.isPlaybackShortcut({key:' ',target:{tagName:'BUTTON'}}));
assert(!sharing.isPlaybackShortcut({code:'Enter',target:{tagName:'CANVAS'}}));
for(const tagName of ['INPUT','TEXTAREA','SELECT'])assert(!sharing.isPlaybackShortcut({code:'Space',target:{tagName}}));
assert(!sharing.isPlaybackShortcut({code:'Space',target:{isContentEditable:true}}));
assert(!sharing.isPlaybackShortcut({code:'Space',target:{closest:()=>({})}}),'Modal keyboard input must not toggle playback');
assert(!sharing.isPlaybackShortcut({code:'Space',ctrlKey:true,target:{}}));
console.log('Passed: share URLs preserve initial grid/key, replace old seeds, and keyboard shortcut respects text inputs.');
const controlsExports={};
const listeners=[];
const visibilityDocument={hidden:false,addEventListener:(...args)=>listeners.push(args),removeEventListener:(...args)=>listeners.push(args)};
vm.runInNewContext(babel.transformFileSync('src/containers/Controls.js',{presets:['env','react','stage-3']}).code,{
  exports:controlsExports, clearTimeout, setTimeout, document:visibilityDocument,
  window:{addEventListener:(...args)=>listeners.push(args),removeEventListener:(...args)=>listeners.push(args)},
  require:name=>({react:require('react'),'react-redux':{connect:()=>component=>component},'../constants':{},'../components/Controls':()=>null,'../composition/share':sharing}[name]),
});
let starts=0; let stops=0; let prevented=0;
const controls=new controlsExports.default({playing:false,start:()=>starts++,stop:()=>stops++});
controls.componentDidMount();
const keyEvent={code:'Space',target:{tagName:'CANVAS'},preventDefault:()=>prevented++};
controls.keyDown(keyEvent); assert.equal(starts,1);
controls.keyDown({...keyEvent,repeat:true}); assert.equal(starts,1);
controls.props={...controls.props,playing:true};
controls.keyDown(keyEvent); assert.equal(stops,1);
controls.keyDown({...keyEvent,target:{tagName:'INPUT'}}); assert.equal(stops,1);
assert.equal(prevented,3);
controls.pauseWhenAway(); assert.equal(stops,2);
controls.visibilityChanged(); assert.equal(stops,2);
visibilityDocument.hidden=true;
controls.visibilityChanged(); assert.equal(stops,3);
controls.props={...controls.props,suspended:true};
controls.componentDidUpdate({suspended:false}); assert.equal(stops,4);
controls.componentWillUnmount(); assert.equal(stops,5);
const keyListeners=listeners.filter(listener=>listener[0]==='keydown');
assert.equal(keyListeners.length,2);
assert.strictEqual(keyListeners[0][1],keyListeners[1][1]);
for(const name of ['blur','pagehide','visibilitychange'])assert.equal(listeners.filter(listener=>listener[0]===name).length,2);
console.log('Passed: pause on focus loss, hidden page, explainer navigation, and unmount; listener cleanup.');
console.log('Passed: Space play/pause, held-key repeat protection, shortcut cleanup.');
