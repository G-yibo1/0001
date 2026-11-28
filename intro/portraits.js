(() => {
  async function drawPose(selector, file) {
    const sprite = document.querySelector(selector);
    const context = sprite.getContext("2d");
    if (!context) return;
    const portrait = new Image();
    portrait.src = "./assets/" + file;
    await portrait.decode();
    context.drawImage(portrait, 0, 0);
  }

  window.portraitsReady = Promise.all([
    drawPose(".female-front", "character-female-front.png"),
    drawPose(".office-player-sprite", "office-player-back.png"),
  ]).catch(error => console.error("女生形象加载失败。", error));
})();
