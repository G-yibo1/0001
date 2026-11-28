(() => {
const cursor = document.querySelector("#game-cursor");
const page = document.documentElement;

let spritesReady = false;
let position;

function showCursor() {
  if (!spritesReady || !position) return;
  cursor.style.setProperty("--pointer-x", position.x + "px");
  cursor.style.setProperty("--pointer-y", position.y + "px");
  cursor.hidden = false;
  page.classList.add("game-cursor-visible");
}

function hideCursor() {
  position = undefined;
  cursor.hidden = true;
  page.classList.remove("game-cursor-visible");
}

function followPointer(event) {
  if (event.pointerType !== "mouse") {
    hideCursor();
    return;
  }
  position = { x: event.clientX, y: event.clientY };
  showCursor();
}

for (const type of ["pointerover", "pointermove", "pointerdown"]) {
  page.addEventListener(type, followPointer, { passive: true });
}
page.addEventListener("pointerleave", hideCursor);
page.addEventListener("pointerout", event => {
  if (!event.relatedTarget) hideCursor();
});
page.addEventListener("pointercancel", hideCursor);
window.addEventListener("blur", hideCursor);

Promise.all(Array.from(cursor.querySelectorAll("img"), image => image.decode())).then(() => {
  spritesReady = true;
  showCursor();
}).catch(() => {
  // Keep the native CSS cursor when a sprite can't be loaded.
});
})();
