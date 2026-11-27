(() => {
  'use strict';
  const configs = {
    tea: {
      title: 'L4 · 红茶冰室室内', background: 'assets/events/tea/interior-clean.webp',
      start: {x:.51,y:.62}, bounds: {left:.045,right:.955,top:.35,bottom:.64},
      obstacles: [
        {left:.03,right:.22,top:.40,bottom:.58},{left:.25,right:.47,top:.39,bottom:.58},
        {left:.26,right:.47,top:.68,bottom:.82},{left:.74,right:.97,top:.34,bottom:.52},
        {left:.72,right:.99,top:.62,bottom:.94},{left:.03,right:.22,top:.68,bottom:.90}
      ],
      actors: [
        ['waiter','点单服务员','waiter-front',.24,.63],['granny','拼桌婆婆','granny-front',.14,.63],
        ['cashier','柜台店员','cashier-front',.84,.60],['eater','吃饭的客人','eater',.79,.30],
        ['ordering','点餐的客人','ordering',.56,.47],['chef','后厨厨师','chef',.47,.17]
      ]
    },
    harbour: {
      title: 'L4 · 海港城 ZARA', background: 'assets/events/harbour/zara.webp',
      start: {x:.50,y:.62}, bounds: {left:.06,right:.94,top:.36,bottom:.64},
      obstacles: [{left:.34,right:.52,top:.44,bottom:.58},{left:.68,right:.92,top:.57,bottom:.78}],
      actors: [
        ['aming','阿明','npc-aming-sad',.43,.40],['guide','商场向导','npc-guide',.23,.52],
        ['witness','现场顾客','npc-witness',.68,.52]
      ],
      actorRoot: 'assets/events/harbour/'
    }
  };
  let room = null;
  let frame = 0;
  let lastTime = 0;
  const keys = {left:false,right:false,up:false,down:false};

  function sprite(gender, direction, step) {
    const view = direction === 'up' ? 'back' : direction === 'down' ? 'front' : 'side';
    return `assets/characters/daily-${gender === '男性' ? 'male' : 'female'}-${view}${step ? '-walk' : ''}.png`;
  }

  function blocked(x, y) {
    const b = room.config.bounds;
    if (x < b.left || x > b.right || y < b.top || y > b.bottom) return true;
    return room.config.obstacles.some(o => x > o.left && x < o.right && y > o.top && y < o.bottom);
  }

  function render() {
    if (!room) return;
    const player = document.querySelector('#roomPlayer');
    if (!player) return;
    player.style.left = `${room.x * 100}%`;
    player.style.bottom = `${(1 - room.y) * 100}%`;
    player.style.zIndex = String(100 + Math.round(room.y * 100));
    player.dataset.facing = room.direction;
    player.classList.toggle('is-walking', room.moving);
    const gender = (state.playerAppearance?.gender || creator.gender) === '男性' ? '男性' : '女性';
    const step = room.moving ? Math.floor(performance.now() / 145) % 2 : 0;
    const image = player.querySelector('img');
    const src = sprite(gender, room.direction, step);
    if (!image.src.endsWith(src)) image.src = src;
    player.querySelector('span').textContent = creator.name || '你';
    document.querySelectorAll('.room-actor').forEach(actor => {
      actor.style.zIndex = String(100 + Math.round(Number(actor.dataset.y) * 100));
    });
    const position = document.querySelector('#roomPosition');
    if (position) position.textContent = `${room.config.title} · WASD 移动 · 点击地面前往`;
  }

  function tick(now) {
    if (!room) return;
    const dt = Math.min(.04, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    room.moving = false;
    if (!document.hidden && document.querySelector('#map').classList.contains('active')) {
      let dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      let dy = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      if (dx || dy) room.target = null;
      else if (room.target) {
        dx = room.target.x - room.x;
        dy = room.target.y - room.y;
        if (Math.hypot(dx * room.width, dy * room.height) < 5) {
          room.target = null;
          dx = 0;
          dy = 0;
        }
      }
      if (dx || dy) {
        const length = Math.hypot(dx * room.width, dy * room.height) || 1;
        const ux = dx * room.width / length;
        const uy = dy * room.height / length;
        if (Math.abs(dx * room.width) > Math.abs(dy * room.height)) room.direction = dx < 0 ? 'left' : 'right';
        else room.direction = dy < 0 ? 'up' : 'down';
        const speed = room.sprint ? 230 : 140;
        const nextX = room.x + ux * speed * dt / room.width;
        const nextY = room.y + uy * speed * dt / room.height;
        if (!blocked(nextX, room.y)) room.x = nextX;
        if (!blocked(room.x, nextY)) room.y = nextY;
        room.moving = true;
      }
    }
    render();
    frame = requestAnimationFrame(tick);
  }

  function enter(id) {
    exit();
    const config = configs[id];
    if (!config) return;
    const viewport = document.querySelector('#adventureViewport');
    room = {id,config,x:config.start.x,y:config.start.y,direction:'up',moving:false,sprint:false,target:null,width:1,height:1};
    const actorRoot = config.actorRoot || 'assets/characters/npcs/';
    viewport.innerHTML = `<div class="room-stage" id="roomStage"><img class="room-background" src="${config.background}" alt="${config.title}全屏室内场景"><div class="room-lighting"></div>
      ${config.actors.map(([key,name,asset,x,y]) => `<div class="room-actor" data-actor="${key}" data-y="${y}" style="left:${x*100}%;bottom:${(1-y)*100}%"><img src="${actorRoot}${asset}.png" alt="${name}"><span>${name}</span></div>`).join('')}
      <div class="room-player" id="roomPlayer" data-facing="up"><img src="${sprite(creator.gender,'up',0)}" alt="玩家角色"><span>${creator.name || '你'}</span></div></div>
      <div class="room-scene-label"><b>${config.title}</b><span id="roomPosition">WASD 移动 · 点击地面前往</span></div><button type="button" class="room-exit" id="roomExit">← 离开室内</button>`;
    document.querySelector('#atlasCrumb').textContent = config.title;
    document.querySelector('#atlasHint').textContent = '全屏室内 · 家具碰撞 · WASD 四向行走';
    document.querySelector('#eventOverlay').classList.add('room-mode');
    const stage = document.querySelector('#roomStage');
    room.width = stage.clientWidth;
    room.height = stage.clientHeight;
    stage.addEventListener('pointerdown', event => {
      if (event.target.closest('button')) return;
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      if (!blocked(x,y)) room.target = {x,y};
    });
    document.querySelector('#roomExit').onclick = () => document.querySelector('#eventClose').click();
    Object.keys(keys).forEach(key => { keys[key] = false; });
    lastTime = performance.now();
    render();
    frame = requestAnimationFrame(tick);
  }

  function exit() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    room = null;
    Object.keys(keys).forEach(key => { keys[key] = false; });
    document.querySelector('#eventOverlay')?.classList.remove('room-mode');
  }

  document.addEventListener('keydown', event => {
    if (!room || !document.querySelector('#map').classList.contains('active')) return;
    const key = event.key.toLowerCase();
    if (['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'].includes(key)) event.preventDefault();
    if (key === 'arrowleft' || key === 'a') keys.left = true;
    if (key === 'arrowright' || key === 'd') keys.right = true;
    if (key === 'arrowup' || key === 'w') keys.up = true;
    if (key === 'arrowdown' || key === 's') keys.down = true;
    if (event.key === 'Shift') room.sprint = true;
  });
  document.addEventListener('keyup', event => {
    if (!room) return;
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') keys.left = false;
    if (key === 'arrowright' || key === 'd') keys.right = false;
    if (key === 'arrowup' || key === 'w') keys.up = false;
    if (key === 'arrowdown' || key === 's') keys.down = false;
    if (event.key === 'Shift') room.sprint = false;
  });
  window.addEventListener('resize', () => {
    const stage = document.querySelector('#roomStage');
    if (room && stage) { room.width = stage.clientWidth; room.height = stage.clientHeight; }
  });
  window.addEventListener('blur', () => Object.keys(keys).forEach(key => { keys[key] = false; }));
  window.RoomEngine = {enter,exit,get active() { return Boolean(room); },getSnapshot: () => room ? {id:room.id,x:room.x,y:room.y,direction:room.direction,moving:room.moving} : null};
})();
