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
    at: Date.now(), cls: item.cls, colors: item.colors,
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
    { href: 'index.html',   label: 'Кейсы',   key: 'cases' },
    { href: 'upgrade.html', label: 'Апгрейд', key: 'upgrade' },
    { href: 'profile.html', label: 'Профиль', key: 'profile' },
  ].map(n => `<a href="${n.href}" class="${active === n.key ? 'active' : ''}">${n.label}</a>`).join('');

  return `
    <header class="site-header">
      <a href="index.html" class="brand">
        <div class="brand-mark"></div>
        <span>CR<span class="brand-accent">A</span>TER</span>
      </a>
      <nav class="main-nav">${nav}</nav>
      <div class="header-spacer"></div>
      <div class="balance-badge" id="bal-badge">${CRATER.fmtBP(CRATER.state.balance)}</div>
      <button class="balance-add" id="bal-add" title="Пополнить (бесплатно)">+ 10 000</button>
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

// ---------- Item card component ---------- //
CRATER.itemCardHTML = function(item, opts) {
  opts = opts || {};
  const svg = CRATER.artWeapon(item, { bg: true });
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
  return `<div class="mini-item">${CRATER.artWeaponMini(item)}</div>`;
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
