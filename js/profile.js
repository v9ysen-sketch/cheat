/* ================================================================
   CRATER — profile: identity + stats + inventory + history.
   ================================================================ */

(function () {
  CRATER.boot('profile');
  const page = document.getElementById('page');
  const state = { invSort: 'newest', invFilter: 'all' };

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

  function rankBadge() {
    if (typeof CRATER.getRank !== 'function') return '';
    const r = CRATER.getRank();
    const pct = Math.round(r.progress * 100);
    return `
      <div class="rank-badge" style="border-color:${r.current.color}">
        <div class="rank-icon" style="color:${r.current.color}">${r.current.icon}</div>
        <div class="rank-info">
          <div class="rank-name" style="color:${r.current.color}">${r.current.name}</div>
          ${r.next ? `
            <div class="rank-progress">
              <div class="rank-bar"><div class="rank-fill" style="width:${pct}%;background:${r.current.color}"></div></div>
              <div class="rank-next">До ${r.next.name}: ${pct}%</div>
            </div>` : `<div class="rank-next" style="color:${r.current.color}">Макс. ранг</div>`}
        </div>
      </div>`;
  }

  function dailyBonus() {
    if (typeof CRATER.canClaimDaily !== 'function') return '';
    if (CRATER.canClaimDaily()) {
      const streak = CRATER.state.dailyStreak || 0;
      const bonus = CRATER.DAILY_BONUS + Math.min(streak + 1, 7) * 500;
      return `
        <div class="daily-bonus available">
          <div class="daily-info">
            <div class="daily-title">Ежедневный бонус</div>
            <div class="daily-sub">Забери <b style="color:var(--accent)">+${CRATER.fmt(bonus)} БП</b> · серия ${streak}</div>
          </div>
          <button class="daily-btn" id="claim-daily">Забрать</button>
        </div>`;
    }
    const ms = CRATER.nextDailyIn();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `
      <div class="daily-bonus">
        <div class="daily-info">
          <div class="daily-title">Ежедневный бонус</div>
          <div class="daily-sub">Через <b>${h}ч ${m}м</b> · серия ${CRATER.state.dailyStreak || 0}</div>
        </div>
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
            ${rankBadge()}
          </div>
          <a href="login.html" class="logout" style="color:var(--accent);border-color:var(--accent-dark)">Войти</a>
        </div>
        ${dailyBonus()}`;
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
          ${rankBadge()}
        </div>
        <button class="logout" id="logout">Выйти</button>
      </div>
      ${dailyBonus()}`;
  }

  function inventoryGrid() {
    let inv = CRATER.state.inventory.slice();
    if (!inv.length) {
      return `<div class="section-title">Инвентарь <span class="count">0 предметов</span></div>
        <div class="empty-state">Инвентарь пуст — открой пару кейсов на главной</div>`;
    }
    const sort = state.invSort || 'newest';
    if (sort === 'newest')       inv.sort((a,b) => (b.gainedAt||0) - (a.gainedAt||0));
    else if (sort === 'oldest')  inv.sort((a,b) => (a.gainedAt||0) - (b.gainedAt||0));
    else if (sort === 'price')   inv.sort((a,b) => b.price - a.price);
    else if (sort === 'price-a') inv.sort((a,b) => a.price - b.price);
    else if (sort === 'rarity')  inv.sort((a,b) =>
      CRATER.RARITY_ORDER.indexOf(b.rarity) - CRATER.RARITY_ORDER.indexOf(a.rarity));
    const filter = state.invFilter || 'all';
    if (filter !== 'all') inv = inv.filter(it => it.rarity === filter);
    const total = inv.reduce((a, b) => a + b.price, 0);
    return `
      <div class="section-title">
        Инвентарь
        <span class="count">${inv.length} · ${CRATER.fmt(total)} БП</span>
        <select id="inv-sort" class="filter-select" style="margin-left:auto">
          <option value="newest"  ${sort==='newest'?'selected':''}>Новые</option>
          <option value="oldest"  ${sort==='oldest'?'selected':''}>Старые</option>
          <option value="price"   ${sort==='price'?'selected':''}>Цена ↓</option>
          <option value="price-a" ${sort==='price-a'?'selected':''}>Цена ↑</option>
          <option value="rarity"  ${sort==='rarity'?'selected':''}>Редкость</option>
        </select>
        <button class="sell-all" id="sell-all">Продать всё</button>
      </div>
      <div class="filter-bar" style="margin-bottom:12px">
        <button class="chip ${filter==='all'?'active':''}" data-inv-r="all">Все</button>
        ${CRATER.RARITY_ORDER.map(r => {
          const has = CRATER.state.inventory.filter(it => it.rarity === r).length;
          if (!has) return '';
          return `<button class="chip ${filter===r?'active':''}" data-inv-r="${r}"
            style="color:${CRATER.RARITY[r].color}">${CRATER.RARITY[r].name} · ${has}</button>`;
        }).join('')}
      </div>
      <div class="inventory-grid">
        ${inv.map(it => CRATER.itemCardHTML(it, { sellBtn: true })).join('') || '<div class="empty-state">Нет предметов этой редкости</div>'}
      </div>`;
  }

  function historyList() {
    const h = CRATER.state.history;
    if (!h.length) return '';
    const rows = h.slice(0, 40).map(r => {
      const ago = timeAgo(r.at);
      const rColor = CRATER.RARITY[r.rarity].color;
      const item = { cls: r.cls, colors: r.colors, weaponName: r.weapon, skin: r.skin, rarity: r.rarity, image: r.image || null };
      return `
        <div class="history-row rarity-${r.rarity}">
          <div class="mini">${CRATER.miniVisual(item)}</div>
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

  function achievementsSection() {
    if (typeof CRATER.getAchievementProgress !== 'function') return '';
    const list = CRATER.getAchievementProgress();
    const done = list.filter(a => a.unlocked).length;
    return `
      <div class="section-title">Достижения <span class="count">${done} / ${list.length}</span></div>
      <div class="achievements-grid">
        ${list.map(a => `
          <div class="ach ${a.unlocked ? 'unlocked' : 'locked'}" title="${CRATER.esc(a.desc)}">
            <div class="ach-icon">${a.icon}</div>
            <div class="ach-body">
              <div class="ach-name">${CRATER.esc(a.name)}</div>
              <div class="ach-desc">${CRATER.esc(a.desc)}</div>
            </div>
          </div>`).join('')}
      </div>`;
  }

  function render() {
    page.innerHTML = `
      ${profileHeader()}
      ${statRow()}
      ${achievementsSection()}
      ${inventoryGrid()}
      ${historyList()}
      <div style="margin-top:32px; padding: 14px 16px; border:1px dashed var(--border); text-align:right">
        <button id="reset-progress" style="background:transparent; border:1px solid var(--border-alt); color:var(--text-muted); padding:8px 14px; font-family:var(--font-h); font-weight:700; font-size:11px; letter-spacing:2px; text-transform:uppercase; cursor:pointer">
          ↺ Сбросить прогресс
        </button>
      </div>
    `;

    const daily = document.getElementById('claim-daily');
    if (daily) daily.addEventListener('click', () => {
      const got = CRATER.claimDaily();
      if (got) {
        CRATER.toast(`Забрал +${CRATER.fmt(got)} БП`);
        if (CRATER.sound) CRATER.sound.coin();
        if (typeof CRATER.confetti === 'function') CRATER.confetti({ count: 40, colors: ['#2be07b','#ffd700'] });
        render();
      }
    });

    const logout = document.getElementById('logout');
    if (logout) logout.addEventListener('click', () => {
      if (!confirm('Выйти из аккаунта? Инвентарь и баланс сохранятся.')) return;
      CRATER.state.profile = null;
      CRATER.saveState();
      render();
      CRATER.mountHeader('profile');
    });

    const reset = document.getElementById('reset-progress');
    if (reset) reset.addEventListener('click', () => {
      if (!confirm('Сбросить ВСЁ: баланс, инвентарь, историю, статы, достижения, ранг? Это нельзя отменить.')) return;
      if (!confirm('Точно уверен? Все данные будут удалены.')) return;
      localStorage.removeItem('crater.state.v1');
      location.reload();
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

    const invSort = document.getElementById('inv-sort');
    if (invSort) invSort.addEventListener('change', (e) => { state.invSort = e.target.value; render(); });
    page.querySelectorAll('[data-inv-r]').forEach(b => {
      b.addEventListener('click', () => { state.invFilter = b.dataset.invR; render(); });
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
