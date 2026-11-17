(() => {
  const canvas = document.querySelector(".neural-field");
  if (!canvas) return;
  const hero = canvas.closest(".hero");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let frame = 0;
  let visible = false;
  let elapsed = 0;
  let lastTime = 0;

  function render() {
    ctx.clearRect(0, 0, width, height);
    const mobile = width < 760;
    const cx = width * (mobile ? .53 : .77);
    const cy = height * (mobile ? .69 : .48);
    const radius = Math.hypot(width, height) * .85;
    const colors = ["#ceff00", "#d8fa69", "#a8ec6b", "#85d7b0", "#aacbea", "#c0c4ed", "#d4edab"];
    ctx.fillStyle = "#ceff00";
    ctx.fillRect(0, 0, width, height);
    const rings = 25;
    for (let ring = rings; ring >= 1; ring--) {
      const depth = ring / rings;
      const base = radius * depth * depth;
      ctx.beginPath();
      for (let segment = 0; segment <= 160; segment++) {
        const angle = segment / 160 * Math.PI * 2;
        const bend = angle + depth * 1.8 + elapsed * .06;
        const fold = 1 + .12 * Math.sin(bend * 5 + depth * 8 - elapsed * .23)
          + .055 * Math.sin(bend * 9 - depth * 5 + elapsed * .16);
        const x = cx + Math.cos(angle) * base * fold;
        const y = cy + Math.sin(angle) * base * fold * .78;
        if (segment === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = colors[ring % colors.length];
      ctx.fill();
    }

  }

  function animate(now) {
    if (lastTime) elapsed += Math.min(.05, (now - lastTime) / 1000);
    lastTime = now;
    render();
    frame = requestAnimationFrame(animate);
  }

  function update() {
    cancelAnimationFrame(frame);
    lastTime = 0;
    render();
    if (visible && !motion.matches && !document.hidden) frame = requestAnimationFrame(animate);
  }

  new ResizeObserver(() => {
    width = hero.clientWidth;
    height = hero.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    update();
  }).observe(hero);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }).observe(hero);
  motion.addEventListener("change", update);
  document.addEventListener("visibilitychange", update);
})();
