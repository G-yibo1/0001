(() => {
  const hotbar = document.querySelector('#hotbar');
  const itemIcons = ['assets/微信图片_20261126093338_127_1244.webp','assets/微信图片_20261126093331_126_1244.jpg','assets/微信图片_20261126093338_128_1244.webp','assets/微信图片_20261126093338_130_1244.webp','assets/微信图片_20261126093338_129_1244.webp','assets/微信图片_20261126093323_117_1244.webp','assets/微信图片_20261126093323_114_1244.webp','assets/微信图片_20261126093323_109_1244.webp','assets/微信图片_20261126093323_115_1244.webp','assets/微信图片_20261126093323_110_1244.webp','assets/微信图片_20261126093338_131_1244.png',''];
  const itemNames = ['八达通','全港地图','入境手册','蛋挞券','星光纪念','相机胶卷','交通票','平安符','电车票','冰室单据','学生证','导师手杖'];
  let selectedSlot = 0;
  let lastScreen = 'journal';
  let sprinting = false;

  // 开场（唐倩茜首页与导图）播放期间，游戏本体不响应键盘
  function introActive() {
    return document.body.classList.contains('intro-active');
  }

  function toast(message) {
    const notice = document.querySelector('#toast');
    if (!notice) return;
    notice.textContent = message;
    notice.classList.add('show');
    clearTimeout(notice.timer);
    notice.timer = setTimeout(() => notice.classList.remove('show'), 1700);
  }

  const slots = itemNames.map((name, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `hotbar-slot${index === 0 ? ' active' : ''}`;
    button.dataset.slot = index;
    button.title = `${index < 9 ? index + 1 : index === 9 ? 0 : index === 10 ? '-' : '='} · ${name}`;
    button.setAttribute('aria-label', button.title);
    const icon = index === 11 ? '<i>杖</i>' : `<img src="${itemIcons[index]}" alt="">`;
    button.innerHTML = `<small>${index < 9 ? index + 1 : index === 9 ? 0 : index === 10 ? '-' : '='}</small>${icon}<span class="sr-only">${name}</span>`;
    button.addEventListener('click', () => selectSlot(index));
    hotbar.appendChild(button);
    return button;
  });

  function selectSlot(index) {
    selectedSlot = (index + slots.length) % slots.length;
    slots.forEach((slot, slotIndex) => slot.classList.toggle('active', slotIndex === selectedSlot));
    if (introActive()) return;
    toast(`快捷栏：${itemNames[selectedSlot]}`);
  }

  function activeScreen() {
    return document.querySelector('.screen.active')?.id || 'map';
  }

  function goToScreen(id) {
    const button = document.querySelector(`.navbtn[data-screen="${id}"]`);
    if (!button) return;
    if (id !== 'map') lastScreen = id;
    button.click();
  }

  document.querySelectorAll('.navbtn').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.screen !== 'map') lastScreen = button.dataset.screen;
  }));

  function interactAtPlayer() {
    const button = document.querySelector('#interactButton');
    if (button && !button.hidden) button.click();
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      const eventOverlay = document.querySelector('.event-overlay.open');
      if (eventOverlay) {
        document.querySelector('#eventClose').click();
        return;
      }
      if (introActive()) return;
      if (activeScreen() !== 'map') goToScreen('map');
      else if (document.querySelector('#atlasBack:not(:disabled)')) document.querySelector('#atlasBack').click();
      return;
    }
    if (introActive() || document.querySelector('.event-overlay.open')) return;
    const key = event.key.toLowerCase();
    if (key === 'e') { event.preventDefault(); goToScreen('bag'); return; }
    if (key === 'j') { event.preventDefault(); goToScreen('quests'); return; }
    if (key === 'l') { event.preventDefault(); goToScreen('journal'); return; }
    if (key === 'm') {
      event.preventDefault();
      if (activeScreen() === 'map') goToScreen(lastScreen);
      else goToScreen('map');
      return;
    }
    if (event.key === 'Shift') {
      sprinting = true;
      document.querySelector('#adventurePlayer')?.classList.add('sprinting');
      window.setWalkSprint?.(true);
      return;
    }
    const slotIndex = key === '0' ? 9 : Number(key) - 1;
    if (/^[0-9]$/.test(key) && Number.isInteger(slotIndex) && slotIndex >= 0 && slotIndex < 10) {
      selectSlot(slotIndex);
      return;
    }
    if (key === 'f' || key === 'enter') {
      event.preventDefault();
      interactAtPlayer();
      return;
    }
    if (key === 'c' && activeScreen() === 'map') {
      toast(`使用：${itemNames[selectedSlot]}`);
      return;
    }
    if ((key === '+' || key === '=') && activeScreen() === 'map') {
      document.querySelector('#streetZoomIn')?.click();
    }
    if (key === '-' && activeScreen() === 'map') {
      document.querySelector('#streetZoomOut')?.click();
    }
  });

  document.addEventListener('keyup', event => {
    if (event.key === 'Shift') {
      sprinting = false;
      document.querySelector('#adventurePlayer')?.classList.remove('sprinting');
      window.setWalkSprint?.(false);
    }
  });

  document.addEventListener('contextmenu', event => {
    if (!document.querySelector('#adventurePlayer') || activeScreen() !== 'map') return;
    const interact = document.querySelector('#interactButton');
    if (!interact || interact.hidden) return;
    event.preventDefault();
    interactAtPlayer();
  });

  const money = document.querySelector('#money');
  if (money) {
    const observer = new MutationObserver(() => {
      const value = money.textContent.replace('¥', 'HK$');
      const hudMoney = document.querySelector('#hudMoney');
      if (hudMoney) hudMoney.textContent = value;
    });
    observer.observe(money, {childList:true,subtree:true,characterData:true});
  }
})();
