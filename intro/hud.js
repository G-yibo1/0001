(() => {
const hud = document.querySelector("#game-hud");
const dayLabel = hud.querySelector(".hud-day");
const locationLabel = hud.querySelector(".hud-location");
const toolbar = hud.querySelector(".hud-toolbar");

function setGameDay(day) {
  dayLabel.setAttribute("aria-label", `第 ${day} 天`);
  const digits = Array.from(String(day), digit => {
    const element = document.createElement("span");
    element.className = "hud-digit";
    element.style.setProperty("--digit", digit);
    return element;
  });
  dayLabel.replaceChildren(...digits);
}

setGameDay(0);

function showHudForScene(scene) {
  const location = scene.dataset.location || "";
  locationLabel.textContent = location;
  locationLabel.hidden = !location;
  toolbar.hidden = !scene.hasAttribute("data-show-toolbar");
  hud.hidden = locationLabel.hidden && toolbar.hidden;
  if (hud.hidden) return;
  hud.style.setProperty("--hud-ratio", getComputedStyle(scene).getPropertyValue("--scene-ratio").trim() || "960 / 544");
}

window.setGameDay = setGameDay;
window.showHudForScene = showHudForScene;
})();

