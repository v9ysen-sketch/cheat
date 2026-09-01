/* ================================================================
   CRATER — shared app: state, storage, header, toasts, format.
   ================================================================ */

window.CRATER = window.CRATER || {};

// ---------- Storage ---------- //
const K_STATE = 'crater.state.v1';

CRATER.defaultState = function() {
  return {
    balance: 15000,
    profile: null,      // {name, avatar, steamId, since}
    inventory: [],      // [{...item, gainedAt, caseId, caseName}]
    history: [],        // last 200 drop rows
    stats: { opened: 0, spent: 0, earned: 0, bestPrice: 0, bestItem: null, upgradesWon: 0, upgradesLost: 0 },
    prefs: { speed: 'normal', upgradeSpeed: 'normal', cookiesSeen: false },
  };
};

CRATER.loadState = function() {
  try {
    const raw = localStorage.getItem(K_STATE);
    if (!raw) return CRATER.defaultState();
    const parsed = JSON.parse(raw);
    // migrate: ensure fields exist
    const def = CRATER.defaultState();
    return Object.assign(def, parsed, {
      stats: Object.assign(def.stats, parsed.stats || {}),
      prefs: Object.assign(def.prefs, parsed.prefs || {}),
    });
  } catch (e) {
    return CRATER.defaultState();
  }
};

CRATER.saveState = function() {
  try { localStorage.setItem(K_STATE, JSON.stringify(CRATER.state)); } catch (e) {}
};

CRATER.state = CRATER.loadState();

// ---------- Rank ---------- //
CRATER.RANKS = [
  { key: 'rookie',   name: 'Рекрут',    minOpened: 0,    minSpent: 0,        color: '#8a988a', icon: '▲' },
  { key: 'novice',   name: 'Новобранец',minOpened: 5,    minSpent: 5000,     color: '#b0c3d9', icon: '▲' },
  { key: 'trainee',  name: 'Стажёр',    minOpened: 15,   minSpent: 25000,    color: '#5e98d9', icon: '▲▲' },
  { key: 'operator', name: 'Оператор',  minOpened: 40,   minSpent: 100000,   color: '#4b69ff', icon: '▲▲▲' },
  { key: 'veteran',  name: 'Ветеран',   minOpened: 100,  minSpent: 500000,   color: '#8847ff', icon: '★' },
  { key: 'elite',    name: 'Элита',     minOpened: 250,  minSpent: 2000000,  color: '#d32ce6', icon: '★★' },
  { key: 'master',   name: 'Мастер',    minOpened: 500,  minSpent: 5000000,  color: '#eb4b4b', icon: '★★★' },
  { key: 'legend',   name: 'Легенда',   minOpened: 1000, minSpent: 20000000, color: '#ffd700', icon: '☆' },
  { key: 'mythic',   name: 'Мифик',     minOpened: 2500, minSpent: 100000000,color: '#2be07b', icon: '❖' },
];
CRATER.getRank = function() {
  const s = CRATER.state.stats || {};
  const opened = s.opened || 0;
  const spent = s.spent || 0;
  let cur = CRATER.RANKS[0], next = null;
  for (let i = 0; i < CRATER.RANKS.length; i++) {
    const r = CRATER.RANKS[i];
    if (opened >= r.minOpened || spent >= r.minSpent) cur = r;
  }
  const idx = CRATER.RANKS.indexOf(cur);
  next = CRATER.RANKS[idx + 1] || null;
  let progress = 1;
  if (next) {
    // progress = max of opened/spent progress
    const po = next.minOpened > 0 ? Math.min(1, opened / next.minOpened) : 0;
    const ps = next.minSpent > 0 ? Math.min(1, spent / next.minSpent) : 0;
    progress = Math.max(po, ps);
  }
  return { current: cur, next, progress };
};

// ---------- Daily bonus ---------- //
CRATER.DAILY_BONUS = 5000;
CRATER.DAILY_MS = 24 * 60 * 60 * 1000;
CRATER.canClaimDaily = function() {
  const last = CRATER.state.lastDaily || 0;
  return (Date.now() - last) >= CRATER.DAILY_MS;
};
CRATER.claimDaily = function() {
  if (!CRATER.canClaimDaily()) return 0;
  CRATER.state.lastDaily = Date.now();
  CRATER.state.dailyStreak = (CRATER.state.dailyStreak || 0) + 1;
  CRATER.saveState();
  const bonus = CRATER.DAILY_BONUS + Math.min(CRATER.state.dailyStreak, 7) * 500;
  CRATER.addBalance(bonus);
  return bonus;
};
CRATER.nextDailyIn = function() {
  const last = CRATER.state.lastDaily || 0;
  return Math.max(0, CRATER.DAILY_MS - (Date.now() - last));
};

// ---------- Format ---------- //
CRATER.fmt = function(n) {
  const int = Math.round(n);
  return int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
CRATER.fmtBP = function(n) {
  return `<span class="bal-amount">${CRATER.fmt(n)}</span> <span class="cur">БП</span>`;
};

// ---------- Balance ops ---------- //
CRATER.addBalance = function(n) {
  CRATER.state.balance = Math.max(0, CRATER.state.balance + n);
  CRATER.saveState();
  CRATER.refreshHeader();
};
CRATER.spend = function(n) {
  if (CRATER.state.balance < n) return false;
  CRATER.state.balance -= n;
  CRATER.state.stats.spent += n;
  CRATER.saveState();
  CRATER.refreshHeader();
  return true;
};

// ---------- Inventory ops ---------- //
CRATER.addToInventory = function(item, caseCfg) {
  const rec = Object.assign({}, item, {
    gainedAt: Date.now(),
    caseId: caseCfg ? caseCfg.id : null,
    caseName: caseCfg ? caseCfg.name : null,
  });
  CRATER.state.inventory.unshift(rec);
  CRATER.state.history.unshift({
    weapon: item.weaponName, skin: item.skin, rarity: item.rarity, price: item.price,
    caseName: caseCfg ? caseCfg.name : (item.caseName || '—'),
    at: Date.now(), cls: item.cls, colors: item.colors, image: item.image || null,
  });
  if (CRATER.state.history.length > 200) CRATER.state.history.length = 200;
  CRATER.state.stats.opened += 1;
  CRATER.state.stats.earned += item.price;
  if (item.price > (CRATER.state.stats.bestPrice || 0)) {
    CRATER.state.stats.bestPrice = item.price;
    CRATER.state.stats.bestItem = { weapon: item.weaponName, skin: item.skin, price: item.price, rarity: item.rarity };
  }
  CRATER.saveState();
};
CRATER.sellFromInventory = function(instanceId) {
  const idx = CRATER.state.inventory.findIndex(x => x.instanceId === instanceId);
  if (idx === -1) return 0;
  const it = CRATER.state.inventory[idx];
  CRATER.state.inventory.splice(idx, 1);
  CRATER.addBalance(it.price);
  return it.price;
};
CRATER.removeFromInventory = function(instanceId) {
  const idx = CRATER.state.inventory.findIndex(x => x.instanceId === instanceId);
  if (idx === -1) return null;
  return CRATER.state.inventory.splice(idx, 1)[0];
};
CRATER.sellAllInventory = function() {
  let total = 0;
  CRATER.state.inventory.forEach(it => { total += it.price; });
  CRATER.state.inventory = [];
  CRATER.addBalance(total);
  return total;
};

// ---------- Header rendering ---------- //
CRATER.renderHeader = function(active) {
  const p = CRATER.state.profile;
  const userChip = p
    ? `<a href="profile.html" class="user-chip" title="Профиль">
        <img class="avatar" src="${escapeAttr(p.avatar || CRATER.defaultAvatarDataUrl())}" alt=""/>
        <span class="name">${escapeHtml(p.name)}</span>
      </a>`
    : `<a href="login.html" class="user-chip guest">
        <img class="avatar" src="${CRATER.defaultAvatarDataUrl()}" alt=""/>
        <span class="name">Войти через Steam</span>
      </a>`;

  const nav = [
    { href: 'index.html',    label: 'Кейсы',    key: 'cases' },
    { href: 'upgrade.html',  label: 'Апгрейд',  key: 'upgrade' },
    { href: 'contract.html', label: 'Контракт', key: 'contract' },
    { href: 'profile.html',  label: 'Профиль',  key: 'profile' },
  ].map(n => `<a href="${n.href}" class="${active === n.key ? 'active' : ''}">${n.label}</a>`).join('');

  return `
    <header class="site-header">
      <a href="index.html" class="brand">
        <div class="brand-mark"></div>
        <span>CR<span class="brand-accent">A</span>TER</span>
      </a>
      <nav class="main-nav">${nav}</nav>
      <div class="header-spacer"></div>
      ${(function(){
        if (typeof CRATER.getRank !== 'function') return '';
        const r = CRATER.getRank();
        return `<div class="rank-chip" title="${r.current.name}" style="color:${r.current.color}; border-color:${r.current.color}">
          <span class="rc-icon">${r.current.icon}</span>
          <span class="rc-name">${r.current.name}</span>
        </div>`;
      })()}
      <div class="balance-badge" id="bal-badge">${CRATER.fmtBP(CRATER.state.balance)}</div>
      <button class="balance-add" id="bal-add" title="Пополнить (бесплатно)">+ 10 000</button>
      <button class="mute-btn" id="mute-btn" title="Звук">
        ${CRATER.state.prefs.muted
          ? '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
          : '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>'}
      </button>
      ${userChip}
    </header>`;
};

CRATER.mountHeader = function(active) {
  const holder = document.getElementById('header-mount') || (() => {
    const d = document.createElement('div'); d.id = 'header-mount';
    document.body.insertBefore(d, document.body.firstChild); return d;
  })();
  holder.innerHTML = CRATER.renderHeader(active);
  document.getElementById('bal-add').addEventListener('click', () => {
    CRATER.addBalance(10000);
    CRATER.toast('+10 000 БП зачислено');
    if (CRATER.sound) CRATER.sound.coin();
  });
  const muteBtn = document.getElementById('mute-btn');
  if (muteBtn) muteBtn.addEventListener('click', () => {
    CRATER.state.prefs.muted = !CRATER.state.prefs.muted;
    CRATER.saveState();
    if (CRATER.sound) CRATER.sound.setMuted(CRATER.state.prefs.muted);
    CRATER.mountHeader(active);
  });
};

CRATER.refreshHeader = function() {
  const bal = document.getElementById('bal-badge');
  if (bal) bal.innerHTML = CRATER.fmtBP(CRATER.state.balance);
};

// ---------- Toasts ---------- //
CRATER.toast = function(msg, kind) {
  let region = document.querySelector('.toast-region');
  if (!region) {
    region = document.createElement('div');
    region.className = 'toast-region';
    document.body.appendChild(region);
  }
  const el = document.createElement('div');
  el.className = 'toast' + (kind === 'err' ? ' err' : '');
  el.textContent = msg;
  region.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2600);
  setTimeout(() => el.remove(), 3000);
};

// ---------- Default avatar (SVG data URL) ---------- //
CRATER.defaultAvatarDataUrl = function() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>
    <rect width='64' height='64' fill='#1c2620'/>
    <circle cx='32' cy='26' r='11' fill='#3a4a3c'/>
    <path d='M12 60 Q12 42 32 42 Q52 42 52 60 Z' fill='#3a4a3c'/>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
};

// ---------- HTML escape ---------- //
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
CRATER.esc = escapeHtml;

// ---------- Visuals: CDN image when the item has one, SVG otherwise ---------- //
CRATER.itemVisual = function(item, opts) {
  opts = opts || {};
  if (item.image) {
    const rColor = CRATER.RARITY[item.rarity] ? CRATER.RARITY[item.rarity].color : '#8a988a';
    const glow = opts.bg === false ? '' :
      `style="background: radial-gradient(ellipse at 50% 45%, ${rColor}33 0%, transparent 70%)"`;
    return `<div class="econ-wrap" ${glow}><img class="econ-img" src="${escapeAttr(item.image)}" alt="" loading="lazy" draggable="false"></div>`;
  }
  return CRATER.artWeapon(item, opts);
};
CRATER.miniVisual = function(item) {
  if (item.image) {
    return `<img class="econ-img" src="${escapeAttr(item.image)}" alt="" loading="lazy" draggable="false">`;
  }
  return CRATER.artWeaponMini(item);
};
CRATER.caseVisual = function(cfg) {
  if (cfg.image) {
    return `<div class="cs2-case-visual">
      <img class="econ-img" src="${escapeAttr(cfg.image)}" alt="" loading="lazy" draggable="false">
      <span class="cs2-badge">CS2</span>
    </div>`;
  }
  return CRATER.artCase(cfg);
};

// ---------- Item card component ---------- //
CRATER.itemCardHTML = function(item, opts) {
  opts = opts || {};
  const svg = CRATER.itemVisual(item, { bg: true });
  const rClass = 'rarity-' + item.rarity;
  const wearBit = opts.hideWear ? '' : `<span class="item-wear">${item.wear}</span>`;
  const price = opts.hidePrice ? '' : `<span class="item-price">${CRATER.fmt(item.price)} <span class="cur">БП</span></span>`;
  const btn = opts.sellBtn ? `<button class="sell-btn" data-sell="${item.instanceId}" title="Продать за ${CRATER.fmt(item.price)} БП">×</button>` : '';
  const extraCls = opts.extraClass || '';
  const dataset = opts.dataset || '';
  return `
    <div class="item-card ${rClass} ${extraCls}" ${dataset}>
      ${btn}
      <div class="item-img">${svg}</div>
      <div class="item-weapon">${escapeHtml(item.weaponName)}</div>
      <div class="item-name">${escapeHtml(item.skin)}</div>
      <div class="item-footer">${price}${wearBit}</div>
    </div>`;
};

CRATER.miniItemHTML = function(item) {
  return `<div class="mini-item">${CRATER.miniVisual(item)}</div>`;
};

// ---------- Cookie banner ---------- //
CRATER.maybeShowCookies = function() {
  if (CRATER.state.prefs.cookiesSeen) return;
  const b = document.createElement('div');
  b.className = 'cookie-banner';
  b.innerHTML = `
    <div class="head"><span class="cookie-icon">🍪</span> Выберите Cookie</div>
    <p>Мы используем <b>cookie</b> для сохранения твоего инвентаря, баланса и настроек прямо в браузере. Данные никуда не отправляются.</p>
    <div class="btns">
      <button class="accept">Принять все</button>
      <button class="hide">Скрыть</button>
    </div>`;
  document.body.appendChild(b);
  const dismiss = () => {
    CRATER.state.prefs.cookiesSeen = true;
    CRATER.saveState();
    b.remove();
  };
  b.querySelector('.accept').addEventListener('click', dismiss);
  b.querySelector('.hide').addEventListener('click', dismiss);
};

// ---------- Boot helper ---------- //
CRATER.boot = function(active) {
  CRATER.mountHeader(active);
  CRATER.maybeShowCookies();
};
