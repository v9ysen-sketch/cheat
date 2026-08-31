/* ================================================================
   CRATER — home page: case grid + filters + live drops ticker.
   ================================================================ */

(function () {
  CRATER.boot('cases');

  const grid = document.getElementById('case-grid');
  const filters = document.getElementById('filters');
  const q = document.getElementById('q');
  const sortEl = document.getElementById('sort');

  let activeTier = 'all';
  let query = '';
  let sortMode = 'tier';

  function rarityPips(cfg) {
    const box = CRATER.getCase(cfg.id);
    if (!box) return '';
    const counts = {};
    box.items.forEach(it => { counts[it.rarity] = (counts[it.rarity] || 0) + 1; });
    return `
      <div class="rarity-pips" title="Распределение дропов">
        ${CRATER.RARITY_ORDER.filter(r => counts[r]).map(r => `
          <span class="pip" style="background:${CRATER.RARITY[r].color}" title="${CRATER.RARITY[r].name}: ${counts[r]}"></span>
          ${counts[r] > 1 ? `<span class="pip-count">${counts[r]}</span>` : ''}
        `).join('')}
      </div>`;
  }

  function caseCardHTML(cfg, i) {
    const tierName = ['','Стартовый','Прайм','Комбат','Элитный','Легендарный'][cfg.tier];
    return `
      <a class="case-card" href="case.html?id=${cfg.id}" data-tier="${cfg.tier}" data-name="${CRATER.esc(cfg.name.toLowerCase())}" style="--i:${i}">
        <div class="case-art">
          <div class="case-tier">${tierName}</div>
          ${CRATER.artCase(cfg)}
        </div>
        <div class="case-body">
          <div class="case-name">${CRATER.esc(cfg.name)}</div>
          ${rarityPips(cfg)}
          <div class="case-open">
            <span class="case-price">${CRATER.fmt(cfg.price)} <span class="cur">БП</span></span>
            <button class="case-open-btn">Открыть</button>
          </div>
        </div>
      </a>`;
  }

  function render() {
    let items = CRATER.CASES.filter(c => {
      if (activeTier !== 'all' && String(c.tier) !== String(activeTier)) return false;
      if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    if (sortMode === 'cheap')     items.sort((a,b) => a.price - b.price);
    else if (sortMode === 'expensive') items.sort((a,b) => b.price - a.price);
    else if (sortMode === 'name') items.sort((a,b) => a.name.localeCompare(b.name));
    // default 'tier' preserves declaration order
    grid.innerHTML = items.map((c, i) => caseCardHTML(c, i)).join('') ||
      '<div class="empty-state">Ничего не найдено</div>';
  }

  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    filters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    activeTier = btn.dataset.tier;
    render();
  });
  q.addEventListener('input', (e) => { query = e.target.value; render(); });
  if (sortEl) sortEl.addEventListener('change', (e) => { sortMode = e.target.value; render(); });

  render();

  // ---------- Home hero (rotating featured tier V cases) ---------- //
  const heroEl = document.getElementById('hero');
  if (heroEl) {
    const featured = CRATER.CASES.filter(c => c.tier === 5);
    let idx = 0;
    function renderHero() {
      const c = featured[idx % featured.length];
      const drops = CRATER.buildFakeDrops(1)[0];
      heroEl.innerHTML = `
        <div class="hero-art" style="background:radial-gradient(ellipse at center, ${c.secondary}44 0%, transparent 70%)">
          ${CRATER.artCase(c)}
        </div>
        <div class="hero-info">
          <div class="hero-eyebrow">Топ кейс сегодня</div>
          <h2 class="hero-title">${CRATER.esc(c.name)}</h2>
          <p class="hero-sub">
            Легендарный тир · возможен нож или перчатки.
            ${drops ? `Последний дроп: <b style="color:${CRATER.RARITY[drops.item.rarity].color}">${CRATER.esc(drops.item.skin)}</b>` : ''}
          </p>
          <div class="hero-actions">
            <a class="hero-open" href="case.html?id=${c.id}">
              Открыть · <span>${CRATER.fmt(c.price)} БП</span>
            </a>
            <button class="hero-next" id="hero-next" title="Другой кейс">↻</button>
          </div>
        </div>`;
      const nb = document.getElementById('hero-next');
      if (nb) nb.addEventListener('click', () => { idx++; renderHero(); });
    }
    renderHero();
    setInterval(() => { idx++; renderHero(); }, 12000);
  }

  // ---------- Live drops ticker ---------- //
  const trackEl = document.getElementById('live-track');
  function rebuildTicker() {
    const drops = CRATER.buildFakeDrops(24);
    const html = drops.map(d => `
      <div class="live-drop rarity-${d.item.rarity}" style="border-left-color:${CRATER.RARITY[d.item.rarity].color}">
        ${CRATER.miniItemHTML(d.item)}
        <div class="drop-info">
          <div class="drop-user">${CRATER.esc(d.user)} · ${CRATER.esc(d.caseName)}</div>
          <div class="drop-name" style="color:${CRATER.RARITY[d.item.rarity].color}">${CRATER.esc(d.item.skin)}</div>
        </div>
      </div>`).join('');
    // Duplicate for seamless loop
    trackEl.innerHTML = html + html;
  }
  rebuildTicker();
  // Refresh occasionally so it feels alive
  setInterval(rebuildTicker, 45000);
})();
