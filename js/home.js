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
