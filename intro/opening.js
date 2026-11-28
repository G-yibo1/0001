(() => {
const opening = document.querySelector("#opening-scene");
const canvas = opening.querySelector("canvas");
const context = canvas.getContext("2d");
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");

const clouds = [
  [98, 102],
  [766, 146],
  [728, 285],
  [385, 63],
  [545, 157],
  [111, 327],
  [478, 354],
];

const frameWidth = 32;
const frameHeight = 40;
const frameDuration = 125;
const walkX = 247;
const walkY = 244;

async function loadImage(file) {
  const image = new Image();
  image.src = "./assets/" + file + ".png";
  await image.decode();
  return image;
}

async function startOpening() {
  const [background, ground, walker, street, vignette, ...cloudImages] = await Promise.all([
    loadImage("00-loading-background"),
    loadImage("01-ground-line"),
    loadImage("02-walk-sheet-32x40"),
    loadImage("07-hong-kong-street-strip"),
    loadImage("08-corner-vignette"),
    ...clouds.map((_, index) => loadImage("04-cloud-" + (index + 1))),
  ]);

  const backdrop = document.createElement("canvas");
  backdrop.width = canvas.width;
  backdrop.height = canvas.height;
  const layers = backdrop.getContext("2d");
  layers.drawImage(background, 0, 0);
  clouds.forEach(([x, y], index) => layers.drawImage(cloudImages[index], x, y));
  layers.drawImage(street, 0, 433);

  const exitBackdrop = document.querySelector("#exit-backdrop").getContext("2d");
  exitBackdrop?.drawImage(backdrop, 0, 0);
  exitBackdrop?.drawImage(vignette, 0, 0);
  layers.drawImage(ground, 0, 0);

  function draw(elapsed) {
    const frame = Math.floor(elapsed / frameDuration) % 4;
    context.drawImage(backdrop, 0, 0);
    context.drawImage(walker, frame * frameWidth, 0, frameWidth, frameHeight,
      walkX, walkY, frameWidth, frameHeight);
    context.drawImage(vignette, 0, 0);
  }

  let startTime;
  let animationFrame;
  function animate(now) {
    startTime ??= now;
    draw(now - startTime);
    animationFrame = requestAnimationFrame(animate);
  }

  function updatePlayback() {
    cancelAnimationFrame(animationFrame);
    if (opening.hidden) return;
    startTime = undefined;
    draw(0);
    if (!motionPreference.matches) {
      animationFrame = requestAnimationFrame(animate);
    }
  }

  opening.addEventListener("openingstart", updatePlayback);
  opening.addEventListener("openingcomplete", () => cancelAnimationFrame(animationFrame));
  motionPreference.addEventListener("change", updatePlayback);
  updatePlayback();
}

if (context) {
  startOpening().catch((error) => {
    console.error("开场动画素材加载失败，显示静态首帧。", error);
  });
}
})();
