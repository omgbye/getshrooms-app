/* Liquid Ether-style hero background: a slow WebGL liquid that flows over a
   dark pool, colored by how fast it moves (calm = deep olive, fast = lime).
   Rebuilt in vanilla WebGL for this page. Falls back silently: if WebGL is
   unavailable the canvas stays transparent and the CSS gradient shows. */
(() => {
  const canvas = document.querySelector('.liquid-field');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false })
    || canvas.getContext('experimental-webgl', { alpha: true });
  if (!gl) return; // CSS gradient fallback remains

  const VERT = `
    attribute vec2 aPos;
    void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
  `;
  const FRAG = `
    precision highp float;
    uniform vec2 uRes;
    uniform float uTime;
    uniform vec2 uPointer;   // -1..1, y up
    uniform float uStir;     // 0..1 pointer energy
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
      for (int i = 0; i < 5; i++){ v += a * noise(p); p = rot * p * 2.0; a *= 0.5; }
      return v;
    }
    void main(){
      vec2 uv = gl_FragCoord.xy / uRes;
      vec2 p = uv; p.x *= uRes.x / uRes.y;
      float t = uTime * 0.045;
      // pointer stirs the pool: warp space toward it and add energy nearby
      vec2 pp = uPointer * 0.5 + 0.5; pp.x *= uRes.x / uRes.y;
      float pd = length(p - pp);
      float stir = uStir * exp(-pd * 3.0);
      vec2 q = vec2(fbm(p * 1.6 + vec2(0.0, t * 0.7)),
                    fbm(p * 1.6 + vec2(5.2, 1.3) - vec2(t * 0.5, 0.0)));
      vec2 r = vec2(fbm(p * 1.6 + 3.0 * q + vec2(1.7, 9.2) + vec2(t * 0.6, 0.0) + stir * 1.4),
                    fbm(p * 1.6 + 3.0 * q + vec2(8.3, 2.8) - vec2(0.0, t * 0.45) - stir * 1.1));
      float f = fbm(p * 1.6 + 3.5 * r);
      float speed = clamp(length(q) * 0.55 + length(r) * 0.45 - 0.55, 0.0, 1.0);
      vec3 deep  = vec3(0.030, 0.038, 0.020);
      vec3 pool  = vec3(0.105, 0.145, 0.028);
      vec3 olive = vec3(0.235, 0.330, 0.030);
      vec3 lime  = vec3(0.580, 0.800, 0.020);
      vec3 pale  = vec3(0.880, 1.000, 0.480);
      vec3 col = mix(deep, pool, smoothstep(0.15, 0.55, f));
      col = mix(col, olive, smoothstep(0.50, 0.78, f));
      col = mix(col, lime, smoothstep(0.30, 0.95, speed) * smoothstep(0.55, 0.85, f));
      col = mix(col, pale, pow(speed, 3.0) * 0.55 + stir * 0.25 * speed);
      // gentle vignette so copy stays readable
      float vig = smoothstep(1.25, 0.35, length(uv - vec2(0.5, 0.55)));
      col *= mix(0.82, 1.0, vig);
      gl_FragColor = vec4(col, 1.0);
    }
  `;
  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
    return s;
  }
  const vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uPointer = gl.getUniformLocation(prog, 'uPointer');
  const uStir = gl.getUniformLocation(prog, 'uStir');

  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  function resize() {
    const w = Math.max(2, Math.round(canvas.clientWidth * DPR));
    const h = Math.max(2, Math.round(canvas.clientHeight * DPR));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }
  resize();
  window.addEventListener('resize', resize);

  let px = 0, py = 0, stir = 0;
  window.addEventListener('pointermove', (e) => {
    px = (e.clientX / window.innerWidth) * 2 - 1;
    py = 1 - (e.clientY / window.innerHeight) * 2;
    stir = Math.min(1, stir + 0.25);
  }, { passive: true });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let running = false, raf = 0, start = performance.now();
  function frame(now) {
    if (!running) return;
    resize();
    stir *= 0.96;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.uniform2f(uPointer, px, py);
    gl.uniform1f(uStir, stir);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  function paintOnce() {
    resize();
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, 7.3);
    gl.uniform2f(uPointer, 0, 0);
    gl.uniform1f(uStir, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function play() {
    if (running || reduced.matches) { if (reduced.matches) paintOnce(); return; }
    running = true; start = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function pause() { running = false; cancelAnimationFrame(raf); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { es.forEach((e) => { e.isIntersecting ? play() : pause(); }); }, { threshold: 0.02 }).observe(canvas);
  } else play();
  document.addEventListener('visibilitychange', () => { document.hidden ? pause() : play(); });
  if (reduced.matches) paintOnce();
})();
