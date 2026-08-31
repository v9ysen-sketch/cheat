/* ================================================================
   CRATER — upgrade mode with two speed modes.
   ================================================================ */

(function () {
  CRATER.boot('upgrade');

  const HOUSE = 0.75;   // house factor: chance = src_price*HOUSE / tgt_price
  const RADIUS = 105;
  const CIRC = 2 * Math.PI * RADIUS;   // 659.7

  // ---------- Refs ---------- //
  const srcSlot = document.getElementById('src-slot');
  const tgtSlot = document.getElementById('tgt-slot');
  const srcList = document.getElementById('src-list');
  const tgtList = document.getElementById('tgt-list');
  const meterFill = document.getElementById('meter-fill');
  const chanceText = document.getElementById('chance');
  const arcHolder = document.getElementById('arc');
  const mults = document.getElementById('mults');
  const btnUpgrade = document.getElementById('btn-upgrade');
  const speedGroup = document.getElementById('upgrade-speed');
  const modal = document.getElementById('result-modal');
  const won = document.getElementById('won');
  const closeBtn = document.getElementById('btn-close');
  const resultTitle = document.getElementById('result-title');

  meterFill.setAttribute('stroke-dasharray', String(CIRC));
  meterFill.setAttribute('stroke-dashoffset', String(CIRC));

  const state = {
    src: null,
    tgt: null,
    mult: 2,
    speed: CRATER.state.prefs.upgradeSpeed || 'normal',
    busy: false,
  };

  // ---------- Render inventory list ---------- //
  function renderSrcList() {
    const inv = CRATER.state.inventory;
    if (!inv.length) {
      srcList.className = 'upgrade-list empty';
      srcList.innerHTML = 'Инвентарь пуст. Открой пару кейсов.';
      return;
    }
    srcList.className = 'upgrade-list';
    srcList.innerHTML = inv.map(it => CRATER.itemCardHTML(it, {
      hideWear: true, extraClass: state.src && state.src.instanceId === it.instanceId ? 'selected' : '',
      dataset: `data-inst="${it.instanceId}"`,
    })).join('');
  }

  // Build global item pool from all cases so we can pick upgrade targets by price
  function globalPool() {
    if (!CRATER._pool) {
      const out = [];
      CRATER.allCases().forEach(c => {
        c.items.forEach(it => out.push(Object.assign({}, it, {
          instanceId: 'g_' + c.id + '_' + it.id,
          caseName: c.name, caseId: c.id,
        })));
      });
      CRATER._pool = out;
    }
    return CRATER._pool;
  }

  function pickTargets(srcPrice, mult) {
    const targetPrice = srcPrice * mult;
    const window = 0.20;   // ± 20 %
    const lo = targetPrice * (1 - window);
    const hi = targetPrice * (1 + window);
    const pool = globalPool().filter(it => it.price >= lo && it.price <= hi);
    // Pick up to 12 varied items
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 12);
    return shuffled;
  }

  function renderTgtList() {
    if (!state.src) {
      tgtList.className = 'upgrade-list empty';
      tgtList.innerHTML = 'Сначала выбери предмет ↰';
      return;
    }
    const cands = pickTargets(state.src.price, state.mult);
    if (!cands.length) {
      tgtList.className = 'upgrade-list empty';
      tgtList.innerHTML = 'Нет подходящих предметов на этот множитель';
      return;
    }
    tgtList.className = 'upgrade-list';
    tgtList.innerHTML = cands.map(it => CRATER.itemCardHTML(it, {
      hideWear: true, extraClass: state.tgt && state.tgt.instanceId === it.instanceId ? 'selected' : '',
      dataset: `data-tgt="${it.instanceId}"`,
    })).join('');
  }

  // ---------- Slot preview ---------- //
  function fillSlot(el, item) {
    if (!item) {
      el.classList.remove('filled');
      el.innerHTML = el === srcSlot ? 'Выбери из инвентаря ↓' : 'Выбери множитель →';
      return;
    }
    el.classList.add('filled');
    const rColor = CRATER.RARITY[item.rarity].color;
    el.innerHTML = `
      <div class="item-preview">
        ${CRATER.artWeapon(item, { bg: false })}
        <div class="name" style="color:${rColor}">${CRATER.esc(item.weaponName)} · ${CRATER.esc(item.skin)}</div>
        <div class="price">${CRATER.fmt(item.price)} <span class="cur" style="color:var(--text-muted);font-size:12px">БП</span></div>
      </div>`;
  }

  // ---------- Meter ---------- //
  function currentChance() {
    if (!state.src || !state.tgt) return 0;
    const raw = (state.src.price * HOUSE) / state.tgt.price;
    return Math.max(0.005, Math.min(0.90, raw));
  }
  function updateMeter() {
    const p = currentChance();
    const offset = CIRC * (1 - p);
    meterFill.setAttribute('stroke-dashoffset', String(offset));
    const pct = (p * 100);
    chanceText.innerHTML = pct.toFixed(pct < 10 ? 1 : 0) + '<span style="font-size:26px">%</span>';
    // Arc zones: green from 0 to p, rest red
    renderArc(p);
    btnUpgrade.disabled = !(state.src && state.tgt && !state.busy);
    btnUpgrade.textContent = state.src && state.tgt
      ? `Апгрейд · шанс ${pct.toFixed(pct<10?1:0)}%`
      : 'Апгрейд';
  }
  function renderArc(chance) {
    // Arc split into green (win) and red (lose) segments; a needle rotates over full circle.
    const winLen = CIRC * chance;
    arcHolder.innerHTML = `
      <svg viewBox="0 0 240 240" width="240" height="240">
        <circle class="zone-lose" cx="120" cy="120" r="105"/>
        <circle class="zone-win"  cx="120" cy="120" r="105"
          stroke-dasharray="${winLen} ${CIRC - winLen}" stroke-dashoffset="0"/>
        <g class="needle" id="needle" transform="rotate(0)">
          <line x1="120" y1="120" x2="120" y2="20"/>
          <circle cx="120" cy="120" r="8"/>
        </g>
      </svg>`;
  }

  // ---------- Select handlers ---------- //
  srcList.addEventListener('click', (e) => {
    const card = e.target.closest('[data-inst]');
    if (!card) return;
    const inst = card.dataset.inst;
    const it = CRATER.state.inventory.find(x => x.instanceId === inst);
    state.src = it || null;
    state.tgt = null;
    renderSrcList();
    fillSlot(srcSlot, state.src);
    fillSlot(tgtSlot, null);
    renderTgtList();
    updateMeter();
  });
  tgtList.addEventListener('click', (e) => {
    const card = e.target.closest('[data-tgt]');
    if (!card) return;
    const inst = card.dataset.tgt;
    const it = globalPool().find(x => x.instanceId === inst);
    if (!it) return;
    state.tgt = it;
    fillSlot(tgtSlot, it);
    // rerender for selection highlight
    tgtList.querySelectorAll('.item-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    updateMeter();
  });
  mults.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    mults.querySelectorAll('button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    state.mult = parseFloat(b.dataset.m);
    state.tgt = null;
    fillSlot(tgtSlot, null);
    renderTgtList();
    updateMeter();
  });
  speedGroup.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    speedGroup.querySelectorAll('button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    state.speed = b.dataset.s;
    CRATER.state.prefs.upgradeSpeed = state.speed;
    CRATER.saveState();
  });

  // ---------- Upgrade action ---------- //
  btnUpgrade.addEventListener('click', () => {
    if (state.busy || !state.src || !state.tgt) return;
    const chance = currentChance();
    const won = Math.random() < chance;

    // Compute target angle: land inside win arc (0..winLen) or inside lose arc.
    // Add multiple full spins for suspense (more on gambling mode).
    const spins = state.speed === 'gamble' ? 6 : 4;
    const winFrac = chance;
    let targetFrac;
    if (won) {
      // Pick a fraction inside win arc, with small padding from edges
      const pad = Math.min(0.02, winFrac * 0.15);
      targetFrac = pad + Math.random() * Math.max(0.001, winFrac - 2 * pad);
    } else {
      const loseSpan = 1 - winFrac;
      const pad = Math.min(0.02, loseSpan * 0.1);
      targetFrac = winFrac + pad + Math.random() * Math.max(0.001, loseSpan - 2 * pad);
    }
    const finalDeg = spins * 360 + targetFrac * 360;
    const dur = state.speed === 'gamble' ? 8500 : 3800;
    const ease = state.speed === 'gamble'
      ? 'cubic-bezier(.10,.72,.20,1)'
      : 'cubic-bezier(.15,.85,.30,1)';

    state.busy = true;
    btnUpgrade.disabled = true;

    const needle = document.getElementById('needle');
    needle.style.transition = 'none';
    needle.setAttribute('transform', 'rotate(0)');
    // Layout tick
    // eslint-disable-next-line no-unused-expressions
    needle.getBoundingClientRect();
    needle.style.transition = `transform ${dur}ms ${ease}`;
    needle.setAttribute('transform', `rotate(${finalDeg})`);

    setTimeout(() => {
      arcHolder.classList.remove('result-win', 'result-lose');
      arcHolder.classList.add(won ? 'result-win' : 'result-lose');
      finalize(won);
    }, dur + 100);
  });

  function finalize(isWin) {
    const src = state.src;
    // Remove source
    CRATER.removeFromInventory(src.instanceId);
    if (isWin) {
      // Roll a wear for the target and add
      const wear = CRATER.WEAR[Math.floor(Math.random() * CRATER.WEAR.length)];
      const winItem = Object.assign({}, state.tgt, {
        wear: wear.code, wearName: wear.name,
        instanceId: 'i_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
      });
      CRATER.addToInventory(winItem, { id: winItem.caseId, name: winItem.caseName });
      CRATER.state.stats.upgradesWon += 1;
      CRATER.saveState();
      showResult(true, winItem);
    } else {
      CRATER.state.stats.upgradesLost += 1;
      CRATER.saveState();
      showResult(false, null);
    }
    state.busy = false;
    state.src = null;
    state.tgt = null;
    renderSrcList();
    fillSlot(srcSlot, null);
    fillSlot(tgtSlot, null);
    renderTgtList();
    updateMeter();
  }

  function showResult(isWin, item) {
    resultTitle.textContent = isWin ? 'Апгрейд удался' : 'Апгрейд провален';
    resultTitle.style.color = isWin ? 'var(--accent)' : 'var(--danger)';
    if (isWin && item) {
      const rColor = CRATER.RARITY[item.rarity].color;
      won.style.borderBottomColor = rColor;
      won.innerHTML = `
        <div class="item-img">${CRATER.artWeapon(item, { bg: true })}</div>
        <div class="weapon">${CRATER.esc(item.weaponName)} · ${item.wear}</div>
        <div class="name" style="color:${rColor}">${CRATER.esc(item.skin)}</div>
        <div class="price">+ ${CRATER.fmt(item.price)} <span class="cur">БП</span></div>`;
    } else {
      won.style.borderBottomColor = 'var(--danger)';
      won.innerHTML = `
        <div class="item-img" style="display:flex;align-items:center;justify-content:center;height:180px;">
          <svg viewBox="0 0 120 120" width="120" height="120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--danger)" stroke-width="4" opacity="0.8"/>
            <line x1="35" y1="35" x2="85" y2="85" stroke="var(--danger)" stroke-width="6" stroke-linecap="round"/>
            <line x1="85" y1="35" x2="35" y2="85" stroke="var(--danger)" stroke-width="6" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="name" style="color:var(--danger)">Предмет сгорел</div>`;
    }
    modal.classList.add('show');
  }
  closeBtn.addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });

  // Boot
  renderSrcList();
  mults.querySelector(`[data-m="${state.mult}"]`).classList.add('active');
  renderTgtList();
  updateMeter();
})();
