const canvas = document.querySelector(".dither");
const hero = canvas.closest(".hero");
const context = canvas.getContext("2d");
const interactivePointer = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
const pixel = 5;
const lifetime = 380;
const thresholds = [
  [0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5],
];

let points = [];
let frame = 0;

function draw(now) {
  frame = 0;
  context.clearRect(0, 0, canvas.width, canvas.height);
  points = points.filter(point => now - point.time < lifetime);
  for (const { x, y, time } of points) {
    const strength = Math.max(0, 1 - (now - time) / lifetime);
    const radius = 58 * Math.sqrt(strength);
    context.fillStyle = "rgba(206, 255, 0, .22)";
    for (let col = Math.max(0, Math.floor((x - radius) / pixel)); col * pixel < x + radius; col++) {
      for (let row = Math.max(0, Math.floor((y - radius) / pixel)); row * pixel < y + radius; row++) {
        const distance = Math.hypot(col * pixel - x, row * pixel - y);
        if ((1 - distance / radius) * strength > (thresholds[row % 4][col % 4] + .5) / 16) {
          context.fillRect(col * pixel, row * pixel, pixel, pixel);
        }
      }
    }
  }
  if (points.length) frame = requestAnimationFrame(draw);
}

function resize() {
  canvas.width = hero.clientWidth;
  canvas.height = hero.clientHeight;
}

if (context) {
  new ResizeObserver(resize).observe(hero);
  hero.addEventListener("pointermove", event => {
    if (!interactivePointer.matches || event.pointerType !== "mouse") return;
    const bounds = hero.getBoundingClientRect();
    points = [...points.slice(-5), { x: event.clientX - bounds.left, y: event.clientY - bounds.top, time: performance.now() }];
    if (!frame) frame = requestAnimationFrame(draw);
  });
  interactivePointer.addEventListener("change", () => { points = []; });
}
