const demo = document.querySelector(".phone-demo");
const stages = [...demo.querySelectorAll(".demo-stages button")];
const next = demo.querySelector(".demo-next");

function showStage(active) {
  for (const stage of stages) {
    const selected = stage === active;
    stage.setAttribute("aria-pressed", String(selected));
    document.getElementById(stage.getAttribute("aria-controls")).hidden = !selected;
  }
}

for (const stage of stages) {
  stage.addEventListener("click", () => showStage(stage));
}
demo.querySelector("fieldset").addEventListener("change", event => {
  next.disabled = false;
  window.lightDirection?.(Number(event.target.value));
});
next.addEventListener("click", () => {
  showStage(stages[1]);
  stages[1].focus();
});

const motionButton = document.querySelector(".demo-motion");
motionButton.addEventListener("click", () => {
  const paused = motionButton.getAttribute("aria-pressed") !== "true";
  motionButton.setAttribute("aria-pressed", String(paused));
  motionButton.textContent = paused ? "Play the stream" : "Pause the stream";
  window.pauseStream?.(paused);
});
