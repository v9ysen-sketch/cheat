/* ================================================================
   CRATER — catalog: cases, items, weapons, skins.
   All skin names are original to CRATER.
   ================================================================ */

window.CRATER = window.CRATER || {};

// ---------- Rarity ---------- //
CRATER.RARITY = {
  consumer:   { key: 'consumer',   name: 'Consumer',    color: '#b0c3d9', chance: 79.92 },
  industrial: { key: 'industrial', name: 'Industrial',  color: '#5e98d9', chance: 15.98 },
  milspec:    { key: 'milspec',    name: 'Mil-Spec',    color: '#4b69ff', chance:  3.19 },
  restricted: { key: 'restricted', name: 'Restricted',  color: '#8847ff', chance:  0.64 },
  classified: { key: 'classified', name: 'Classified',  color: '#d32ce6', chance:  0.20 },
  covert:     { key: 'covert',     name: 'Covert',      color: '#eb4b4b', chance:  0.05 },
  special:    { key: 'special',    name: 'Exceedingly Rare', color: '#ffd700', chance: 0.026 },
};
CRATER.RARITY_ORDER = ['consumer','industrial','milspec','restricted','classified','covert','special'];

// ---------- Wear ---------- //
CRATER.WEAR = [
  { code: 'FN', name: 'Factory New',    mult: 1.35 },
  { code: 'MW', name: 'Minimal Wear',   mult: 1.15 },
  { code: 'FT', name: 'Field-Tested',   mult: 1.00 },
  { code: 'WW', name: 'Well-Worn',      mult: 0.75 },
  { code: 'BS', name: 'Battle-Scarred', mult: 0.55 },
];

// ---------- Weapons ---------- //
// [display name, class, base price factor]
CRATER.WEAPONS = {
  ak47:      { name: 'AK-47',            cls: 'rifle',   base: 1.20 },
  m4a4:      { name: 'M4A4',             cls: 'rifle',   base: 1.10 },
  m4a1s:     { name: 'M4A1-S',           cls: 'rifle',   base: 1.10 },
  aug:       { name: 'AUG',              cls: 'rifle',   base: 0.85 },
  sg553:     { name: 'SG 553',           cls: 'rifle',   base: 0.85 },
  famas:     { name: 'FAMAS',            cls: 'rifle',   base: 0.55 },
  galil:     { name: 'Galil AR',         cls: 'rifle',   base: 0.55 },
  awp:       { name: 'AWP',              cls: 'sniper',  base: 1.40 },
  ssg08:     { name: 'SSG 08',           cls: 'sniper',  base: 0.70 },
  scar20:    { name: 'SCAR-20',          cls: 'sniper',  base: 0.60 },
  g3sg1:     { name: 'G3SG1',            cls: 'sniper',  base: 0.60 },
  deagle:    { name: 'Desert Eagle',     cls: 'pistol',  base: 0.95 },
  usps:      { name: 'USP-S',            cls: 'pistol',  base: 0.65 },
  glock:     { name: 'Glock-18',         cls: 'pistol',  base: 0.55 },
  p250:      { name: 'P250',             cls: 'pistol',  base: 0.40 },
  p2000:     { name: 'P2000',            cls: 'pistol',  base: 0.40 },
  fiveseven: { name: 'Five-SeveN',       cls: 'pistol',  base: 0.45 },
  tec9:      { name: 'Tec-9',            cls: 'pistol',  base: 0.45 },
  cz75:      { name: 'CZ75-Auto',        cls: 'pistol',  base: 0.45 },
  duals:     { name: 'Dual Berettas',    cls: 'pistol',  base: 0.35 },
  r8:        { name: 'R8 Revolver',      cls: 'pistol',  base: 0.55 },
  mp7:       { name: 'MP7',              cls: 'smg',     base: 0.50 },
  mp9:       { name: 'MP9',              cls: 'smg',     base: 0.50 },
  mp5:       { name: 'MP5-SD',           cls: 'smg',     base: 0.55 },
  ump:       { name: 'UMP-45',           cls: 'smg',     base: 0.50 },
  p90:       { name: 'P90',              cls: 'smg',     base: 0.65 },
  bizon:     { name: 'PP-Bizon',         cls: 'smg',     base: 0.40 },
  mac10:     { name: 'MAC-10',           cls: 'smg',     base: 0.45 },
  nova:      { name: 'Nova',             cls: 'shotgun', base: 0.35 },
  xm1014:    { name: 'XM1014',           cls: 'shotgun', base: 0.45 },
  mag7:      { name: 'MAG-7',            cls: 'shotgun', base: 0.40 },
  sawedoff:  { name: 'Sawed-Off',        cls: 'shotgun', base: 0.35 },
  m249:      { name: 'M249',             cls: 'heavy',   base: 0.40 },
  negev:     { name: 'Negev',            cls: 'heavy',   base: 0.40 },
};

// ---------- Knives (real weapon types) ---------- //
CRATER.KNIVES = [
  'Karambit', 'Butterfly Knife', 'Bayonet', 'M9 Bayonet', 'Flip Knife',
  'Huntsman Knife', 'Falchion Knife', 'Bowie Knife', 'Shadow Daggers',
  'Gut Knife', 'Ursus Knife', 'Navaja Knife', 'Stiletto Knife',
  'Talon Knife', 'Nomad Knife', 'Skeleton Knife', 'Paracord Knife',
  'Survival Knife', 'Classic Knife',
];
// Knife base multiplier applied on top of the case tier
CRATER.KNIFE_BASE = 2.6;

// ---------- Gloves ---------- //
CRATER.GLOVES = [
  'Sport Gloves', 'Driver Gloves', 'Specialist Gloves',
  'Bloodhound Gloves', 'Motorcycle Gloves', 'Broken Fang Gloves',
  'Hand Wraps', 'Hydra Gloves',
];
CRATER.GLOVE_BASE = 1.8;

// ---------- Skin patterns (invented for CRATER) ---------- //
// Generator: mood templates × adjectives × pattern-nouns → ~230 unique skins.
// Each skin: { name, colors:[main,accent,dark], mood, pattern }

CRATER.PATTERN_NOUNS = [
  'Chevron','Halo','Drift','Cascade','Coil','Waltz','Requiem','Static',
  'Divide','Meridian','Sigil','Wraith','Prism','Trace','Bloom','Vein',
  'Fracture','Rush','Pulse','Grid','Fade','Weave','Spire','Crest',
];

CRATER.MOOD_TEMPLATES = {
  fire: {
    palettes: [
      ['#ff5722','#ffab00','#3a1000'],
      ['#e53935','#ffb300','#2a0000'],
      ['#bf360c','#ffab40','#1a0500'],
      ['#d84315','#ff8f00','#3a1500'],
      ['#ff6b1a','#ffcf40','#7a1a00'],
    ],
    adjectives: ['Ember','Cinder','Molten','Solar','Blaze','Fever','Inferno','Scorch','Ashfall','Wildfire','Ignition','Phoenix'],
    patterns: ['fade','chevron','waves','splatter','runes','stripes'],
  },
  ice: {
    palettes: [
      ['#0288d1','#4fc3f7','#01579b'],
      ['#00bcd4','#b3e5fc','#004d5a'],
      ['#0d47a1','#82b1ff','#050d20'],
      ['#80deea','#e0f7fa','#004d5a'],
      ['#039be5','#b3e5fc','#01324a'],
    ],
    adjectives: ['Frost','Sapphire','Deep','Aurora','Frostbite','Glacial','Arctic','Crystal','Iceborn','Polar','Blizzard','Wintermark'],
    patterns: ['fade','hex','waves','prismatic','scales','tribal'],
  },
  nature: {
    palettes: [
      ['#00c853','#69f0ae','#0d3a1c'],
      ['#43a047','#c6ff00','#0f2a10'],
      ['#2e7d32','#a5d6a7','#0d2412'],
      ['#33691e','#aeea00','#0e2205'],
      ['#00e676','#b9f6ca','#0f3a20'],
    ],
    adjectives: ['Emerald','Verdant','Radiant','Chlorophyll','Forest','Moss','Jade','Ivy','Bloom','Thicket','Sprout','Meadow'],
    patterns: ['fade','waves','scales','dots','circuit','hex'],
  },
  void: {
    palettes: [
      ['#4a148c','#7c4dff','#0a0018'],
      ['#6a1b9a','#e040fb','#100022'],
      ['#7c4dff','#ff4081','#100033'],
      ['#8e24aa','#ff80ab','#180024'],
      ['#311b92','#b39ddb','#08001f'],
    ],
    adjectives: ['Void','Nebula','Nightshade','Warp','Cosmic','Astral','Blackhole','Eclipse','Chasm','Umbra','Rift','Abyss'],
    patterns: ['fade','prismatic','runes','waves','tribal','circuit'],
  },
  cyber: {
    palettes: [
      ['#00e5ff','#ff00e5','#0a0a1a'],
      ['#00b8d4','#ffea00','#0f1a1a'],
      ['#18ffff','#ff1744','#001622'],
      ['#f50057','#00e5ff','#0a0a22'],
      ['#ff4081','#40c4ff','#100022'],
    ],
    adjectives: ['Neon','Wired','Data','Hyper','Circuit','Pixel','Vector','Terminal','Firewall','Overclock','Cybercore','Nano'],
    patterns: ['circuit','grid','pixel','prismatic','hex','fade'],
  },
  dark: {
    palettes: [
      ['#212121','#616161','#000000'],
      ['#1c1c1c','#424242','#000000'],
      ['#2c2c2c','#9e9e9e','#0a0a0a'],
      ['#0d0d0d','#37474f','#000000'],
      ['#0e1414','#455a64','#000000'],
    ],
    adjectives: ['Onyx','Obsidian','Ash','Shadow','Nightfall','Ravencloak','Umbra','Sable','Charcoal','Blackout'],
    patterns: ['solid','stripes','fade','runes','chevron'],
  },
  metal: {
    palettes: [
      ['#cfd8dc','#eceff1','#455a64'],
      ['#b0bec5','#eceff1','#37474f'],
      ['#8d6e63','#d7ccc8','#3e2723'],
      ['#b7410e','#e64a19','#3e1a05'],
      ['#546e7a','#b0bec5','#263238'],
    ],
    adjectives: ['Chrome','Titanium','Rust','Copper','Steel','Alloy','Brass','Ironwork','Gunmetal','Plated'],
    patterns: ['solid','fade','grid','stripes','hex'],
  },
  gold: {
    palettes: [
      ['#ffd700','#ffea00','#3a2b00'],
      ['#ffb300','#fff176','#3a2500'],
      ['#ffab00','#ffd54f','#331e00'],
      ['#e4ae39','#fff176','#332200'],
      ['#ffc107','#ffd54f','#3a2400'],
    ],
    adjectives: ['Golden','Regal','Zenith','Aegis','Crown','Bullion','Sovereign','Gilded','Opulent','Meridian'],
    patterns: ['fade','tribal','runes','chevron','prismatic'],
  },
  blood: {
    palettes: [
      ['#c62828','#ff8a80','#310000'],
      ['#b71c1c','#ef5350','#1a0000'],
      ['#d50000','#ff5252','#210000'],
      ['#e53935','#ff5252','#2b0000'],
      ['#a71313','#ff8a80','#170000'],
    ],
    adjectives: ['Crimson','Blood','Ruby','Scarlet','Vein','Wound','Carmine','Cardinal','Cinnabar'],
    patterns: ['splatter','fade','waves','runes','tribal'],
  },
  tech: {
    palettes: [
      ['#00bfa5','#64ffda','#00332a'],
      ['#00acc1','#84ffff','#002a33'],
      ['#0091ea','#40c4ff','#002238'],
      ['#00897b','#80cbc4','#00251f'],
      ['#0288d1','#81d4fa','#013a5c'],
    ],
    adjectives: ['Cypher','Fragment','Meridian','Signal','Node','Vector','Protocol','Uplink','Beacon','Trace'],
    patterns: ['circuit','grid','hex','fade','pixel'],
  },
  orange: {
    palettes: [
      ['#f57c00','#ffb74d','#331500'],
      ['#ff6f00','#ffca28','#331700'],
      ['#ff9100','#ffd180','#331a00'],
      ['#e65100','#ffab40','#2b1200'],
    ],
    adjectives: ['Splinter','Amber','Sunfall','Tangerine','Rust','Marigold','Persimmon','Ochre'],
    patterns: ['fade','chevron','stripes','splatter'],
  },
  bone: {
    palettes: [
      ['#ffffff','#616161','#0a0a0a'],
      ['#eeeeee','#bdbdbd','#212121'],
      ['#f5f5f5','#9e9e9e','#171717'],
      ['#e0e0e0','#757575','#111111'],
    ],
    adjectives: ['Skull','Bone','Marrow','Skeleton','Reliquary','Ossuary','Cathedral'],
    patterns: ['runes','tribal','stripes','solid'],
  },
  storm: {
    palettes: [
      ['#455a64','#78909c','#1a2327'],
      ['#37474f','#607d8b','#0f1418'],
      ['#546e7a','#90a4ae','#212a2f'],
      ['#263238','#546e7a','#0a1013'],
    ],
    adjectives: ['Cyclone','Storm','Tempest','Thunder','Squall','Gale','Whirlwind','Zephyr'],
    patterns: ['waves','fade','chevron','stripes'],
  },
  toxic: {
    palettes: [
      ['#76ff03','#ffff00','#1a2200'],
      ['#00e676','#c6ff00','#0d3a1c'],
      ['#aeea00','#c6ff00','#182a00'],
      ['#84ffff','#76ff03','#0a2a1a'],
    ],
    adjectives: ['Venom','Acid','Radiation','Sludge','Corrosion','Plague','Bio','Bile'],
    patterns: ['splatter','dots','waves','camo'],
  },
  urban: {
    palettes: [
      ['#546e7a','#ff5252','#212a30'],
      ['#455a64','#ffea00','#1a2227'],
      ['#616161','#ff4081','#212121'],
      ['#37474f','#00e5ff','#0f1418'],
    ],
    adjectives: ['Graffiti','Concrete','Rebar','Alley','Subway','Bricktop','Metro','Skyline','Blackout','Neon-Rush'],
    patterns: ['splatter','stripes','pixel','grid','chevron'],
  },
  military: {
    palettes: [
      ['#4e5d3f','#8d9c62','#2c351f'],
      ['#5d4e2f','#a08850','#2a2312'],
      ['#3e4b3a','#7c8d5e','#1f261c'],
      ['#4c4a2f','#a8a45d','#242212'],
    ],
    adjectives: ['Camo','Woodland','Desert','Digital','Fatigue','Ranger','Recon','Warhawk','Ironsight','Bunker','Frontline'],
    patterns: ['camo','stripes','chevron','grid'],
  },
  tribal: {
    palettes: [
      ['#795548','#ff7043','#2c1810'],
      ['#5d4037','#ffab40','#231613'],
      ['#4e342e','#ffd54f','#1e1310'],
      ['#3e2723','#ff8a65','#1a0f0a'],
    ],
    adjectives: ['Totem','Rune','Ancestral','Warpaint','Clan','Nomad','Shaman','Thunderbird','Wanderer'],
    patterns: ['tribal','runes','stripes','chevron'],
  },
  prismatic: {
    palettes: [
      ['#7c4dff','#00e5ff','#0a0022'],
      ['#e040fb','#00e676','#100022'],
      ['#ff4081','#00e5ff','#100022'],
      ['#00e5ff','#ff00e5','#0a0a1a'],
    ],
    adjectives: ['Rainbow','Holo','Refract','Iridescent','Chroma','Spectra','Kaleido'],
    patterns: ['prismatic','fade','waves','hex'],
  },
  paint: {
    palettes: [
      ['#e91e63','#ffeb3b','#1a0a12'],
      ['#03a9f4','#ffeb3b','#0a1a22'],
      ['#8bc34a','#e91e63','#141a0a'],
      ['#ff5722','#03a9f4','#221008'],
    ],
    adjectives: ['Splatter','Dripline','Airbrush','Stencil','Splash','Tag','Burst','Roller'],
    patterns: ['splatter','stripes','waves','pixel'],
  },
  fauna: {
    palettes: [
      ['#3e2723','#ff8f00','#1a0a05'],
      ['#212121','#ff5722','#0a0a0a'],
      ['#4e342e','#e0e0e0','#1e1310'],
      ['#5d4037','#c62828','#231613'],
    ],
    adjectives: ['Dragon','Tiger','Wolf','Phoenix','Cobra','Falcon','Bear','Panther','Leviathan','Kraken','Griffin'],
    patterns: ['scales','tribal','runes','waves','camo'],
  },
  ancient: {
    palettes: [
      ['#8d6e63','#ffb74d','#3e2723'],
      ['#a1887f','#ffca28','#4e342e'],
      ['#795548','#ffd54f','#2c1810'],
      ['#6d4c41','#ffab40','#241813'],
    ],
    adjectives: ['Ruin','Pharaoh','Hieroglyph','Antique','Relic','Ziggurat','Obelisk','Sanctum'],
    patterns: ['runes','hex','tribal','grid'],
  },
  water: {
    palettes: [
      ['#006064','#4fc3f7','#00232a'],
      ['#00838f','#80deea','#003a44'],
      ['#01579b','#4dd0e1','#01324a'],
      ['#0277bd','#81d4fa','#013a5c'],
    ],
    adjectives: ['Tide','Ripple','Abyss','Coral','Kelp','Undertow','Reef','Fathom'],
    patterns: ['waves','scales','fade','dots'],
  },
  desert: {
    palettes: [
      ['#c98a3c','#ffd180','#3d260a'],
      ['#d69752','#ffe0b2','#42280a'],
      ['#b17434','#ffab40','#2f1806'],
      ['#e0a570','#ffca80','#3a220a'],
    ],
    adjectives: ['Sand','Mirage','Dune','Sirocco','Oasis','Sunstroke','Nomadic'],
    patterns: ['waves','fade','chevron','tribal'],
  },
};

CRATER.generateSkins = function() {
  const out = [];
  const seen = new Set();
  Object.entries(CRATER.MOOD_TEMPLATES).forEach(([mood, tpl]) => {
    tpl.adjectives.forEach((adj, i) => {
      // 2 variants per adjective (different palette + pattern-noun)
      for (let v = 0; v < 2; v++) {
        const palette = tpl.palettes[(i + v) % tpl.palettes.length];
        const noun = CRATER.PATTERN_NOUNS[(i * 3 + v * 7 + mood.length) % CRATER.PATTERN_NOUNS.length];
        const pattern = tpl.patterns[(i + v * 2) % tpl.patterns.length];
        const name = `${adj} ${noun}`;
        if (seen.has(name)) continue;
        seen.add(name);
        out.push({ name, colors: palette.slice(), mood, pattern });
      }
    });
  });
  return out;
};

CRATER.SKINS = CRATER.generateSkins();

// Fast lookup
CRATER.SKINS_BY_MOOD = CRATER.SKINS.reduce((m, s) => {
  (m[s.mood] = m[s.mood] || []).push(s);
  return m;
}, {});

// ---------- 40 Cases ---------- //
// Each entry: { id, name, tier, mood, weapon(icon), primary, secondary, accent, price, hasGloves? }
// tier bands set the price and item pool bias.
CRATER.CASES = [
  // Tier 1 — Starter (100–500)
  { id: 'rookie',    name: 'Rookie',     tier: 1, mood: 'metal',  weapon: 'pistol',  primary:'#546e7a', secondary:'#78909c', accent:'#b0bec5', price: 120 },
  { id: 'ember',     name: 'Ember',      tier: 1, mood: 'fire',   weapon: 'pistol',  primary:'#d84315', secondary:'#ff8a3d', accent:'#ffd54f', price: 180 },
  { id: 'frost',     name: 'Frost',      tier: 1, mood: 'ice',    weapon: 'pistol',  primary:'#0277bd', secondary:'#4fc3f7', accent:'#b3e5fc', price: 220 },
  { id: 'pyrite',    name: 'Pyrite',     tier: 1, mood: 'gold',   weapon: 'smg',     primary:'#7a5a10', secondary:'#e4ae39', accent:'#fff176', price: 260 },
  { id: 'slate',     name: 'Slate',      tier: 1, mood: 'dark',   weapon: 'smg',     primary:'#37474f', secondary:'#607d8b', accent:'#90a4ae', price: 300 },
  { id: 'copper',    name: 'Copper',     tier: 1, mood: 'metal',  weapon: 'pistol',  primary:'#8d3810', secondary:'#c25b1a', accent:'#ffab40', price: 340 },
  { id: 'onyxbasic', name: 'Onyx Basic', tier: 1, mood: 'dark',   weapon: 'smg',     primary:'#1c1c1c', secondary:'#424242', accent:'#9e9e9e', price: 380 },
  { id: 'sandstone', name: 'Sandstone',  tier: 1, mood: 'metal',  weapon: 'shotgun', primary:'#8a6e3f', secondary:'#c9b280', accent:'#ffe0a3', price: 460 },

  // Tier 2 — Prime (500–2500)
  { id: 'cobalt',    name: 'Cobalt',     tier: 2, mood: 'ice',    weapon: 'rifle',   primary:'#0d47a1', secondary:'#2962ff', accent:'#82b1ff', price:  620 },
  { id: 'crimson',   name: 'Crimson',    tier: 2, mood: 'blood',  weapon: 'rifle',   primary:'#b71c1c', secondary:'#e53935', accent:'#ff8a80', price:  780 },
  { id: 'verdant',   name: 'Verdant',    tier: 2, mood: 'nature', weapon: 'rifle',   primary:'#1b5e20', secondary:'#43a047', accent:'#c6ff00', price:  920 },
  { id: 'twilight',  name: 'Twilight',   tier: 2, mood: 'void',   weapon: 'sniper',  primary:'#311b92', secondary:'#5e35b1', accent:'#b39ddb', price: 1080 },
  { id: 'aurora',    name: 'Aurora',     tier: 2, mood: 'ice',    weapon: 'rifle',   primary:'#00695c', secondary:'#00bfa5', accent:'#84ffff', price: 1260 },
  { id: 'nova',      name: 'Nova',       tier: 2, mood: 'gold',   weapon: 'rifle',   primary:'#e65100', secondary:'#ffab00', accent:'#fff176', price: 1520 },
  { id: 'volt',      name: 'Volt',       tier: 2, mood: 'cyber',  weapon: 'smg',     primary:'#006064', secondary:'#00e5ff', accent:'#ffea00', price: 1860 },
  { id: 'phantom',   name: 'Phantom',    tier: 2, mood: 'void',   weapon: 'sniper',  primary:'#1a237e', secondary:'#3949ab', accent:'#7986cb', price: 2280 },

  // Tier 3 — Combat (2500–10000)
  { id: 'warfront',  name: 'Warfront',   tier: 3, mood: 'metal',  weapon: 'rifle',   primary:'#3e2723', secondary:'#795548', accent:'#ffab40', price:  2900 },
  { id: 'ironclad',  name: 'Ironclad',   tier: 3, mood: 'metal',  weapon: 'heavy',   primary:'#263238', secondary:'#546e7a', accent:'#e4ae39', price:  3600 },
  { id: 'ravager',   name: 'Ravager',    tier: 3, mood: 'blood',  weapon: 'rifle',   primary:'#3e0000', secondary:'#c62828', accent:'#ff5252', price:  4200 },
  { id: 'vanguard',  name: 'Vanguard',   tier: 3, mood: 'metal',  weapon: 'sniper',  primary:'#01579b', secondary:'#0288d1', accent:'#4fc3f7', price:  4900 },
  { id: 'serpent',   name: 'Serpent',    tier: 3, mood: 'nature', weapon: 'rifle',   primary:'#004d40', secondary:'#00897b', accent:'#c8e6c9', price:  5800 },
  { id: 'vortex',    name: 'Vortex',     tier: 3, mood: 'storm',  weapon: 'sniper',  primary:'#1a237e', secondary:'#3f51b5', accent:'#9fa8da', price:  6800 },
  { id: 'havoc',     name: 'Havoc',      tier: 3, mood: 'fire',   weapon: 'rifle',   primary:'#bf360c', secondary:'#e64a19', accent:'#ffd54f', price:  8100 },
  { id: 'ranger',    name: 'Ranger',     tier: 3, mood: 'nature', weapon: 'sniper',  primary:'#33691e', secondary:'#689f38', accent:'#c5e1a5', price:  9600 },

  // Tier 4 — Elite (10 000–40 000). Special items include knives.
  { id: 'obsidian',  name: 'Obsidian',   tier: 4, mood: 'dark',   weapon: 'knife',   primary:'#0a0a0a', secondary:'#212121', accent:'#e4ae39', price: 11500 },
  { id: 'meridian',  name: 'Meridian',   tier: 4, mood: 'tech',   weapon: 'rifle',   primary:'#004d5a', secondary:'#00838f', accent:'#84ffff', price: 13500 },
  { id: 'chimera',   name: 'Chimera',    tier: 4, mood: 'void',   weapon: 'rifle',   primary:'#4a148c', secondary:'#7b1fa2', accent:'#ea80fc', price: 16000 },
  { id: 'kingslayer',name: 'Kingslayer', tier: 4, mood: 'gold',   weapon: 'knife',   primary:'#3a2b00', secondary:'#e4ae39', accent:'#fff176', price: 19000 },
  { id: 'titanium',  name: 'Titanium',   tier: 4, mood: 'metal',  weapon: 'knife',   primary:'#37474f', secondary:'#78909c', accent:'#eceff1', price: 22500 },
  { id: 'radiant',   name: 'Radiant',    tier: 4, mood: 'nature', weapon: 'rifle',   primary:'#1b5e20', secondary:'#43a047', accent:'#c6ff00', price: 27000 },
  { id: 'eclipse',   name: 'Eclipse',    tier: 4, mood: 'dark',   weapon: 'sniper',  primary:'#0d0d0d', secondary:'#4a148c', accent:'#ff4081', price: 32000 },
  { id: 'zephyr',    name: 'Zephyr',     tier: 4, mood: 'ice',    weapon: 'sniper',  primary:'#01579b', secondary:'#039be5', accent:'#b3e5fc', price: 38000 },

  // Tier 5 — Legendary (40 000–100 000). All have knives + gloves in special pool.
  { id: 'dragonlord', name: 'Dragonlord', tier: 5, mood: 'blood',  weapon: 'knife', primary:'#4a0000', secondary:'#c62828', accent:'#ffd54f', price: 44000, hasGloves: true },
  { id: 'voidbreaker',name: 'Voidbreaker',tier: 5, mood: 'void',   weapon: 'knife', primary:'#0a0018', secondary:'#4a148c', accent:'#ea80fc', price: 52000, hasGloves: true },
  { id: 'emberking',  name: 'Emberking',  tier: 5, mood: 'fire',   weapon: 'knife', primary:'#3a0a00', secondary:'#e64a19', accent:'#ffab40', price: 61000, hasGloves: true },
  { id: 'prism',      name: 'Prism',      tier: 5, mood: 'cyber',  weapon: 'knife', primary:'#0a0a2a', secondary:'#7c4dff', accent:'#00e5ff', price: 70000, hasGloves: true },
  { id: 'celestial',  name: 'Celestial',  tier: 5, mood: 'gold',   weapon: 'knife', primary:'#1a1200', secondary:'#e4ae39', accent:'#fff176', price: 78000, hasGloves: true },
  { id: 'ascendant',  name: 'Ascendant',  tier: 5, mood: 'ice',    weapon: 'knife', primary:'#001a3a', secondary:'#0288d1', accent:'#b3e5fc', price: 86000, hasGloves: true },
  { id: 'apex',       name: 'Apex',       tier: 5, mood: 'metal',  weapon: 'knife', primary:'#0a0a0a', secondary:'#455a64', accent:'#e4ae39', price: 94000, hasGloves: true },
  { id: 'genesis',    name: 'Genesis',    tier: 5, mood: 'void',   weapon: 'knife', primary:'#000000', secondary:'#4a148c', accent:'#ffd700', price:100000, hasGloves: true },

  // --- Prime (t2) drop, 5 fresh aesthetics ---
  { id: 'prism_refraction',  name: 'Prism Refraction',  tier: 2, mood: 'prismatic', weapon: 'rifle',   primary:'#ff2fb3', secondary:'#3ad0ff', accent:'#fff45a', price:  4200 },
  { id: 'splatter_riot',     name: 'Splatter Riot',     tier: 2, mood: 'paint',     weapon: 'smg',     primary:'#ff5b2e', secondary:'#2ee8a4', accent:'#ffe14a', price:  3100 },
  { id: 'spring_bloom',      name: 'Spring Bloom',      tier: 2, mood: 'nature',    weapon: 'pistol',  primary:'#ff7fbf', secondary:'#7dd94f', accent:'#fff2a8', price:  2800 },
  { id: 'arctic_aurora',     name: 'Arctic Aurora',     tier: 2, mood: 'ice',       weapon: 'sniper',  primary:'#5ae2ff', secondary:'#a679ff', accent:'#c7ffee', price:  6400 },
  { id: 'sunset_chevron',    name: 'Sunset Chevron',    tier: 2, mood: 'orange',    weapon: 'shotgun', primary:'#ff6a1a', secondary:'#ffb347', accent:'#ff2e88', price:  3600 },

  // --- Combat (t3) thematic ---
  { id: 'shaman_totem',      name: 'Shaman Totem',      tier: 3, mood: 'tribal',  weapon: 'shotgun', primary:'#6b3a1f', secondary:'#c9a24a', accent:'#e8d3a1', price:  7200 },
  { id: 'kraken_depths',     name: 'Kraken Depths',     tier: 3, mood: 'water',   weapon: 'sniper',  primary:'#0b2a3d', secondary:'#1f7a6b', accent:'#9be3d0', price: 11800, hasGloves: true },
  { id: 'pharaoh_ruins',     name: 'Pharaoh Ruins',     tier: 3, mood: 'ancient', weapon: 'rifle',   primary:'#3a2510', secondary:'#d4a437', accent:'#f2e2b0', price: 13500 },
  { id: 'sand_serpent',      name: 'Sand Serpent',      tier: 3, mood: 'desert',  weapon: 'smg',     primary:'#a67535', secondary:'#5c3a1a', accent:'#e6c98a', price:  6400 },
  { id: 'plague_doctor',     name: 'Plague Doctor',     tier: 3, mood: 'toxic',   weapon: 'pistol',  primary:'#1a1f14', secondary:'#7ab53a', accent:'#c8e64a', price:  8900 },

  // --- Elite (t4) industrial high-end ---
  { id: 'aerospace_titanium',name: 'Aerospace Titanium',tier: 4, mood: 'metal',    weapon: 'sniper', primary:'#2a2f36', secondary:'#6b7480', accent:'#e8f1ff', price: 42000 },
  { id: 'deepsea_salvage',   name: 'Deep Salvage',      tier: 4, mood: 'dark',     weapon: 'heavy',  primary:'#0a1a24', secondary:'#2d5c66', accent:'#c9a24b', price: 38500, hasGloves: true },
  { id: 'neon_subway',       name: 'Neon Subway',       tier: 4, mood: 'cyber',    weapon: 'smg',    primary:'#141026', secondary:'#3a2e6b', accent:'#ff2f8a', price: 34000 },
  { id: 'digital_camo',      name: 'Digital Camo',      tier: 4, mood: 'military', weapon: 'rifle',  primary:'#1c2418', secondary:'#4a5a3a', accent:'#d4e04a', price: 28500 },
  { id: 'fabricator',        name: 'Fabricator',        tier: 4, mood: 'tech',     weapon: 'pistol', primary:'#1a1614', secondary:'#5c4a3a', accent:'#ff7a1a', price: 22000 },

  // --- Legendary (t5) mythic hunt ---
  { id: 'crimson_lair',      name: 'Crimson Lair',      tier: 5, mood: 'blood', weapon: 'knife', primary:'#2a0508', secondary:'#7a1220', accent:'#ff2a4a', price: 189000, hasGloves: true },
  { id: 'void_obsidian',     name: 'Void Obsidian',     tier: 5, mood: 'void',  weapon: 'knife', primary:'#08060f', secondary:'#241a3a', accent:'#a678ff', price: 215000, hasGloves: true },
  { id: 'molten_forge',      name: 'Molten Forge',      tier: 5, mood: 'fire',  weapon: 'heavy', primary:'#180806', secondary:'#8a2a10', accent:'#ffb347', price: 142000, hasGloves: true },
  { id: 'arctic_apex',       name: 'Arctic Apex',       tier: 5, mood: 'ice',   weapon: 'sniper',primary:'#061a24', secondary:'#1e5a78', accent:'#7ff0ff', price: 168000, hasGloves: true },
  { id: 'gold_monarchy',     name: 'Gold Monarchy',     tier: 5, mood: 'gold',  weapon: 'knife', primary:'#1a1206', secondary:'#7a5a12', accent:'#ffd24a', price: 248000, hasGloves: true },
];

// ---------- Deterministic PRNG (mulberry32) ---------- //
CRATER.seedFrom = function(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
};
CRATER.mulberry32 = function(a) {
  return function() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
function pick(arr, r) { return arr[Math.floor(r() * arr.length)]; }

// ---------- Case item generation ---------- //
// Each tier's rarity distribution across ~15 items.
CRATER.TIER_COUNTS = {
  1: { consumer: 5, industrial: 4, milspec: 3, restricted: 2, classified: 1, covert: 0, special: 0 },
  2: { consumer: 5, industrial: 4, milspec: 3, restricted: 2, classified: 1, covert: 1, special: 0 },
  3: { consumer: 4, industrial: 4, milspec: 3, restricted: 2, classified: 1, covert: 1, special: 0 },
  4: { consumer: 3, industrial: 4, milspec: 4, restricted: 3, classified: 2, covert: 1, special: 1 },
  5: { consumer: 3, industrial: 4, milspec: 4, restricted: 3, classified: 2, covert: 2, special: 2 },
};

// Rarity price multiplier off the base case price
CRATER.RARITY_MULT = {
  consumer:   0.05,
  industrial: 0.15,
  milspec:    0.55,
  restricted: 1.60,
  classified: 4.50,
  covert:    12.00,
  special:   35.00,
};

// Weapon pools that a case's rarity slot picks from (biased to weapon type of the case)
CRATER.WEAPON_KEYS = Object.keys(CRATER.WEAPONS);

CRATER.pickWeaponPoolFor = function(caseCfg, rarityKey, r) {
  const allKeys = CRATER.WEAPON_KEYS;
  const byClass = (cls) => allKeys.filter(k => CRATER.WEAPONS[k].cls === cls);

  // Higher rarities lean toward premium weapons (AK/AWP/M4/Deagle)
  const premium = ['ak47','m4a4','m4a1s','awp','deagle','usps'];
  const midtier = ['aug','sg553','ssg08','fiveseven','p90','mp7','mp9'];

  if (rarityKey === 'covert' || rarityKey === 'classified') {
    return premium.concat(midtier);
  }
  if (rarityKey === 'restricted') {
    return premium.concat(midtier, ['xm1014','p250','glock','ump','mp5']);
  }
  // Lower rarities bias toward the case's weapon class
  const caseCls = caseCfg.weapon === 'knife' ? 'rifle' : caseCfg.weapon;
  const focus = byClass(caseCls);
  return focus.length ? focus.concat(allKeys) : allKeys;
};

CRATER.buildCase = function(caseCfg) {
  const seed = CRATER.seedFrom(caseCfg.id);
  const r = CRATER.mulberry32(seed);
  const counts = CRATER.TIER_COUNTS[caseCfg.tier];
  const items = [];

  // Skin pool priorities: 60% case's mood, 40% others
  const moodSkins = CRATER.SKINS_BY_MOOD[caseCfg.mood] || [];
  const otherSkins = CRATER.SKINS.filter(s => s.mood !== caseCfg.mood);
  const skinPool = (want) => (r() < 0.6 && moodSkins.length ? pick(moodSkins, r) : pick(otherSkins, r));

  const used = new Set();

  Object.entries(counts).forEach(([rarityKey, count]) => {
    if (rarityKey === 'special') return;   // handled below
    const wPool = CRATER.pickWeaponPoolFor(caseCfg, rarityKey, r);
    for (let i = 0; i < count; i++) {
      let skin, weapon, key, tries = 0;
      do {
        skin = skinPool();
        weapon = pick(wPool, r);
        key = weapon + '|' + skin.name;
        tries++;
      } while (used.has(key) && tries < 12);
      used.add(key);
      const wear = pick(CRATER.WEAR, r);
      const weaponCfg = CRATER.WEAPONS[weapon];
      const basePrice = caseCfg.price * CRATER.RARITY_MULT[rarityKey] * weaponCfg.base * wear.mult;
      const jitter = 0.85 + r() * 0.30;
      const price = Math.max(1, Math.round(basePrice * jitter));
      items.push({
        id: `${caseCfg.id}_${rarityKey}_${i}`,
        weapon,
        weaponName: weaponCfg.name,
        cls: weaponCfg.cls,
        skin: skin.name,
        colors: skin.colors,
        pattern: skin.pattern || 'solid',
        rarity: rarityKey,
        wear: wear.code,
        wearName: wear.name,
        price,
      });
    }
  });

  // Special items (knives, gloves)
  const specialCount = counts.special || 0;
  for (let i = 0; i < specialCount; i++) {
    const isGlove = caseCfg.hasGloves && i === specialCount - 1;
    const pool = isGlove ? CRATER.GLOVES : CRATER.KNIVES;
    const weaponName = pick(pool, r);
    const skin = pick(moodSkins.length ? moodSkins : CRATER.SKINS, r);
    const wear = pick(CRATER.WEAR, r);
    const baseMult = isGlove ? CRATER.GLOVE_BASE : CRATER.KNIFE_BASE;
    const basePrice = caseCfg.price * CRATER.RARITY_MULT.special * baseMult * wear.mult;
    const jitter = 0.80 + r() * 0.50;
    const price = Math.max(1, Math.round(basePrice * jitter));
    items.push({
      id: `${caseCfg.id}_special_${i}`,
      weapon: isGlove ? 'gloves' : 'knife',
      weaponName,
      cls: isGlove ? 'gloves' : 'knife',
      skin: skin.name,
      colors: skin.colors,
      pattern: skin.pattern || 'solid',
      rarity: 'special',
      wear: wear.code,
      wearName: wear.name,
      price,
    });
  }

  // Sort by rarity descending so drop grid shows best first
  items.sort((a, b) => {
    const ra = CRATER.RARITY_ORDER.indexOf(a.rarity);
    const rb = CRATER.RARITY_ORDER.indexOf(b.rarity);
    if (ra !== rb) return rb - ra;
    return b.price - a.price;
  });

  return { ...caseCfg, items };
};

CRATER.getCase = function(id) {
  const cfg = CRATER.CASES.find(c => c.id === id);
  return cfg ? CRATER.buildCase(cfg) : null;
};

CRATER.allCases = function() {
  if (!CRATER._built) CRATER._built = CRATER.CASES.map(CRATER.buildCase);
  return CRATER._built;
};

// ---------- Roll an item (weighted by CS-standard rarity odds within case) ---------- //
CRATER.rollItem = function(builtCase) {
  const bucket = {};
  builtCase.items.forEach(it => {
    (bucket[it.rarity] = bucket[it.rarity] || []).push(it);
  });
  // Total rarity chance in cases where a rarity is missing gets redistributed
  const availableRarities = Object.keys(bucket);
  let totalChance = 0;
  availableRarities.forEach(rk => { totalChance += CRATER.RARITY[rk].chance; });
  const roll = Math.random() * totalChance;
  let acc = 0;
  let chosenRarity = availableRarities[0];
  for (const rk of availableRarities) {
    acc += CRATER.RARITY[rk].chance;
    if (roll <= acc) { chosenRarity = rk; break; }
  }
  const pool = bucket[chosenRarity];
  const item = pool[Math.floor(Math.random() * pool.length)];
  // Pick a random wear for the drop instance
  const wear = CRATER.WEAR[Math.floor(Math.random() * CRATER.WEAR.length)];
  const jitter = 0.9 + Math.random() * 0.2;
  const finalPrice = Math.max(1, Math.round(item.price * (wear.mult / (CRATER.WEAR.find(w => w.code === item.wear).mult)) * jitter));
  return {
    ...item,
    wear: wear.code,
    wearName: wear.name,
    price: finalPrice,
    instanceId: 'i_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
  };
};

// ---------- Live drops feed generator (fake) ---------- //
CRATER.FAKE_USERS = [
  'GhostFire', 'Nezyx', 'MorphKid', 'iSaltz', 'DrakePro', 'Klyaksa', 'Ymka3',
  'Void_TT', 'Slayerix', 'Rusyaka', 'Freon24', 'Marra', 'AshGO', 'MEGO4',
  'Timonchik', 'Wispo', 'Nixon', 'Trippix', 'Lambo_23', 'BraveHeart',
  'Zerkal0', 'Cypher0', 'YungKrit', 'Storm77', 'Peppex',
];
CRATER.buildFakeDrops = function(n) {
  const cases = CRATER.allCases();
  const drops = [];
  for (let i = 0; i < n; i++) {
    const c = cases[Math.floor(Math.random() * cases.length)];
    const goodItems = c.items.filter(it => ['restricted','classified','covert','special'].includes(it.rarity));
    const item = goodItems.length && Math.random() < 0.6
      ? goodItems[Math.floor(Math.random() * goodItems.length)]
      : c.items[Math.floor(Math.random() * c.items.length)];
    const user = CRATER.FAKE_USERS[Math.floor(Math.random() * CRATER.FAKE_USERS.length)];
    drops.push({ user, item, caseName: c.name });
  }
  return drops;
};
