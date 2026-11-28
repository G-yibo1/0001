(() => {
  const canvas = document.querySelector('.mapcanvas');
  if (!canvas) return;

  canvas.classList.add('adventure-canvas');
  canvas.innerHTML = `
    <div class="adventure-toolbar">
      <button type="button" id="atlasBack">← 返回上层</button>
      <span class="map-crumb" id="atlasCrumb">M · 香港总览</span>
      <span class="map-hint" id="atlasHint">选择地图上的区域进入下一层</span>
    </div>
    <div class="adventure-viewport" id="adventureViewport"></div>`;

  const viewport = document.querySelector('#adventureViewport');
  // 所有人物统一向上平移半个身高（主角 15vh 半身高 7.5%，NPC 为主角 95%≈14.25vh 半身高 7%）
  const PLAYER_LIFT = 7.5;
  const NPC_LIFT = 7;
  const backButton = document.querySelector('#atlasBack');
  const crumb = document.querySelector('#atlasCrumb');
  const hint = document.querySelector('#atlasHint');
  const eventOverlay = document.createElement('div');
  eventOverlay.id = 'eventOverlay';
  eventOverlay.className = 'event-overlay';
  eventOverlay.innerHTML = `<section class="event-dialog" role="dialog" aria-modal="true" aria-labelledby="eventTitle">
    <header class="event-top"><span id="eventTitle">特别事件</span><div class="event-top-actions"><button type="button" id="eventReferenceToggle">NPC人物原稿</button><button type="button" id="eventClose" aria-label="关闭对话">×</button></div></header>
    <div class="event-body"><div class="event-avatars"><div class="dialog-avatar" id="dialogHeroAvatar" aria-label="主人公立绘"></div><img class="event-npc-avatar" id="eventNpcAvatar" alt="当前事件 NPC"></div><div class="event-copy"><p class="event-speaker" id="eventSpeaker"></p><p class="event-line" id="eventLine"></p></div><div class="event-scene-wrap" id="eventSceneWrap"><img class="event-scene-art" id="eventSceneArt" alt="事件场景插画"></div></div>
    <div class="event-options" id="eventOptions"></div><footer class="event-foot" id="eventFoot">探索暂停中 · 对话结束后返回原位置</footer>
  </section><aside class="event-reference-drawer" id="eventReferenceDrawer" hidden><header><span id="eventReferenceTitle">NPC人物原稿</span><button type="button" id="eventReferenceClose" aria-label="关闭人物原稿">×</button></header><iframe id="eventReferenceFrame" title="事件流程中的NPC人物原稿"></iframe></aside>`;
  document.body.appendChild(eventOverlay);
  const referenceToggle = document.querySelector('#eventReferenceToggle');
  const referenceDrawer = document.querySelector('#eventReferenceDrawer');
  const referenceFrame = document.querySelector('#eventReferenceFrame');

  const maps = {
    l1: {
      title: 'M · 香港总览',
      image: 'assets/maps/l1-l2/01.webp',
      points: [
        ['新界西', 36.5, 26, 'nt-west'], ['新界东', 75.5, 24, 'nt-east'],
        ['九龙区', 62, 44.5, 'kowloon'], ['港岛区', 65, 75, 'hong-kong-island'],
        ['大屿山及离岛', 21.5, 72, 'lantau']
      ]
    },
    'nt-west': {
      title: 'L2 · 新界西', image: 'assets/maps/l1-l2/05.webp',
      points: [['流浮山',20,21],['米埔湿地',44,16],['后海湾',9,32],['天水围',35,33],['元朗',65,31],['大榄涌水塘',81,16],['青山',63,44],['屯门',45,52],['荃湾',88,49],['葵涌',82,65],['香港迪士尼乐园',27,53],['香港国际机场',31,72],['赤鱲角',13,82]]
    },
    'nt-east': {
      title: 'L2 · 新界东', image: 'assets/maps/l1-l2/06.webp',
      points: [['八仙岭',45,13],['船湾淡水湖',66,17],['大埔',15,27],['大窝山',45,31],['太和',27,40],['马鞍山',62,38],['沙田',40,56],['火炭',15,49],['大围',24,60],['石门',63,54],['乌溪沙',76,49],['西贡',87,38],['清水湾',83,64],['将军澳',63,69],['钻石山',31,76],['牛头角',42,85]]
    },
    kowloon: {
      title: 'L2 · 九龙区', image: 'assets/maps/l1-l2/02.webp',
      points: [['深水埗',20,28],['九龙塘',47,17],['黄大仙',77,19],['油麻地',28,50],['旺角',44,41],['九龙城',66,47],['观塘',89,55],['佐敦',20,65],['尖沙咀',43,73]]
    },
    'hong-kong-island': {
      title: 'L2 · 港岛区', image: 'assets/maps/l1-l2/03.webp',
      points: [['西环',13,29],['上环',31,28],['中环',46,23],['湾仔',68,29],['铜锣湾',88,29],['金钟',56,39],['跑马地',76,43],['太平山',42,47],['薄扶林',19,67],['香港公园',62,53],['海洋公园',43,76],['浅水湾',81,59],['赤柱',76,82]]
    },
    lantau: {
      title: 'L2 · 大屿山及离岛', image: 'assets/maps/l1-l2/04.webp',
      points: [['香港国际机场',29,20],['东涌',15,43],['昂坪缆车',45,31],['天坛大佛',43,49],['宝莲禅寺',41,59],['大澳',12,60],['大屿山',52,62],['香港迪士尼乐园',67,38],['愉景湾',82,17],['坪洲',94,31],['长洲',91,57],['南丫岛',83,75],['蒲台岛',64,84],['索罟群岛',85,89]]
    }
  };

  const sceneImages = [1, 2, 3, 4, 5].map(index => `assets/maps/l3-tsim-sha-tsui/${String(index).padStart(2, '0')}.webp`);
  // 街景背景图原始尺寸（5 段统一为 1268×714，object-fit:cover 显示）
  const SCENE_IMAGE_W = 1268;
  const SCENE_IMAGE_H = 714;
  // sign：招牌在【对应街景图片里的像素矩形】，渲染时按 cover 换算到舞台坐标，保证高亮框与招牌像素级重合
  const eventLocations = [
    { id: 'tea', title: '红茶冰室 · 买单小突发事件', icon: '🍵', x: 0.28, y: 0.88, scene: 1,
      sign: { panel: 1, px: 392, py: 360, pw: 188, ph: 53, label: '紅茶餐廳' } },
    { id: 'scam', title: '陌生来电 · 反诈骗情景模拟', icon: '☎', x: 0.12, y: 0.87, scene: 0 },
    { id: 'harbour', title: '海港城 · 消失的现金', icon: '？', x: 0.72, y: 0.88, scene: 3,
      sign: { panel: 3, px: 526, py: 317, pw: 264, ph: 54, label: '海港城' } }
  ];
  // 由像素矩形反推归一化世界坐标（仅用于触发距离判断）
  eventLocations.forEach(item => {
    if (!item.sign) return;
    item.sign.x = (item.sign.panel + (item.sign.px + item.sign.pw / 2) / SCENE_IMAGE_W) / 5;
    item.sign.w = (item.sign.pw / SCENE_IMAGE_W) / 5;
  });
  // 街道只允许在底部人行道窄带内移动（参考街道示意视频：脚底约在画面高度 84%–92%）
  const STREET_Y_MIN = 0.84;
  const STREET_Y_MAX = 0.92;
  const clampStreetY = value => Math.min(STREET_Y_MAX, Math.max(STREET_Y_MIN, value));
  const walk = {
    x: 0.07, y: 0.82, target: null, direction: 'down', near: null,
    active: false, moving: false, shift: false, zoom: 1, cameraX: 0,
    keys: {left:false,right:false,up:false,down:false}, lastFrame: performance.now()
  };
  const streetNpcs = [
    {id:'student',name:'赶路的学生',gender:'女性',x:.17,y:.88,speed:38,route:[{x:.17,y:.88,wait:1.4},{x:.22,y:.90,wait:.6},{x:.15,y:.86,wait:2.1}]},
    {id:'resident',name:'附近居民',gender:'男性',x:.055,y:.90,speed:30,route:[{x:.055,y:.90,wait:2.4},{x:.10,y:.87,wait:1.2},{x:.08,y:.89,wait:1.8}]},
    {id:'granny',name:'散步的婆婆',sprite:'granny',x:.32,y:.87,speed:20,route:[{x:.32,y:.87,wait:2.8},{x:.36,y:.89,wait:2.2},{x:.29,y:.85,wait:1.5}]},
    {id:'photographer',name:'拍照的游客',gender:'女性',x:.51,y:.86,speed:34,route:[{x:.51,y:.86,wait:2.5},{x:.57,y:.89,wait:1.8},{x:.48,y:.88,wait:1.2}]},
    {id:'commuter',name:'下班的行人',gender:'男性',x:.67,y:.89,speed:43,route:[{x:.67,y:.89,wait:.8},{x:.75,y:.86,wait:1.1},{x:.71,y:.90,wait:1.6}]},
    {id:'wanderer',name:'海滨游客',gender:'女性',x:.88,y:.87,speed:32,route:[{x:.88,y:.87,wait:1.7},{x:.93,y:.90,wait:2.4},{x:.84,y:.88,wait:1.3}]},
    {id:'waiter',name:'冰室服务员',sprite:'waiter',x:.25,y:.86,speed:31,route:[{x:.25,y:.86,wait:1.3},{x:.28,y:.90,wait:1.6},{x:.22,y:.88,wait:.9}]},
    {id:'cashier',name:'外出采购的店员',sprite:'cashier',x:.40,y:.90,speed:27,route:[{x:.40,y:.90,wait:2.1},{x:.45,y:.87,wait:1.2},{x:.38,y:.89,wait:1.4}]},
    {id:'classmate',name:'同行的同学',gender:'男性',x:.59,y:.88,speed:39,route:[{x:.59,y:.88,wait:.7},{x:.64,y:.86,wait:1.1},{x:.55,y:.90,wait:1.5}]},
    {id:'tourist',name:'看地图的游客',gender:'女性',x:.77,y:.87,speed:29,route:[{x:.77,y:.87,wait:2.3},{x:.81,y:.89,wait:1.4},{x:.74,y:.86,wait:.8}]},
    {id:'neighbour',name:'街坊邻居',sprite:'cashier',x:.91,y:.88,speed:25,route:[{x:.91,y:.88,wait:1.9},{x:.96,y:.90,wait:1.1},{x:.89,y:.86,wait:1.7}]},
    {id:'server-break',name:'休息中的服务员',sprite:'waiter',x:.10,y:.86,speed:28,route:[{x:.10,y:.86,wait:2.2},{x:.13,y:.89,wait:1.3},{x:.06,y:.87,wait:1.2}]}
  ].map((npc,index) => ({...npc,direction:'down',moving:false,routeIndex:1,wait:index*.32}));
  const phoneStoryboards = {call:'01',first:'02',second:'03',argue:'04',pass:'05',fail:'06'};
  let currentMap = 'l1';
  let activeEvent = null;
  let scamAutoShown = false;
  let eventStage = null;
  let activePortrait = '☏';
  let dialogueText = '';
  let dialogueTimer = null;
  let walkFramePending = false;
  let roomReturnPosition = null;

  function setAtlas(id) {
    currentMap = id;
    const map = maps[id];
    if (!map) return;
    viewport.innerHTML = `<img class="atlas-image" src="${map.image}" alt="${map.title}像素地图"><div class="atlas-hotspots"></div>`;
    crumb.textContent = map.title;
    const idleHint = id === 'l1' ? '悬停查看区域 · 点击进入 L2' : '悬停查看地点 · 点击地点互动';
    hint.textContent = idleHint;
    backButton.disabled = id === 'l1';
    const layer = viewport.querySelector('.atlas-hotspots');
    map.points.forEach(([name, x, y, target]) => {
      const point = document.createElement('button');
      point.type = 'button';
      point.className = 'atlas-point';
      point.style.left = `${x}%`;
      point.style.top = `${y}%`;
      point.setAttribute('aria-label', name);
      const showPointName = () => { hint.textContent = `${name} · ${target ? '点击进入区域' : '点击查看地点'}`; };
      point.addEventListener('pointerenter', showPointName);
      point.addEventListener('pointerleave', () => { hint.textContent = idleHint; });
      point.addEventListener('focus', showPointName);
      point.addEventListener('blur', () => { hint.textContent = idleHint; });
      point.onclick = () => {
        if (target) {
          setAtlas(target);
          return;
        }
        if (id === 'kowloon' && name === '尖沙咀') {
          enterTsimShaTsui();
          return;
        }
        const destination = {
          '香港国际机场': '机场抵达大厅', '天坛大佛': '昂坪山径', '香港迪士尼乐园': '乐园入口',
          '红茶冰室': '红茶冰室', '海港城': '海港城'
        }[name] || name;
        const detail = document.createElement('button');
        detail.dataset.title = destination;
        detail.dataset.region = map.title.replace('L2 · ', '');
        detail.dataset.desc = `你抵达了${name}。沿街道寻找可以互动的地点，记录一段香港回忆`;
        detail.dataset.bg = sceneImages[0];
        openHotspot(detail);
      };
      layer.appendChild(point);
    });
  }

  function setL3Map() {
    currentMap = 'l3';
    crumb.textContent = 'L3 · 尖沙咀步行街';
    hint.textContent = '←→ / AD 行走 · Shift 奔跑 · F 互动';
    backButton.disabled = false;
    viewport.innerHTML = `<div class="street-stage" id="streetStage"><div class="walk-strip" id="walkStrip">${sceneImages.map((src,index)=>`<div class="walk-panel"><img src="${src}" alt="尖沙咀街区场景 ${index+1}"><div class="walk-shade"></div></div>`).join('')}</div>
      <div class="street-warmth" aria-hidden="true"></div><div class="street-pavement" aria-hidden="true"></div>
      <div class="street-video-controls"><button type="button" id="streetZoomOut" aria-label="缩小街区">−</button><button type="button" id="streetZoomIn" aria-label="放大街区">+</button></div>
      ${eventLocations.map(item => item.sign
        ? `<div class="sign-glow" data-event="${item.id}" data-sign="1" title="${item.title}"><i class="sign-alert" aria-hidden="true">!</i></div>`
        : `<div class="walk-marker" data-event="${item.id}" title="${item.title}"><button type="button" aria-label="靠近后互动：${item.title}">!</button><small>${item.title.split(' · ')[0]}</small></div>`
      ).join('')}
      ${streetNpcs.map(npc => `<div class="street-npc" data-npc="${npc.id}" data-facing="down" title="${npc.name} · 自主巡游"><img src="${npcDirectionalSprite(npc, 'down')}" alt="${npc.name}"><span>${npc.name}</span></div>`).join('')}
      <div class="adventure-player" id="adventurePlayer" aria-label="玩家角色" data-facing="down"><div class="walk-player-sprite" id="walkPlayerSprite"></div><span class="player-name">你</span></div>
      </div>
      <div class="walk-hud"><span id="walkPosition">尖沙咀 · 09:00</span><span id="walkPrompt">←→ 或 A/D 沿街移动</span><div class="walk-actions"><button type="button" id="walkLeft" aria-label="向左移动">←</button><button type="button" id="interactButton" hidden>F 互动</button><button type="button" id="walkRight" aria-label="向右移动">→</button></div></div>`;
    document.querySelector('#worldFullscreen')?.remove();
    const fullscreenButton = document.createElement('button');
    fullscreenButton.type = 'button';
    fullscreenButton.id = 'worldFullscreen';
    fullscreenButton.textContent = '⛶ 全屏';
    fullscreenButton.setAttribute('aria-label', '切换浏览器全屏');
    document.querySelector('.adventure-toolbar').appendChild(fullscreenButton);
    fullscreenButton.onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch { toast('当前浏览器不支持全屏，已保持全视口显示'); }
    };
    walk.active = true;
    walk.x = 0.07;
    walk.y = 0.88;
    walk.target = null;
    Object.keys(walk.keys).forEach(key => { walk.keys[key] = false; });
    walk.near = null;
    walk.moving = false;
    walk.cameraX = 0;
    walk.lastFrame = performance.now();
    streetNpcs.forEach((npc,index) => {
      npc.x = npc.route[0].x;
      npc.y = npc.route[0].y;
      npc.direction = 'down';
      npc.moving = false;
      npc.routeIndex = 1;
      npc.wait = index * .32;
    });
    viewport.querySelector('#streetZoomIn').onclick = () => setWalkZoom(walk.zoom + .1);
    viewport.querySelector('#streetZoomOut').onclick = () => setWalkZoom(walk.zoom - .1);
    eventLocations.forEach(item => {
      const marker = viewport.querySelector(`[data-event="${item.id}"]`);
      if (item.sign) {
        marker.onclick = () => {
          if (walk.near === item.id) beginEvent(item.id);
          else moveToLocation(item);
        };
        marker.style.cursor = 'pointer';
        marker.style.pointerEvents = 'auto';
        return;
      }
      marker.querySelector('button').onclick = () => {
        if (walk.near === item.id) beginEvent(item.id);
        else moveToLocation(item);
      };
    });
    viewport.querySelector('#interactButton').onclick = () => {
      if (walk.near) beginEvent(walk.near);
    };
    viewport.querySelector('#walkLeft').onclick = () => movePlayer(-1, 0);
    viewport.querySelector('#walkRight').onclick = () => movePlayer(1, 0);
    viewport.querySelector('#streetStage').addEventListener('pointerdown', event => {
      if (event.target.closest('button,.walk-marker,.sign-glow')) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      const worldWidth = bounds.width * 5 * walk.zoom;
      walk.target = {
        x: Math.min(.97, Math.max(.03, (event.clientX - bounds.left + walk.cameraX) / worldWidth)),
        y: clampStreetY((event.clientY - bounds.top) / bounds.height)
      };
      requestWalkFrame();
    });
    renderWalk();
    requestWalkFrame();
  }

  function enterTsimShaTsui() {
    setL3Map();
    toast('抵达尖沙咀。沿街移动，靠近感叹号地点触发事件');
  }

  function worldIsPaused() {
    return activeEvent || document.hidden || !document.querySelector('#map').classList.contains('active');
  }

  function directionalSprite(gender, direction, step = 0) {
    const view = direction === 'up' ? 'back' : direction === 'down' ? 'front' : 'side';
    return `assets/characters/daily-${gender === '男性' ? 'male' : 'female'}-${view}${step ? '-walk' : ''}.png`;
  }

  function npcDirectionalSprite(npc, direction, step = 0) {
    if (!npc.sprite) return directionalSprite(npc.gender, direction, step);
    const view = direction === 'up' ? 'back' : direction === 'down' ? 'front' : 'side';
    return `assets/characters/npcs/${npc.sprite}-${view}${step ? '-walk' : ''}.png`;
  }

  function faceMovement(dx, dy, worldWidth, stageHeight) {
    if (Math.abs(dx * worldWidth) >= Math.abs(dy * stageHeight)) {
      if (Math.abs(dx) > .00001) walk.direction = dx < 0 ? 'left' : 'right';
    } else if (Math.abs(dy) > .00001) walk.direction = dy < 0 ? 'up' : 'down';
  }

  function updateStreetNpcs(dt, worldWidth, stageHeight) {
    streetNpcs.forEach(npc => {
      npc.moving = false;
      if (npc.wait > 0) {
        npc.wait = Math.max(0, npc.wait - dt);
        return;
      }
      const target = npc.route[npc.routeIndex];
      const dx = target.x - npc.x;
      const dy = target.y - npc.y;
      const pixelDx = dx * worldWidth;
      const pixelDy = dy * stageHeight;
      const distance = Math.hypot(pixelDx, pixelDy);
      if (distance < 3) {
        npc.x = target.x;
        npc.y = target.y;
        npc.wait = target.wait;
        npc.routeIndex = (npc.routeIndex + 1) % npc.route.length;
        return;
      }
      if (Math.abs(pixelDx) >= Math.abs(pixelDy)) npc.direction = dx < 0 ? 'left' : 'right';
      else npc.direction = dy < 0 ? 'up' : 'down';
      const step = Math.min(distance, npc.speed * dt);
      npc.x += pixelDx / distance * step / worldWidth;
      npc.y += pixelDy / distance * step / stageHeight;
      npc.moving = true;
    });
  }

  function renderStreetNpcs(worldWidth) {
    streetNpcs.forEach(npc => {
      const element = viewport.querySelector(`[data-npc="${npc.id}"]`);
      if (!element) return;
      element.style.left = `${npc.x * worldWidth - walk.cameraX}px`;
      element.style.bottom = `${(1 - npc.y) * 100 + NPC_LIFT}%`;
      element.style.zIndex = String(100 + Math.round(npc.y * 100));
      element.dataset.facing = npc.direction;
      element.classList.toggle('is-walking', npc.moving);
      const step = npc.moving ? Math.floor(performance.now() / 170) % 2 : 0;
      const frameKey = `${npc.direction}-${step}`;
      if (element.dataset.renderedFacing !== frameKey) {
        element.dataset.renderedFacing = frameKey;
        const image = element.querySelector('img');
        image.src = npcDirectionalSprite(npc, npc.direction, step);
      }
    });
  }

  function renderWalk() {
    if (!walk.active || currentMap !== 'l3') return;
    const stage = viewport.querySelector('#streetStage');
    const player = viewport.querySelector('#adventurePlayer');
    if (!stage || !player) return;
    const viewportWidth = stage.clientWidth;
    const stageHeight = stage.clientHeight;
    const worldWidth = viewportWidth * 5 * walk.zoom;
    const playerWorldX = walk.x * worldWidth;
    walk.cameraX = Math.max(0, Math.min(Math.max(0, worldWidth - viewportWidth), playerWorldX - viewportWidth * .45));
    const strip = viewport.querySelector('#walkStrip');
    strip.style.transformOrigin = 'left center';
    strip.style.left = `${-walk.cameraX}px`;
    strip.style.transform = `scale(${walk.zoom})`;
    renderStreetNpcs(worldWidth);
    player.style.left = `${playerWorldX - walk.cameraX}px`;
    player.style.setProperty('bottom', `${(1 - walk.y) * 100 + PLAYER_LIFT}%`, 'important');
    player.style.zIndex = String(100 + Math.round(walk.y * 100));
    player.dataset.facing = walk.direction;
    player.classList.toggle('is-walking', walk.moving);
    const appearance = state.playerAppearance || {gender:creator.gender || '女性',outfit:'daily',tone:'normal'};
    const sprite = viewport.querySelector('#walkPlayerSprite');
    const gender = appearance.gender === '男性' ? '男性' : '女性';
    sprite.dataset.gender = gender;
    sprite.dataset.outfit = appearance.outfit || 'daily';
    sprite.dataset.accessory = appearance.accessory || 'none';
    sprite.dataset.tone = appearance.tone || 'normal';
    const step = walk.moving ? Math.floor(performance.now() / 150) % 2 : 0;
    sprite.style.backgroundImage = `url('${directionalSprite(gender, walk.direction, step)}')`;
    player.querySelector('.player-name').textContent = creator.name || '你';
    const currentItem = eventLocations.find(item => item.sign
      ? Math.abs(walk.x - item.sign.x) < item.sign.w / 2 + .014
      : Math.abs(walk.x - item.x) < .027 && Math.abs(walk.y - item.y) < .14);
    walk.near = currentItem?.id || null;
    eventLocations.forEach(item => {
      const marker = viewport.querySelector(`[data-event="${item.id}"]`);
      const completed = Boolean(state.specialEvents?.[item.id]);
      if (item.sign) {
        // 按背景图 object-fit:cover 的实际显示方式换算，招牌矩形才能与画面像素级重合
        const panelW = viewportWidth * walk.zoom;
        const panelH = stageHeight * walk.zoom;
        const coverScale = Math.max(panelW / SCENE_IMAGE_W, panelH / SCENE_IMAGE_H);
        const offsetX = (panelW - SCENE_IMAGE_W * coverScale) / 2;
        const offsetY = (panelH - SCENE_IMAGE_H * coverScale) / 2;
        const panelTop = (stageHeight - panelH) / 2;
        const left = -walk.cameraX + item.sign.panel * panelW + offsetX + item.sign.px * coverScale;
        const top = panelTop + offsetY + item.sign.py * coverScale;
        const width = item.sign.pw * coverScale;
        const height = item.sign.ph * coverScale;
        marker.style.left = `${left}px`;
        marker.style.width = `${width}px`;
        marker.style.height = `${height}px`;
        marker.style.setProperty('bottom', `${stageHeight - top - height}px`, 'important');
        marker.style.zIndex = '60';
        marker.classList.toggle('is-near', walk.near === item.id);
        marker.classList.toggle('done', completed);
        const alert = marker.querySelector('.sign-alert');
        alert.textContent = completed ? '✓' : '!';
        alert.hidden = completed || walk.near !== item.id;
        return;
      }
      marker.style.left = `${item.x * worldWidth - walk.cameraX}px`;
      marker.style.setProperty('bottom', `${(1 - item.y) * 100 + NPC_LIFT}%`, 'important');
      marker.style.zIndex = String(90 + Math.round(item.y * 100));
      marker.classList.toggle('is-near', walk.near === item.id);
      marker.classList.toggle('done', completed);
      marker.querySelector('button').textContent = completed ? '✓' : '!';
    });
    const prompt = viewport.querySelector('#walkPrompt');
    const interact = viewport.querySelector('#interactButton');
    const nearSign = currentItem?.sign;
    prompt.textContent = walk.near
      ? (nearSign ? `已到达${nearSign.label} · 按 F 进入` : '已到达地点 · 按 F 开始对话')
      : '←→ 或 A/D 沿街移动 · 点击地面前往';
    interact.hidden = !walk.near;
    viewport.querySelector('#walkPosition').textContent = `尖沙咀 · ${walk.x > .43 ? '13:30' : '09:00'}${walk.shift ? ' · 奔跑' : ''}`;
    if (walk.x > .43 && !state.specialEvents?.scam && !activeEvent && !scamAutoShown) {
      scamAutoShown = true;
      beginEvent('scam');
    }
  }

  function movePlayer(horizontal, vertical) {
    if (!walk.active || worldIsPaused()) return;
    const stage = viewport.querySelector('#streetStage');
    faceMovement(horizontal, vertical, stage.clientWidth * 5 * walk.zoom, stage.clientHeight);
    walk.target = {
      x: Math.min(.97, Math.max(.03, walk.x + horizontal * .055)),
      y: clampStreetY(walk.y + vertical * .10)
    };
    requestWalkFrame();
  }

  function setWalkZoom(value) {
    walk.zoom = Math.max(1, Math.min(1.35, value));
    renderWalk();
  }

  function moveToLocation(item) {
    walk.target = {x:item.x, y:clampStreetY(item.y + .025)};
    const stage = viewport.querySelector('#streetStage');
    faceMovement(item.x - walk.x, item.y - walk.y, stage.clientWidth * 5 * walk.zoom, stage.clientHeight);
    toast(`前往${item.title.split(' · ')[0]}，靠近后按 F 互动`);
    requestWalkFrame();
  }

  function requestWalkFrame() {
    if (walkFramePending || !walk.active || currentMap !== 'l3') return;
    walkFramePending = true;
    window.setTimeout(() => {
      walkFramePending = false;
      walkFrame(performance.now());
    }, 16);
  }

  function walkFrame(now) {
    const dt = Math.min(.04, Math.max(0, (now - walk.lastFrame) / 1000));
    walk.lastFrame = now;
    walk.moving = false;
    if (walk.active && currentMap === 'l3' && !worldIsPaused()) {
      const stage = viewport.querySelector('#streetStage');
      const worldWidth = stage.clientWidth * 5 * walk.zoom;
      const stageHeight = stage.clientHeight;
      updateStreetNpcs(dt, worldWidth, stageHeight);
      let dx = (walk.keys.right ? 1 : 0) - (walk.keys.left ? 1 : 0);
      let dy = (walk.keys.down ? 1 : 0) - (walk.keys.up ? 1 : 0);
      const speed = (walk.shift ? 255 : 155) * dt;
      if (dx || dy) {
        walk.target = null;
        const length = Math.hypot(dx, dy) || 1;
        dx /= length;
        dy /= length;
        faceMovement(dx, dy, worldWidth, stageHeight);
        walk.x = Math.min(.97, Math.max(.03, walk.x + dx * speed / worldWidth));
        walk.y = clampStreetY(walk.y + dy * speed / stageHeight);
        walk.moving = true;
      } else if (walk.target) {
        const targetDx = walk.target.x - walk.x;
        const targetDy = walk.target.y - walk.y;
        const pixelDx = targetDx * worldWidth;
        const pixelDy = targetDy * stageHeight;
        const distance = Math.hypot(pixelDx, pixelDy);
        if (distance < 4) {
          walk.x = walk.target.x;
          walk.y = walk.target.y;
          walk.target = null;
        } else {
          faceMovement(targetDx, targetDy, worldWidth, stageHeight);
          const step = Math.min(distance, speed);
          walk.x += pixelDx / distance * step / worldWidth;
          walk.y += pixelDy / distance * step / stageHeight;
          walk.moving = true;
        }
      }
    }
    renderWalk();
    if (walk.active && currentMap === 'l3') requestWalkFrame();
  }

  function closeEvent() {
    window.StoryEngine?.cancel();
    eventOverlay.classList.remove('open');
    referenceDrawer.hidden = true;
    referenceFrame.src = 'about:blank';
    activeEvent = null;
    if (window.RoomEngine?.active) {
      window.RoomEngine.exit();
      setL3Map();
      if (roomReturnPosition) {
        walk.x = roomReturnPosition.x;
        walk.y = roomReturnPosition.y;
        walk.direction = roomReturnPosition.direction;
      }
      roomReturnPosition = null;
    }
    eventStage = null;
    clearInterval(dialogueTimer);
    dialogueTimer = null;
    const video = viewport.querySelector('#streetVideo');
    if (video && walk.active) video.play().catch(() => {});
    renderWalk();
  }

  function finishEvent(id, result) {
    state.specialEvents = state.specialEvents || {};
    if (state.specialEvents[id]) {
      closeEvent();
      return;
    }
    state.specialEvents[id] = result;
    if (state.eventProgress) delete state.eventProgress[id];
    if (result.items?.length) state.eventItems = [...new Set([...(state.eventItems || []), ...result.items])];
    if (result.achievement) state.achievements = [...new Set([...(state.achievements || []), result.achievement])];
    if (result.items?.length || result.achievement) {
      document.querySelector('#bagText').textContent = `${result.achievement ? `成就：${result.achievement}\n` : ''}${result.items?.length ? `事件物品：${result.items.join('、')}` : ''}`;
    }
    eventStage = result.pass ? 'pass' : 'fail';
    if (result.returnToStart) { walk.x = .07; walk.y = .88; walk.target = null; }
    clearInterval(dialogueTimer);
    dialogueTimer = null;
    const xpChange = result.xp || 0;
    state.socialXP = Math.max(0, (state.socialXP || 0) + xpChange);
    state.journal += `\n\n${result.title}\n${result.record}${xpChange ? `（社会实践 XP ${xpChange > 0 ? '+' : ''}${xpChange}）` : ''}`;
    update();
    document.querySelector('#eventTitle').textContent = result.title;
    document.querySelector('#eventSceneArt').src = result.art || (id === 'scam' ? `assets/events/phone/${phoneStoryboards[eventStage]}.webp` : id === 'tea' ? 'assets/thumbs/110.jpg' : 'assets/thumbs/129.jpg');
    document.querySelector('#eventSceneArt').alt = `${result.title} · ${result.pass ? '成功' : '未通过'}画面`;
    const scamGuide = '防骗指南：不轻信来电身份；不透露个人资料；通过独立查找的官方渠道核实；有疑问可咨询香港警方防骗易热线 18222。';
    document.querySelector('#eventFoot').innerHTML = `${result.tip || (id === 'scam' ? scamGuide : '事件已记录，探索暂停状态已解除。')} <span class="event-stamp">${result.pass ? '笑脸 · 已通过' : '哭脸 · 未通过'}</span>`;
    document.querySelector('#eventSpeaker').textContent = '手账记录';
    document.querySelector('#eventNpcAvatar').alt = result.pass ? '事件成功记录图' : '事件未通过记录图';
    document.querySelector('#eventLine').textContent = result.record + (xpChange ? `\n社会实践 XP ${xpChange > 0 ? '+' : ''}${xpChange}` : '');
    const options = document.querySelector('#eventOptions');
    options.innerHTML = '';
    addChoice(options, '继续探索', () => {
      toast(`${result.title} 已记入手账`);
      closeEvent();
    });
  }

  function addChoice(parent, label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'event-choice';
    button.innerHTML = `<b>${parent.children.length + 1}</b><span>${label}</span>`;
    button.onclick = action;
    parent.appendChild(button);
  }

  function showDialogue(title, speaker, line, choices, foot = '选择会影响事件结局 · 移动和游戏时间已暂停') {
    clearInterval(dialogueTimer);
    const video = viewport.querySelector('#streetVideo');
    if (video) video.pause();
    document.querySelector('#eventTitle').textContent = title;
    document.querySelector('#eventSpeaker').textContent = speaker;
    referenceDrawer.hidden = true;
    referenceFrame.dataset.referenceSrc = activeEvent === 'tea'
      ? '../事件流程/红茶冰室-买单小突发事件.pdf#page=2&zoom=70&toolbar=0&navpanes=0'
      : activeEvent === 'harbour'
        ? '../事件流程/海港城迷踪-消失的现金.pdf#page=8&zoom=75&toolbar=0&navpanes=0'
        : 'assets/events/phone/02.webp';
    document.querySelector('#eventReferenceTitle').textContent = activeEvent === 'tea'
      ? '红茶冰室 · NPC人物卡'
      : activeEvent === 'harbour' ? '海港城迷踪 · NPC人物页' : '陌生来电 · 原始事件分镜';
    const lineElement = document.querySelector('#eventLine');
    lineElement.textContent = '';
    dialogueText = line;
    let characterIndex = 0;
    dialogueTimer = setInterval(() => {
      characterIndex += 1;
      lineElement.textContent = line.slice(0, characterIndex);
      if (characterIndex >= line.length) clearInterval(dialogueTimer);
    }, 24);
    lineElement.onclick = () => {
      clearInterval(dialogueTimer);
      lineElement.textContent = dialogueText;
    };
    const appearance = state.playerAppearance || {gender:creator.gender || '女性'};
    document.querySelector('#dialogHeroAvatar').dataset.gender = appearance.gender === '男性' ? '男性' : '女性';
    const npcImage = document.querySelector('#eventNpcAvatar');
    npcImage.src = activeEvent === 'scam' ? 'assets/events/phone/02.webp' : activeEvent === 'tea' ? 'assets/thumbs/110.jpg' : 'assets/thumbs/129.jpg';
    npcImage.alt = activeEvent === 'scam' ? '反诈事件来电警员' : activeEvent === 'tea' ? '红茶冰室店员与顾客' : '海港城事件的海滨现场';
    const art = document.querySelector('#eventSceneArt');
    art.src = activeEvent === 'scam' ? `assets/events/phone/${phoneStoryboards[eventStage || 'call']}.webp` : activeEvent === 'tea' ? 'assets/thumbs/110.jpg' : 'assets/thumbs/129.jpg';
    art.alt = `${title}场景与人物`;
    document.querySelector('#eventFoot').textContent = foot;
    const options = document.querySelector('#eventOptions');
    options.innerHTML = '';
    choices.forEach(([label, action]) => addChoice(options, label, action));
    eventOverlay.classList.add('open');
  }

  function beginEvent(id) {
    if (state.specialEvents?.[id]) {
      toast('这段事件已经记入手账');
      return;
    }
    activeEvent = id;
    if ((id === 'tea' || id === 'harbour') && window.RoomEngine) {
      roomReturnPosition = {x:walk.x,y:walk.y,direction:walk.direction};
      walk.active = false;
      walk.target = null;
      Object.keys(walk.keys).forEach(key => { walk.keys[key] = false; });
      window.RoomEngine.enter(id);
    }
    if (window.StoryEngine) {
      window.StoryEngine.start(id, {
        progress: state.eventProgress?.[id],
        onProgress: progress => {
          state.eventProgress = state.eventProgress || {};
          state.eventProgress[id] = progress;
        },
        onFinish: result => finishEvent(id, result),
        onCancel: closeEvent
      });
      return;
    }
    if (id === 'scam') {
      eventStage = 'call';
      activePortrait = '☎';
      showDialogue('陌生来电 · 反诈骗情景模拟', '未知来电 · +852 来电', '现在是 13:30。对方自称香港警员，说你的入境资料异常，要求重新提交，否则可能被遣返。', [
        ['拒绝接听，继续探索', () => finishEvent('scam', {title:'陌生来电 · 安全拒接',record:'拒绝陌生来电，没有透露任何个人资料。',pass:true})],
        ['接听电话', () => scamFirstCall()]
      ]);
      return;
    }
    if (id === 'tea') {
      eventStage = 'start';
      activePortrait = '🍵';
      showDialogue('红茶冰室 · 买单小突发事件', '店员 · 阿婆', '午饭高峰，邻桌的阿婆说自己已经付过账，店员却拿来一张未结清的单。你发现点单和桌号似乎对不上。', [
        ['先核对桌号和逐项账单', () => teaCheckBill()],
        ['先替阿婆付清，别耽误大家', () => finishEvent('tea', {title:'红茶冰室 · 好意付错账',record:'没有核对账单就替别人付款，店员后来发现桌号记错。',pass:false})],
        ['直接质问店员是不是算错了', () => finishEvent('tea', {title:'红茶冰室 · 账单争执',record:'沟通变成争执，问题没有及时查清。',pass:false})]
      ]);
      return;
    }
    eventStage = 'start';
    activePortrait = '？';
    showDialogue('海港城迷踪 · 消失的现金', '你 · 海港城顾客', '结账时你发现钱包里的现金少了一叠。商场人流很大，刚才经过店铺、扶梯和海滨长廊。先从哪里查起？', [
      ['回想路线，按顺序问店员和服务台', () => harbourSearch()],
      ['立刻认定身边的人拿了钱', () => finishEvent('harbour', {title:'海港城迷踪 · 误认失主',record:'没有证据便指认他人，现场陷入混乱，现金仍未找到。',pass:false})],
      ['暂停购物，检查随身物品与收据', () => harbourSearch()]
    ]);
  }

  function scamFirstCall() {
    eventStage = 'first';
    activePortrait = '☎';
    showDialogue('陌生来电 · 一级对话', '自称警员', '你的身份资料可能被盗用，需要前往入境事务处重新登记。请现在提供证件号码，我替你备案。', [
      ['直接挂断电话', () => finishEvent('scam', {title:'陌生来电 · 挂断核实',record:'挂断可疑来电，没有提供个人资料。',pass:true})],
      ['仔细询问对方单位和案件编号', () => scamSecondCall()],
      ['破口大骂', () => {
        eventStage = 'argue';
        activePortrait = '☎';
        showDialogue('陌生来电 · 对方挂断', '来电者', '「你而家係發緊癲呀？」对方回骂后主动挂断了电话。', [
          ['记录号码，通过独立渠道核实', () => finishEvent('scam', {title:'陌生来电 · 对方挂断',record:'没有受骗，但与可疑来电争吵并非建议做法。',pass:true,tip:'防骗指南：不透露资料；独立查找官方渠道核实；有疑问可咨询香港警方防骗易热线 18222。'})]
        ]);
      }]
    ]);
  }

  function scamSecondCall() {
    eventStage = 'second';
    activePortrait = '☎';
    showDialogue('陌生来电 · 二级对话', '自称警员', '你的身份信息涉及盗用，必须马上处理。可以到入境事务处，也可以在线提交资料。', [
      ['按他说的去入境事务处', () => finishEvent('scam', {title:'陌生来电 · 未通过',record:'相信来电指示前往指定地点，离开原有探索路线。',xp:-1,pass:false,returnToStart:true})],
      ['想在线办理，询问网址', () => finishEvent('scam', {title:'陌生来电 · 未通过',record:'继续询问对方提供的线上办理方式，差点提交个人资料。',xp:-2,pass:false})],
      ['挂断并自行查找官方联系方式', () => finishEvent('scam', {title:'陌生来电 · 独立核实',record:'挂断电话，通过独立查找的官方渠道核实，没有透露资料。',pass:true,tip:'防骗指南：不轻信来电身份；不透露个人资料；通过独立查找的官方渠道核实；有疑问可咨询香港警方防骗易热线 18222。'})]
    ]);
  }

  function teaCheckBill() {
    eventStage = 'bill';
    activePortrait = '🍵';
    showDialogue('红茶冰室 · 核对单据', '店员 · 阿婆', '店员拿出点单纸，发现邻桌刚才换了座位，两张单混在一起。阿婆说自己只点了一碗红茶和菠萝油。', [
      ['请店员逐项复核，再分别结账', () => finishEvent('tea', {title:'红茶冰室 · 买单小插曲',record:'先核对桌号与点单，再请店员分开结账。误会解开，也提醒自己保留收据。',pass:true})],
      ['让阿婆再回忆一次点过什么', () => finishEvent('tea', {title:'红茶冰室 · 买单小插曲',record:'耐心确认点单后请店员重新核对，账单恢复正确。',pass:true})]
    ]);
  }

  function harbourSearch() {
    eventStage = 'search';
    activePortrait = '？';
    showDialogue('海港城迷踪 · 逐段查找', '商场服务台', '你按收据回想路线：先在商店付款，接着经过扶梯，最后在海滨长廊整理物品。服务台愿意帮你联系店铺。', [
      ['拿收据回店铺核对付款记录', () => harbourFound()],
      ['请服务台广播失物信息，不报证件资料', () => harbourFound()],
      ['继续翻找自己的包和购物袋', () => harbourFound()]
    ]);
  }

  function harbourFound() {
    eventStage = 'found';
    activePortrait = '？';
    showDialogue('海港城迷踪 · 线索对上了', '店员 · 服务台', '店员查到现金装在刚才寄存的购物袋夹层里。服务台提醒你先核对物品，再离开商场。', [
      ['核对金额与物品后取回', () => finishEvent('harbour', {title:'海港城迷踪 · 找回现金',record:'按路线核对收据并联系服务台，找回遗落的现金。',pass:true})],
      ['记下经过，检查好随身物品', () => finishEvent('harbour', {title:'海港城迷踪 · 找回现金',record:'确认现金来自自己的购物袋，检查物品后继续行程。',pass:true})]
    ]);
  }

  backButton.onclick = () => {
    if (window.RoomEngine?.active) {
      window.RoomEngine.exit();
      window.StoryEngine?.cancel();
      eventOverlay.classList.remove('open');
      activeEvent = null;
      roomReturnPosition = null;
    }
    if (currentMap === 'l3') {
      walk.active = false;
      walk.target = null;
      Object.keys(walk.keys).forEach(key => { walk.keys[key] = false; });
      document.querySelector('#worldFullscreen')?.remove();
      setAtlas('kowloon');
      return;
    }
    if (currentMap !== 'l1') setAtlas('l1');
  };
  document.querySelector('#eventClose').onclick = closeEvent;
  referenceToggle.onclick = () => {
    if (referenceDrawer.hidden) {
      referenceFrame.src = referenceFrame.dataset.referenceSrc;
      referenceDrawer.hidden = false;
    } else {
      referenceDrawer.hidden = true;
      referenceFrame.src = 'about:blank';
    }
  };
  document.querySelector('#eventReferenceClose').onclick = () => {
    referenceDrawer.hidden = true;
    referenceFrame.src = 'about:blank';
  };
  document.addEventListener('keydown', event => {
    if (currentMap !== 'l3' || !walk.active || worldIsPaused()) return;
    const key = event.key.toLowerCase();
    // 街道仅保留左右移动；上下（W/S/↑/↓）在街道禁用，室内场景仍支持完整 WASD
    if (['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d'].includes(key)) event.preventDefault();
    if (key === 'arrowleft' || key === 'a') walk.keys.left = true;
    if (key === 'arrowright' || key === 'd') walk.keys.right = true;
    if (key === 'arrowup' || key === 'w') walk.keys.up = false;
    if (key === 'arrowdown' || key === 's') walk.keys.down = false;
    requestWalkFrame();
  });
  document.addEventListener('keyup', event => {
    const key = event.key.toLowerCase();
    if (key === 'arrowleft' || key === 'a') walk.keys.left = false;
    if (key === 'arrowright' || key === 'd') walk.keys.right = false;
    if (key === 'arrowup' || key === 'w') walk.keys.up = false;
    if (key === 'arrowdown' || key === 's') walk.keys.down = false;
    requestWalkFrame();
  });
  window.addEventListener('blur', () => {
    Object.keys(walk.keys).forEach(key => { walk.keys[key] = false; });
  });
  window.addEventListener('resize', renderWalk);
  window.setWalkSprint = value => {
    walk.shift = Boolean(value);
    renderWalk();
  };
  window.setWalkZoom = setWalkZoom;
  setL3Map();
})();