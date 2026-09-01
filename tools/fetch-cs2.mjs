#!/usr/bin/env node
/* ================================================================
   CRATER — CS2 data builder.
   Runs at deploy time (GitHub Action) or locally:
     node tools/fetch-cs2.mjs
   Downloads the community dataset (ByMykel/CSGO-API, MIT) and
   compacts the weapon cases into data/cs2.json. Images are NOT
   downloaded — the JSON stores CDN URLs and the player's browser
   loads them straight from Steam's servers.
   ================================================================ */

import { writeFile, mkdir } from 'node:fs/promises';

const SRC = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json';
const OUT = new URL('../data/cs2.json', import.meta.url);

// rarity.name → CRATER rarity key
const RARITY_MAP = {
  'Consumer Grade':   'consumer',
  'Industrial Grade': 'industrial',
  'Mil-Spec Grade':   'milspec',
  'Restricted':       'restricted',
  'Classified':       'classified',
  'Covert':           'covert',
  'Contraband':       'covert',
  'Extraordinary':    'special',
};

// weapon display name → CRATER weapon class (for filters + SVG fallback)
const CLS_MAP = {
  'AK-47': 'rifle', 'M4A4': 'rifle', 'M4A1-S': 'rifle', 'AUG': 'rifle',
  'SG 553': 'rifle', 'FAMAS': 'rifle', 'Galil AR': 'rifle',
  'AWP': 'sniper', 'SSG 08': 'sniper', 'SCAR-20': 'sniper', 'G3SG1': 'sniper',
  'Desert Eagle': 'pistol', 'USP-S': 'pistol', 'Glock-18': 'pistol',
  'P250': 'pistol', 'P2000': 'pistol', 'Five-SeveN': 'pistol', 'Tec-9': 'pistol',
  'CZ75-Auto': 'pistol', 'Dual Berettas': 'pistol', 'R8 Revolver': 'pistol',
  'Zeus x27': 'pistol',
  'MP7': 'smg', 'MP9': 'smg', 'MP5-SD': 'smg', 'UMP-45': 'smg',
  'P90': 'smg', 'PP-Bizon': 'smg', 'MAC-10': 'smg',
  'Nova': 'shotgun', 'XM1014': 'shotgun', 'MAG-7': 'shotgun', 'Sawed-Off': 'shotgun',
  'M249': 'heavy', 'Negev': 'heavy',
};

function splitName(fullName) {
  // "AK-47 | Redline" → weapon + skin; "★ Bayonet | Fade" → knife
  const starred = fullName.startsWith('★');
  const clean = fullName.replace(/^★\s*/, '');
  const [weapon, skin] = clean.split(' | ');
  return { weapon: weapon.trim(), skin: (skin || 'Vanilla').trim(), starred };
}

function clsFor(weapon, starred) {
  if (starred) {
    return /Gloves|Hand Wraps/i.test(weapon) ? 'gloves' : 'knife';
  }
  return CLS_MAP[weapon] || 'rifle';
}

function mapItem(raw, forceSpecial) {
  const { weapon, skin, starred } = splitName(raw.name || '');
  const rarityName = raw.rarity && raw.rarity.name;
  let r = RARITY_MAP[rarityName] || 'milspec';
  if (forceSpecial || starred) r = 'special';
  return {
    n: skin,                 // skin name
    w: weapon,               // weapon display name
    c: clsFor(weapon, starred),
    r,                       // CRATER rarity key
    img: raw.image || null,  // CDN URL (loaded by the player's browser)
  };
}

const res = await fetch(SRC);
if (!res.ok) {
  console.error(`fetch failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const crates = await res.json();
const cases = crates.filter(c => (c.type || '') === 'Case');

const out = cases.map(c => ({
  id: 'cs2_' + (c.id || '').replace(/[^a-z0-9]+/gi, '_'),
  name: c.name,
  image: c.image || null,
  date: c.first_sale_date || null,
  items: [
    ...(c.contains || []).map(it => mapItem(it, false)),
    ...(c.contains_rare || []).map(it => mapItem(it, true)),
  ],
}));

await mkdir(new URL('../data/', import.meta.url), { recursive: true });
const json = JSON.stringify(out);
await writeFile(OUT, json);
console.log(`wrote data/cs2.json: ${cases.length} cases, ${out.reduce((a, c) => a + c.items.length, 0)} items, ${(json.length / 1024 / 1024).toFixed(2)} MB`);
