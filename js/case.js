/* ================================================================
   CRATER — case detail page + roulette animation.
   ================================================================ */

(function () {
  CRATER.boot('cases');

  const params = new URLSearchParams(location.search);
  const id = params.get('id') || 'rookie';
  let box = CRATER.getCase(id);
  const page = document.getElementById('page');

  if (!box) {
    // CS2 case data may still be loading — retry once the catalog updates
    page.innerHTML = `<div class="empty-state">Загружаю кейс…</div>`;
    CRATER.onCatalogUpdate = () => {
      box = CRATER.getCase(id);
      if (box) render();
      else page.innerHTML = `<h1 class="page-title">Кейс не найден</h1>
        <p class="page-subtitle"><a href="index.html" style="color:var(--accent)">← К каталогу</a></p>`;
    };
  }

  const state = { speed: CRATER.state.prefs.speed || 'normal', busy: false, lastRoll: null };

  function drops() {
    // Group items by rarity, show header per group.
    // data-drop-idx keeps the global index so the detail modal maps correctly.
    const groups = {};
    box.items.forEach((it, gi) => {
      (groups[it.rarity] = groups[it.rarity] || []).push({ it, gi });
    });
    const rarityOrder = CRATER.RARITY_ORDER.slice().reverse();
    return rarityOrder.filter(r => groups[r]).map(r => {
      const items = groups[r];
      const chance = CRATER.RARITY[r].chance;
      const color = CRATER.RARITY[r].color;
      return `
        <div class="rarity-group">
          <div class="rarity-header" style="border-left-color:${color}">
            <span class="rh-name" style="color:${color}">${CRATER.RARITY[r].name}</span>
            <span class="rh-meta">${items.length} шт · шанс ${chance}%</span>
          </div>
          <div class="drops-grid">
            ${items.map(({ it, gi }) => CRATER.itemCardHTML(it, { hideWear: true, dataset: `data-drop-idx="${gi}"` })).join('')}
          </div>
        </div>`;
    }).join('');
  }

  function speedButtons() {
    return `
      <div class="speed-toggle" id="speed-toggle">
        <button data-speed="fast"    class="${state.speed==='fast'?'active':''}">Быстрая</button>
        <button data-speed="normal"  class="${state.speed==='normal'?'active':''}">Обычная</button>
        <button data-speed="gamble"  class="${state.speed==='gamble'?'active':''}">Азартная</button>
      </div>`;
  }

  function render() {
    page.innerHTML = `
      <p class="page-subtitle" style="margin-bottom:12px"><a href="index.html" style="color:var(--accent)">← К каталогу</a></p>

      ${speedButtons()}

      <div class="roulette-stage" id="stage">
        <div class="roulette-pointer"></div>
        <div class="roulette-track" id="track"></div>
      </div>

      <div class="case-detail">
        <div class="case-hero">
          <div class="case-art">${CRATER.caseVisual(box)}</div>
          <h1>${CRATER.esc(box.name)}</h1>
          <div class="price">${CRATER.fmt(box.price)}<span class="cur">БП</span></div>
          <div class="open-controls">
            <button class="btn-open" id="btn-open">Открыть · ${CRATER.fmt(box.price)} БП</button>
            <div class="btn-multi">
              <button data-n="2">×2</button>
              <button data-n="5">×5</button>
              <button data-n="10">×10</button>
              <button data-n="25">×25</button>
            </div>
          </div>
        </div>

        <div class="case-drops">
          <h2>Возможные предметы <span style="color:var(--text-muted);font-size:13px;letter-spacing:1px">· ${box.items.length}</span></h2>
          ${drops()}
        </div>
      </div>
    `;

    document.getElementById('speed-toggle').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      state.speed = b.dataset.speed;
      CRATER.state.prefs.speed = state.speed;
      CRATER.saveState();
      document.querySelectorAll('#speed-toggle button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    });
    document.getElementById('btn-open').addEventListener('click', () => openOnce());
    page.querySelectorAll('.btn-multi button').forEach(b => {
      b.addEventListener('click', () => openMany(parseInt(b.dataset.n)));
    });
  }

  // ---------- Roulette ---------- //
  const REEL_SIZE = 60;           // items in strip
  const WIN_INDEX = 52;           // where the winning item lands
  const CARD_W = 188;             // width + gap

  function buildReel(win) {
    // Weighted picks from case items for filler; winner is `win`.
    const filler = [];
    const commonPool = box.items.filter(x => ['consumer','industrial','milspec'].includes(x.rarity));
    const midPool = box.items.filter(x => ['restricted','classified'].includes(x.rarity));
    const rarePool = box.items.filter(x => ['covert','special'].includes(x.rarity));
    for (let i = 0; i < REEL_SIZE; i++) {
      const roll = Math.random();
      let pool = commonPool.length ? commonPool : box.items;
      if (roll < 0.06 && rarePool.length) pool = rarePool;
      else if (roll < 0.25 && midPool.length) pool = midPool;
      const src = pool[Math.floor(Math.random() * pool.length)];
      filler.push(Object.assign({}, src, { instanceId: 'r_' + i + '_' + Math.random().toString(36).slice(2,7) }));
    }
    filler[WIN_INDEX] = Object.assign({}, win);
    return filler;
  }

  function speedProfile(speed) {
    // duration ms, easing
    if (speed === 'fast')   return { dur: 3200, ease: 'cubic-bezier(.13,.85,.28,1)' };
    if (speed === 'gamble') return { dur: 9500, ease: 'cubic-bezier(.10,.72,.20,1)' };
    return { dur: 5800, ease: 'cubic-bezier(.12,.82,.24,1)' };  // normal
  }

  function playRoulette(winItem) {
    return new Promise(resolve => {
      const reel = buildReel(winItem);
      const track = document.getElementById('track');
      const stage = document.getElementById('stage');
      track.innerHTML = reel.map(it => CRATER.itemCardHTML(it, { hideWear: true, hidePrice: true, extraClass: 'reel' })).join('');
      // Reset
      track.style.transition = 'none';
      track.style.transform = 'translateX(0)';
      // Layout tick
      // eslint-disable-next-line no-unused-expressions
      track.offsetWidth;

      const stageW = stage.clientWidth;
      // Center of the winning card = WIN_INDEX*CARD_W + CARD_W/2 + 8(leading pad)
      const winCenter = WIN_INDEX * CARD_W + CARD_W / 2 + 8;
      // Small jitter so the pointer doesn't always hit dead center
      const jitter = (Math.random() - 0.5) * (CARD_W - 40);
      const targetX = -(winCenter - stageW / 2 + jitter);

      const prof = speedProfile(state.speed);
      requestAnimationFrame(() => {
        track.style.transition = `transform ${prof.dur}ms ${prof.ease}`;
        track.style.transform = `translateX(${targetX}px)`;
      });
      // Schedule tick sounds along the decel curve
      if (CRATER.sound) {
        CRATER.sound.click();
        const ticks = state.speed === 'gamble' ? 40 : (state.speed === 'fast' ? 18 : 28);
        for (let i = 0; i < ticks; i++) {
          const t = 1 - Math.pow(1 - i / ticks, 2.4);
          setTimeout(() => CRATER.sound.tick(), t * prof.dur);
        }
        setTimeout(() => CRATER.sound.tock(), prof.dur - 20);
      }
      // Highlight the winning card when animation lands
      setTimeout(() => {
        const cards = track.querySelectorAll('.item-card');
        if (cards[WIN_INDEX]) cards[WIN_INDEX].classList.add('landed');
      }, prof.dur);
      setTimeout(() => resolve(), prof.dur + 400);
    });
  }

  // ---------- Result modal ---------- //
  const modal = document.getElementById('result-modal');
  const wonBox = document.getElementById('won');
  const btnSell = document.getElementById('btn-sell');
  const btnKeep = document.getElementById('btn-keep');
  let modalItem = null;

  function showResult(item) {
    modalItem = item;
    const rColor = CRATER.RARITY[item.rarity].color;
    wonBox.style.borderBottomColor = rColor;
    wonBox.innerHTML = `
      <div class="item-img">${CRATER.itemVisual(item, { bg: true })}</div>
      <div class="weapon">${CRATER.esc(item.weaponName)} · ${item.wear}</div>
      <div class="name" style="color:${rColor}">${CRATER.esc(item.skin)}</div>
      <div class="price">+ ${CRATER.fmt(item.price)} <span class="cur">БП</span></div>
    `;
    document.querySelector('.modal h2').textContent = 'Ты выбил';
    modal.classList.add('show');
    if (CRATER.sound) {
      if (['covert','special','classified'].includes(item.rarity)) CRATER.sound.bigwin();
      else if (item.rarity === 'restricted') CRATER.sound.win();
      else CRATER.sound.chime();
    }
    if (typeof CRATER.confetti === 'function' && ['classified','covert','special'].includes(item.rarity)) {
      const rColor = CRATER.RARITY[item.rarity].color;
      CRATER.confetti({
        count: item.rarity === 'special' ? 160 : (item.rarity === 'covert' ? 120 : 80),
        colors: [rColor, '#ffd700', '#2be07b', item.colors[0], item.colors[1]],
      });
    }
    if (typeof CRATER.rareSplash === 'function') {
      const rColor = CRATER.RARITY[item.rarity].color;
      if (item.rarity === 'special')    CRATER.rareSplash('★ MYTHIC DROP ★', rColor);
      else if (item.rarity === 'covert') CRATER.rareSplash('COVERT!', rColor);
      else if (item.rarity === 'classified') CRATER.rareSplash('CLASSIFIED', rColor);
    }
    if (typeof CRATER.checkAchievements === 'function') CRATER.checkAchievements();
  }
  function hideResult() { modal.classList.remove('show'); }

  btnSell.addEventListener('click', () => {
    if (modal._multiWins) {
      let total = 0;
      modal._multiWins.forEach(w => {
        CRATER.addBalance(w.price); total += w.price;
        CRATER.state.stats.earned += w.price;
        CRATER.state.history.unshift({
          weapon: w.weaponName, skin: w.skin, rarity: w.rarity, price: w.price,
          caseName: box.name, at: Date.now(), cls: w.cls, colors: w.colors, image: w.image || null,
        });
        CRATER.state.stats.opened += 1;
        if (w.price > (CRATER.state.stats.bestPrice || 0)) {
          CRATER.state.stats.bestPrice = w.price;
          CRATER.state.stats.bestItem = { weapon: w.weaponName, skin: w.skin, price: w.price, rarity: w.rarity };
        }
      });
      if (CRATER.state.history.length > 200) CRATER.state.history.length = 200;
      CRATER.saveState();
      CRATER.toast(`Продано ${modal._multiWins.length} шт. за ${CRATER.fmt(total)} БП`);
      modal._multiWins = null;
      hideResult();
      return;
    }
    if (!modalItem) return;
    CRATER.addBalance(modalItem.price);
    CRATER.state.stats.earned += modalItem.price;
    CRATER.state.history.unshift({
      weapon: modalItem.weaponName, skin: modalItem.skin, rarity: modalItem.rarity,
      price: modalItem.price, caseName: box.name, at: Date.now(),
      cls: modalItem.cls, colors: modalItem.colors, image: modalItem.image || null,
    });
    if (CRATER.state.history.length > 200) CRATER.state.history.length = 200;
    CRATER.state.stats.opened += 1;
    if (modalItem.price > (CRATER.state.stats.bestPrice || 0)) {
      CRATER.state.stats.bestPrice = modalItem.price;
      CRATER.state.stats.bestItem = { weapon: modalItem.weaponName, skin: modalItem.skin, price: modalItem.price, rarity: modalItem.rarity };
    }
    CRATER.saveState();
    CRATER.toast('Продано за ' + CRATER.fmt(modalItem.price) + ' БП');
    hideResult();
  });
  btnKeep.addEventListener('click', () => {
    if (modal._multiWins) {
      modal._multiWins.forEach(w => CRATER.addToInventory(w, box));
      CRATER.toast(`+${modal._multiWins.length} шт. в инвентарь`);
      modal._multiWins = null;
      hideResult();
      return;
    }
    if (!modalItem) return;
    CRATER.addToInventory(modalItem, box);
    CRATER.toast('В инвентаре: ' + modalItem.skin);
    hideResult();
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) hideResult(); });

  // ---------- Open flow ---------- //
  function openOnce() {
    if (state.busy) return;
    if (!CRATER.spend(box.price)) {
      CRATER.toast('Недостаточно БП. Нажми «+10 000» в шапке', 'err');
      return;
    }
    state.busy = true;
    document.getElementById('btn-open').disabled = true;
    const win = CRATER.rollItem(box);
    playRoulette(win).then(() => {
      state.busy = false;
      document.getElementById('btn-open').disabled = false;
      showResult(win);
    });
  }

  async function openMany(n) {
    if (state.busy) return;
    const cost = box.price * n;
    if (CRATER.state.balance < cost) {
      CRATER.toast('Недостаточно БП на ×' + n, 'err');
      return;
    }
    state.busy = true;
    document.getElementById('btn-open').disabled = true;

    let total = 0, wins = [];
    const instant = n >= 10;   // skip animation for large batches

    if (instant) {
      // Instant mode: roll all at once, no animation
      for (let i = 0; i < n; i++) {
        if (!CRATER.spend(box.price)) break;
        const win = CRATER.rollItem(box);
        wins.push(win);
        total += win.price;
      }
      // Quick visual: brief roulette showing best drop
      const best = wins.reduce((a,b) => (a && a.price > b.price ? a : b), wins[0]);
      if (best) {
        const prevSpeed = state.speed;
        state.speed = 'fast';
        await playRoulette(best);
        state.speed = prevSpeed;
      }
    } else {
      const prevSpeed = state.speed;
      state.speed = 'fast';
      for (let i = 0; i < n; i++) {
        if (!CRATER.spend(box.price)) break;
        const win = CRATER.rollItem(box);
        wins.push(win);
        await playRoulette(win);
        total += win.price;
      }
      state.speed = prevSpeed;
    }

    state.busy = false;
    document.getElementById('btn-open').disabled = false;
    showMultiResult(wins, cost, total);
    if (CRATER.sound) CRATER.sound.win();
    if (wins.some(w => ['covert','special','classified'].includes(w.rarity)) && typeof CRATER.confetti === 'function') {
      CRATER.confetti({ count: 120 });
    }
  }

  function showMultiResult(wins, cost, total) {
    const diff = total - cost;
    const diffCls = diff >= 0 ? 'pos' : 'neg';
    const diffSign = diff >= 0 ? '+' : '';
    document.querySelector('.modal h2').textContent = `×${wins.length} · Результат`;
    wonBox.style.borderBottomColor = 'var(--accent)';
    wonBox.innerHTML = `
      <div class="multi-grid">
        ${wins.map(w => `
          <div class="mini-drop rarity-${w.rarity}" title="${CRATER.esc(w.skin)}"
               style="border-color:${CRATER.RARITY[w.rarity].color}">
            <div class="mini-drop-img">${CRATER.miniVisual(w)}</div>
            <div class="mini-drop-price">${CRATER.fmt(w.price)}</div>
          </div>`).join('')}
      </div>
      <div class="multi-summary">
        <div>Потрачено: <b>${CRATER.fmt(cost)} БП</b></div>
        <div>Выпало: <b style="color:var(--accent)">${CRATER.fmt(total)} БП</b></div>
        <div>Разница: <b class="${diffCls}" style="color:var(${diff>=0?'--accent':'--danger'})">${diffSign}${CRATER.fmt(diff)} БП</b></div>
      </div>
    `;
    // Repurpose sell/keep buttons for the batch
    btnSell.textContent = `Продать всё за ${CRATER.fmt(total)} БП`;
    btnKeep.textContent = 'Оставить всё';
    modalItem = null;
    modal._multiWins = wins;
    modal.classList.add('show');
  }

  if (box) render();

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === ' ' || e.key === 'Enter') {
      if (modal.classList.contains('show')) return;
      e.preventDefault();
      openOnce();
    } else if (e.key === 'Escape') {
      if (modal.classList.contains('show')) hideResult();
    }
  });
})();
