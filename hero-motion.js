const heroBackground = document.querySelector(".hero");
const waveCanvas = heroBackground.querySelector(".wave-field");
const waveContext = waveCanvas.getContext("2d");
const reducedWaves = matchMedia("(prefers-reduced-motion: reduce)");
const WAVE_PHRASE = "CURIOSITY · POSSIBILITY · IMAGINATION · ";
let waveFrame = 0;
let waveTime = 0;
let previousWaveTime = 0;
let lastPaint = 0;
let waveWidth = 0;
let waveHeight = 0;
let waveVisible = true;
let waveRatio = 1;
let mushroomArea;
let waveStrip = null;      // the phrase, pre-rendered twice for seamless wrapping
let wavePhraseWidth = 0;   // CSS px
let waveFontSize = 23;

// The wave used to draw every letter of every row on every frame (thousands of
// rotated fillText calls, originally with a blur filter on each) — that is what
// froze the page. Now the phrase is rasterised ONCE into an offscreen strip and
// each frame just blits slices of it with the same sine swell, rotation and
// fade the per-letter version had. Same look, a fraction of the main-thread cost.
function buildStrip() {
  waveFontSize = waveWidth < 700 ? 17 : 23;
  const probe = document.createElement("canvas").getContext("2d");
  probe.font = `600 ${waveFontSize}px "DM Sans", sans-serif`;
  wavePhraseWidth = [...WAVE_PHRASE].reduce((sum, glyph) => sum + probe.measureText(glyph).width + 1.2, 0);
  const stripHeight = waveFontSize * 2;
  waveStrip = document.createElement("canvas");
  waveStrip.width = Math.ceil(wavePhraseWidth * 2 * waveRatio);
  waveStrip.height = Math.ceil(stripHeight * waveRatio);
  const stripCtx = waveStrip.getContext("2d");
  stripCtx.setTransform(waveRatio, 0, 0, waveRatio, 0, 0);
  stripCtx.font = `600 ${waveFontSize}px "DM Sans", sans-serif`;
  stripCtx.textBaseline = "middle";
  stripCtx.fillStyle = "rgb(35, 60, 102)";
  for (let copy = 0; copy < 2; copy++) {
    let x = copy * wavePhraseWidth;
    for (const glyph of WAVE_PHRASE) {
      stripCtx.fillText(glyph, x, stripHeight / 2);
      x += probe.measureText(glyph).width + 1.2;
    }
  }
}

function paintWaves() {
  if (!waveStrip || !mushroomArea) return;
  waveContext.setTransform(waveRatio, 0, 0, waveRatio, 0, 0);
  waveContext.clearRect(0, 0, waveWidth, waveHeight);
  const rowHeight = waveFontSize * 1.65;
  const stripHeight = waveFontSize * 2;
  const segW = wavePhraseWidth / 6;

  for (let row = -2; row < waveHeight / rowHeight + 2; row++) {
    const startX = -wavePhraseWidth + (row % 2) * wavePhraseWidth * .32 + (waveTime * waveFontSize * .8) % wavePhraseWidth;
    let srcX = ((-startX) % wavePhraseWidth + wavePhraseWidth) % wavePhraseWidth;
    for (let x = startX; x < waveWidth + 30; x += segW) {
      const cx = x + segW / 2;
      const phase = cx / (waveWidth * .7) * Math.PI * 2 + row * .45 - waveTime;
      const swell = Math.sin(phase);
      const y = row * rowHeight + swell * rowHeight * 1.1 + Math.sin(cx / 390 - waveTime * .55) * 9;
      const nx = (cx - mushroomArea.x) / mushroomArea.rx;
      const ny = (y - mushroomArea.y) / mushroomArea.ry;
      const distance = Math.hypot(nx, ny);
      const clearance = Math.min(1, Math.max(.08, (distance - .3) / .9));
      const opacity = (.12 + (swell + 1) * .025) * clearance;
      const angle = Math.cos(phase) * .055;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      waveContext.setTransform(waveRatio * cos, waveRatio * sin, -waveRatio * sin, waveRatio * cos, waveRatio * cx, waveRatio * y);
      waveContext.globalAlpha = Math.max(0, Math.min(1, opacity));
      waveContext.drawImage(waveStrip, srcX * waveRatio, 0, segW * waveRatio, waveStrip.height, -segW / 2, -stripHeight / 2, segW, stripHeight);
      srcX += segW;
      if (srcX >= wavePhraseWidth) srcX -= wavePhraseWidth;
    }
  }
  waveContext.globalAlpha = 1;
  waveContext.setTransform(waveRatio, 0, 0, waveRatio, 0, 0);
}

function animateWaves(now) {
  waveFrame = requestAnimationFrame(animateWaves);
  if (previousWaveTime) waveTime += Math.min((now - previousWaveTime) / 1000, .05);
  previousWaveTime = now;
  // Ambient background: ~25fps is plenty, and it caps the main-thread cost.
  if (now - lastPaint < 40) return;
  lastPaint = now;
  paintWaves();
}

function startWaves() {
  if (!waveFrame && waveVisible && !document.hidden && !reducedWaves.matches) {
    previousWaveTime = 0;
    lastPaint = 0;
    waveFrame = requestAnimationFrame(animateWaves);
  }
}

function stopWaves() {
  cancelAnimationFrame(waveFrame);
  waveFrame = 0;
}

function updateWaves() {
  stopWaves();
  previousWaveTime = 0;
  paintWaves();
  startWaves();
}

function sizeWaves() {
  const bounds = heroBackground.getBoundingClientRect();
  const mushroom = heroBackground.querySelector(".art").getBoundingClientRect();
  waveWidth = bounds.width;
  waveHeight = bounds.height;
  waveRatio = Math.min(devicePixelRatio || 1, 1.5);
  waveCanvas.width = Math.round(waveWidth * waveRatio);
  waveCanvas.height = Math.round(waveHeight * waveRatio);
  buildStrip();
  mushroomArea = {
    x: mushroom.left - bounds.left + mushroom.width / 2,
    y: mushroom.top - bounds.top + mushroom.height / 2,
    rx: Math.max(mushroom.width * .6, 1),
    ry: Math.max(mushroom.height * .6, 1),
  };
  updateWaves();
}

reducedWaves.addEventListener("change", updateWaves);
new ResizeObserver(sizeWaves).observe(heroBackground);
new IntersectionObserver(([entry]) => {
  waveVisible = entry.isIntersecting;
  if (waveVisible) startWaves();
  else stopWaves();
}).observe(heroBackground);
document.fonts.ready.then(sizeWaves);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopWaves();
  else startWaves();
});
