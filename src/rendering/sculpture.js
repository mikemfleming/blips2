export const INITIAL_VIEW = { yaw: Math.PI / 4, pitch: .65, zoom: 1 };
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const cameraFor = (rows, columns, height, view) => ({
  radius: Math.hypot(rows, columns, height) / 2,
  center: [columns / 2, rows / 2, height / 2],
  yaw: view.yaw, pitch: view.pitch, zoom: view.zoom,
});

// Intersect a camera ray with the editable top plane instead of querying DOM faces.
export const pickCell = (clientX, clientY, rect, rows, columns, height, view, planeHeight = height) => {
  const camera = cameraFor(rows, columns, height, view);
  const size = Math.min(rect.width, rect.height);
  const a = (clientX - rect.left - rect.width / 2) / size * camera.radius / (.36 * view.zoom);
  const v = (clientY - rect.top - rect.height / 2) / size * camera.radius / (.36 * view.zoom);
  const distance = camera.radius * 3;
  const inverse = (across, vertical, depth) => {
    const forward = vertical * Math.sin(view.pitch) + depth * Math.cos(view.pitch);
    return [across * Math.cos(view.yaw) + forward * Math.sin(view.yaw),
      -across * Math.sin(view.yaw) + forward * Math.cos(view.yaw),
      -vertical * Math.cos(view.pitch) + depth * Math.sin(view.pitch)];
  };
  const origin = inverse(0, 0, distance);
  const direction = inverse(a, v, -distance);
  const t = (planeHeight - camera.center[2] - origin[2]) / direction[2];
  if (!Number.isFinite(t) || t <= 0) return null;
  const x = Math.floor(camera.center[0] + origin[0] + t * direction[0]);
  const y = Math.floor(camera.center[1] + origin[1] + t * direction[1]);
  return x >= 0 && x < columns && y >= 0 && y < rows ? { x, y } : null;
};

const vertexShader = `
precision mediump float;
attribute vec3 position;
attribute vec3 normal;
attribute vec3 offset;
uniform vec3 center;
uniform vec4 camera;
uniform vec2 aspect;
uniform float plane;
uniform float preview;
uniform vec2 dimensions;
uniform float height;
varying vec3 world;
varying vec3 local;
varying float shade;
varying vec3 cellPosition;
void main() {
  // The grid separates history from the current generation, beneath its cubes.
  world = plane > .5 ? vec3(position.xy * dimensions, height - 1. + .002) : position + offset;
  if (preview > .5) world.z += .015;
  local = position;
  cellPosition = offset;
  vec3 p = world - center;
  float across = p.x * cos(camera.x) - p.y * sin(camera.x);
  float forward = p.x * sin(camera.x) + p.y * cos(camera.x);
  float vertical = forward * sin(camera.y) - p.z * cos(camera.y);
  float depth = forward * cos(camera.y) + p.z * sin(camera.y);
  float distance = camera.z * 3.;
  float w = distance - depth;
  float scale = .72 * camera.w / camera.z * distance;
  gl_Position = vec4(across * scale * aspect.x, -vertical * scale * aspect.y, -depth * .25, w);
  shade = .55 + .25 * abs(normal.x) + .45 * max(normal.z, 0.);
}`;
const fragmentShader = `
precision mediump float;
uniform float plane;
uniform float preview;
uniform float height;
uniform float column;
uniform float playing;
uniform float time;
uniform vec2 selected;
varying vec3 world;
varying vec3 local;
varying float shade;
varying vec3 cellPosition;
vec3 rainbow(float t) {
  float s = fract(t * 5.) * 5.;
  if (s < 1.) return mix(vec3(.58,0.,.83), vec3(0.,0.,1.), s);
  if (s < 2.) return mix(vec3(0.,0.,1.), vec3(0.,1.,0.), s-1.);
  if (s < 3.) return mix(vec3(0.,1.,0.), vec3(1.,1.,0.), s-2.);
  if (s < 4.) return mix(vec3(1.,1.,0.), vec3(1.,.5,0.), s-3.);
  return mix(vec3(1.,.5,0.), vec3(1.,0.,0.), s-4.);
}
void main() {
  vec2 cell = plane > .5 ? floor(world.xy) : cellPosition.xy;
  bool sounding = playing > .5 && abs(cell.x - column) < .1;
  bool hover = all(lessThan(abs(cell - selected), vec2(.1)));
  if (plane > .5) {
    vec2 edge = min(fract(world.xy), 1. - fract(world.xy));
    float line = 1. - step(.025, min(edge.x, edge.y));
    vec3 color = hover ? vec3(.61,.25,.84) : sounding ? vec3(.73,.40,.93) : vec3(.65,.72,.76);
    gl_FragColor = vec4(color, hover ? .5 : sounding ? .25 : mix(.08,.6,line));
  } else {
    bool current = cellPosition.z > height - 1.1;
    vec3 color = current ? vec3(.15,.17,.20) : vec3(.43,.55,.61);
    if (current && sounding) color = rainbow(time);
    if (preview > .5) color = vec3(.61,.25,.84);
    vec3 edge = min(local, 1.-local);
    float border = step(edge.x,.018) + step(edge.y,.018) + step(edge.z,.018);
    gl_FragColor = vec4(border > 1.5 ? color * .6 : color * shade, 1.);
  }
}`;

export default class SculptureRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) throw new Error('WebGL is unavailable. Enable hardware acceleration to view the sculpture.');
    this.gl = gl;
    this.instancing = gl.getExtension('ANGLE_instanced_arrays');
    if (!this.instancing) throw new Error('Instanced rendering is unavailable in this browser.');
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexShader);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentShader);
    this.program = gl.createProgram();
    gl.attachShader(this.program, vertex); gl.attachShader(this.program, fragment); gl.linkProgram(this.program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program));
    this.attributes = {};
    ['position', 'normal', 'offset'].forEach(name => { this.attributes[name] = gl.getAttribLocation(this.program, name); });
    this.uniforms = {};
    ['center','camera','aspect','plane','dimensions','height','column','playing','time','selected','preview'].forEach(name => {
      this.uniforms[name] = gl.getUniformLocation(this.program, name);
    });
    const vertices = [];
    const face = (corners, normal) => [0,1,2,0,2,3].forEach(i => vertices.push(...corners[i], ...normal));
    face([[0,0,1],[1,0,1],[1,1,1],[0,1,1]], [0,0,1]);
    face([[0,1,0],[1,1,0],[1,0,0],[0,0,0]], [0,0,-1]);
    face([[0,0,0],[1,0,0],[1,0,1],[0,0,1]], [0,-1,0]);
    face([[1,1,0],[0,1,0],[0,1,1],[1,1,1]], [0,1,0]);
    face([[0,1,0],[0,0,0],[0,0,1],[0,1,1]], [-1,0,0]);
    face([[1,0,0],[1,1,0],[1,1,1],[1,0,1]], [1,0,0]);
    this.mesh = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    this.past = { buffer: gl.createBuffer(), count: 0, capacity: 0 };
    this.current = { buffer: gl.createBuffer(), count: 0, capacity: 0 };
    this.ghost = { buffer: gl.createBuffer(), count: 0, capacity: 0 };
    this.previewKey = null;
    this.history = [];
    this.historyOffsets = [];
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.frontFace(gl.CW);
    gl.clearColor(.98,.98,.98,1);
  }

  offsets(grid, z) {
    const offsets = [];
    grid.forEach((row,y) => row.forEach((cell,x) => { if (cell) offsets.push(x,y,z); }));
    return offsets;
  }

  upload(target, data, start = 0) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, target.buffer);
    if (data.length > target.capacity) {
      target.capacity = Math.max(data.length, target.capacity * 2, 3072);
      gl.bufferData(gl.ARRAY_BUFFER, target.capacity * 4, gl.DYNAMIC_DRAW);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(data));
    } else if (data.length > start) {
      gl.bufferSubData(gl.ARRAY_BUFFER, start * 4, new Float32Array(data.slice(start)));
    }
    target.count = data.length / 3;
  }

  update(grid, history) {
    if (this.history !== history) {
      const append = history.length >= this.history.length && this.history.every((layer,i) => layer === history[i]);
      const start = append ? this.history.length : 0;
      if (!append) this.historyOffsets = [];
      const previousLength = this.historyOffsets.length;
      for (let z = start; z < history.length; z += 1) {
        this.historyOffsets.push(...this.offsets(history[z], z));
      }
      this.upload(this.past, this.historyOffsets, append ? previousLength : 0);
      this.history = history;
    }
    if (this.grid !== grid || this.height !== history.length + 1) {
      this.upload(this.current, this.offsets(grid, history.length));
      this.grid = grid;
      this.height = history.length + 1;
    }
  }

  draw(view, column, playing, selected, time, preview = []) {
    const gl = this.gl;
    const previewKey = `${this.height}:` + preview.map(cell => `${cell.x},${cell.y}`).join(';');
    if (this.previewKey !== previewKey) {
      this.upload(this.ghost, preview.reduce((offsets,cell) => offsets.concat([cell.x,cell.y,this.height-1]), []));
      this.previewKey = previewKey;
    }
    const rect = this.canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * pixelRatio));
    const height = Math.max(1, Math.round(rect.height * pixelRatio));
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height; }
    gl.viewport(0,0,width,height); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    const rows = this.grid.length; const columns = this.grid[0].length;
    const camera = cameraFor(rows, columns, this.height, view);
    const u = this.uniforms;
    gl.uniform3fv(u.center, camera.center);
    gl.uniform4f(u.camera, view.yaw, view.pitch, camera.radius, view.zoom);
    gl.uniform2f(u.aspect, Math.min(width,height)/width, Math.min(width,height)/height);
    gl.uniform2f(u.dimensions, columns, rows);
    gl.uniform1f(u.height, this.height); gl.uniform1f(u.column, column);
    gl.uniform1f(u.playing, playing ? 1 : 0); gl.uniform1f(u.time,(time % 200) / 1000);
    gl.uniform2f(u.selected, selected ? selected.x : -1, selected ? selected.y : -1);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh);
    ['position','normal'].forEach((name,i) => {
      gl.enableVertexAttribArray(this.attributes[name]);
      gl.vertexAttribPointer(this.attributes[name],3,gl.FLOAT,false,24,i*12);
    });
    gl.uniform1f(u.plane,0);
    gl.uniform1f(u.preview,0);
    gl.enableVertexAttribArray(this.attributes.offset);
    this.instancing.vertexAttribDivisorANGLE(this.attributes.offset,1);
    [this.past,this.current,this.ghost].forEach(target => {
      gl.uniform1f(u.preview,target === this.ghost ? 1 : 0);
      if (!target.count) return;
      gl.bindBuffer(gl.ARRAY_BUFFER,target.buffer);
      gl.vertexAttribPointer(this.attributes.offset,3,gl.FLOAT,false,12,0);
      this.instancing.drawArraysInstancedANGLE(gl.TRIANGLES,0,36,target.count);
    });
    this.instancing.vertexAttribDivisorANGLE(this.attributes.offset,0);
    gl.disableVertexAttribArray(this.attributes.offset); gl.vertexAttrib3f(this.attributes.offset,0,0,0);
    gl.uniform1f(u.preview,0);
    gl.uniform1f(u.plane,1);
    gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false); gl.drawArrays(gl.TRIANGLES,0,6); gl.depthMask(true);
    gl.disable(gl.BLEND); gl.enable(gl.CULL_FACE);
  }

  dispose() {
    [this.mesh,this.past.buffer,this.current.buffer,this.ghost.buffer].forEach(buffer => this.gl.deleteBuffer(buffer));
    this.gl.deleteProgram(this.program);
  }
}
