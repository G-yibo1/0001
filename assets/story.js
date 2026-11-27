(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const artRoot = 'assets/events/';
  const npc = {
    heroTea: 'assets/characters/daily-female-front.png',
    waiter: 'assets/characters/npcs/waiter-front.png',
    cashierTea: 'assets/characters/npcs/cashier-front.png',
    granny: 'assets/characters/npcs/granny-front.png',
    heroHarbour: artRoot + 'harbour/npc-hero.png',
    amingSad: artRoot + 'harbour/npc-aming-sad.webp',
    amingHappy: artRoot + 'harbour/npc-aming-happy.png',
    guide: artRoot + 'harbour/npc-guide.png',
    witness: artRoot + 'harbour/npc-witness.png'
  };

  let session = null;
  let typeTimer = null;
  let autoTimer = null;

  const teaScript = [
    ['旁白', '午饭时间，红茶冰室几乎坐满了。你推门进来，先向点单服务员报人数。', 'waiter'],
    ['主控', '你好，一位。', 'heroTea'],
    ['点单服务员', '一位？入面搭枱啦，窗边仲有个位。', 'waiter'],
    ['主控（内心）', '搭枱……是和别的客人一起坐吗？先过去看看。', 'heroTea'],
    ['点单服务员', '靠窗那位婆婆对面空着，你可以先问问她。', 'waiter'],
    ['旁白', '你穿过中央过道，来到靠窗的双人桌旁。', 'granny'],
    ['拼桌老奶奶', '（婆婆抬起头，看向你。）', 'granny'],
    ['主控', '婆婆，不好意思，我可以跟您搭台吗？', 'heroTea'],
    ['拼桌老奶奶', '（婆婆笑了笑，指了指对面的空椅子。）坐啦，唔使客气。', 'granny'],
    ['主控', '谢谢婆婆。', 'heroTea'],
    ['拼桌老奶奶', '（婆婆把浅棕布袋往身边收了收，给你让出位置。）', 'granny'],
    ['旁白', '你在婆婆对面坐下，第一次和陌生人搭台。', 'granny'],
    ['点单服务员', '（服务员递来菜单和点单簿。）慢慢睇，睇好叫我。', 'waiter'],
    ['主控（内心）', '先看看菜单。萝卜牛腩，再配一杯冻柠茶。', 'heroTea'],
    ['点单服务员', '谂好食咩未？', 'waiter'],
    ['主控', '我要一份萝卜牛腩，还有一杯冻柠茶。', 'heroTea'],
    ['点单服务员', '萝卜牛腩一份、冻柠茶一杯，系咪？', 'waiter'],
    ['主控', '对，谢谢。', 'heroTea'],
    ['旁白', '服务员用普通话确认了点单，转身把单子送去后厨。', 'waiter'],
    ['点单服务员', '呢张单你攞住，一阵买单用。', 'waiter'],
    ['旁白', '小票上的字有些模糊。你还是把它折好，收进背包。', 'heroTea'],
    ['主控（内心）', '先收好吧，结账的时候应该能用。', 'heroTea'],
    ['旁白', '萝卜牛腩和冻柠茶送上来了。你慢慢吃完午饭。', 'granny'],
    ['主控', '婆婆，我吃好了，先去买单。您慢慢吃。', 'heroTea'],
    ['旁白', '你起身走向收银台，刚才能用普通话沟通的点单服务员已经不在座位区。', 'cashierTea'],
    ['主控', '你好，买单。', 'heroTea'],
    ['柜台店员', '你食咗咩呀？', 'cashierTea'],
    ['主控（内心）', '小票的字看不清……只能直接报菜名了。', 'heroTea'],
    ['柜台店员', '可唔可以話我知，你啱啱食咗咩？', 'cashierTea'],
    ['主控', '我吃的是萝卜牛腩。', 'heroTea'],
    ['柜台店员', '你講咩話？我聽唔明普通話。', 'cashierTea'],
    ['主控', '萝卜……', 'heroTea'],
    ['旁白', '柜台附近一两位客人停下动作，回头看了你两秒，又继续吃面、看菜单。', 'cashierTea'],
    ['主控（内心）', '有点脸红……对了，可以指菜单给他看。', 'heroTea'],
    ['柜台店员', '你可以指住菜单上面嘅菜名俾我睇。', 'cashierTea'],
    ['主控', '（找到菜单上的菜，红着脸指了指。）我吃的是这个。', 'heroTea']
  ];

  function teaNodes() {
    const nodes = {};
    teaScript.forEach((entry, index) => {
      const id = `t${index + 1}`;
      nodes[id] = {
        art: `${artRoot}tea/frames/f${String(index + 1).padStart(2, '0')}.jpg`,
        speaker: entry[0], text: entry[1], npc: npc[entry[2]],
        foot: `红茶冰室 · 分镜 ${index + 1}/36 · 点击选项或按空格继续`,
        next: index < teaScript.length - 1 ? `t${index + 2}` : null
      };
    });
    nodes.t33.auto = 2000;
    nodes.t33.foot = '客人回头中 · 2 秒后自动恢复';
    nodes.t35.choices = [
      { label: '蘿蔔牛腩', action: () => go('teaRepeat') },
      { label: '菠蘿油', wrong: '店员看了看，摇摇头：呢个唔系你啱啱讲嘅菜。再看看菜单。' },
      { label: '凍檸茶', wrong: '这是饮料，还需要指出刚才吃的主菜。' }
    ];
    nodes.t35.next = null;
    nodes.teaRepeat = {
      art: `${artRoot}tea/frames/f36.jpg`, speaker: '柜台店员', npc: npc.cashierTea,
      text: '哦，蘿蔔牛腩！同埋凍檸茶，系咪？（店员复述菜名并示意金额。）',
      next: 't36', foot: '主控点头确认 · 菜单帮助两个人完成了沟通'
    };
    nodes.t36.next = 'FINISH_TEA';
    return nodes;
  }

  const scamNodes = {
    call: {
      art: artRoot + 'phone/01.webp', speaker: '未知来电 · 中国香港', npc: artRoot + 'phone/01.webp',
      text: '9月1日 13:30。陌生来电显示对方自称香港警员，说你的入境资料异常，要求重新提交，否则可能被遣返。',
      foot: 'L3 尖沙咀 · 通话期间暂停游戏时间与角色移动',
      choices: [
        { label: '拒绝接听，继续探索', result: { title: '陌生来电 · 安全拒接', record: '拒绝陌生来电，没有透露任何个人资料。', pass: true, art: artRoot + 'phone/05.webp' } },
        { label: '接听电话', next: 'first' }
      ]
    },
    first: {
      art: artRoot + 'phone/02.webp', speaker: '自称香港警员', npc: artRoot + 'phone/02.webp',
      text: '你的身份资料可能被盗用，需要重新登记。请配合提交资料，否则可能影响入境身份。',
      choices: [
        { label: '直接挂断电话', result: { title: '陌生来电 · 挂断核实', record: '直接挂断可疑来电，没有提供个人资料。', pass: true, art: artRoot + 'phone/05.webp' } },
        { label: '仔细询问', next: 'second' },
        { label: '破口大骂', next: 'argue' }
      ]
    },
    second: {
      art: artRoot + 'phone/03.webp', speaker: '自称香港警员', npc: artRoot + 'phone/03.webp',
      text: '你的身份信息存在被盗用风险，必须马上去香港入境事务处提交资料。',
      choices: [
        { label: '按他说的去入境事务处', result: { title: '陌生来电 · 未通过', record: '相信来电指示前往指定地点，离开原有探索路线。', xp: -1, pass: false, returnToStart: true, art: artRoot + 'phone/06.webp' } },
        { label: '路程太远，想线上进行', result: { title: '陌生来电 · 未通过', record: '接受对方提出的线上办理方向，面临泄露个人资料的风险。', xp: -2, pass: false, art: artRoot + 'phone/06.webp' } },
        { label: '挂断电话，独立核实', result: { title: '陌生来电 · 独立核实', record: '挂断电话，通过独立查找的官方渠道核实，没有透露资料。', pass: true, art: artRoot + 'phone/05.webp' } }
      ]
    },
    argue: {
      art: artRoot + 'phone/04.webp', speaker: '来电者', npc: artRoot + 'phone/04.webp',
      text: '「你而家係發緊癲呀？」对方用粤语回骂，随后主动挂断电话。',
      foot: '没有受骗，但不鼓励争吵；直接挂断、独立核实更稳妥。',
      choices: [
        { label: '结束通话，记录防骗提示', result: { title: '陌生来电 · 对方挂断', record: '对方回骂后主动挂断，没有受骗；但与可疑来电争吵并非建议做法。', pass: true, art: artRoot + 'phone/05.webp', tip: '虽未受骗，但不鼓励争吵。防骗指南：不透露资料；独立查找官方渠道核实；香港警方防骗易热线 18222。' } }
      ]
    }
  };

  function clearTimers() {
    clearInterval(typeTimer);
    clearTimeout(autoTimer);
    typeTimer = null;
    autoTimer = null;
  }

  function clearHotspots() {
    $('#eventHotspots')?.remove();
  }

  function setText(text) {
    clearInterval(typeTimer);
    const line = $('#eventLine');
    line.textContent = '';
    let index = 0;
    typeTimer = setInterval(() => {
      index += 1;
      line.textContent = text.slice(0, index);
      if (index >= text.length) clearInterval(typeTimer);
    }, 20);
    line.onclick = () => {
      clearInterval(typeTimer);
      line.textContent = text;
    };
  }

  function choice(label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'event-choice';
    button.innerHTML = `<b>${$('#eventOptions').children.length + 1}</b><span>${label}</span>`;
    button.onclick = action;
    $('#eventOptions').appendChild(button);
  }

  function save() {
    if (!session || session.id !== 'harbour') return;
    const h = session.harbour;
    session.onProgress?.({ accepted: h.accepted, clues: [...h.clues], search: h.search, envelope: h.envelope, returned: h.returned });
  }

  function go(id) {
    if (!session) return;
    if (id === 'FINISH_TEA') {
      finish({
        title: '红茶冰室 · 买单小突发事件', pass: true, art: artRoot + 'tea/frames/f36.jpg',
        record: '今天第一次跟人搭台。买单时说了半天，最后是菜单帮了我。',
        tip: '事件完成 · 萝卜牛腩与冻柠茶已结账，可从入口返回 L3。'
      });
      return;
    }
    const node = session.nodes[id];
    if (!node) return;
    session.nodeId = id;
    render(node);
  }

  function finish(result) {
    if (!session) return;
    clearTimers();
    clearHotspots();
    const callback = session.onFinish;
    session = null;
    callback?.(result);
  }

  function render(node) {
    if (!session) return;
    clearTimers();
    clearHotspots();
    $('#eventTitle').textContent = session.title;
    $('#eventSpeaker').textContent = node.speaker || '旁白';
    $('#eventSceneArt').src = node.art;
    $('#eventSceneArt').alt = `${session.title} · ${node.speaker || '场景'}`;
    const portrait = $('#eventNpcAvatar');
    portrait.src = node.npc || node.art;
    portrait.alt = `${node.speaker || '事件'}人物立绘`;
    portrait.classList.toggle('phone-frame', session.id === 'scam');
    $('#eventFoot').textContent = node.foot || '移动和游戏时间已暂停 · 点击选项或按空格继续';
    $('#eventOptions').innerHTML = '';
    setText(node.text || '');
    $('#eventOverlay').classList.add('open');

    if (node.choices) {
      node.choices.forEach(item => {
        choice(item.label, () => {
          if (item.wrong) {
            $('#eventFoot').textContent = item.wrong;
            return;
          }
          if (item.result) finish(item.result);
          else if (item.action) item.action();
          else if (item.next) go(item.next);
        });
      });
    } else if (node.next) {
      choice(node.next === 'FINISH_TEA' ? '确认结账，记入手账' : '继续', () => go(node.next));
    }
    if (node.auto) autoTimer = setTimeout(() => go(node.next), node.auto);
  }

  function showHarbourLine(speaker, text, portrait, next = harbourHub, foot) {
    render({ art: artRoot + 'harbour/zara.webp', speaker, text, npc: portrait, foot, choices: [{ label: '继续', action: next }] });
  }

  function harbourIntro() {
    render({
      art: artRoot + 'harbour/exterior.webp', speaker: '主控（内心）', npc: npc.heroHarbour,
      text: '广东道这边就是海港城了。ZARA 今天开始七折，趁周末来挑件过冬的风衣。',
      foot: '【系统】新区域解锁——海港城　【操作】进入商场',
      choices: [{ label: '沿入口进入海港城（空格）', action: harbourMall }]
    });
  }

  function harbourMall() {
    render({
      art: artRoot + 'harbour/mall.webp', speaker: '主控（内心）', npc: npc.heroHarbour,
      text: 'ZARA 在那边，门口果然挂着 SALE 30% 的牌子，希望码数还全。',
      foot: '【系统】目标更新——进入 ZARA 挑选风衣',
      choices: [{ label: '移动至 ZARA 门口，跨过门槛', action: harbourAnomaly }]
    });
  }

  function harbourAnomaly() {
    render({
      art: artRoot + 'harbour/zara.webp', speaker: '主控（内心）', npc: npc.amingSad,
      text: '嗯？那个男生怎么急得快哭了，地上也没看到他掉了什么。',
      foot: '【系统】触发支线事件——消失的现金　阿明头顶出现「！」',
      choices: [{ label: '走近阿明，点击角色对话', action: harbourRequest }]
    });
  }

  function harbourRequest() {
    showHarbourLine('阿明', '同学……你有没有看到一个牛皮纸信封？我换的几千块港币全在里面。', npc.amingSad, () => {
      showHarbourLine('主控', '你先别急，还记得最后一次拿信封是在哪儿吗？', npc.heroHarbour, () => {
        showHarbourLine('阿明', '我想给我爸挑件风衣，在镜子前试穿的时候信封还在，一摸口袋就没了……那是我攒了大半年的钱。', npc.amingSad, () => {
          showHarbourLine('主控', '我帮你一起找。你留在这儿，万一有人捡到送回来呢。', npc.heroHarbour, () => {
            session.harbour.accepted = true;
            save();
            harbourHub();
          }, '【系统】接受任务【消失的现金】；目标：向店内目击者询问线索。');
        });
      });
    });
  }

  function harbourHub() {
    if (!session) return;
    const h = session.harbour;
    save();
    render({
      art: artRoot + 'harbour/zara.webp', speaker: '寻物调查', npc: h.envelope ? npc.heroHarbour : npc.amingSad,
      text: h.envelope ? '已经找到牛皮纸信封。把它还给阿明吧。' : `向店内带「？」的角色询问线索（${h.clues.size}/2），再搜查风衣模特。`,
      foot: h.clues.size === 2 ? '两条线索已收齐 · 风衣模特已金色高亮，可连续搜查两次' : '收集两条线索后才会解锁风衣模特；点错不扣时间、不影响流程'
    });
    $('#eventOptions').innerHTML = '';
    const count = h.clues.size;
    choice(`${h.clues.has('guide') ? '✓' : '？'} 询问导购`, talkGuide);
    choice(`${h.clues.has('witness') ? '✓' : '？'} 询问目击者`, talkWitness);
    choice(count === 2 ? `✨ 搜查风衣模特（${h.search}/2）` : '🔒 风衣模特（需要两条线索）', () => {
      if (count < 2) {
        $('#eventFoot').textContent = '还没有足够线索。先分别询问导购和目击者。';
        return;
      }
      searchMannequin();
    });
    choice('查看其他衣架', () => { $('#eventFoot').textContent = '这里只有叠好的衣服。没有惩罚，把注意力放回风衣模特。'; });
    if (h.envelope && !h.returned) choice('把牛皮纸信封还给阿明', returnEnvelope);
    addHarbourHotspots();
  }

  function addHarbourHotspots() {
    const layer = document.createElement('div');
    layer.id = 'eventHotspots';
    layer.className = 'event-hotspots';
    const points = [
      ['guide', '？导购', 17, 49, talkGuide],
      ['witness', '？目击者', 79, 48, talkWitness],
      ['mannequin', '风衣模特', 52, 37, searchMannequin],
      ['rack', '其他衣架', 88, 61, () => { $('#eventFoot').textContent = '这里只有叠好的衣服。'; }]
    ];
    points.forEach(([id, label, x, y, action]) => {
      if (id === 'mannequin' && session.harbour.clues.size < 2) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `scene-hotspot ${id === 'mannequin' ? 'highlight' : ''}`;
      button.style.left = `${x}%`;
      button.style.top = `${y}%`;
      button.textContent = label;
      button.dataset.hotspot = id;
      button.onclick = id === 'mannequin' && session.harbour.clues.size < 2 ? null : action;
      layer.appendChild(button);
    });
    $('#eventSceneWrap').appendChild(layer);
  }

  function talkGuide() {
    const h = session.harbour;
    h.clues.add('guide');
    save();
    showHarbourLine('导购', '他大概十分钟前在风衣区照过镜子，当时手里还拿着一个信封，后来往收银台这边走了。', npc.guide, harbourHub, '【系统】获得线索①——阿明曾在风衣区停留。');
  }

  function talkWitness() {
    const h = session.harbour;
    h.clues.add('witness');
    save();
    showHarbourLine('线索 NPC · 目击者', '啊，我有印象！我好像看见他之前在那边风衣模特那里试穿，对着镜子比划了好久，说不定是那时候掉的。', npc.witness, () => {
      showHarbourLine('主控', '风衣模特……好，我去那边看看。', npc.heroHarbour, harbourHub, '【系统】获得线索②——重点搜查风衣模特；地图标记已更新。');
    });
  }

  function searchMannequin() {
    const h = session.harbour;
    if (h.clues.size < 2 || h.envelope) {
      $('#eventFoot').textContent = h.envelope ? '信封已经找到了，把它还给阿明吧。' : '先收集两条线索。';
      return;
    }
    if (h.search === 0) {
      h.search = 1;
      save();
      showHarbourLine('系统 · 第一次搜查', '一件卡其色长风衣，外面的口袋空空的，没发现信封。', artRoot + 'harbour/prop-mannequin.png', () => {
        showHarbourLine('主控（内心）', '再仔细看看，风衣里面还有内袋……', npc.heroHarbour, harbourHub, '【操作】再次点击高亮风衣模特，搜查内袋。');
      });
      return;
    }
    h.search = 2;
    h.envelope = true;
    save();
    showHarbourLine('系统 · 第二次搜查', '内袋里夹着一个牛皮纸信封，应该是他试穿时从外套口袋滑进去的。', artRoot + 'harbour/prop-mannequin.png', harbourHub, '【系统】获得关键物品【牛皮纸信封】。');
  }

  function returnEnvelope() {
    showHarbourLine('主控', '阿明，你看看这个是不是你的？', npc.heroHarbour, () => {
      session.harbour.returned = true;
      save();
      showHarbourLine('阿明', '是它！钱一分都没少！真的太谢谢你了！', npc.amingHappy, () => {
        showHarbourLine('主控', '下次外套口袋记得拉拉链，快收好吧。', npc.heroHarbour, () => {
          showHarbourLine('阿明', '你手里是不是也挑了衣服？走，我帮你结账，就当谢礼，不许拒绝！', npc.amingHappy, cashierEnding, '【系统】阿明状态更新：伤心 → 开心；前往收银台触发结局。');
        });
      });
    });
  }

  function cashierEnding() {
    showHarbourLine('导购', '您好，两件一起结账吗？', npc.guide, () => {
      showHarbourLine('阿明', '她那件我来付。加个联系方式吧，以后在香港还能互相照应。', npc.amingHappy, () => finish({
        title: '海港城迷踪 · 意外的谢礼', pass: true, art: artRoot + 'harbour/zara.webp',
        record: '帮阿明找回现金。本来只想买件打折风衣，结果还交到了朋友。\n奖励：所选风衣免单；成就「海港城活雷锋」；道具「阿明的联系方式」。',
        tip: '任务完成 · 风衣免单 · 成就「海港城活雷锋」 · 道具「阿明的联系方式」已存入背包',
        achievement: '海港城活雷锋', items: ['牛皮纸信封（已归还）', '阿明的联系方式', '风衣免单']
      }), '【系统】奖励结算：风衣免单、成就「海港城活雷锋」、道具「阿明的联系方式」。');
    });
  }

  function startHarbour(progress) {
    session.nodes = {};
    session.harbour = {
      accepted: Boolean(progress?.accepted), clues: new Set(progress?.clues || []),
      search: progress?.search || 0, envelope: Boolean(progress?.envelope), returned: Boolean(progress?.returned)
    };
    if (session.harbour.accepted) harbourHub();
    else harbourIntro();
  }

  function start(id, options = {}) {
    cancel();
    session = { id, ...options };
    const reference = $('#eventReferenceFrame');
    if (reference) reference.dataset.referenceSrc = id === 'tea'
      ? '../事件流程/红茶冰室-买单小突发事件.pdf#page=2&zoom=70&toolbar=0&navpanes=0'
      : id === 'harbour'
        ? '../事件流程/海港城迷踪-消失的现金.pdf#page=2&zoom=75&toolbar=0&navpanes=0'
        : 'assets/events/phone/02.webp';
    if ($('#eventReferenceTitle')) $('#eventReferenceTitle').textContent = id === 'tea'
      ? '红茶冰室 · NPC人物卡'
      : id === 'harbour' ? '海港城迷踪 · NPC人物页' : '陌生来电 · 原始事件分镜';
    if (id === 'tea') {
      session.title = '红茶冰室 · 买单小突发事件';
      session.nodes = teaNodes();
      go('t1');
    } else if (id === 'scam') {
      session.title = '陌生来电 · 反诈骗情景模拟';
      session.nodes = scamNodes;
      go('call');
    } else if (id === 'harbour') {
      session.title = '海港城迷踪 · 消失的现金';
      startHarbour(options.progress);
    }
  }

  function cancel() {
    clearTimers();
    clearHotspots();
    session = null;
  }

  function advance() {
    if (!session) return;
    const button = $('#eventOptions .event-choice');
    if (button) button.click();
  }

  document.addEventListener('keydown', event => {
    if (!session || !$('#eventOverlay').classList.contains('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      const callback = session.onCancel;
      cancel();
      callback?.();
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
      advance();
    }
  });

  window.StoryEngine = {
    start, cancel, advance,
    getSnapshot: () => session ? {
      id: session.id, nodeId: session.nodeId,
      harbour: session.harbour ? { accepted: session.harbour.accepted, clues: [...session.harbour.clues], search: session.harbour.search, envelope: session.harbour.envelope, returned: session.harbour.returned } : null
    } : null
  };
})();
