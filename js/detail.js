/* ================================================================
   CRATER — item detail modal (click any item card to inspect).
   ================================================================ */

window.CRATER = window.CRATER || {};

CRATER.showItemDetail = function (item, opts) {
  opts = opts || {};
  const rColor = CRATER.RARITY[item.rarity].color;
  const rName  = CRATER.RARITY[item.rarity].name;
  const chance = CRATER.RARITY[item.rarity].chance;

  let host = document.getElementById('detail-modal');
  if (!host) {
    host = document.createElement('div');
    host.id = 'detail-modal';
    host.className = 'modal-overlay';
    document.body.appendChild(host);
  }
  host.innerHTML = `
    <div class="modal detail-modal">
      <button class="detail-close" data-close>×</button>
      <div class="detail-hero" style="background: radial-gradient(circle at 50% 40%, ${rColor}55, transparent 70%)">
        ${CRATER.itemVisual(item, { bg: true })}
      </div>
      <div class="detail-body">
        <div class="detail-rarity" style="color:${rColor}; border-color:${rColor}">${rName}</div>
        <div class="detail-weapon">${CRATER.esc(item.weaponName || '')}</div>
        <div class="detail-name" style="color:${rColor}">${CRATER.esc(item.skin || '')}</div>
        <div class="detail-meta">
          <div><span>Износ</span><b>${item.wearName || item.wear || '—'}</b></div>
          <div><span>Паттерн</span><b>${(item.pattern || 'solid').toUpperCase()}</b></div>
          <div><span>Класс</span><b>${(item.cls || '').toUpperCase()}</b></div>
          <div><span>Шанс дропа</span><b>${chance}%</b></div>
          ${opts.caseName ? `<div><span>Из кейса</span><b>${CRATER.esc(opts.caseName)}</b></div>` : ''}
        </div>
        <div class="detail-price">
          <span class="lbl">Стоимость</span>
          <span class="val">${CRATER.fmt(item.price || 0)} <span class="cur">БП</span></span>
        </div>
      </div>
    </div>`;
  requestAnimationFrame(() => host.classList.add('show'));
  const close = () => { host.classList.remove('show'); };
  host.addEventListener('click', (e) => {
    if (e.target === host || e.target.dataset.close != null) close();
  }, { once: false });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });
};

// Delegated click handler: any .item-card in drops grid opens detail.
document.addEventListener('click', function (e) {
  const card = e.target.closest('.drops-grid .item-card, .inventory-grid .item-card');
  if (!card) return;
  // Ignore clicks on inner buttons
  if (e.target.closest('button')) return;
  // Extract item from data attribute or by matching to inventory
  const inst = card.querySelector('[data-inst]')?.dataset?.inst || card.dataset.inst;
  const invItem = CRATER.state.inventory.find(x => x.instanceId === inst);
  if (invItem) {
    CRATER.showItemDetail(invItem, { caseName: invItem.caseName });
    return;
  }
  // Otherwise it's a preview from case drops — find in current case
  const routeParams = CRATER._routeParams || new URLSearchParams(location.search);
  const caseId = routeParams.get('id');
  const box = caseId ? CRATER.getCase(caseId) : null;
  if (!box) return;
  const di = card.dataset.dropIdx;
  const item = di != null ? box.items[+di] : null;
  if (item) CRATER.showItemDetail(item, { caseName: box.name });
});
