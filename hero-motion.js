const heroBackground = document.querySelector(".hero");
const waveCanvas = heroBackground.querySelector(".wave-field");
const waveContext = waveCanvas.getContext("2d");
const reducedWaves = matchMedia("(prefers-reduced-motion: reduce)");
let waveFrame = 0;
let waveTime = 0;
let previousWaveTime = 0;
let waveWidth = 0;
let waveHeight = 0;
let mushroomArea;

function paintWaves() {
  waveContext.clearRect(0, 0, waveWidth, waveHeight);
  const fontSize = waveWidth < 700 ? 17 : 23;
  const rowHeight = fontSize * 1.65;
  const phrase = "CURIOSITY · POSSIBILITY · IMAGINATION · ";
  waveContext.font = `600 ${fontSize}px "DM Sans", sans-serif`;
  waveContext.textBaseline = "middle";
  const glyphs = [...phrase];
  const widths = glyphs.map(glyph => waveContext.measureText(glyph).width + 1.2);
  const phraseWidth = widths.reduce((sum, width) => sum + width, 0);

  for (let row = -2; row < waveHeight / rowHeight + 2; row++) {
    let x = -phraseWidth + (row % 2) * phraseWidth * .32 + (waveTime * fontSize * .8) % phraseWidth;
    let index = 0;
    while (x < waveWidth + 30) {
      const phase = x / (waveWidth * .7) * Math.PI * 2 + row * .45 - waveTime;
      const swell = Math.sin(phase);
      const y = row * rowHeight + swell * rowHeight * 1.1 + Math.sin(x / 390 - waveTime * .55) * 9;
      const nx = (x - mushroomArea.x) / mushroomArea.rx;
      const ny = (y - mushroomArea.y) / mushroomArea.ry;
      const distance = Math.hypot(nx, ny);
      const clearance = Math.min(1, Math.max(.08, (distance - .3) / .9));
      const opacity = (.12 + (swell + 1) * .025) * clearance;
      waveContext.save();
      waveContext.translate(x, y);
      waveContext.rotate(Math.cos(phase) * .055);
      waveContext.filter = `blur(${Math.max(0, -swell) * .9}px)`;
      waveContext.fillStyle = `rgba(35, 60, 102, ${opacity})`;
      waveContext.fillText(glyphs[index], 0, 0);
      waveContext.restore();
      x += widths[index];
      index = (index + 1) % glyphs.length;
    }
  }
}

function animateWaves(now) {
  if (previousWaveTime) waveTime += Math.min((now - previousWaveTime) / 1000, .05);
  previousWaveTime = now;
  paintWaves();
  waveFrame = requestAnimationFrame(animateWaves);
}

function updateWaves() {
  cancelAnimationFrame(waveFrame);
  previousWaveTime = 0;
  paintWaves();
  if (!reducedWaves.matches) {
    waveFrame = requestAnimationFrame(animateWaves);
  }
}

function sizeWaves() {
  const bounds = heroBackground.getBoundingClientRect();
  const mushroom = heroBackground.querySelector(".art").getBoundingClientRect();
  waveWidth = bounds.width;
  waveHeight = bounds.height;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  waveCanvas.width = Math.round(waveWidth * ratio);
  waveCanvas.height = Math.round(waveHeight * ratio);
  waveContext.setTransform(ratio, 0, 0, ratio, 0, 0);
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
document.fonts.ready.then(sizeWaves);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancelAnimationFrame(waveFrame);
  else updateWaves();
});
