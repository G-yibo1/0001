(() => {
const officeReady = window.officeReady;
const playOffice = window.playOffice;
const showHudForScene = window.showHudForScene;
const opening = document.querySelector("#opening-scene");
const title = document.querySelector("#title-scene");
const character = document.querySelector("#character-scene");
const office = document.querySelector("#office-scene");
const officeArt = document.querySelector("#office-art");
const dorm = document.querySelector("#dorm-scene");
const dormHeading = document.querySelector("#dorm-heading");
const overview = document.querySelector("#overview-scene");
const region = document.querySelector("#region-scene");
const regionArt = document.querySelector("#region-art");
const backToCharacter = document.querySelector("#back-to-character");
const backToOverview = document.querySelector("#back-to-overview");
const exit = document.querySelector("#exit-scene");
const exitHeading = document.querySelector("#exit-heading");
const restartButton = document.querySelector("#restart-game");
const enterButton = document.querySelector("#enter-game");
const exitButton = document.querySelector("#exit-game");
const backButton = document.querySelector("#back-to-title");
const form = document.querySelector("#character-form");
const nameInput = document.querySelector("#character-name");
const residenceInput = document.querySelector("#residence-name");
const avatarButtons = [...form.querySelectorAll("[data-avatar]")];
const malePreview = document.querySelector("#male-preview");
const femalePreview = document.querySelector("#female-preview");
const loadingDuration = 2000;
const sceneFadeDuration = 180;
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const storageKey = "hong-kong-diary:character";

let avatar = "female";
let activeRegionButton;
let currentScene = opening;
let transitioning = false;

async function showScene(scene, focusTarget, prepare) {
  if (transitioning || scene === currentScene) return;
  transitioning = true;
  const outgoing = currentScene;
  outgoing.inert = true;
  try {
    if (prepare) await prepare();
    if (!motionPreference.matches) {
      const fade = outgoing.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: sceneFadeDuration,
        easing: "ease-out",
        fill: "forwards",
      });
      await fade.finished.catch(() => {});
      outgoing.hidden = true;
      fade.cancel();
    } else {
      outgoing.hidden = true;
    }
    if (outgoing === opening) opening.dispatchEvent(new Event("openingcomplete"));
    scene.hidden = false;
    showHudForScene(scene);
    currentScene = scene;
    if (scene === opening) opening.dispatchEvent(new Event("openingstart"));
    focusTarget?.focus({ preventScroll: true });
  } finally {
    outgoing.inert = false;
    transitioning = false;
  }
}

async function finishLoading(nextScene, focusTarget, artworkReady) {
  const minimumDuration = new Promise(resolve => setTimeout(resolve, loadingDuration));
  await Promise.all([minimumDuration, artworkReady]);
  await showScene(nextScene, focusTarget);
}

function selectAvatar(nextAvatar) {
  avatar = nextAvatar;
  malePreview.hidden = avatar !== "male";
  femalePreview.hidden = avatar !== "female";
  for (const button of avatarButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.avatar === avatar));
  }
}

for (const button of avatarButtons) {
  button.addEventListener("click", () => selectAvatar(button.dataset.avatar));
}

function showCharacter() {
  showScene(character, avatarButtons.find(button => button.dataset.avatar === avatar));
}

enterButton.addEventListener("click", showCharacter);
backToCharacter.addEventListener("click", showCharacter);

function returnToMenu() {
  showScene(title, enterButton);
}

exitButton.addEventListener("click", () => showScene(exit, exitHeading));
restartButton.addEventListener("click", returnToMenu);

backButton.addEventListener("click", returnToMenu);
character.addEventListener("keydown", event => {
  if (event.key === "Escape") returnToMenu();
});

form.addEventListener("reset", () => selectAvatar("female"));

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (transitioning || currentScene !== character) return;
  const name = nameInput.value.trim();
  const home = residenceInput.value.trim();
  try {
    localStorage.setItem(storageKey, JSON.stringify({ name, home, avatar }));
  } catch {
    // The profile can still be used during the current visit.
  }
  await showScene(opening);
  try {
    await finishLoading(office, office, Promise.all([officeArt.decode(), officeReady]));
    await playOffice(name);
  } catch (error) {
    console.error("办公室图片加载失败。", error);
    showCharacter();
    return;
  }
  await showScene(opening);
  await finishLoading(dorm, dormHeading, dorm.querySelector("img").decode().catch(() => {}));
});

for (const button of overview.querySelectorAll("[data-region]")) {
  button.addEventListener("click", () => showScene(region, backToOverview, async () => {
    activeRegionButton = button;
    const name = button.getAttribute("aria-label");
    regionArt.alt = name + "地图";
    regionArt.src = "./assets/maps/" + button.dataset.region + ".png";
    region.setAttribute("aria-label", regionArt.alt);
    await regionArt.decode().catch(() => {});
  }));
}

function returnToOverview() {
  showScene(overview, activeRegionButton);
}

backToOverview.addEventListener("click", returnToOverview);
region.addEventListener("keydown", event => {
  if (event.key === "Escape") returnToOverview();
});
overview.addEventListener("keydown", event => {
  if (event.key === "Escape") showCharacter();
});

try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && typeof saved.name === "string" && typeof saved.home === "string") {
    nameInput.value = saved.name;
    residenceInput.value = saved.home;
    selectAvatar(saved.avatar === "male" ? "male" : "female");
  }
} catch {
  // A new draft is still usable when storage is unavailable.
}

const menuArt = title.querySelector("img");
finishLoading(title, undefined, menuArt.decode().catch(() => {}));

// ── 流程终点：选择宿舍页。点击屏幕即进入港硕回忆录的街道 ──
const introDoneKey = "hong-kong-diary:intro-done";
let introLeaving = false;

function finishIntro() {
  if (introLeaving || dorm.hidden) return;
  introLeaving = true;
  try { sessionStorage.setItem(introDoneKey, "1"); } catch {}
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({ type: "hk-intro-done" }, "*");
  } else {
    location.href = "../index.html";
  }
}

dorm.addEventListener("click", finishIntro);
dorm.addEventListener("keydown", event => {
  if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
    event.preventDefault();
    finishIntro();
  }
});

// 告诉外层（游戏的首页）开场脚本已就绪，避免兜底超时误触发
if (window.parent && window.parent !== window) {
  window.parent.postMessage({ type: "hk-intro-ready" }, "*");
}
})();
