(() => {
  const link = document.querySelector(".floating-download a");
  const ua = navigator.userAgent;
  const apple = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(ua);
  if (apple) {
    link.href = "https://apps.apple.com/us/iphone/today";
    link.textContent = "Open App Store";
    link.setAttribute("aria-label", "Open Apple’s App Store. SHROOMS release pending.");
  } else if (android) {
    link.href = "https://play.google.com/store/apps";
    link.textContent = "Open Google Play";
    link.setAttribute("aria-label", "Open Google Play. SHROOMS release pending.");
  }
})();
