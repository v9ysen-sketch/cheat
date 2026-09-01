/* ================================================================
   CRATER — CS2 catalog loader.
   Reads data/cs2.json (built at deploy time by tools/fetch-cs2.mjs)
   and merges the real cases into the catalog. Item/case images are
   CDN URLs loaded directly by the player's browser; when the JSON
   is missing (e.g. artifact build) everything silently stays on the
   built-in CRATER catalog.
   ================================================================ */

window.CRATER = window.CRATER || {};

(function () {
  const WEAPON_BASE = {};
  Object.values(CRATER.WEAPONS).forEach(w => { WEAPON_BASE[w.name] = w.base; });

  function buildCs2Case(raw, idx, total) {
    const r = CRATER.mulberry32(CRATER.seedFrom(raw.id));
    // Price grows with release order (newer cases cost more), rounded to 10s
    const price = Math.round((600 + idx * 380 + r() * 300) / 10) * 10;
    const tier = 1 + Math.min(4, Math.floor(idx / (total / 5)));

    const items = raw.items.map((it, i) => {
      const wear = CRATER.WEAR[Math.floor(r() * CRATER.WEAR.length)];
      const base = it.c === 'knife' ? CRATER.KNIFE_BASE
                 : it.c === 'gloves' ? CRATER.GLOVE_BASE
                 : (WEAPON_BASE[it.w] || 0.7);
      const jitter = 0.85 + r() * 0.3;
      const itemPrice = Math.max(1, Math.round(price * CRATER.RARITY_MULT[it.r] * base * wear.mult * jitter));
      const rc = CRATER.RARITY[it.r].color;
      return {
        id: raw.id + '_' + i,
        weapon: it.w,
        weaponName: it.w,
        cls: it.c,
        skin: it.n,
        colors: [rc, lighten(rc, 40), shade(rc, 60)],
        pattern: 'solid',
        rarity: it.r,
        wear: wear.code,
        wearName: wear.name,
        price: itemPrice,
        image: it.img || null,
      };
    });
    items.sort((a, b) => {
      const ra = CRATER.RARITY_ORDER.indexOf(a.rarity);
      const rb = CRATER.RARITY_ORDER.indexOf(b.rarity);
      if (ra !== rb) return rb - ra;
      return b.price - a.price;
    });

    const cfg = {
      id: raw.id, name: raw.name, tier, price,
      image: raw.image || null, cs2: true,
      // fallback theme fields so artCase still works without the image
      mood: 'metal', weapon: 'rifle',
      primary: '#3a2b16', secondary: '#c9a44a', accent: '#e4ae39',
    };
    return { cfg, built: Object.assign({}, cfg, { items }) };
  }

  CRATER.loadCS2 = function () {
    if (CRATER._cs2Loading) return CRATER._cs2Loading;
    CRATER._cs2Loading = fetch('data/cs2.json')
      .then(r => { if (!r.ok) throw new Error('no cs2 data'); return r.json(); })
      .then(list => {
        list.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
        const builtMap = {};
        const cfgs = [];
        list.forEach((raw, idx) => {
          const { cfg, built } = buildCs2Case(raw, idx, list.length);
          cfgs.push(cfg);
          builtMap[cfg.id] = built;
        });
        CRATER._cs2Built = builtMap;
        CRATER.CS2_CASES = cfgs;
        // invalidate caches that pre-date the merge
        CRATER._built = null;
        CRATER._pool = null;
        CRATER._contractIdx = null;
        if (typeof CRATER.onCatalogUpdate === 'function') CRATER.onCatalogUpdate();
      })
      .catch(() => { /* artifact / local without data — CRATER catalog only */ });
    return CRATER._cs2Loading;
  };

  // Full catalog = built-in configs + CS2 configs
  CRATER.catalog = function () {
    return CRATER.CASES.concat(CRATER.CS2_CASES || []);
  };

  // getCase / allCases consult the CS2 map first
  const origGetCase = CRATER.getCase;
  CRATER.getCase = function (id) {
    if (CRATER._cs2Built && CRATER._cs2Built[id]) return CRATER._cs2Built[id];
    return origGetCase(id);
  };
  const origAllCases = CRATER.allCases;
  CRATER.allCases = function () {
    const base = origAllCases();
    return CRATER._cs2Built ? base.concat(Object.values(CRATER._cs2Built)) : base;
  };

  CRATER.loadCS2();
})();
