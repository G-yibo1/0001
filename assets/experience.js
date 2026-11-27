(() => {
  const welcome = document.querySelector('#welcomeScreen');
  const onboarding = document.querySelector('#onboarding');
  const welcomeImage = document.querySelector('#welcomeScene');
  const avatar = document.querySelector('#previewAvatar');
  const avatarSheet = document.querySelector('#avatarSheet');
  const outfits = document.querySelector('#outfitOptions');
  const hotbar = document.querySelector('#hotbar');
  const itemIcons = ['assets/微信图片_20261126093338_127_1244.webp','assets/微信图片_20261126093331_126_1244.jpg','assets/微信图片_20261126093338_128_1244.webp','assets/微信图片_20261126093338_130_1244.webp','assets/微信图片_20261126093338_129_1244.webp','assets/微信图片_20261126093323_117_1244.webp','assets/微信图片_20261126093323_114_1244.webp','assets/微信图片_20261126093323_109_1244.webp','assets/微信图片_20261126093323_115_1244.webp','assets/微信图片_20261126093323_110_1244.webp','assets/微信图片_20261126093338_131_1244.png',''];
  const itemNames = ['八达通','全港地图','入境手册','蛋挞券','星光纪念','相机胶卷','交通票','平安符','电车票','冰室单据','学生证','导师手杖'];
  const slides = [
    {src:'assets/video_cover.jpg',caption:'中环摩天轮'},
    {src:'assets/thumbs/110.jpg',caption:'港式冰室 · 热茶刚好'},
    {src:'assets/thumbs/116.jpg',caption:'九龙 · 街巷之间'}
  ];
  let slideIndex = 0;
  let selectedSlot = 0;
  let lastScreen = 'journal';
  let avatarTone = 'normal';
  let avatarOutfit = 'daily';
  let avatarAccessory = 'none';
  let sprinting = false;

  function toast(message) {
    const notice = document.querySelector('#toast');
    if (!notice) return;
    notice.textContent = message;
    notice.classList.add('show');
    clearTimeout(notice.timer);
    notice.timer = setTimeout(() => notice.classList.remove('show'), 1700);
  }

  function setSlide(index) {
    slideIndex = (index + slides.length) % slides.length;
    const slide = slides[slideIndex];
    welcomeImage.classList.add('slide-in');
    welcomeImage.src = slide.src;
    welcomeImage.alt = slide.caption + '像素街景';
    document.querySelector('#sceneCaption').textContent = slide.caption;
    const count = String(slideIndex + 1).padStart(2, '0');
    document.querySelector('#sceneNumber').textContent = count;
    document.querySelector('#welcomeSlideCurrent').textContent = count;
    welcomeImage.onload = () => welcomeImage.classList.remove('slide-in');
  }

  function enterCharacterCreation() {
    welcome.hidden = true;
    onboarding.classList.remove('hidden');
    document.querySelector('#playerName').focus({preventScroll:true});
  }

  document.querySelector('#beginJourney').addEventListener('click', enterCharacterCreation);
  document.querySelector('#navBeginJourney').addEventListener('click', enterCharacterCreation);
  document.querySelector('#resumeJourney').addEventListener('click', () => setSlide(slideIndex + 1));
  document.querySelector('#welcomePrev').addEventListener('click', () => setSlide(slideIndex - 1));
  document.querySelector('#welcomeNext').addEventListener('click', () => setSlide(slideIndex + 1));
  document.querySelector('#backToWelcome').addEventListener('click', () => {
    onboarding.classList.add('hidden');
    welcome.hidden = false;
  });
  document.querySelectorAll('[data-home-tab]').forEach((button, index) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-home-tab]').forEach(tab => tab.classList.toggle('current', tab === button));
      setSlide(index);
    });
  });
  setSlide(0);
  setInterval(() => {
    if (!welcome.hidden && !document.hidden) setSlide(slideIndex + 1);
  }, 7200);

  function updateAvatar() {
    const selectedGender = document.querySelector('#genderOptions .selected')?.dataset.gender || '女性';
    const selectedOutfit = outfits.querySelector('.selected');
    const characterName = document.querySelector('#playerName').value.trim() || '林同学';
    avatarOutfit = selectedOutfit?.dataset.outfit || 'daily';
    avatar.dataset.outfit = avatarOutfit;
    avatar.dataset.accessory = avatarAccessory;
    avatarSheet.dataset.gender = selectedGender === '男性' ? '男性' : '女性';
    avatar.dataset.gender = selectedGender;
    const spriteGender = selectedGender === '男性' ? 'male' : 'female';
    const dailyThumbnail = document.querySelector('.daily-art img');
    if (dailyThumbnail) dailyThumbnail.src = `assets/characters/daily-${spriteGender}-front.png`;
    document.querySelectorAll('#characterTurnaround img').forEach(image => {
      image.src = `assets/characters/daily-${spriteGender}-${image.dataset.view}.png`;
    });
    document.querySelector('#characterTurnaround').hidden = !['daily', 'street'].includes(avatarOutfit);
    const compareGender = selectedGender === '男性' ? '男性' : '女性';
    document.querySelector('#compareBeforePerson').dataset.gender = compareGender;
    document.querySelector('#compareAfterPerson').dataset.gender = compareGender;
    const accessoryFiles = {bow:'accessory-bow.png',hairpin:'accessory-hairpin.png',scarf:'accessory-scarf.png',bat:'accessory-bat.png'};
    const compareAccessory = document.querySelector('#compareAccessory');
    const accessoryFile = accessoryFiles[avatarAccessory];
    compareAccessory.hidden = !accessoryFile;
    if (accessoryFile) compareAccessory.src = `assets/characters/${accessoryFile}`;
    document.querySelector('#compareAccessoryName').textContent = avatarAccessory === 'none' ? '当前：无配饰' : `当前：${document.querySelector('#accessoryOptions .selected')?.title || '已装饰'}`;
    avatar.style.setProperty('--avatar-scale', Number(document.querySelector('#avatarScale').value) / 100);
    document.querySelector('#avatarScaleValue').textContent = document.querySelector('#avatarScale').value + '%';
    document.querySelector('#avatarZoomNote').textContent = document.querySelector('#avatarScale').value + '%';
    document.querySelector('#avatarPreviewName').textContent = `${characterName} · ${selectedOutfit?.dataset.clothes || '日常校园'}`;
    avatarTone = document.querySelector('#avatarTone').value;
    const filters = {normal:'none',warm:'sepia(.14) saturate(1.12)',cool:'saturate(.88) hue-rotate(10deg)',soft:'brightness(1.04) saturate(.83)'};
    avatar.style.setProperty('--avatar-filter', filters[avatarTone]);
    const fullArt = document.querySelector('#avatarFull');
    if (avatarOutfit === 'holiday') fullArt.src = 'assets/characters/holiday-character.png';
    else if (avatarOutfit === 'alternative') fullArt.src = 'assets/characters/alternative-character.png';
    else fullArt.removeAttribute('src');
    const appearance = {gender:selectedGender,outfit:avatarOutfit,accessory:avatarAccessory,tone:avatarTone,scale:Number(document.querySelector('#avatarScale').value)};
    try { state.playerAppearance = appearance; } catch {}
  }

  document.querySelector('#playerName').addEventListener('input', updateAvatar);
  document.querySelectorAll('#genderOptions button').forEach(button => button.addEventListener('click', updateAvatar));
  outfits.querySelectorAll('.outfit-option').forEach(button => button.addEventListener('click', () => {
    outfits.querySelectorAll('.outfit-option').forEach(option => option.classList.toggle('selected', option === button));
    if (typeof creator !== 'undefined') creator.clothes = button.dataset.clothes;
    updateAvatar();
    if (typeof recalcStats === 'function') recalcStats();
  }));
  document.querySelectorAll('#accessoryOptions .accessory-option').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('#accessoryOptions .accessory-option').forEach(option => option.classList.toggle('selected', option === button));
    avatarAccessory = button.dataset.accessory;
    updateAvatar();
  }));
  document.querySelector('#avatarScale').addEventListener('input', updateAvatar);
  document.querySelector('#avatarTone').addEventListener('change', updateAvatar);
  document.querySelector('#startCreation').addEventListener('click', updateAvatar);
  updateAvatar();

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
    if (!welcome.hidden) return;
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
      if (!welcome.hidden) return;
      if (!onboarding.classList.contains('hidden')) {
        document.querySelector('#backToWelcome').click();
        return;
      }
      if (document.querySelector('#guideOverlay.active')) {
        document.querySelector('#guideNext').click();
        return;
      }
      if (document.querySelector('#dormOverlay.active')) {
        document.querySelector('#confirmDorm').click();
        return;
      }
      if (activeScreen() !== 'map') goToScreen('map');
      else if (document.querySelector('#atlasBack:not(:disabled)')) document.querySelector('#atlasBack').click();
      return;
    }
    if (!welcome.hidden || !onboarding.classList.contains('hidden') || document.querySelector('.event-overlay.open')) return;
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

  document.addEventListener('click', event => {
    if (event.button !== 0 || !event.target.closest('#adventureViewport')) return;
  });

  const money = document.querySelector('#money');
  if (money) {
    const observer = new MutationObserver(() => {
      const value = money.textContent.replace('¥', 'HK$');
      document.querySelector('#hudMoney').textContent = value;
    });
    observer.observe(money, {childList:true,subtree:true,characterData:true});
  }
})();
