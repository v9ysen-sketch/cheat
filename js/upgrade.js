/* ================================================================
   CRATER — upgrade mode with two speed modes.
   ================================================================ */

(function () {
  CRATER.boot('upgrade');

  const HOUSE = 0.75;   // house factor: chance = src_price*HOUSE / tgt_price
  const RADIUS = 105;
  const CIRC = 2 * Math.PI * RADIUS;
  const RADIUS_HI = 94;
  const CIRC_HI = 2 * Math.PI * RADIUS_HI;

  // ---------- Refs ---------- //
  const srcSlot = document.getElementById('src-slot');
  const tgtSlot = document.getElementById('tgt-slot');
  const srcList = document.getElementById('src-list');
  const tgtList = document.getElementById('tgt-list');
  const chanceText = document.getElementById('chance');
  const arcHolder = document.getElementById('arc');
  const mults = document.getElementById('mults');
  const btnUpgrade = document.getElementById('btn-upgrade');
  const speedGroup = document.getElementById('upgrade-speed');
  const modal = document.getElementById('result-modal');
  const won = document.getElementById('won');
  const closeBtn = document.getElementById('btn-close');
  const resultTitle = document.getElementById('result-title');

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
        ${CRATER.itemVisual(item, { bg: false })}
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
    const hasBoth = !!(state.src && state.tgt);
    const p = currentChance();
    if (hasBoth) {
      const pct = (p * 100);
      chanceText.innerHTML = pct.toFixed(pct < 10 ? 1 : 0) + '<span style="font-size:26px">%</span>';
    } else {
      chanceText.innerHTML = '<span style="color:var(--text-dim)">—</span>';
    }
    renderArc(hasBoth ? p : 0);
    // Fresh needle DOM element sits at rotate(0); reset cumulative angle to match.
    state.needleAngle = 0;
    btnUpgrade.disabled = !(hasBoth && !state.busy);
    const pct = (p * 100);
    btnUpgrade.textContent = hasBoth
      ? `Апгрейд · шанс ${pct.toFixed(pct<10?1:0)}%`
      : 'Апгрейд';
  }

  function renderArc(chance) {
    // Ticks around outer edge, major every 6th (every 90°)
    let ticks = '';
    const TICK_N = 24;
    for (let i = 0; i < TICK_N; i++) {
      const ang = (i / TICK_N) * 360 - 90;   // start at top
      const rad = ang * Math.PI / 180;
      const isMajor = i % 6 === 0;
      const inner = 122;
      const outer = isMajor ? 132 : 127;
      const x1 = (130 + Math.cos(rad) * inner).toFixed(2);
      const y1 = (130 + Math.sin(rad) * inner).toFixed(2);
      const x2 = (130 + Math.cos(rad) * outer).toFixed(2);
      const y2 = (130 + Math.sin(rad) * outer).toFixed(2);
      ticks += `<line class="${isMajor?'tick-major':''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }

    const winLen = CIRC * chance;
    const winLenHi = CIRC_HI * chance;

    arcHolder.innerHTML = `
      <svg viewBox="0 0 260 260">
        <defs>
          <radialGradient id="ug-hub" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stop-color="#1c2620"/>
            <stop offset="70%" stop-color="#0f1613"/>
            <stop offset="100%" stop-color="#0a0e0b"/>
          </radialGradient>
          <linearGradient id="ug-needle-l" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#dfe8df"/>
            <stop offset="100%" stop-color="#8a988a"/>
          </linearGradient>
          <linearGradient id="ug-needle-r" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#5c6a5c"/>
            <stop offset="100%" stop-color="#2a3529"/>
          </linearGradient>
        </defs>

        <!-- Groove backdrop -->
        <circle class="ring-groove" cx="130" cy="130" r="105"/>

        <!-- Full lose zone -->
        <circle class="zone-lose" cx="130" cy="130" r="105"
          stroke-dasharray="${CIRC.toFixed(2)} 0"/>

        <!-- Win arc (from top, clockwise) -->
        <circle class="zone-win" cx="130" cy="130" r="105"
          stroke-dasharray="${winLen.toFixed(2)} ${(CIRC - winLen).toFixed(2)}"
          transform="rotate(-90 130 130)"/>

        <!-- Inner bright edge on win arc -->
        <circle class="zone-win-hi" cx="130" cy="130" r="94"
          stroke-dasharray="${winLenHi.toFixed(2)} ${(CIRC_HI - winLenHi).toFixed(2)}"
          transform="rotate(-90 130 130)"/>

        <!-- Ticks -->
        <g class="ticks">${ticks}</g>

        <!-- Central hub -->
        <circle class="hub-plate" cx="130" cy="130" r="76" fill="url(#ug-hub)"/>
        <circle class="hub-ring"  cx="130" cy="130" r="70"/>
        <circle class="hub-ring"  cx="130" cy="130" r="63"/>

        <!-- Needle: rotates around (130,130). At rotation 0 points UP. -->
        <g class="needle" id="needle" transform="rotate(0 130 130)">
          <!-- soft shadow offset -->
          <polygon class="n-shadow" points="130,34 137,128 130,138 123,128" transform="translate(2,4)"/>
          <!-- right half (darker) -->
          <polygon class="n-dark"  points="130,34 137,128 130,138" fill="url(#ug-needle-r)"/>
          <!-- left half (lighter) -->
          <polygon class="n-light" points="130,34 130,138 123,128" fill="url(#ug-needle-l)"/>
          <!-- accent tip -->
          <polygon class="n-tip"   points="130,20 137,38 123,38"/>
          <!-- pivot cap -->
          <circle class="n-pivot-outer" cx="130" cy="130" r="14"/>
          <circle class="n-pivot-inner" cx="130" cy="130" r="5"/>
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
    const dur = state.speed === 'gamble' ? 8500 : 3800;

    state.busy = true;
    btnUpgrade.disabled = true;
    if (CRATER.sound) CRATER.sound.click();

    // Cumulative angle: always spin forward from current, never reset.
    state.needleAngle = state.needleAngle || 0;
    const startAngle = state.needleAngle;
    const currentFrac = ((startAngle % 360) + 360) % 360 / 360;
    let delta = ((targetFrac - currentFrac) % 1 + 1) % 1;   // 0..1, forward
    const finalAngle = startAngle + spins * 360 + delta * 360;
    state.needleAngle = finalAngle;

    // rAF-based animation — deterministic, no CSS-transition weirdness on SVG attrs.
    const needle = document.getElementById('needle');
    if (needle) needle.style.transition = 'none';
    const startTs = performance.now();
    const easeOut = t => 1 - Math.pow(1 - t, 3.4);
    function tick(now) {
      if (!needle) return;
      const t = Math.min(1, (now - startTs) / dur);
      const angle = startAngle + (finalAngle - startAngle) * easeOut(t);
      needle.setAttribute('transform', `rotate(${angle.toFixed(2)} 130 130)`);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    if (CRATER.sound) {
      const ticks = state.speed === 'gamble' ? 34 : 18;
      for (let i = 0; i < ticks; i++) {
        const t = 1 - Math.pow(1 - i / ticks, 2.4);
        setTimeout(() => CRATER.sound.tick(), t * dur);
      }
      setTimeout(() => CRATER.sound.tock(), dur - 20);
    }

    setTimeout(() => {
      arcHolder.classList.remove('result-win', 'result-lose');
      arcHolder.classList.add(won ? 'result-win' : 'result-lose');
      if (CRATER.sound) (won ? CRATER.sound.bigwin() : CRATER.sound.fail());
      if (won && typeof CRATER.confetti === 'function') {
        CRATER.confetti({ count: 100, colors: ['#2be07b','#ffd700','#4b69ff','#d32ce6'] });
      } else if (!won && typeof CRATER.screenFlash === 'function') {
        CRATER.screenFlash('rgba(224,72,59,0.28)');
      }
      finalize(won);
      if (typeof CRATER.checkAchievements === 'function') CRATER.checkAchievements();
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
        <div class="item-img">${CRATER.itemVisual(item, { bg: true })}</div>
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
