(() => {
const portraitsReady = window.portraitsReady;
const office = document.querySelector("#office-scene");
const player = office.querySelector(".office-player");
const sprite = player.querySelector("canvas");
const context = sprite.getContext("2d");
const dialogue = office.querySelector(".office-dialogue");
const advanceButton = dialogue.querySelector("button");
const dialogueArt = dialogue.querySelector(".office-dialogue-art");
const line = dialogue.querySelector(".office-line");
const nameplate = dialogue.querySelector(".office-speaker");
const portrait = dialogue.querySelector(".office-portrait");
const reactionBubbles = {
  player: player.querySelector(".player-reaction"),
  teacher: office.querySelector(".teacher-reaction"),
};
const reactionLabels = {
  smile: "笑脸",
  sweat: "汗滴",
  sleep: "睡觉",
  heart: "爱心",
  question: "问号",
  ellipsis: "省略号",
  exclamation: "感叹号",
};
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");

const script = [
  { speaker: "teacher", line: "....来报道的吧" },
  { speaker: "teacher", line: "嗯...叫我Mr. 马就好..." },
  { speaker: "player", line: "好的，Mr.马，我需要准备什么材料..." },
  { speaker: "teacher", line: "……" },
  { speaker: "teacher", line: "你拿着你的offer去选宿舍就好..." },
  { speaker: "player", line: "offer…" },
  { speaker: "player", line: "谢谢你，Mr.马..." },
  { speaker: "player", line: "我今天刚来，有点紧张..." },
  { speaker: "player", reaction: "sweat" },
  { speaker: "teacher", line: "第一天都这样..." },
  { speaker: "teacher", line: "选好宿舍多出去走走..." },
  { speaker: "teacher", line: "......" },
  { speaker: "teacher", line: "多读书，多看报..." },
  { speaker: "teacher", line: "......少吃零食...多睡觉" },
  { speaker: "teacher", reaction: "sleep" },
  { speaker: "teacher", line: "有助于心里健康..." },
  { speaker: "player", line: "...好的，Mr.马" },
  { speaker: "player", reaction: "sweat" },
  { speaker: "teacher", line: "噢对了..." },
  { speaker: "teacher", line: "（差点忘了）这个给你..." },
  { speaker: "teacher", line: "这个是新生手帐本...每个人都有" },
  { speaker: "player", reaction: "sweat" },
  { speaker: "teacher", line: "你可以在上面记录课表和行程..." },
  { speaker: "teacher", line: "记得放到背包里..." },
  { speaker: "teacher", line: "手帐本可以帮助你更快到达目的地..." },
  { speaker: "teacher", reaction: "heart" },
  { speaker: "teacher", line: "你自己探索吧..." },
  { speaker: "teacher", line: "很有趣的..." },
  { speaker: "teacher", reaction: "smile" },
  { speaker: "player", reaction: "question" },
  { speaker: "player", line: "..." },
  { speaker: "player", line: "好的，谢谢Mr.马" },
  { speaker: "teacher", reaction: "ellipsis" },
  { speaker: "player", reaction: "question" },
  { speaker: "teacher", line: "......哦，对了" },
  { speaker: "teacher", reaction: "exclamation" },
  { speaker: "teacher", line: "......" },
  { speaker: "player", reaction: "question" },
  { speaker: "teacher", line: "手帐收到背包里之后，会一直在第一格。" },
  { speaker: "teacher", line: "……" },
  { speaker: "teacher", line: "这样...不用担心找不到手帐" },
  { speaker: "teacher", reaction: "smile" },
  { speaker: "player", reaction: "smile" },
  { speaker: "teacher", line: "你也可以在界面右边找到手帐呢..." },
  { speaker: "teacher", line: "很好找的..." },
  { speaker: "player", line: "谢谢你，Mr.马..." },
  { speaker: "player", reaction: "smile" },
  { speaker: "player", line: "（Mr.马好贴心...）" },
  { speaker: "player", reaction: "heart" },
  { speaker: "teacher", line: "手帐里面还有HK地图。" },
  { speaker: "teacher", line: "......很贴心的设计..." },
  { speaker: "teacher", line: "（嘿嘿）这可是我设计的..." },
  { speaker: "teacher", reaction: "smile" },
  { speaker: "player", line: "......" },
  { speaker: "player", reaction: "sweat" },
  { speaker: "teacher", line: "要找路就打开地图......" },
  { speaker: "teacher", line: "......这样就不会迷路" },
  { speaker: "teacher", reaction: "smile" },
  { speaker: "teacher", line: "出门记得留意时间......" },
  { speaker: "teacher", line: "......" },
  { speaker: "teacher", line: "出门参加活动，会减少时间呢......" },
  { speaker: "teacher", line: "记得多看时间......" },
  { speaker: "teacher", line: "十点之后就要回宿舍哦......" },
  { speaker: "teacher", line: "不然会有意想不到的事情发生..." },
  { speaker: "player", reaction: "question" },
  { speaker: "teacher", line: "别害怕" },
  { speaker: "teacher", line: "有空就随便逛逛吧..." },
  { speaker: "teacher", line: "可以和路人打招呼哦..." },
  { speaker: "teacher", line: "......可以获取意想不到的消息呢。" },
  { speaker: "teacher", reaction: "heart" },
  { speaker: "teacher", line: "有特殊活动，手帐会提醒你的..." },
  { speaker: "teacher", line: "总之你会知道的..." },
  { speaker: "teacher", reaction: "smile" },
  { speaker: "teacher", line: "很快就会适应的..." },
  { speaker: "teacher", line: "你自己探索吧..." },
  { speaker: "teacher", line: "很有趣的..." },
  { speaker: "teacher", reaction: "smile" },
  { speaker: "player", reaction: "question" },
];

function loadImage(file) {
  const image = new Image();
  image.src = "./assets/" + file;
  return image;
}

const gait = loadImage("office-player-gait.png");
const portraits = {
  player: loadImage("office-player-portrait.png"),
  teacher: loadImage("office-teacher-portrait.png"),
};
const icons = Object.fromEntries(Object.keys(reactionLabels).map(icon => [
  icon, loadImage("office-reaction-" + icon + ".png"),
]));
const officeReady = Promise.all([
  portraitsReady,
  ...[gait, dialogueArt, ...Object.values(portraits), ...Object.values(icons)].map(image => image.decode()),
]);
// The character flow awaits this promise before showing the office.
officeReady.catch(() => {});

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const doorway = 96;
const counter = 55.5;
const doorwayHeight = 11;
const counterHeight = 19.5;
const reactionDuration = 1450;
const framesPerCycle = 16;
const passingFrame = 4;
let nextBeat = 0;
let playerName;
let finishDialogue;

async function showReaction(speaker, icon) {
  const bubble = reactionBubbles[speaker];
  bubble.src = icons[icon].src;
  bubble.alt = reactionLabels[icon];
  bubble.hidden = false;
  await wait(reactionDuration);
  bubble.hidden = true;
}

function placePlayer(feet, height) {
  player.style.setProperty("--player-feet", feet + "%");
  player.style.setProperty("--player-height", height + "%");
}

function drawWalkFrame(row, frame) {
  const { width, height } = sprite;
  context.clearRect(0, 0, width, height);
  context.drawImage(gait, frame * width, row * height, width, height, 0, 0, width, height);
}

function walkPath(start, end, duration, steps, row) {
  if (motionPreference.matches) {
    placePlayer(end.feet, end.height);
    return Promise.resolve();
  }
  const scaleRange = Math.log(end.height / start.height);
  let startTime;
  let lastFrame = -1;
  return new Promise(resolve => {
    function tick(now) {
      startTime ??= now;
      const time = Math.min((now - startTime) / duration, 1);
      const distance = time - 0.08 * Math.sin(2 * Math.PI * time);
      const height = start.height + (end.height - start.height) * distance;
      placePlayer(start.feet + (end.feet - start.feet) * distance, height);
      if (time === 1) {
        resolve();
        return;
      }

      // Use distance in sprite-sized units, so a larger character covers more floor per step.
      const strides = Math.log(height / start.height) / scaleRange * steps / 2;
      const frame = (passingFrame + Math.floor(strides * framesPerCycle)) % framesPerCycle;
      if (frame !== lastFrame) {
        drawWalkFrame(row, frame);
        lastFrame = frame;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

const doorwayPosition = { feet: doorway, height: doorwayHeight };
const counterPosition = { feet: counter, height: counterHeight };
const outsidePosition = { feet: 112, height: 9 };

async function walkToCounter() {
  const idle = context.getImageData(0, 0, sprite.width, sprite.height);
  await walkPath(doorwayPosition, counterPosition, 2950, 11, 0);
  context.putImageData(idle, 0, 0);
}

async function leaveOffice() {
  sprite.setAttribute("aria-label", "转身走向门口的女孩");
  if (!motionPreference.matches) {
    drawWalkFrame(2, 0);
    await wait(140);
    drawWalkFrame(2, 1);
    await wait(110);
  }
  await walkPath(counterPosition, outsidePosition, 3900, 15, 1);
}

async function advanceDialogue() {
  let beat = script[nextBeat++];
  const restoreFocus = document.activeElement === advanceButton;
  if (!beat || !beat.line) dialogue.hidden = true;

  while (beat && !beat.line) {
    await showReaction(beat.speaker, beat.reaction);
    beat = script[nextBeat++];
  }

  if (!beat) {
    office.focus({ preventScroll: true });
    finishDialogue();
    return;
  }

  const speakerName = beat.speaker === "teacher" ? "Mr. 马" : playerName;
  nameplate.textContent = speakerName;
  nameplate.style.setProperty("--speaker-fit", 20 / Array.from(speakerName).length + "cqw");
  portrait.src = portraits[beat.speaker].src;
  portrait.alt = speakerName + "的半身像";
  line.textContent = beat.line;
  if (dialogue.hidden) {
    // Reveal the artwork, caption and speaker as a single unit.
    await Promise.all([portrait.decode().catch(() => {}), document.fonts.ready]);
  }
  dialogue.hidden = false;
  if (restoreFocus || document.activeElement === office) {
    advanceButton.focus({ preventScroll: true });
  }
}

advanceButton.addEventListener("click", () => {
  if (!dialogue.hidden) advanceDialogue();
});

async function playOffice(name) {
  playerName = name || "小黛";
  nextBeat = 0;
  dialogue.hidden = true;
  placePlayer(doorway, doorwayHeight);
  await showReaction("player", "smile");
  await walkToCounter();
  const complete = new Promise(resolve => { finishDialogue = resolve; });
  await advanceDialogue();
  await complete;
  await leaveOffice();
}

window.officeReady = officeReady;
window.playOffice = playOffice;
})();
