const opening = document.querySelector(".opening");
const introButton = opening.querySelector(".opening-control");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const diagram = opening.querySelector(".sequence-diagram");
const marks = [...diagram.querySelectorAll("i")];
const axis = diagram.querySelector(".sequence-axis");
const label = opening.querySelector(".sequence-copy span");
const headline = opening.querySelector(".sequence-copy strong");
const progress = opening.querySelector(".sequence-progress");
const logo = opening.querySelector(".sequence-logo");
const secondsPerScene = 2;
const logoDuration = 1.65;
const scenes = [
  { label: "THE QUESTION", headline: "Whose dream are you dreaming?", marks: [[.24,.45,.03],[.51,.21,.03],[.74,.52,.03]], angle: -24 },
  { label: "THE MIRROR", headline: "You need a mirror to see your eyes.", marks: [[.18,.50,.20],[.34,.32,.32],[.50,.16,.20]], angle: -12 },
  { label: "THE SURPRISE", headline: "Hit the button labeled surprise.", marks: [[.13,.19,.44],[.13,.43,.68],[.13,.67,.36]], angle: 0 },
  { label: "THE REVEAL", headline: "Three roles where you naturally fit.", marks: [[.15,.20,.65],[.15,.45,.53],[.15,.70,.38]], angle: -9 },
  { label: "THE DAILY STEP", headline: "One daily habit. Test your reality.", marks: [[.45,.44,.03],[.51,.44,.03],[.57,.44,.03]], angle: -24 },
];

const storyDuration = scenes.length * secondsPerScene;
const duration = storyDuration + logoDuration;
let animationFrame;
let lastScene;

function draw(time) {
  const reveal = Math.max(0, Math.min(1, (time - storyDuration + .55) / 1.15));
  const settle = 1 - (1 - reveal) ** 3;
  logo.style.opacity = String(Math.max(0, Math.min(1, (reveal - .22) * 2.8)));
  logo.style.transform = `scale(${.18 + .82 * settle + .14 * Math.sin(Math.PI * settle)}) rotate(${-18 * (1 - settle)}deg)`;
  diagram.style.opacity = String(1 - reveal);
  opening.querySelector(".sequence-copy").style.opacity = String(1 - Math.min(1, reveal * 3));
  const silhouette = Math.min(1, reveal * 2);
  const index = Math.min(Math.floor(time / secondsPerScene), scenes.length - 1);
  const scene = scenes[index];
  const next = scenes[Math.min(index + 1, scenes.length - 1)];
  const phase = time / secondsPerScene - index;
  const movement = Math.max(0, Math.min(1, (phase - .55) / .45));
  const eased = movement * movement * (3 - 2 * movement);
  const mix = (from, to) => from + (to - from) * eased;

  if (lastScene !== index) {
    label.textContent = scene.label;
    headline.textContent = scene.headline;
    lastScene = index;
  }
  const width = diagram.clientWidth;
  const height = diagram.clientHeight;
  axis.style.transform = `rotate(${mix(scene.angle, next.angle)}deg) scaleY(${mix(.65 + index * .06, .65 + Math.min(index + 1, 4) * .06)})`;
  marks.forEach((mark, i) => {
    const [x, y, length] = scene.marks[i].map((value, j) => mix(value, next.marks[i][j]));
    const mushroom = [[.26,.18,.48,0,.31],[.28,.44,.44,-8,.11],[.48,.54,.31,109,.08]][i];
    const towardsLogo = (from, to) => from + (to - from) * silhouette;
    mark.style.width = `${Math.max(12, towardsLogo(length, mushroom[2]) * width)}px`;
    mark.style.height = `${towardsLogo(12, mushroom[4] * height)}px`;
    mark.style.transform = `translate(${towardsLogo(x, mushroom[0]) * width}px, ${towardsLogo(y, mushroom[1]) * height}px) rotate(${towardsLogo(mix(scene.angle, next.angle), mushroom[3])}deg)`;
  });
  progress.style.transform = `scaleX(${time / duration})`;
}

function finishIntro() {
  cancelAnimationFrame(animationFrame);
  opening.classList.remove("playing");
  introButton.textContent = "Play intro ↻";
}

function playIntro() {
  if (motionPreference.matches) return;
  opening.classList.add("playing");
  introButton.textContent = "Skip intro →";
  const start = performance.now();
  draw(0);

  function frame(now) {
    const elapsed = Math.max(0, (now - start) / 1000);
    if (elapsed >= duration) {
      finishIntro();
      return;
    }
    draw(elapsed);
    animationFrame = requestAnimationFrame(frame);
  }

  animationFrame = requestAnimationFrame(frame);
}

introButton.addEventListener("click", () => {
  if (opening.classList.contains("playing")) finishIntro();
  else playIntro();
});

function updateMotionPreference() {
  finishIntro();
  introButton.hidden = motionPreference.matches;
}

motionPreference.addEventListener("change", updateMotionPreference);
updateMotionPreference();
