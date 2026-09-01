/* ================================================================
   CRATER — Contract (trade-up): 10 items of same rarity → 1 higher.
   ================================================================ */

(function () {
  CRATER.boot('contract');

  const filterEl   = document.getElementById('contract-filter');
  const slotsEl    = document.getElementById('slots');
  const previewEl  = document.getElementById('preview');
  const btnEl      = document.getElementById('btn-contract');
  const invEl      = document.getElementById('inv');
  const invCount   = document.getElementById('inv-count');
  const modal      = document.getElementById('result-modal');
  const wonEl      = document.getElementById('won');
  const closeBtn   = document.getElementById('btn-close');
  const resultTitle= document.getElementById('result-title');

  // Contract only advances these rarities (top three are unreachable).
  const CHAIN = ['consumer','industrial','milspec','restricted','classified','covert'];
  const state = { rarity: 'milspec', slots: [] };  // slots hold instanceIds

  function rarityLabel(r) { return CRATER.RARITY[r].name; }

  function renderFilter() {
    filterEl.innerHTML = CHAIN.slice(0, -1).map(r => {
      const next = CHAIN[CHAIN.indexOf(r) + 1];
      const nextName = CRATER.RARITY[next].name;
      const style = `color:${CRATER.RARITY[r].color}; border-color:${CRATER.RARITY[r].color}`;
      const active = state.rarity === r ? ' active' : '';
      return `<button class="chip${active}" data-r="${r}"
        style="${active ? style : ''}">
        ${rarityLabel(r)} → ${nextName}
      </button>`;
    }).join('');
  }

  function eligibleItems() {
    return CRATER.state.inventory.filter(it => it.rarity === state.rarity);
  }

  function renderSlots() {
    let html = '';
    for (let i = 0; i < 10; i++) {
      const inst = state.slots[i];
      if (inst) {
        const it = CRATER.state.inventory.find(x => x.instanceId === inst);
        if (it) {
          const rColor = CRATER.RARITY[it.rarity].color;
          html += `<div class="contract-slot filled" data-idx="${i}" title="Убрать" style="border-bottom-color:${rColor}">
            <div class="slot-mini">${CRATER.itemVisual(it, { bg: false })}</div>
            <div class="slot-name" style="color:${rColor}">${CRATER.esc(it.skin)}</div>
            <div class="slot-price">${CRATER.fmt(it.price)}</div>
          </div>`;
          continue;
        }
      }
      html += `<div class="contract-slot empty" data-idx="${i}">+</div>`;
    }
    slotsEl.innerHTML = html;

    // Compute preview: expected output rarity & value range
    const filled = state.slots.filter(Boolean).length;
    const nextR = CHAIN[CHAIN.indexOf(state.rarity) + 1];
    if (filled === 0) {
      previewEl.innerHTML = `<div class="prev-none">Заполни 10 слотов → выпадет предмет редкости
        <b style="color:${CRATER.RARITY[nextR].color}">${CRATER.RARITY[nextR].name}</b></div>`;
    } else {
      const items = state.slots.filter(Boolean).map(inst =>
        CRATER.state.inventory.find(x => x.instanceId === inst)).filter(Boolean);
      const totalIn = items.reduce((a, b) => a + b.price, 0);
      const pool = CRATER.contractPool(nextR, items);
      const range = pool.length
        ? `${CRATER.fmt(Math.min(...pool.map(p => p.price)))}—${CRATER.fmt(Math.max(...pool.map(p => p.price)))} БП`
        : '—';
      previewEl.innerHTML = `
        <div class="prev-head">Слотов заполнено: ${filled}/10</div>
        <div class="prev-r">Выйдет: <b style="color:${CRATER.RARITY[nextR].color}">${CRATER.RARITY[nextR].name}</b></div>
        <div class="prev-in">Вложено: <b>${CRATER.fmt(totalIn)} БП</b></div>
        <div class="prev-range">Возможный диапазон: <b>${range}</b></div>`;
    }

    btnEl.disabled = filled !== 10;
    btnEl.textContent = filled === 10 ? 'Контракт · 10 → 1' : `Контракт · ${filled}/10`;
  }

  function renderInv() {
    const items = eligibleItems();
    const used = new Set(state.slots.filter(Boolean));
    invCount.textContent = `${items.length} · ${rarityLabel(state.rarity)}`;
    if (!items.length) {
      invEl.innerHTML = '<div class="empty-state">Нет предметов этой редкости</div>';
      return;
    }
    invEl.innerHTML = items.map(it => {
      const isUsed = used.has(it.instanceId);
      const extra = isUsed ? ' selected' : '';
      return CRATER.itemCardHTML(it, {
        hideWear: true, extraClass: extra,
        dataset: `data-add="${it.instanceId}"`,
      });
    }).join('');
  }

  // Contract pool for next rarity: items from all cases at that rarity.
  CRATER.contractPool = function(rarity, sourceItems) {
    if (!CRATER._contractIdx) {
      const idx = {};
      CRATER.allCases().forEach(c => {
        c.items.forEach(it => {
          (idx[it.rarity] = idx[it.rarity] || []).push(it);
        });
      });
      CRATER._contractIdx = idx;
    }
    return CRATER._contractIdx[rarity] || [];
  };

  // Run contract: weighted pick from next rarity pool
  function runContract() {
    if (state.slots.filter(Boolean).length !== 10) return;
    const nextR = CHAIN[CHAIN.indexOf(state.rarity) + 1];
    const items = state.slots.map(inst => CRATER.state.inventory.find(x => x.instanceId === inst)).filter(Boolean);
    if (items.length !== 10) return;
    const totalIn = items.reduce((a, b) => a + b.price, 0);
    const pool = CRATER.contractPool(nextR);
    if (!pool.length) return;

    // Weight: items closer to totalIn/1.4 (house edge factor) are more likely
    const target = totalIn / 1.4;
    const weights = pool.map(p => 1 / (1 + Math.abs(p.price - target) / target));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let picked = pool[0];
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) { picked = pool[i]; break; }
    }

    // Roll wear + create instance
    const wear = CRATER.WEAR[Math.floor(Math.random() * CRATER.WEAR.length)];
    const jitter = 0.85 + Math.random() * 0.35;
    const finalPrice = Math.max(1, Math.round(picked.price * (wear.mult / CRATER.WEAR.find(w => w.code === picked.wear).mult) * jitter));
    const drop = Object.assign({}, picked, {
      wear: wear.code, wearName: wear.name,
      price: finalPrice,
      instanceId: 'i_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    });

    // Remove source items from inventory
    items.forEach(it => CRATER.removeFromInventory(it.instanceId));

    // Add new item
    CRATER.addToInventory(drop, { id: null, name: 'Контракт' });
    CRATER.state.stats.contracts = (CRATER.state.stats.contracts || 0) + 1;
    CRATER.saveState();

    // Reset slots
    state.slots = [];
    renderSlots();
    renderInv();

    showResult(drop, totalIn);
    if (CRATER.sound) {
      if (['covert','classified'].includes(drop.rarity)) CRATER.sound.bigwin();
      else CRATER.sound.chime();
    }
    if (typeof CRATER.confetti === 'function' && ['restricted','classified','covert'].includes(drop.rarity)) {
      const rColor = CRATER.RARITY[drop.rarity].color;
      CRATER.confetti({ count: 100, colors: [rColor, '#2be07b', '#ffd700', drop.colors[0]] });
    }
    if (typeof CRATER.checkAchievements === 'function') CRATER.checkAchievements();
  }

  function showResult(item, totalIn) {
    const rColor = CRATER.RARITY[item.rarity].color;
    const diff = item.price - totalIn;
    const diffCls = diff >= 0 ? 'pos' : 'neg';
    const diffSign = diff >= 0 ? '+' : '';
    resultTitle.textContent = 'Контракт выполнен';
    resultTitle.style.color = 'var(--accent)';
    wonEl.style.borderBottomColor = rColor;
    wonEl.innerHTML = `
      <div class="item-img">${CRATER.itemVisual(item, { bg: true })}</div>
      <div class="weapon">${CRATER.esc(item.weaponName)} · ${item.wear}</div>
      <div class="name" style="color:${rColor}">${CRATER.esc(item.skin)}</div>
      <div class="price">${CRATER.fmt(item.price)} <span class="cur">БП</span></div>
      <div style="font-family:var(--font-h); font-weight:600; font-size:13px; color:var(--text-muted); letter-spacing:1px; margin-top:4px">
        Разница: <span style="color:var(${diff>=0?'--accent':'--danger'})">${diffSign}${CRATER.fmt(diff)} БП</span>
      </div>`;
    modal.classList.add('show');
  }

  filterEl.addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    state.rarity = b.dataset.r;
    state.slots = [];
    renderFilter();
    renderSlots();
    renderInv();
  });

  slotsEl.addEventListener('click', (e) => {
    const slot = e.target.closest('.contract-slot');
    if (!slot) return;
    const idx = parseInt(slot.dataset.idx);
    if (state.slots[idx]) {
      state.slots[idx] = null;
      renderSlots();
      renderInv();
    }
  });

  invEl.addEventListener('click', (e) => {
    const card = e.target.closest('[data-add]');
    if (!card) return;
    const inst = card.dataset.add;
    if (state.slots.includes(inst)) {
      // deselect: remove
      state.slots = state.slots.map(x => x === inst ? null : x);
    } else {
      const emptyIdx = state.slots.findIndex(x => !x);
      if (emptyIdx === -1) {
        // find first empty by looking through 10 slots
        for (let i = 0; i < 10; i++) {
          if (!state.slots[i]) { state.slots[i] = inst; break; }
        }
      } else {
        state.slots[emptyIdx] = inst;
      }
    }
    renderSlots();
    renderInv();
  });

  btnEl.addEventListener('click', runContract);
  closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });

  // Initialize slots to array of 10
  for (let i = 0; i < 10; i++) state.slots.push(null);
  renderFilter();
  renderSlots();
  renderInv();
})();
