/* ================================================================
   CRATER — profile: identity + stats + inventory + history.
   ================================================================ */

(function () {
  CRATER.boot('profile');
  const page = document.getElementById('page');

  function statRow() {
    const s = CRATER.state.stats;
    const roi = s.spent ? ((s.earned - s.spent) / s.spent * 100) : 0;
    const roiCls = roi >= 0 ? 'pos' : 'neg';
    return `
      <div class="stat-row">
        <div class="stat-card"><div class="label">Открыто кейсов</div><div class="value">${CRATER.fmt(s.opened)}</div></div>
        <div class="stat-card"><div class="label">Потрачено</div><div class="value">${CRATER.fmt(s.spent)} <span style="font-size:14px;color:var(--text-muted)">БП</span></div></div>
        <div class="stat-card"><div class="label">Получено</div><div class="value pos">${CRATER.fmt(s.earned)} <span style="font-size:14px;color:var(--text-muted)">БП</span></div></div>
        <div class="stat-card"><div class="label">Разница</div><div class="value ${roiCls}">${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%</div></div>
        <div class="stat-card"><div class="label">Лучший дроп</div><div class="value gold">${s.bestPrice ? CRATER.fmt(s.bestPrice) + ' БП' : '—'}</div></div>
        <div class="stat-card"><div class="label">Апгрейды</div><div class="value">${s.upgradesWon} / ${s.upgradesWon + s.upgradesLost}</div></div>
      </div>`;
  }

  function profileHeader() {
    const p = CRATER.state.profile;
    if (!p) {
      return `
        <div class="profile-header">
          <img class="avatar-big" src="${CRATER.defaultAvatarDataUrl()}" alt=""/>
          <div class="who">
            <h1>Гость</h1>
            <div class="meta">Войди через Стим, чтобы твой профиль отображался красиво.</div>
          </div>
          <a href="login.html" class="logout" style="color:var(--accent);border-color:var(--accent-dark)">Войти</a>
        </div>`;
    }
    const since = new Date(p.since).toLocaleDateString('ru-RU');
    return `
      <div class="profile-header">
        <img class="avatar-big" src="${CRATER.esc(p.avatar || CRATER.defaultAvatarDataUrl())}" alt=""/>
        <div class="who">
          <h1>${CRATER.esc(p.name)}</h1>
          <div class="meta">
            ${p.steamId ? `<span class="steam-id">${CRATER.esc(p.steamId)}</span> · ` : ''}
            в CRATER с ${since}
          </div>
        </div>
        <button class="logout" id="logout">Выйти</button>
      </div>`;
  }

  function inventoryGrid() {
    const inv = CRATER.state.inventory;
    if (!inv.length) {
      return `<div class="section-title">Инвентарь <span class="count">0 предметов</span></div>
        <div class="empty-state">Инвентарь пуст — открой пару кейсов на главной</div>`;
    }
    const total = inv.reduce((a, b) => a + b.price, 0);
    return `
      <div class="section-title">
        Инвентарь
        <span class="count">${inv.length} · ${CRATER.fmt(total)} БП</span>
        <button class="sell-all" id="sell-all">Продать всё</button>
      </div>
      <div class="inventory-grid">
        ${inv.map(it => CRATER.itemCardHTML(it, { sellBtn: true })).join('')}
      </div>`;
  }

  function historyList() {
    const h = CRATER.state.history;
    if (!h.length) return '';
    const rows = h.slice(0, 40).map(r => {
      const ago = timeAgo(r.at);
      const rColor = CRATER.RARITY[r.rarity].color;
      const item = { cls: r.cls, colors: r.colors, weaponName: r.weapon, skin: r.skin, rarity: r.rarity };
      return `
        <div class="history-row rarity-${r.rarity}">
          <div class="mini">${CRATER.artWeaponMini(item)}</div>
          <div class="info">
            <div class="weapon">${CRATER.esc(r.weapon)}</div>
            <div class="name" style="color:${rColor}">${CRATER.esc(r.skin)}</div>
          </div>
          <div class="case-name">${CRATER.esc(r.caseName)} · ${ago}</div>
          <div class="value">${CRATER.fmt(r.price)} БП</div>
        </div>`;
    }).join('');
    return `
      <div class="section-title">История дропов <span class="count">${h.length}</span></div>
      <div class="history-list">${rows}</div>`;
  }

  function timeAgo(ts) {
    const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
    if (s < 60)   return s + ' сек назад';
    if (s < 3600) return Math.floor(s/60) + ' мин назад';
    if (s < 86400) return Math.floor(s/3600) + ' ч назад';
    return Math.floor(s/86400) + ' дн назад';
  }

  function render() {
    page.innerHTML = `
      ${profileHeader()}
      ${statRow()}
      ${inventoryGrid()}
      ${historyList()}
    `;

    const logout = document.getElementById('logout');
    if (logout) logout.addEventListener('click', () => {
      if (!confirm('Выйти из аккаунта? Инвентарь и баланс сохранятся.')) return;
      CRATER.state.profile = null;
      CRATER.saveState();
      render();
      CRATER.mountHeader('profile');
    });

    const sellAll = document.getElementById('sell-all');
    if (sellAll) sellAll.addEventListener('click', () => {
      const inv = CRATER.state.inventory;
      if (!inv.length) return;
      const total = inv.reduce((a, b) => a + b.price, 0);
      if (!confirm(`Продать все ${inv.length} предметов за ${CRATER.fmt(total)} БП?`)) return;
      const got = CRATER.sellAllInventory();
      CRATER.toast('Продано на ' + CRATER.fmt(got) + ' БП');
      render();
    });

    page.querySelectorAll('[data-sell]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const price = CRATER.sellFromInventory(btn.dataset.sell);
        if (price) CRATER.toast('+' + CRATER.fmt(price) + ' БП');
        render();
      });
    });
  }

  render();
})();
