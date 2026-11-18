(() => {
  const canvas = document.querySelector(".mushroom-field");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0, height = 0, frame = 0, visible = false, time = 0, previous = 0;
  const random = n => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const cap = new Path2D("M -260 25 C -225 -35 -160 -180 -85 -205 C -10 -240 65 -210 125 -160 C 180 -120 255 -60 270 5 C 285 70 160 100 10 107 C -145 113 -290 90 -260 25 Z");
  const stem = new Path2D("M -12 102 C -17 170 -48 234 -75 285 C -90 312 -42 321 -15 299 C 22 264 47 179 46 102 Z");

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const glow = ctx.createRadialGradient(width * .56, height * .47, 10, width * .56, height * .47, width * .65);
    glow.addColorStop(0, "#162e39");
    glow.addColorStop(.6, "#0b1717");
    glow.addColorStop(1, "#080d0c");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Perspective ground grid: all paths converge behind the stem.
    ctx.strokeStyle = "#ceff001c";
    ctx.lineWidth = 1;
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath(); ctx.moveTo(width * .5, height * .66);
      ctx.lineTo(width * .5 + i * width * .15, height); ctx.stroke();
    }
    for (let i = 1; i <= 8; i++) {
      const y = height * .66 + Math.pow(i / 8, 2) * height * .34;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    const scale = Math.min(width / 730, height / 640);
    ctx.save();
    ctx.translate(width * .55, height * .46);
    ctx.scale(scale, scale);
    ctx.rotate(-.11);
    const capColor = ctx.createLinearGradient(0, -220, 0, 100);
    capColor.addColorStop(0, "#234aff");
    capColor.addColorStop(.52, "#83d8ff");
    capColor.addColorStop(1, "#d8faff");
    ctx.fillStyle = "#172d4260"; ctx.fill(cap);
    ctx.strokeStyle = capColor; ctx.lineWidth = 2; ctx.stroke(cap);
    ctx.fillStyle = "#ceff0008"; ctx.fill(stem);
    ctx.strokeStyle = "#ceff00a0"; ctx.lineWidth = 1.5; ctx.stroke(stem);

    // The cap is constructed from a moving dot matrix clipped to its silhouette.
    ctx.save(); ctx.clip(cap);
    for (let row = -22; row <= 11; row++) {
      for (let col = -29; col <= 29; col++) {
        const phase = random(row * 89 + col) * 6.28;
        const alpha = .18 + .65 * Math.pow(.5 + .5 * Math.sin(time * 1.5 + phase + col * .12), 3);
        ctx.fillStyle = `rgba(150,220,255,${alpha})`;
        ctx.fillRect(col * 10, row * 10, 1.8, 1.8);
      }
      ctx.beginPath();
      ctx.moveTo(-300, row * 10);
      ctx.bezierCurveTo(-100, row * 10 - 22, 130, row * 10 - 22, 300, row * 10);
      ctx.strokeStyle = "#94ddff25"; ctx.lineWidth = .7; ctx.stroke();
    }
    ctx.restore();

    // Gills converge on an eye beneath the tilted cap.
    for (let i = 0; i <= 18; i++) {
      const angle = Math.PI * i / 18;
      const x = Math.cos(angle) * 240, y = 40 + Math.sin(angle) * 58;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x * .45, y + 24, 17, 66);
      ctx.strokeStyle = i % 3 === 0 ? "#d9f3e6b0" : "#91bdd76b";
      ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-24, 63); ctx.quadraticCurveTo(17, 26, 61, 63);
    ctx.quadraticCurveTo(17, 98, -24, 63);
    ctx.fillStyle = "#081310"; ctx.fill();
    ctx.strokeStyle = "#ceff00"; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.beginPath(); ctx.arc(18, 63, 13, 0, Math.PI * 2);
    ctx.strokeStyle = "#a8dbff"; ctx.stroke();
    ctx.beginPath(); ctx.arc(18, 63, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ceff00"; ctx.fill();



    ctx.restore();

    // Tracking boxes follow live signals around the mushroom and grass.
    for (let i = 0; i < 5; i++) {
      const x = width * (.14 + i * .17) + Math.sin(time * .32 + i * 1.7) * width * .035;
      const y = height * (.32 + (i % 3) * .15) + Math.cos(time * .28 + i) * 18;
      const box = width < 600 ? 22 : 34;
      const corner = 7;
      ctx.strokeStyle = i % 2 ? "#a8dbff80" : "#ceff0080";
      ctx.lineWidth = 1;
      for (const [dx, dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
        ctx.beginPath();
        ctx.moveTo(x + dx * box, y + dy * (box - corner));
        ctx.lineTo(x + dx * box, y + dy * box);
        ctx.lineTo(x + dx * (box - corner), y + dy * box);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(x + box, y);
      ctx.lineTo(width * .55, height * .53);
      ctx.strokeStyle = "#a8dbff20"; ctx.stroke();
      ctx.fillStyle = "#b4d6ca90";
      ctx.font = '9px "Instrument Sans", sans-serif';
      ctx.fillText("SIGNAL " + String(i + 1).padStart(2, "0"), x - box, y + box + 13);
    }

    // A slow scan travels through the field and lights nearby matrix points.
    const scanY = height * (.24 + ((time * .07) % 1) * .62);
    const scan = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
    scan.addColorStop(0, "#ceff0000");
    scan.addColorStop(.5, "#ceff0014");
    scan.addColorStop(1, "#ceff0000");
    ctx.fillStyle = scan;
    ctx.fillRect(0, scanY - 30, width, 60);
    ctx.strokeStyle = "#b9e9ff45";
    ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(width, scanY); ctx.stroke();

    for (let i = 0; i < 32; i++) {
      const travel = (time * .085 + random(i + 900)) % 1;
      const startX = random(i + 800) * width;
      const x = startX + (width * .55 - startX) * travel;
      const y = height - travel * height * .49;
      ctx.fillStyle = i % 3 ? "#ceff0080" : "#a8dbffb0";
      ctx.fillRect(x, y, 2, 2);
    }

    // Fine grass in the middle distance and large blades in the foreground.
    for (let i = 0; i < 125; i++) {
      const x = random(i + 1) * width;
      const tall = (28 + random(i + 200) * 145) * (height / 650);
      const y = height * (.79 + random(i + 300) * .21);
      const sway = Math.sin(time * .45 + i) * 6;
      const lean = (random(i + 400) - .5) * 64;
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + lean, y - tall * .65, x + lean + sway, y - tall);
      ctx.strokeStyle = i % 4 === 0 ? "#ceff0070" : "#6caa6945";
      ctx.lineWidth = 1 + random(i + 500) * 1.3; ctx.stroke();
      if (i % 7 === 0) {
        ctx.fillStyle = "#ceff00a0"; ctx.fillRect(x + lean + sway - 1, y - tall - 1, 2, 2);
      }
    }
    ctx.font = `500 ${width < 600 ? 9 : 11}px "Instrument Sans", sans-serif`;
    const words = ["CURIOSITY", "POSSIBILITY", "PAY ATTENTION", "IMAGINATION"];
    words.forEach((word, i) => {
      const x = width * (.06 + i * .235), y = height * (.34 + (i % 2) * .29);
      ctx.fillStyle = i % 2 ? "#a9dfff9c" : "#ceff009c";
      ctx.fillText(word, x, y);
      ctx.strokeStyle = "#a9dfff38";
      ctx.strokeRect(x - 6, y - 14, ctx.measureText(word).width + 12, 21);
    });
  }
  function tick(now) {
    if (previous) time += Math.min(.05, (now - previous) / 1000);
    previous = now; draw(); frame = requestAnimationFrame(tick);
  }
  function update() {
    cancelAnimationFrame(frame); previous = 0; draw();
    if (visible && !reduced.matches && !document.hidden) frame = requestAnimationFrame(tick);
  }
  new ResizeObserver(() => {
    width = canvas.clientWidth; height = canvas.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = width * dpr; canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); update();
  }).observe(canvas);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }).observe(canvas);
  reduced.addEventListener("change", update);
  document.addEventListener("visibilitychange", update);
})();
