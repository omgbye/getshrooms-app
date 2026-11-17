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
    const strands = mobile ? 24 : 36;
    const levels = 38;
    const point = (strand, depth) => {
      const angle = strand / strands * Math.PI * 2;
      const r = radius * depth * depth;
      const twist = angle + .19 * Math.sin(depth * 7 - elapsed * .32);
      const ripple = 1 + .04 * Math.sin(depth * 20 + angle * 3 - elapsed * .55);
      return [cx + Math.cos(twist) * r * ripple, cy + Math.sin(twist) * r * .64 * ripple];
    };

    for (let strand = 0; strand < strands; strand++) {
      ctx.beginPath();
      for (let level = 1; level <= levels; level++) {
        const depth = level / levels;
        const [x, y] = point(strand, depth);
        if (level === 1) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = strand % 3 === 0 ? "rgba(38, 57, 185, .25)" : "rgba(42, 71, 100, .14)";
      ctx.lineWidth = strand % 3 === 0 ? 1.3 : .8;
      ctx.stroke();

      for (let pulse = 0; pulse < 2; pulse++) {
        const depth = .12 + ((elapsed * .075 + strand * .083 + pulse * .5) % 1) * .88;
        const [x, y] = point(strand, depth);
        ctx.beginPath();
        ctx.arc(x, y, .8 + depth * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = strand % 3 === 0 ? "rgba(31, 50, 220, .5)" : "rgba(42, 74, 110, .3)";
        ctx.fill();
      }
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
