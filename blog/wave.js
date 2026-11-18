// The Spore Print hero background: a slow sea of the SHROOMS tagline.
// Original lightweight canvas implementation inspired by wave-lettering
// text-sea effects. Respects prefers-reduced-motion (draws one still frame).
(function () {
  var canvas = document.querySelector(".spore-wave");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var hero = canvas.parentElement;
  var PHRASE = "FIND WHAT YOU LOVE · MAKE IT HAPPEN · ";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var W = 0, H = 0, rows = [];
  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

  function build() {
    var r = hero.getBoundingClientRect();
    W = Math.max(320, Math.floor(r.width));
    H = Math.max(240, Math.floor(r.height));
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    rows = [];
    var count = Math.max(10, Math.floor(H / 34));
    for (var i = 0; i < count; i++) {
      var depth = count <= 1 ? 1 : i / (count - 1); // 0 far, 1 near
      rows.push({
        y: 18 + depth * (H - 30),
        size: 10 + depth * 9,
        alpha: 0.05 + depth * 0.13,
        speed: 6 + depth * 16,
        amp: 2 + depth * 5,
        phase: Math.random() * Math.PI * 2,
        offset: Math.random() * 400
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#1c2a00";
    ctx.textBaseline = "middle";
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      ctx.font = "600 " + row.size + "px 'Space Grotesk', sans-serif";
      var unit = ctx.measureText(PHRASE).width;
      if (unit <= 0) continue;
      var drift = ((t * row.speed + row.offset) % unit + unit) % unit;
      ctx.globalAlpha = row.alpha;
      for (var x = -unit - drift; x < W + unit; x += unit) {
        var wave = Math.sin((x / W) * Math.PI * 2 + row.phase + t * 0.7) * row.amp;
        ctx.fillText(PHRASE, x, row.y + wave);
      }
    }
    ctx.globalAlpha = 1;
  }

  var start = null, raf = null;
  function frame(ts) {
    if (start === null) start = ts;
    draw((ts - start) / 1000);
    raf = requestAnimationFrame(frame);
  }

  function play() {
    build();
    if (reduce) { draw(1.2); return; }
    if (raf) cancelAnimationFrame(raf);
    start = null;
    raf = requestAnimationFrame(frame);
  }

  document.addEventListener("visibilitychange", function () {
    if (reduce) return;
    if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = null; }
    else if (!raf) { start = null; raf = requestAnimationFrame(frame); }
  });
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(play, 180);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(play);
  play();
})();
