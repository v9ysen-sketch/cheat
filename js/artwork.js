/* ================================================================
   CRATER — SVG artwork generators for cases + weapons.
   All hand-drawn shapes, no external assets.
   ================================================================ */

window.CRATER = window.CRATER || {};

// ---------- Utilities ---------- //
function svgOpen(vb, extra) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet"${extra||''}>`;
}
function lighten(hex, amt) {
  const c = hex.replace('#','');
  const n = parseInt(c, 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 0xff) + amt, b = (n & 0xff) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + ((r<<16)|(g<<8)|b).toString(16).padStart(6,'0');
}
function shade(hex, amt) { return lighten(hex, -Math.abs(amt)); }

// ---------- Weapon silhouettes (viewBox 400 x 300) ---------- //
// Each returns raw SVG path/shapes (no <svg> wrapper). Colors are applied at call site.
CRATER.WEAPON_ART = {
  rifle: function(main, accent, dark) {
    return `
      <g>
        <!-- stock -->
        <path d="M20 165 L70 145 L82 155 L82 195 L70 205 L20 185 Z" fill="${shade(main,20)}" stroke="${dark}" stroke-width="1.5"/>
        <!-- receiver -->
        <rect x="80" y="150" width="180" height="42" fill="${main}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="80" y="150" width="180" height="10" fill="${lighten(main,25)}"/>
        <rect x="80" y="184" width="180" height="8" fill="${shade(main,20)}"/>
        <!-- accent panel -->
        <rect x="100" y="162" width="150" height="12" fill="${accent}" opacity="0.85"/>
        <!-- magazine -->
        <path d="M140 190 L138 235 L200 235 L198 190 Z" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="146" y="200" width="45" height="4" fill="${accent}" opacity="0.7"/>
        <rect x="146" y="212" width="45" height="4" fill="${accent}" opacity="0.7"/>
        <!-- grip -->
        <path d="M220 190 L215 240 L245 245 L250 195 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <!-- trigger guard -->
        <path d="M195 190 L200 215 L225 215 L220 190 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.2"/>
        <circle cx="212" cy="205" r="4" fill="${dark}"/>
        <!-- barrel -->
        <rect x="260" y="164" width="120" height="14" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="260" y="164" width="120" height="4" fill="${lighten(main,15)}"/>
        <!-- muzzle -->
        <rect x="378" y="160" width="8" height="22" fill="${dark}"/>
        <!-- iron sight -->
        <rect x="150" y="140" width="6" height="12" fill="${dark}"/>
        <rect x="240" y="140" width="6" height="12" fill="${dark}"/>
        <!-- rail dots -->
        <rect x="105" y="158" width="140" height="1.5" fill="${accent}" opacity="0.6"/>
        <rect x="105" y="182" width="140" height="1.5" fill="${accent}" opacity="0.6"/>
      </g>`;
  },
  sniper: function(main, accent, dark) {
    return `
      <g>
        <!-- stock -->
        <path d="M10 158 L60 138 L75 148 L75 202 L60 212 L10 192 Z" fill="${shade(main,20)}" stroke="${dark}" stroke-width="1.5"/>
        <!-- cheek rest -->
        <rect x="60" y="130" width="40" height="20" fill="${shade(main,25)}" rx="2"/>
        <!-- receiver -->
        <rect x="75" y="150" width="140" height="38" fill="${main}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="75" y="150" width="140" height="8" fill="${lighten(main,20)}"/>
        <!-- scope -->
        <ellipse cx="150" cy="120" rx="55" ry="14" fill="${shade(main,30)}" stroke="${dark}" stroke-width="2"/>
        <ellipse cx="150" cy="120" rx="42" ry="10" fill="${dark}"/>
        <line x1="115" y1="120" x2="185" y2="120" stroke="${accent}" stroke-width="1.5" opacity="0.7"/>
        <line x1="150" y1="112" x2="150" y2="128" stroke="${accent}" stroke-width="1.5" opacity="0.7"/>
        <rect x="130" y="128" width="40" height="22" fill="${shade(main,20)}" stroke="${dark}" stroke-width="1.5"/>
        <!-- accent -->
        <rect x="90" y="161" width="115" height="8" fill="${accent}" opacity="0.85"/>
        <!-- magazine -->
        <path d="M130 188 L128 220 L175 220 L173 188 Z" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.2"/>
        <!-- grip -->
        <path d="M195 186 L192 235 L220 240 L225 190 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <!-- barrel -->
        <rect x="215" y="164" width="160" height="12" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="215" y="164" width="160" height="3" fill="${lighten(main,15)}"/>
        <!-- bipod -->
        <line x1="290" y1="176" x2="278" y2="220" stroke="${dark}" stroke-width="2.5"/>
        <line x1="300" y1="176" x2="312" y2="220" stroke="${dark}" stroke-width="2.5"/>
        <!-- muzzle -->
        <rect x="372" y="160" width="12" height="20" fill="${dark}"/>
      </g>`;
  },
  pistol: function(main, accent, dark) {
    return `
      <g>
        <!-- slide -->
        <path d="M100 130 L280 130 L295 148 L295 170 L100 170 Z" fill="${main}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="100" y="130" width="195" height="8" fill="${lighten(main,20)}"/>
        <!-- accent strip -->
        <rect x="115" y="148" width="160" height="10" fill="${accent}" opacity="0.85"/>
        <!-- serrations -->
        <line x1="105" y1="140" x2="105" y2="165" stroke="${dark}" stroke-width="1.2"/>
        <line x1="112" y1="140" x2="112" y2="165" stroke="${dark}" stroke-width="1.2"/>
        <line x1="119" y1="140" x2="119" y2="165" stroke="${dark}" stroke-width="1.2"/>
        <line x1="278" y1="140" x2="278" y2="165" stroke="${dark}" stroke-width="1.2"/>
        <line x1="285" y1="140" x2="285" y2="165" stroke="${dark}" stroke-width="1.2"/>
        <!-- iron sight -->
        <rect x="150" y="122" width="6" height="10" fill="${dark}"/>
        <rect x="240" y="122" width="6" height="10" fill="${dark}"/>
        <!-- barrel tip -->
        <rect x="288" y="152" width="12" height="12" fill="${dark}"/>
        <!-- trigger guard -->
        <path d="M155 170 L165 200 L220 200 L230 170 Z" fill="${shade(main,20)}" stroke="${dark}" stroke-width="1.5"/>
        <circle cx="195" cy="185" r="6" fill="${dark}"/>
        <!-- grip -->
        <path d="M100 165 L110 240 L200 245 L210 168 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <!-- grip texture -->
        <line x1="120" y1="180" x2="200" y2="184" stroke="${dark}" stroke-width="1" opacity="0.5"/>
        <line x1="122" y1="195" x2="200" y2="198" stroke="${dark}" stroke-width="1" opacity="0.5"/>
        <line x1="124" y1="210" x2="200" y2="212" stroke="${dark}" stroke-width="1" opacity="0.5"/>
        <line x1="125" y1="225" x2="197" y2="228" stroke="${dark}" stroke-width="1" opacity="0.5"/>
        <!-- mag base -->
        <rect x="112" y="238" width="90" height="10" fill="${accent}" opacity="0.7"/>
      </g>`;
  },
  smg: function(main, accent, dark) {
    return `
      <g>
        <!-- stock -->
        <path d="M20 155 L60 145 L75 155 L75 195 L60 205 L20 195 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <!-- body -->
        <rect x="72" y="155" width="180" height="42" fill="${main}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="72" y="155" width="180" height="9" fill="${lighten(main,20)}"/>
        <rect x="72" y="188" width="180" height="8" fill="${shade(main,20)}"/>
        <!-- accent panel -->
        <rect x="90" y="166" width="140" height="14" fill="${accent}" opacity="0.85"/>
        <!-- rail dots -->
        <g fill="${dark}" opacity="0.6">
          <circle cx="100" cy="160" r="1.5"/><circle cx="115" cy="160" r="1.5"/>
          <circle cx="130" cy="160" r="1.5"/><circle cx="145" cy="160" r="1.5"/>
          <circle cx="160" cy="160" r="1.5"/><circle cx="175" cy="160" r="1.5"/>
          <circle cx="190" cy="160" r="1.5"/><circle cx="205" cy="160" r="1.5"/>
        </g>
        <!-- sight -->
        <rect x="140" y="142" width="14" height="14" fill="${dark}"/>
        <!-- barrel -->
        <rect x="252" y="167" width="70" height="14" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="320" y="163" width="8" height="22" fill="${dark}"/>
        <!-- trigger -->
        <path d="M158 195 L165 218 L195 218 L188 195 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.2"/>
        <circle cx="178" cy="208" r="4" fill="${dark}"/>
        <!-- magazine -->
        <path d="M118 195 L114 245 L166 245 L162 195 Z" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="122" y="205" width="38" height="4" fill="${accent}" opacity="0.7"/>
        <rect x="122" y="216" width="38" height="4" fill="${accent}" opacity="0.7"/>
        <rect x="122" y="227" width="38" height="4" fill="${accent}" opacity="0.7"/>
        <!-- grip -->
        <path d="M200 195 L196 238 L228 240 L232 197 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
      </g>`;
  },
  shotgun: function(main, accent, dark) {
    return `
      <g>
        <!-- stock -->
        <path d="M15 160 L60 145 L75 155 L75 200 L60 210 L15 195 Z" fill="${shade(main,20)}" stroke="${dark}" stroke-width="1.5"/>
        <!-- receiver -->
        <rect x="75" y="155" width="115" height="40" fill="${main}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="75" y="155" width="115" height="8" fill="${lighten(main,20)}"/>
        <!-- accent -->
        <rect x="85" y="165" width="90" height="10" fill="${accent}" opacity="0.85"/>
        <!-- pump -->
        <rect x="200" y="170" width="70" height="18" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5" rx="2"/>
        <line x1="210" y1="170" x2="210" y2="188" stroke="${dark}" stroke-width="1"/>
        <line x1="230" y1="170" x2="230" y2="188" stroke="${dark}" stroke-width="1"/>
        <line x1="250" y1="170" x2="250" y2="188" stroke="${dark}" stroke-width="1"/>
        <!-- barrel -->
        <rect x="190" y="163" width="200" height="10" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <ellipse cx="385" cy="168" rx="7" ry="10" fill="${dark}"/>
        <!-- trigger -->
        <path d="M130 195 L135 218 L165 218 L160 195 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.2"/>
        <circle cx="147" cy="208" r="4" fill="${dark}"/>
        <!-- grip -->
        <path d="M155 195 L152 240 L182 240 L188 197 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <!-- shell tube -->
        <rect x="190" y="188" width="80" height="10" fill="${shade(main,15)}" stroke="${dark}" stroke-width="1"/>
      </g>`;
  },
  heavy: function(main, accent, dark) {
    return `
      <g>
        <!-- stock -->
        <path d="M15 165 L55 150 L70 160 L70 200 L55 210 L15 195 Z" fill="${shade(main,20)}" stroke="${dark}" stroke-width="1.5"/>
        <!-- receiver -->
        <rect x="70" y="152" width="180" height="50" fill="${main}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="70" y="152" width="180" height="10" fill="${lighten(main,20)}"/>
        <!-- accent -->
        <rect x="90" y="168" width="140" height="16" fill="${accent}" opacity="0.85"/>
        <!-- belt-feed box -->
        <rect x="90" y="200" width="120" height="45" fill="${shade(main,20)}" stroke="${dark}" stroke-width="1.5" rx="3"/>
        <g stroke="${dark}" stroke-width="1" opacity="0.7">
          <line x1="100" y1="212" x2="200" y2="212"/>
          <line x1="100" y1="222" x2="200" y2="222"/>
          <line x1="100" y1="232" x2="200" y2="232"/>
        </g>
        <!-- barrel with cooling ribs -->
        <rect x="250" y="164" width="140" height="18" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <g stroke="${dark}" stroke-width="1.5" opacity="0.8">
          <line x1="270" y1="164" x2="270" y2="182"/>
          <line x1="285" y1="164" x2="285" y2="182"/>
          <line x1="300" y1="164" x2="300" y2="182"/>
          <line x1="315" y1="164" x2="315" y2="182"/>
          <line x1="330" y1="164" x2="330" y2="182"/>
          <line x1="345" y1="164" x2="345" y2="182"/>
          <line x1="360" y1="164" x2="360" y2="182"/>
        </g>
        <rect x="386" y="160" width="10" height="26" fill="${dark}"/>
        <!-- grip -->
        <path d="M210 200 L206 245 L240 248 L246 205 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <!-- sight -->
        <rect x="140" y="140" width="10" height="14" fill="${dark}"/>
      </g>`;
  },
  knife: function(main, accent, dark) {
    return `
      <g>
        <!-- blade -->
        <path d="M60 155 L280 130 L340 155 L280 180 L60 175 Z" fill="${main}" stroke="${dark}" stroke-width="1.5"/>
        <path d="M60 155 L280 130 L340 155 L280 145 Z" fill="${lighten(main,30)}" opacity="0.8"/>
        <!-- fuller/edge highlight -->
        <line x1="90" y1="163" x2="290" y2="148" stroke="${accent}" stroke-width="1.5" opacity="0.7"/>
        <line x1="90" y1="170" x2="290" y2="160" stroke="${dark}" stroke-width="1" opacity="0.5"/>
        <!-- edge -->
        <line x1="65" y1="175" x2="335" y2="155" stroke="${dark}" stroke-width="1.3"/>
        <!-- guard -->
        <path d="M50 140 L60 140 L60 190 L50 190 L45 175 L45 155 Z" fill="${shade(main,30)}" stroke="${dark}" stroke-width="1.5"/>
        <!-- handle -->
        <path d="M50 148 L45 200 L15 210 L15 145 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <!-- handle wrapping -->
        <g stroke="${accent}" stroke-width="2" opacity="0.7">
          <line x1="20" y1="160" x2="45" y2="165"/>
          <line x1="19" y1="175" x2="45" y2="180"/>
          <line x1="18" y1="190" x2="45" y2="195"/>
        </g>
        <!-- pommel dot -->
        <circle cx="20" cy="177" r="3" fill="${accent}"/>
      </g>`;
  },
  gloves: function(main, accent, dark) {
    return `
      <g>
        <!-- back hand -->
        <path d="M80 100 Q100 90 130 92 L200 95 L260 98 Q280 100 288 120 L295 200 Q295 220 275 225 L100 225 Q80 220 78 200 L80 100 Z"
          fill="${main}" stroke="${dark}" stroke-width="1.5"/>
        <!-- thumb -->
        <path d="M78 200 Q60 195 55 175 L48 130 Q52 110 72 108 L82 125 L80 200 Z"
          fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <!-- knuckle accent -->
        <path d="M110 105 L280 108 L280 130 L110 128 Z" fill="${accent}" opacity="0.75"/>
        <!-- finger seams -->
        <line x1="130" y1="90" x2="130" y2="220" stroke="${dark}" stroke-width="1.5" opacity="0.7"/>
        <line x1="175" y1="90" x2="175" y2="220" stroke="${dark}" stroke-width="1.5" opacity="0.7"/>
        <line x1="220" y1="93" x2="220" y2="220" stroke="${dark}" stroke-width="1.5" opacity="0.7"/>
        <line x1="265" y1="98" x2="265" y2="220" stroke="${dark}" stroke-width="1.5" opacity="0.7"/>
        <!-- wrist band -->
        <rect x="80" y="205" width="215" height="18" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="90" y="212" width="195" height="4" fill="${accent}" opacity="0.85"/>
        <!-- stitching -->
        <path d="M90 130 Q180 125 285 132" stroke="${accent}" stroke-width="1.2" fill="none" opacity="0.6" stroke-dasharray="3 2"/>
        <path d="M90 155 Q180 152 285 158" stroke="${accent}" stroke-width="1.2" fill="none" opacity="0.6" stroke-dasharray="3 2"/>
      </g>`;
  },
};

// ---------- Weapon SVG for item cards ---------- //
CRATER.artWeapon = function(item, opts) {
  opts = opts || {};
  const cls = item.cls;
  const [main, accent, dark] = item.colors;
  const art = CRATER.WEAPON_ART[cls] || CRATER.WEAPON_ART.rifle;
  const bg = opts.bg !== false;
  const rarityCol = CRATER.RARITY[item.rarity].color;

  return svgOpen('0 0 400 300') + `
    <defs>
      <linearGradient id="wbg-${item.instanceId || item.id || Math.random()}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${lighten(rarityCol, -60)}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.65"/>
      </linearGradient>
      <radialGradient id="wglow-${item.instanceId || item.id || Math.random()}" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="${rarityCol}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${rarityCol}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    ${bg ? `<rect width="400" height="300" fill="url(#wbg-${item.instanceId || item.id})"/>` : ''}
    ${bg ? `<ellipse cx="200" cy="150" rx="180" ry="80" fill="url(#wglow-${item.instanceId || item.id})"/>` : ''}
    ${art(main, accent, dark)}
  </svg>`;
};

// ---------- Case artwork ---------- //
CRATER.artCase = function(cfg) {
  const { primary, secondary, accent, weapon, tier, name } = cfg;
  const iconArt = (CRATER.WEAPON_ART[weapon] || CRATER.WEAPON_ART.rifle)(secondary, accent, shade(primary, 30));
  const tierRoman = ['','I','II','III','IV','V'][tier] || '';
  const uid = 'c-' + cfg.id;

  return svgOpen('0 0 400 400') + `
    <defs>
      <linearGradient id="${uid}-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${lighten(primary, 15)}"/>
        <stop offset="50%" stop-color="${primary}"/>
        <stop offset="100%" stop-color="${shade(primary, 40)}"/>
      </linearGradient>
      <linearGradient id="${uid}-panel" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${lighten(primary, 25)}" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="${shade(primary, 30)}" stop-opacity="0.9"/>
      </linearGradient>
      <linearGradient id="${uid}-bev" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${lighten(secondary, 30)}"/>
        <stop offset="100%" stop-color="${shade(secondary, 30)}"/>
      </linearGradient>
      <radialGradient id="${uid}-glow" cx="50%" cy="50%" r="55%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
      <pattern id="${uid}-grid" width="18" height="18" patternUnits="userSpaceOnUse">
        <path d="M18 0 L0 0 0 18" fill="none" stroke="${lighten(primary, 30)}" stroke-width="0.5" opacity="0.35"/>
      </pattern>
      <filter id="${uid}-shadow">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.55"/>
      </filter>
    </defs>

    <!-- outer bg -->
    <rect width="400" height="400" fill="url(#${uid}-bg)"/>
    <rect width="400" height="400" fill="url(#${uid}-grid)"/>

    <!-- diagonal accent slash -->
    <polygon points="0,320 400,120 400,180 0,380" fill="${secondary}" opacity="0.28"/>
    <polygon points="0,340 400,140 400,155 0,355" fill="${accent}" opacity="0.55"/>

    <!-- radial glow behind weapon -->
    <ellipse cx="200" cy="200" rx="180" ry="120" fill="url(#${uid}-glow)"/>

    <!-- CRATER watermark large behind -->
    <text x="200" y="240" text-anchor="middle"
      font-family="Rajdhani, Chakra Petch, sans-serif" font-size="130" font-weight="700"
      fill="${lighten(primary, 5)}" opacity="0.18" letter-spacing="10">CRATER</text>

    <!-- container plate (case body) -->
    <g filter="url(#${uid}-shadow)">
      <path d="M50 90 L350 90 Q365 90 365 105 L365 315 Q365 330 350 330 L50 330 Q35 330 35 315 L35 105 Q35 90 50 90 Z"
        fill="url(#${uid}-panel)" stroke="url(#${uid}-bev)" stroke-width="2"/>
      <!-- top rail -->
      <rect x="35" y="98" width="330" height="14" fill="${shade(primary, 20)}" opacity="0.8"/>
      <rect x="35" y="98" width="330" height="4" fill="${lighten(secondary, 20)}"/>
      <!-- bottom rail with accent strip -->
      <rect x="35" y="308" width="330" height="22" fill="${shade(primary, 25)}" opacity="0.9"/>
      <rect x="35" y="308" width="330" height="3" fill="${accent}"/>
      <!-- rivets -->
      <g fill="${lighten(secondary, 20)}" stroke="${shade(primary, 40)}" stroke-width="1">
        <circle cx="55" cy="105" r="4"/>
        <circle cx="345" cy="105" r="4"/>
        <circle cx="55" cy="320" r="4"/>
        <circle cx="345" cy="320" r="4"/>
      </g>
    </g>

    <!-- weapon centerpiece -->
    <g transform="translate(50 130) scale(0.75)">
      ${iconArt}
    </g>

    <!-- CRATER brand label -->
    <g>
      <rect x="130" y="290" width="140" height="30" fill="${shade(primary, 30)}" opacity="0.85" stroke="${accent}" stroke-width="1"/>
      <text x="200" y="310" text-anchor="middle"
        font-family="Rajdhani, Chakra Petch, sans-serif" font-size="18" font-weight="700"
        fill="${accent}" letter-spacing="6">CRATER</text>
    </g>

    <!-- tier badge (top-right chevron) -->
    <g>
      <polygon points="300,90 365,90 365,140 320,140" fill="${accent}" opacity="0.92"/>
      <polygon points="300,90 365,90 365,140 320,140" fill="none" stroke="${lighten(accent, 20)}" stroke-width="1.5"/>
      <text x="335" y="125" text-anchor="middle"
        font-family="Rajdhani, Chakra Petch, sans-serif" font-size="24" font-weight="700"
        fill="${shade(primary, 50)}" letter-spacing="2">${tierRoman}</text>
    </g>

    <!-- side stripes -->
    <rect x="35" y="140" width="6" height="140" fill="${accent}" opacity="0.85"/>
    <rect x="359" y="140" width="6" height="140" fill="${accent}" opacity="0.85"/>

    <!-- corner brackets -->
    <g stroke="${lighten(accent, 10)}" stroke-width="2" fill="none" opacity="0.85">
      <path d="M20 60 L20 40 L40 40"/>
      <path d="M380 60 L380 40 L360 40"/>
      <path d="M20 340 L20 360 L40 360"/>
      <path d="M380 340 L380 360 L360 360"/>
    </g>

    <!-- case name banner (extra small under logo) -->
    <text x="200" y="352" text-anchor="middle"
      font-family="Rajdhani, Chakra Petch, sans-serif" font-size="13" font-weight="600"
      fill="${lighten(secondary, 30)}" letter-spacing="4" opacity="0.9">${(name||'').toUpperCase()} · TIER ${tierRoman}</text>

    <!-- top-left ID stripe -->
    <text x="45" y="88" font-family="Chakra Petch, sans-serif" font-size="9" font-weight="600"
      fill="${lighten(secondary, 20)}" letter-spacing="2" opacity="0.9">NO. ${(cfg.id||'').toUpperCase()}</text>
  </svg>`;
};

// ---------- Mini item icon (for ticker / history) ---------- //
CRATER.artWeaponMini = function(item) {
  const cls = item.cls;
  const [main, accent, dark] = item.colors;
  const art = (CRATER.WEAPON_ART[cls] || CRATER.WEAPON_ART.rifle)(main, accent, dark);
  return svgOpen('0 0 400 300') + `
    ${art}
  </svg>`;
};
