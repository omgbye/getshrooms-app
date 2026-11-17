// Noise goes in one side of the phone, three directions come out the other.
// Picking an answer in the phone demo sends a pulse down one of the three.
{
const stream = document.querySelector(".stream");
const stage = stream.querySelector(".stream-stage");
const canvas = stage.querySelector(".stream-canvas");
const device = stage.querySelector(".stream-device");
const phone = device.querySelector(".phone");
const ctx = canvas.getContext("2d");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const lime = "206, 255, 0";
const paper = "150, 165, 255";
const cobalt = "120, 145, 255";

let width = 0;
let height = 0;
let vertical = false;
let inputs = [];   // noisy lines heading into the phone
let outputs = [];  // calm lines leaving it
let directions = [];
let pulses = [];
let lit = -1;
let paused = false;
let visible = false;
let frame = 0;
let lastSpawn = 0;
let lastTick = 0;

const seeded = i => (Math.sin(i * 12.9898) * 43758.5453) % 1;

function bezier(a, b, c, d, steps = 56) {
  const points = [];
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const u = 1 - t;
    points.push([
      u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
      u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
    ]);
  }
  return points;
}

// Lay lines out along the stream axis, then rotate for the vertical (phone) layout.
function place(along, across) {
  return vertical ? [across, along] : [along, across];
}

function build() {
  const dpr = Math.min(2, devicePixelRatio || 1);
  width = stage.clientWidth;
  height = stage.clientHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  vertical = width < 760;

  const length = vertical ? height : width;
  const spread = vertical ? width : height;
  const start = vertical ? device.offsetTop : device.offsetLeft;
  const size = vertical ? device.offsetWidth : device.offsetHeight;
  const end = start + (vertical ? device.offsetHeight : device.offsetWidth);
  const middle = (vertical ? device.offsetLeft : device.offsetTop) + size / 2;
  const waist = size * (vertical ? .34 : .22);
  const count = vertical ? 22 : 36;

  inputs = [];
  outputs = [];
  pulses = [];
  for (let i = 0; i < count; i++) {
    const s = i / (count - 1) - .5;
    const wobble = seeded(i + 1);
    const from = middle + s * spread * 1.15 + wobble * 24;
    const into = middle + s * waist;
    inputs.push({
      phase: wobble * 6.28,
      points: bezier(place(0, from), place(start * .45, from), place(start * .7, into), place(start + 12, into)),
    });
    const out = middle + s * spread * 1.05;
    outputs.push({
      points: bezier(place(end - 12, into), place(end + (length - end) * .3, into), place(end + (length - end) * .55, out), place(length, out)),
    });
  }
  directions = [Math.round(count * .2), Math.round(count * .5), Math.round(count * .8)];
}

function stroke(points, from, to, style, lineWidth) {
  const first = Math.max(0, Math.floor(from * (points.length - 1)));
  const last = Math.min(points.length - 1, Math.ceil(to * (points.length - 1)));
  if (last <= first) return;
  ctx.beginPath();
  ctx.moveTo(points[first][0], points[first][1]);
  for (let i = first + 1; i <= last; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.strokeStyle = style;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

// The noise side shivers; it calms down the closer it gets to the phone.
function noisy(line, time) {
  if (reduceMotion.matches) return line.points;
  return line.points.map(([x, y], i, all) => {
    const calm = 1 - i / (all.length - 1);
    const shake = Math.sin(time / 900 + line.phase + i * .35) * 9 * calm * calm;
    return vertical ? [x + shake, y] : [x, y + shake];
  });
}

function fade(axisEnd) {
  const gradient = vertical
    ? ctx.createLinearGradient(0, 0, 0, height)
    : ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, `rgba(${paper}, 0)`);
  gradient.addColorStop(axisEnd, `rgba(${paper}, .42)`);
  gradient.addColorStop(1 - axisEnd, `rgba(${paper}, .42)`);
  gradient.addColorStop(1, `rgba(${paper}, 0)`);
  return gradient;
}

function draw(time) {
  ctx.clearRect(0, 0, width, height);
  const base = fade(vertical ? .1 : .3);
  const live = inputs.map(line => noisy(line, time));
  for (const points of live) stroke(points, 0, 1, base, 1);
  outputs.forEach((line, i) => {
    const index = directions.indexOf(i);
    if (index === -1) stroke(line.points, 0, 1, base, 1);
    else if (index !== lit) stroke(line.points, 0, 1, `rgba(${lime}, .35)`, 1.2);
  });

  ctx.save();
  ctx.shadowColor = `rgba(${lime}, .9)`;
  ctx.shadowBlur = 14;
  if (lit !== -1) {
    const pulse = pulses.find(p => p.lights);
    stroke(outputs[directions[lit]].points, 0, pulse ? pulse.t : 1, `rgba(${lime}, .95)`, 2);
  }
  for (const pulse of pulses) {
    const points = pulse.side === "in" ? live[pulse.line] : outputs[pulse.line].points;
    const color = pulse.side === "in" ? cobalt : lime;
    ctx.shadowColor = `rgba(${color}, .85)`;
    stroke(points, pulse.t - .19, pulse.t, `rgba(${color}, ${pulse.strength})`, pulse.lights ? 3.2 : 2.1);
  }
  ctx.restore();
}

function tick(now) {
  frame = 0;
  const step = Math.min(.05, lastTick ? (now - lastTick) / 1000 : 0);
  lastTick = now;
  if (!paused && now - lastSpawn > 280 && pulses.length < 16) {
    lastSpawn = now;
    pulses.push({ side: "in", line: Math.floor(Math.random() * inputs.length), t: 0, speed: .45 + Math.random() * .25, strength: .9 });
  }
  for (const pulse of pulses) pulse.t += pulse.speed * step;
  const arrivals = pulses.filter(pulse => pulse.side === "in" && pulse.t >= 1 && !pulse.transferred);
  for (const pulse of arrivals) {
    pulse.transferred = true;
    pulses.push({
      side: "out",
      line: directions[Math.floor(Math.random() * directions.length)],
      t: 0,
      speed: .65,
      strength: .85
    });
  }
  pulses = pulses.filter(pulse => pulse.t < 1.14);
  draw(now);
  if (visible && (!paused || pulses.length)) frame = requestAnimationFrame(tick);
  else lastTick = 0;
}

function run() {
  if (!frame && visible && !reduceMotion.matches) frame = requestAnimationFrame(tick);
}

function redraw() {
  build();
  draw(performance.now());
}

// Called by the phone demo when someone picks an answer.
window.lightDirection = index => {
  lit = index;
  pulses = pulses.filter(pulse => !pulse.lights);
  if (reduceMotion.matches) {
    draw(performance.now());
    return;
  }
  pulses.push({ side: "out", line: directions[index], t: 0, speed: .7, strength: 1, lights: true });
  run();
};

window.pauseStream = value => {
  paused = value;
  run();
};

// Tilt the phone a little toward the pointer, with light catching the glass.
if (finePointer.matches) {
  stage.addEventListener("pointermove", event => {
    if (reduceMotion.matches) return;
    const box = phone.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - box.left - box.width / 2) / (box.width * 1.6)));
    const y = Math.max(-1, Math.min(1, (event.clientY - box.top - box.height / 2) / (box.height * 1.2)));
    device.style.setProperty("--tilt-x", `${-y * 7}deg`);
    device.style.setProperty("--tilt-y", `${x * 10}deg`);
    device.style.setProperty("--glare-x", `${50 + x * 40}%`);
    device.style.setProperty("--glare-y", `${50 + y * 40}%`);
  });
  stage.addEventListener("pointerleave", () => {
    for (const name of ["--tilt-x", "--tilt-y", "--glare-x", "--glare-y"]) device.style.removeProperty(name);
  });
}

if (ctx) {
  new ResizeObserver(redraw).observe(stage);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    run();
  }).observe(stage);
  reduceMotion.addEventListener("change", redraw);
}
}
