const app = document.querySelector('#app');
const modalRoot = document.querySelector('#modal-root');
const $ = (selector, root = document) => root.querySelector(selector);
const relicPool = [
  { name: 'Cinza de Fênix', icon: '🔥', desc: 'Recupere 2 de vida ao derrotar um inimigo.', effect: 'phoenix' },
  { name: 'Dente de Ferro', icon: '🦷', desc: '+2 de dano em todos os ataques.', effect: 'fang' },
  { name: 'Moeda da Sorte', icon: '🪙', desc: 'Encontre 50% mais ouro nos baús.', effect: 'fortune' },
  { name: 'Raiz Ancestral', icon: '🌿', desc: '+12 de vida máxima.', effect: 'root' },
  { name: 'Olho do Corvo', icon: '👁️', desc: 'Sua visão alcança mais longe.', effect: 'eye' },
  { name: 'Selo do Vazio', icon: '✦', desc: 'Sua habilidade recarrega a cada 4 turnos.', effect: 'void' },
  { name: 'Coração de Brasa', icon: '❤️‍🔥', desc: 'Ataques causam +1 de dano por andar.', effect: 'ember' },
  { name: 'Botas Errantes', icon: '🥾', desc: 'Esquiva ocasionalmente de ataques.', effect: 'boots' },
  { name: 'Ídolo de Sal', icon: '🧂', desc: 'Poções restauram 10 de vida extra.', effect: 'salt' },
  { name: 'Pena de Grifo', icon: '🪶', desc: 'Ganhe 1 de vida ao caminhar.', effect: 'feather' }
];
const classes = [
  { id: 'warrior', name: 'Guardião', icon: '⚔️', tagline: 'Aço e tenacidade', desc: 'Resistente, contundente e feito para ficar de pé. Sua investida atinge todos ao redor.', hp: 100, atk: 11, def: 3, skill: 'Investida', skillIcon: '✹' },
  { id: 'mage', name: 'Arcanista', icon: '🔮', tagline: 'Chama e mistério', desc: 'Pouca armadura, magia devastadora. Dispare um raio arcano contra o alvo mais próximo.', hp: 74, atk: 14, def: 1, skill: 'Raio arcano', skillIcon: 'ϟ' },
  { id: 'rogue', name: 'Errante', icon: '🗡️', tagline: 'Sombra e precisão', desc: 'Ágil e letal. Torne-se intocável por um instante e recupere vida.', hp: 84, atk: 12, def: 2, skill: 'Véu', skillIcon: '◌' }
];
const enemyBook = {
  rat: { name: 'Rato de cripta', icon: '🐀', hp: 18, atk: 5, xp: 12, gold: 3 },
  wisp: { name: 'Fogo-fátuo', icon: '👻', hp: 24, atk: 7, xp: 17, gold: 5 },
  skeleton: { name: 'Sentinela ossuda', icon: '💀', hp: 34, atk: 9, xp: 23, gold: 7 },
  knight: { name: 'Cavaleiro oco', icon: '🛡️', hp: 48, atk: 11, xp: 30, gold: 10 },
  boss: { name: 'O Devorador', icon: '🐉', hp: 145, atk: 15, xp: 120, gold: 55 }
};
let game = null;
let selectedClass = classes[0];
let soundOn = false;
let audioContext = null;
let toastTimer;
let runCount = Number(localStorage.getItem('cinzas-runs') || 0);
$('#footer-run').textContent = `RUN ${String(runCount).padStart(3, '0')}`;
$('#help-btn').addEventListener('click', showHelp);
$('#sound-btn').addEventListener('click', () => {
  soundOn = !soundOn;
  $('#sound-btn').textContent = soundOn ? '♫' : '♪';
  toast(soundOn ? 'Sons de exploração ativados' : 'Sons desativados');
  if (soundOn) playTone(440, .08);
});

function rngInt(max) { return Math.floor(Math.random() * max); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function distance(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
function playTone(freq = 220, duration = .08) {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator(), gain = audioContext.createGain();
    osc.frequency.value = freq; osc.type = 'sine'; gain.gain.value = .045;
    osc.connect(gain); gain.connect(audioContext.destination); osc.start(); gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration); osc.stop(audioContext.currentTime + duration);
  } catch (_) { /* audio is optional */ }
}
function showToast(message) {
  let node = $('.toast');
  if (!node) { node = document.createElement('div'); node.className = 'toast'; document.body.append(node); }
  node.textContent = message; node.classList.add('show'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('show'), 1550);
}
function toast(message) { showToast(message); }
function showModal(content) { modalRoot.innerHTML = `<div class="overlay"><section class="modal-card">${content}</section></div>`; }
function closeModal() { modalRoot.innerHTML = ''; }
function renderTitle() {
  $('#top-status').textContent = 'A DESCIDA COMEÇA';
  app.innerHTML = `<section class="title-screen">
    <div class="title-copy"><div class="eyebrow">UM ROGUELIKE DE FANTASIA SOMBRIA</div>
      <h1>Cripta <span>de Cinzas</span></h1>
      <p class="intro">Sob uma cidade esquecida, a cripta respira. Desça por salões tomados pela noite, reúna relíquias e enfrente aquilo que espera no fundo.</p>
      <div class="title-meta"><div><small>5 ANDARES</small><strong>Uma descida sem volta</strong></div><div><small>3 CAMINHOS</small><strong>Escolha seu destino</strong></div></div>
      <button class="primary-btn" id="start-btn">INICIAR DESCIDA <span>↗</span></button>
      ${localStorage.getItem('cinzas-best') ? `<button class="continue-run" id="records-btn">MELHOR: ${localStorage.getItem('cinzas-best')} OURO</button>` : ''}
    </div>
    <div class="hero-art" aria-hidden="true"><div class="moon"></div><div class="spire"></div><div class="stair-light"></div><div class="hero-caption">A CRIPTA NÃO ESQUECE.</div></div>
  </section>`;
  $('#seed-label').textContent = '—';
  $('#start-btn').addEventListener('click', showClassPicker);
  $('#records-btn')?.addEventListener('click', () => toast(`Você já provou que pode ir mais longe.`));
}
function showClassPicker() {
  let chosen = selectedClass.id;
  showModal(`<div class="eyebrow">PRIMEIRO, ESCOLHA SEU CAMINHO</div><h2>Quem desce?</h2><p>Cada jornada começa com uma escolha. Não há retorno — apenas aquilo que você leva consigo.</p>
    <div class="class-grid">${classes.map(c => `<button class="choice-card ${c.id === chosen ? 'selected' : ''}" data-class="${c.id}"><span class="choice-icon">${c.icon}</span><strong>${c.name}</strong><small>${c.tagline}<br>VIDA ${c.hp} · ATAQUE ${c.atk}<br>${c.desc}</small></button>`).join('')}</div>
    <div class="modal-actions"><span class="modal-hint">WASD ou setas para mover<br>Sobreviva. Descubra. Desça.</span><button class="primary-btn" id="begin-btn">DESCER À CRIPTA <span>↘</span></button></div>`);
  modalRoot.querySelectorAll('[data-class]').forEach(button => button.addEventListener('click', () => {
    chosen = button.dataset.class; modalRoot.querySelectorAll('[data-class]').forEach(card => card.classList.toggle('selected', card === button));
  }));
  $('#begin-btn').addEventListener('click', () => { selectedClass = classes.find(c => c.id === chosen); startRun(); });
}
function startRun() {
  runCount++; localStorage.setItem('cinzas-runs', runCount); $('#footer-run').textContent = `RUN ${String(runCount).padStart(3, '0')}`;
  game = { hero: { ...selectedClass, hp: selectedClass.hp, maxHp: selectedClass.hp, xp: 0, level: 1, gold: 0, potions: 2, relics: [], kills: 0, turns: 0, skillCooldown: 0, floor: 1, evasion: 0 }, log: [], floor: null, status: 'playing', seed: Math.random().toString(36).slice(2, 8).toUpperCase() };
  $('#seed-label').textContent = game.seed; $('#top-status').textContent = 'EXPEDIÇÃO EM CURSO'; closeModal(); buildFloor(); addLog(`A pedra se fecha atrás de você. A descida começa.`); renderGame();
}
function buildFloor() {
  const W = 29, H = 19, grid = Array.from({ length: H }, () => Array(W).fill(0));
  const rooms = [];
  const count = 6 + rngInt(2);
  for (let attempt = 0; attempt < 120 && rooms.length < count; attempt++) {
    const w = 4 + rngInt(4), h = 3 + rngInt(3), x = 1 + rngInt(W - w - 2), y = 1 + rngInt(H - h - 2);
    if (rooms.some(r => x < r.x + r.w + 1 && x + w + 1 > r.x && y < r.y + r.h + 1 && y + h + 1 > r.y)) continue;
    const room = { x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) }; rooms.push(room);
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) grid[yy][xx] = 1;
  }
  rooms.sort((a, b) => a.cx - b.cx);
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i - 1], b = rooms[i];
    if (Math.random() < .5) { carveH(grid, a.cx, b.cx, a.cy); carveV(grid, a.cy, b.cy, b.cx); }
    else { carveV(grid, a.cy, b.cy, a.cx); carveH(grid, a.cx, b.cx, b.cy); }
  }
  const start = rooms[0] || { cx: 3, cy: 3, x: 2, y: 2, w: 4, h: 3 };
  if (!rooms.length) for (let y = 2; y < 5; y++) for (let x = 2; x < 6; x++) grid[y][x] = 1;
  const end = rooms[rooms.length - 1] || start;
  const floor = { W, H, grid, rooms, start: { x: start.cx, y: start.cy }, stairs: { x: end.cx, y: end.cy }, explored: new Set(), enemies: [], items: [], turn: 0 };
  if (distance(floor.start, floor.stairs) < 8) { const r = rooms[rooms.length - 1]; floor.stairs = { x: r.x + r.w - 2, y: r.y + r.h - 2 }; }
  game.floor = floor;
  game.hero.x = floor.start.x;
  game.hero.y = floor.start.y;
  const bossFloor = game.hero.floor === 5;
  const available = game.hero.floor <= 1 ? ['rat', 'wisp'] : game.hero.floor <= 3 ? ['rat', 'wisp', 'skeleton'] : ['wisp', 'skeleton', 'knight'];
  if (bossFloor) {
    floor.stairs = null;
    const room = rooms[rooms.length - 1] || end;
    floor.enemies.push(createEnemy('boss', room.cx, room.cy));
  }
  const free = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (!grid[y][x] || (x === floor.start.x && y === floor.start.y) || (floor.stairs && x === floor.stairs.x && y === floor.stairs.y)) continue;
    if (distance({ x, y }, floor.start) < 5 || (floor.stairs && distance({ x, y }, floor.stairs) < 2)) continue;
    free.push({ x, y });
  }
  const shuffle = arr => arr.sort(() => Math.random() - .5);
  shuffle(free);
  const enemyCount = 3 + game.hero.floor * 2 + rngInt(3);
  for (let i = 0; i < enemyCount && free.length; i++) {
    const pos = free.pop(), type = available[rngInt(available.length)];
    floor.enemies.push(createEnemy(type, pos.x, pos.y));
  }
  for (let i = 0; i < 2 + rngInt(2) && free.length; i++) floor.items.push({ type: 'potion', ...free.pop() });
  for (let i = 0; i < 2 + rngInt(3) && free.length; i++) floor.items.push({ type: 'chest', ...free.pop(), opened: false });
  for (let i = 0; i < 4 + rngInt(4) && free.length; i++) floor.items.push({ type: 'gold', ...free.pop(), amount: 5 + rngInt(13) });
  revealFog();
}
function carveH(grid, x1, x2, y) { for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) grid[y][x] = 1; }
function carveV(grid, y1, y2, x) { for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) grid[y][x] = 1; }
function createEnemy(type, x, y) {
  const data = enemyBook[type], scale = Math.max(0, game.hero.floor - 1);
  return { type, x, y, hp: data.hp + scale * (type === 'boss' ? 8 : 3), maxHp: data.hp + scale * (type === 'boss' ? 8 : 3), atk: data.atk + Math.floor(scale * .8), alive: true, alert: false };
}
function revealFog() {
  const hero = game.hero, radius = 5 + (hero.relics.some(r => r.effect === 'eye') ? 3 : 0);
  for (let y = 0; y < game.floor.H; y++) for (let x = 0; x < game.floor.W; x++) if (distance({ x, y }, hero) <= radius) game.floor.explored.add(`${x},${y}`);
}
function renderGame() {
  if (!game) return;
  const h = game.hero, f = game.floor, bossFloor = h.floor === 5;
  $('#top-status').textContent = bossFloor ? 'O FIM DA DESCIDA' : 'EXPEDIÇÃO EM CURSO';
  const target = f.enemies.filter(e => e.alive).sort((a, b) => distance(a, h) - distance(b, h))[0];
  app.innerHTML = `<section class="game-layout">
    <aside class="side-panel">
      <div class="panel-heading">A SUA JORNADA <span>✦ ${h.level}</span></div>
      <div class="character-card"><div class="avatar">${h.icon}</div><div><div class="character-name">${h.name}</div><div class="character-class">${h.tagline.toUpperCase()}</div></div></div>
      <div class="stats-block">
        <div class="stat-line"><span>Vida</span><strong>${h.hp} / ${h.maxHp}</strong></div><div class="bar"><span class="hp-fill" style="width:${100 * h.hp / h.maxHp}%"></span></div>
        <div class="stat-line" style="margin-top:11px"><span>Experiência · Nv. ${h.level}</span><strong>${h.xp} / ${xpGoal()}</strong></div><div class="bar"><span class="xp-fill" style="width:${100 * h.xp / xpGoal()}%"></span></div>
      </div>
      <hr class="divider">
      <div class="mini-stats"><div class="mini-stat"><span>ATAQUE</span><strong>⚔ ${effectiveAttack()}</strong></div><div class="mini-stat"><span>ARMADURA</span><strong>⬟ ${h.def}</strong></div><div class="mini-stat"><span>OURO</span><strong>◈ ${h.gold}</strong></div><div class="mini-stat"><span>ABATES</span><strong>☠ ${h.kills}</strong></div></div>
      <div class="relics-block"><div class="panel-heading" style="margin-bottom:8px">RELÍQUIAS <span>${h.relics.length}/5</span></div><div class="relic-list">${h.relics.length ? h.relics.map(r => `<span class="relic-chip" title="${r.desc}"><span>${r.icon}</span>${r.name}</span>`).join('') : '<span class="empty-enemy">Nenhuma encontrada.</span>'}</div></div>
      <div class="inventory-block"><div class="panel-heading" style="margin-bottom:8px">ALFORJE</div><div class="inventory-row"><div class="slot" title="Poção de cura">🧪<small>${h.potions}</small></div><div class="slot" title="Sua habilidade: ${h.skill}">${h.skillIcon}<small>${h.skillCooldown ? h.skillCooldown : 'OK'}</small></div><div class="slot" title="Andar atual">⌖<small>${h.floor}/5</small></div></div></div>
    </aside>
    <section class="board-panel">
      <div class="board-top"><div class="floor-name">${floorNames[h.floor - 1]}<small>ANDAR ${String(h.floor).padStart(2, '0')} · ${bossFloor ? 'CÂMARA DO DEVORADOR' : `${f.enemies.filter(e => e.alive).length} PRESENÇAS HOSTIS`}</small></div><div class="floor-badge">${bossFloor ? 'CHEFE FINAL' : `NÍVEL ${h.floor} / 5`}</div></div>
      <div class="map-wrap"><div class="dungeon-map" id="dungeon-map" style="--cols:${f.W}">${renderTiles()}</div></div>
      <div class="map-tooltip">${bossFloor ? 'Encontre e derrote o Devorador.' : 'Explore as salas. Encontre as escadas para descer.'}</div>
      <div class="board-bottom"><div class="action-buttons"><button class="action-btn" id="skill-btn">${h.skillIcon} ${h.skill} <em>[Q]</em></button><button class="action-btn" id="potion-btn">🧪 Poção <em>[I] ×${h.potions}</em></button></div><span class="floor-progress">TURNO ${String(f.turn).padStart(3, '0')}</span></div>
      <div class="mobile-controls"><button data-move="0,-1" aria-label="Mover para cima">↑</button><button data-move="-1,0" aria-label="Mover para esquerda">←</button><button class="wait-control" data-wait="true">ESPERAR · ESPAÇO</button><button data-move="1,0" aria-label="Mover para direita">→</button><button data-move="0,1" aria-label="Mover para baixo">↓</button></div>
      <div class="log-panel"><div class="log-title">✳ &nbsp; DIÁRIO DA DESCIDA</div>${game.log.slice(0, 3).map(line => `<div class="log-line">${line}</div>`).join('')}</div>
    </section>
    <aside class="side-panel right-panel"><div class="panel-heading">SINAIS DA CRIPTA <span>⌁</span></div>
      <div class="objective"><strong>${bossFloor ? 'ÚLTIMO OBJETIVO' : 'OBJETIVO ATUAL'}</strong>${bossFloor ? 'Enfrente o Devorador e encerre a maldição.' : `Encontre a saída do ${ordinal(h.floor)} andar. ${f.enemies.filter(e => e.alive).length ? 'Não baixe a guarda.' : 'O silêncio é um bom sinal.'}`}</div>
      <div class="enemy-card">${target ? `<div class="enemy-head"><span>${enemyBook[target.type].icon}</span>${enemyBook[target.type].name}</div><div class="stat-line" style="margin-top:9px"><span>${distance(target, h) <= 5 ? (target.alert ? 'À sua caça' : 'Nas sombras') : 'Distante'}</span><strong>${target.hp} / ${target.maxHp}</strong></div><div class="bar"><span class="hp-fill" style="width:${100 * target.hp / target.maxHp}%"></span></div><p>${enemyDescriptions[target.type]}</p>` : '<div class="empty-enemy">Nenhum sinal hostil. Aproveite o silêncio enquanto dura.</div>'}</div>
      <div class="guide-card"><strong>✧ &nbsp; LEMBRE-SE</strong><p>Inimigos só se movem quando você age. Use paredes e corredores a seu favor. Baús escondem ouro ou relíquias.</p></div>
    </aside>
  </section>`;
  $('#seed-label').textContent = game.seed;
  const map = $('#dungeon-map');
  map.addEventListener('click', event => { const tile = event.target.closest('.tile'); if (!tile) return; const dx = Number(tile.dataset.x) - h.x, dy = Number(tile.dataset.y) - h.y; if (Math.abs(dx) + Math.abs(dy) === 1) moveHero(dx, dy); });
  $('#skill-btn').addEventListener('click', useSkill); $('#potion-btn').addEventListener('click', usePotion);
  app.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () => { const [dx, dy] = button.dataset.move.split(',').map(Number); moveHero(dx, dy); }));
  $('[data-wait]')?.addEventListener('click', waitTurn);
}
const floorNames = ['Asoleiro', 'Galerias Afogadas', 'Jardins de Sal', 'Arquivo Sepulto', 'Câmara do Devorador'];
const enemyDescriptions = { rat: 'Pequeno, faminto e rápido. Costuma atacar em grupo.', wisp: 'Uma alma perdida que flutua entre as paredes.', skeleton: 'Um antigo guarda que ainda protege seu juramento.', knight: 'Armadura vazia, lâmina cheia de rancor.', boss: 'A fome que mora no fundo da cripta. A lenda não exagerava.' };
function ordinal(n) { return ['primeiro', 'segundo', 'terceiro', 'quarto', 'quinto'][n - 1] || `${n}º`; }
function xpGoal() { return game.hero.level * 45; }
function effectiveAttack() { const h = game.hero; return h.atk + h.level - 1 + (h.relics.some(r => r.effect === 'fang') ? 2 : 0); }
function renderTiles() {
  const f = game.floor, h = game.hero, visible = new Set();
  const radius = 5 + (h.relics.some(r => r.effect === 'eye') ? 3 : 0);
  for (let y = 0; y < f.H; y++) for (let x = 0; x < f.W; x++) if (distance({ x, y }, h) <= radius) visible.add(`${x},${y}`);
  let html = '';
  for (let y = 0; y < f.H; y++) for (let x = 0; x < f.W; x++) {
    const key = `${x},${y}`, seen = f.explored.has(key), lit = visible.has(key), wall = !f.grid[y][x];
    let type = seen ? wall ? 'wall' : lit ? 'floor' : 'floor shade' : 'hidden', icon = '';
    if (lit && h.x === x && h.y === y) { type += ' player'; icon = h.icon; }
    else if (lit) {
      const enemy = f.enemies.find(e => e.alive && e.x === x && e.y === y);
      const item = f.items.find(i => i.x === x && i.y === y && (i.type !== 'chest' || !i.opened));
      if (enemy) { type += enemy.type === 'boss' ? ' boss' : ' enemy'; icon = enemyBook[enemy.type].icon; }
      else if (item) { type += ` ${item.type}`; icon = item.type === 'chest' ? '▣' : item.type === 'gold' ? '✧' : '⚗'; }
      else if (f.stairs && f.stairs.x === x && f.stairs.y === y) { type += ' stairs'; icon = '⇣'; }
    } else if (seen && !wall && f.stairs && f.stairs.x === x && f.stairs.y === y) { type += ' stairs'; icon = '⇣'; }
    html += `<div class="tile ${type}" data-x="${x}" data-y="${y}">${icon}</div>`;
  }
  return html;
}
function addLog(text) { game.log.unshift(text); game.log = game.log.slice(0, 20); }
function isWalkable(x, y) { return x >= 0 && y >= 0 && x < game.floor.W && y < game.floor.H && game.floor.grid[y][x] === 1; }
function enemyAt(x, y) { return game.floor.enemies.find(e => e.alive && e.x === x && e.y === y); }
function moveHero(dx, dy) {
  if (!game || game.status !== 'playing') return;
  const h = game.hero, nx = h.x + dx, ny = h.y + dy;
  if (!isWalkable(nx, ny)) { playTone(100, .035); return; }
  const enemy = enemyAt(nx, ny);
  if (enemy) { attackEnemy(enemy); finishAction(); return; }
  h.x = nx; h.y = ny; h.turns++; game.floor.turn++; revealFog();
  if (h.relics.some(r => r.effect === 'feather')) h.hp = Math.min(h.maxHp, h.hp + 1);
  collectAtHero();
  if (game.status === 'playing') finishAction(true);
}
function collectAtHero() {
  const h = game.hero, f = game.floor;
  const itemIndex = f.items.findIndex(i => i.x === h.x && i.y === h.y && (i.type !== 'chest' || !i.opened));
  if (itemIndex >= 0) {
    const item = f.items[itemIndex];
    if (item.type === 'gold') { h.gold += item.amount; addLog(`<span class="log-gold">✧ Você recolhe ${item.amount} peças de ouro.</span>`); f.items.splice(itemIndex, 1); playTone(660); }
    if (item.type === 'potion') { h.potions++; addLog('Você encontrou uma poção de cura.'); f.items.splice(itemIndex, 1); playTone(510); }
    if (item.type === 'chest') {
      item.opened = true; const coins = Math.round((22 + rngInt(28)) * (h.relics.some(r => r.effect === 'fortune') ? 1.5 : 1)); h.gold += coins;
      addLog(`<span class="log-gold">O baú guarda ${coins} peças de ouro.</span>`); playTone(740);
      if (Math.random() < .6 && h.relics.length < 5) { const owned = new Set(h.relics.map(r => r.effect)); const options = relicPool.filter(r => !owned.has(r.effect)); if (options.length) { const relic = options[rngInt(options.length)]; h.relics.push(relic); addLog(`Uma relíquia antiga: ${relic.icon} ${relic.name}.`); toast(`Relíquia encontrada: ${relic.name}`); if (relic.effect === 'root') { h.maxHp += 12; h.hp = Math.min(h.maxHp, h.hp + 12); } } }
    }
  }
  if (f.stairs && h.x === f.stairs.x && h.y === f.stairs.y) descend();
}
function attackEnemy(enemy, bonus = 0) {
  const h = game.hero, damage = Math.max(1, effectiveAttack() + bonus + (h.relics.some(r => r.effect === 'ember') ? h.floor : 0) + rngInt(5) - 2);
  enemy.hp -= damage; enemy.alert = true; playTone(enemy.hp <= 0 ? 180 : 290, .075);
  addLog(`Você atinge ${enemyBook[enemy.type].name} por ${damage} de dano.`);
  if (enemy.hp <= 0) {
    enemy.alive = false; h.kills++; h.xp += enemyBook[enemy.type].xp; const coins = enemyBook[enemy.type].gold; h.gold += coins;
    addLog(`<span class="log-gold">${enemyBook[enemy.type].name} cai. +${enemyBook[enemy.type].xp} XP, +${coins} ouro.</span>`);
    if (h.relics.some(r => r.effect === 'phoenix')) h.hp = Math.min(h.maxHp, h.hp + 2);
    if (enemy.type === 'boss') { game.status = 'victory'; setTimeout(showVictory, 220); }
  }
}
function finishAction(moved = false) {
  if (game.status !== 'playing') { renderGame(); return; }
  enemyTurn();
  if (game.status !== 'playing') return;
  const h = game.hero;
  if (h.skillCooldown > 0) h.skillCooldown--;
  if (h.xp >= xpGoal()) { beginLevelUp(); return; }
  renderGame();
}
function enemyTurn() {
  const h = game.hero, f = game.floor;
  for (const enemy of f.enemies) {
    if (!enemy.alive || game.status !== 'playing') continue;
    const dist = distance(enemy, h);
    if (dist <= 1) {
      const bootDodge = h.relics.some(r => r.effect === 'boots') && Math.random() < .16;
      if (h.evasion > 0 || bootDodge) { addLog(`${enemyBook[enemy.type].name} golpeia o vazio.`); continue; }
      const damage = Math.max(1, enemy.atk - h.def - rngInt(3)); h.hp -= damage; enemy.alert = true;
      addLog(`<span style="color:#cf7168">${enemyBook[enemy.type].name} fere você por ${damage}.</span>`); playTone(120, .1);
      if (h.hp <= 0) { h.hp = 0; game.status = 'dead'; setTimeout(showGameOver, 180); break; }
    } else if (dist <= 7) {
      enemy.alert = true;
      const directions = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}].sort((a,b) => distance({x:enemy.x+a.x,y:enemy.y+a.y}, h) - distance({x:enemy.x+b.x,y:enemy.y+b.y}, h));
      const options = directions.filter(d => isWalkable(enemy.x + d.x, enemy.y + d.y) && !(enemy.x + d.x === h.x && enemy.y + d.y === h.y) && !enemyAt(enemy.x + d.x, enemy.y + d.y));
      if (options.length && distance(enemy, h) <= 7) { enemy.x += options[0].x; enemy.y += options[0].y; }
    }
  }
  if (h.evasion > 0) h.evasion--;
}
function useSkill() {
  if (!game || game.status !== 'playing') return;
  const h = game.hero;
  if (h.skillCooldown > 0) { toast(`Habilidade em recarga: ${h.skillCooldown} turnos.`); return; }
  const enemies = game.floor.enemies.filter(e => e.alive);
  if (h.id === 'warrior') {
    const nearby = enemies.filter(e => distance(e, h) <= 1);
    if (!nearby.length) { toast('Nenhum inimigo ao alcance da investida.'); return; }
    addLog('Você gira a arma em uma investida feroz!'); nearby.forEach(enemy => attackEnemy(enemy, 3));
  } else if (h.id === 'mage') {
    const target = enemies.filter(e => distance(e, h) <= 8).sort((a,b) => distance(a,h)-distance(b,h))[0];
    if (!target) { toast('Nenhuma presença ao alcance do raio.'); return; }
    addLog('Um raio arcano rasga o silêncio!'); attackEnemy(target, 13);
  } else {
    h.evasion = 2; const heal = Math.min(20, h.maxHp - h.hp); h.hp += heal;
    addLog(`Você se dissolve no Véu e recupera ${heal} de vida.`); playTone(520, .15);
  }
  h.skillCooldown = h.relics.some(r => r.effect === 'void') ? 4 : 6;
  game.hero.turns++; game.floor.turn++; finishAction();
}
function usePotion() {
  if (!game || game.status !== 'playing') return;
  const h = game.hero;
  if (!h.potions) { toast('Você não tem poções.'); return; }
  if (h.hp === h.maxHp) { toast('Sua vida já está cheia.'); return; }
  h.potions--; const heal = Math.min(h.maxHp - h.hp, 32 + (h.relics.some(r => r.effect === 'salt') ? 10 : 0)); h.hp += heal;
  addLog(`Você bebe uma poção e recupera ${heal} de vida.`); playTone(520, .12); game.floor.turn++; h.turns++; finishAction();
}
function waitTurn() {
  if (!game || game.status !== 'playing') return;
  addLog('Você aguarda, atento aos ecos.'); game.floor.turn++; game.hero.turns++; finishAction();
}
function descend() {
  const h = game.hero;
  if (h.floor >= 5) return;
  h.floor++; h.hp = Math.min(h.maxHp, h.hp + Math.ceil(h.maxHp * .18)); h.potions++;
  addLog(`Você desce ao ${ordinal(h.floor)} andar. A jornada continua.`); buildFloor(); revealFog(); playTone(330, .2); renderGame();
}
function beginLevelUp() {
  const h = game.hero; h.xp -= xpGoal(); h.level++; h.maxHp += 5; h.hp = Math.min(h.maxHp, h.hp + 18);
  game.status = 'reward'; showLevelReward();
}
function showLevelReward() {
  const rewards = [
    { icon: '⚔️', name: 'Fio afiado', desc: 'Aumenta o dano base em 3.', apply: h => h.atk += 3 },
    { icon: '🛡️', name: 'Vigor antigo', desc: '+16 de vida máxima e recupera 16.', apply: h => { h.maxHp += 16; h.hp = Math.min(h.maxHp, h.hp + 16); } },
    { icon: '⬟', name: 'Armadura rúnica', desc: 'Aumenta sua armadura em 2.', apply: h => h.def += 2 },
    { icon: '🧪', name: 'Alquimia', desc: 'Recebe duas poções de cura.', apply: h => h.potions += 2 },
    { icon: '✧', name: 'Bolsa funda', desc: 'Recebe 45 peças de ouro.', apply: h => h.gold += 45 },
    { icon: '✹', name: 'Ritmo de batalha', desc: 'Sua habilidade recarrega mais rápido.', apply: h => h.skillCooldown = Math.max(0, h.skillCooldown - 2) }
  ];
  const options = rewards.sort(() => Math.random() - .5).slice(0, 3);
  showModal(`<div class="eyebrow">A EXPERIÊNCIA TRANSFORMA</div><h2>Nível ${game.hero.level}</h2><p>Algo em você mudou. Escolha um aprimoramento para continuar a descida.</p><div class="reward-grid">${options.map((r,i) => `<button class="choice-card reward-card" data-reward="${i}"><span class="choice-icon">${r.icon}</span><strong>${r.name}</strong><small>${r.desc}</small></button>`).join('')}</div><div class="modal-actions"><span class="modal-hint">A escolha é permanente.<br>Que sua força seja suficiente.</span></div>`);
  modalRoot.querySelectorAll('[data-reward]').forEach(button => button.addEventListener('click', () => {
    options[Number(button.dataset.reward)].apply(game.hero); addLog(`Aprimoramento escolhido: ${options[Number(button.dataset.reward)].name}.`); game.status = 'playing'; closeModal();
    if (game.hero.xp >= xpGoal()) beginLevelUp(); else renderGame();
  }));
}
function showGameOver() {
  if (!game) return;
  $('#top-status').textContent = 'A CRIPTA VENCEU';
  const h = game.hero, best = Number(localStorage.getItem('cinzas-best') || 0);
  if (h.gold > best) localStorage.setItem('cinzas-best', h.gold);
  showModal(`<div class="eyebrow">A PEDRA SE FECHA</div><h2>As cinzas recebem você.</h2><p>Esta descida terminou no ${ordinal(h.floor)} andar. A cripta ainda guarda seus segredos — e a próxima jornada pode ir mais longe.</p>
    <div class="death-stats"><div><small>ANDARES</small><strong>${h.floor} / 5</strong></div><div><small>INIMIGOS</small><strong>${h.kills}</strong></div><div><small>OURO</small><strong>${h.gold}</strong></div></div>
    <div class="modal-actions"><span class="modal-hint">A cada descida, um novo mapa.<br>Nenhuma vida é em vão.</span><button class="primary-btn" id="again-btn">TENTAR DE NOVO <span>↻</span></button></div>`);
  $('#again-btn').addEventListener('click', () => { game = null; renderTitle(); showClassPicker(); });
}
function showVictory() {
  if (!game) return;
  $('#top-status').textContent = 'A MALDIÇÃO FOI QUEBRADA';
  const h = game.hero, best = Number(localStorage.getItem('cinzas-best') || 0);
  if (h.gold > best) localStorage.setItem('cinzas-best', h.gold);
  showModal(`<div class="eyebrow">O SILÊNCIO VOLTA À CRIPTA</div><h2>A maldição se desfaz.</h2><p>O Devorador cai. Pela primeira vez em séculos, a cidade poderá dormir. Você fez a descida completa — e voltou com histórias.</p>
    <div class="death-stats"><div><small>NÍVEL</small><strong>${h.level}</strong></div><div><small>INIMIGOS</small><strong>${h.kills}</strong></div><div><small>OURO</small><strong>${h.gold}</strong></div></div>
    <div class="modal-actions"><span class="modal-hint">Uma vitória rara.<br>A cripta sempre se rearranja.</span><button class="primary-btn" id="again-btn">OUTRA DESCIDA <span>↻</span></button></div>`);
  $('#again-btn').addEventListener('click', () => { game = null; renderTitle(); showClassPicker(); });
}
function showHelp() {
  if (game && game.status === 'playing') {
    showModal(`<div class="eyebrow">GUIA DO EXPLORADOR</div><h2>Como sobreviver</h2><p>Mova-se com <b>WASD</b> ou as <b>setas</b>. No celular, use os controles abaixo do mapa. Ao caminhar contra um inimigo, você ataca. Cada ação dá aos monstros uma chance de agir.</p><p><b>Q</b> usa sua habilidade de classe · <b>I</b> bebe uma poção · <b>Espaço</b> espera um turno · <b>Esc</b> fecha este guia. Explore para revelar o mapa, abra baús e pise nas escadas para descer.</p><div class="modal-actions"><span class="modal-hint">Poções restauram vida.<br>Relíquias mudam sua jornada.</span><button class="primary-btn" id="close-help">ENTENDI <span>✓</span></button></div>`);
    $('#close-help').addEventListener('click', closeModal);
  } else {
    showModal(`<div class="eyebrow">GUIA DO EXPLORADOR</div><h2>Uma descida sem volta</h2><p>Escolha uma classe, explore cinco andares gerados para esta jornada e enfrente a criatura no fundo. Combate por turnos: seus inimigos só agem depois de cada movimento ou ação.</p><p>WASD / setas movem · Q habilidade · I poção · Espaço espera · Esc fecha</p><div class="modal-actions"><span class="modal-hint">Descubra baús, reúna relíquias<br>e alcance a última câmara.</span><button class="primary-btn" id="close-help">FECHAR <span>✓</span></button></div>`);
    $('#close-help').addEventListener('click', closeModal);
  }
}
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { closeModal(); return; }
  if (!game || game.status !== 'playing' || modalRoot.innerHTML) return;
  const key = event.key.toLowerCase();
  const moves = { ArrowUp: [0,-1], w: [0,-1], ArrowDown: [0,1], s: [0,1], ArrowLeft: [-1,0], a: [-1,0], ArrowRight: [1,0], d: [1,0] };
  if (moves[event.key] || moves[key]) { event.preventDefault(); const [dx,dy] = moves[event.key] || moves[key]; moveHero(dx,dy); }
  else if (key === 'q') useSkill();
  else if (key === 'i') usePotion();
  else if (event.code === 'Space') { event.preventDefault(); waitTurn(); }
});
renderTitle();
