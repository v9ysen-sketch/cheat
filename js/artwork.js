/* ================================================================
   CRATER — SVG artwork generators for cases + weapons.
   All hand-drawn shapes, no external assets.
   ================================================================ */

window.CRATER = window.CRATER || {};

// ---------- Utilities ---------- //
function svgOpen(vb, extra) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet"${extra||''}>`;
}
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lighten(hex, amt) {
  const c = hex.replace('#','');
  const n = parseInt(c, 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 0xff) + amt, b = (n & 0xff) + amt;
  r = clamp(r, 0, 255); g = clamp(g, 0, 255); b = clamp(b, 0, 255);
  return '#' + ((r<<16)|(g<<8)|b).toString(16).padStart(6,'0');
}
function shade(hex, amt) { return lighten(hex, -Math.abs(amt)); }

// ---------- Weapon silhouettes (viewBox 400 x 300) ---------- //
// Each returns raw SVG path/shapes (no <svg> wrapper). Colors applied at call site.
CRATER.WEAPON_ART = {
  rifle: function(main, accent, dark, mainFill) {
    const bodyFill = mainFill || main;
    return `
      <g>
        <path d="M20 165 L70 145 L82 155 L82 195 L70 205 L20 185 Z" fill="${shade(main,20)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="80" y="150" width="180" height="42" fill="${bodyFill}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="80" y="150" width="180" height="10" fill="${lighten(main,25)}" opacity="0.35"/>
        <rect x="80" y="184" width="180" height="8" fill="${shade(main,20)}" opacity="0.55"/>
        <rect x="100" y="162" width="150" height="12" fill="${accent}" opacity="0.65"/>
        <path d="M140 190 L138 235 L200 235 L198 190 Z" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="146" y="200" width="45" height="4" fill="${accent}" opacity="0.7"/>
        <rect x="146" y="212" width="45" height="4" fill="${accent}" opacity="0.7"/>
        <path d="M220 190 L215 240 L245 245 L250 195 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <path d="M195 190 L200 215 L225 215 L220 190 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.2"/>
        <circle cx="212" cy="205" r="4" fill="${dark}"/>
        <rect x="260" y="164" width="120" height="14" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="260" y="164" width="120" height="4" fill="${lighten(main,15)}"/>
        <rect x="378" y="160" width="8" height="22" fill="${dark}"/>
        <rect x="150" y="140" width="6" height="12" fill="${dark}"/>
        <rect x="240" y="140" width="6" height="12" fill="${dark}"/>
        <rect x="105" y="158" width="140" height="1.5" fill="${accent}" opacity="0.6"/>
        <rect x="105" y="182" width="140" height="1.5" fill="${accent}" opacity="0.6"/>
      </g>`;
  },
  sniper: function(main, accent, dark, mainFill) {
    const bodyFill = mainFill || main;
    return `
      <g>
        <path d="M10 158 L60 138 L75 148 L75 202 L60 212 L10 192 Z" fill="${shade(main,20)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="60" y="130" width="40" height="20" fill="${shade(main,25)}" rx="2"/>
        <rect x="75" y="150" width="140" height="38" fill="${bodyFill}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="75" y="150" width="140" height="8" fill="${lighten(main,20)}" opacity="0.4"/>
        <ellipse cx="150" cy="120" rx="55" ry="14" fill="${shade(main,30)}" stroke="${dark}" stroke-width="2"/>
        <ellipse cx="150" cy="120" rx="42" ry="10" fill="${dark}"/>
        <line x1="115" y1="120" x2="185" y2="120" stroke="${accent}" stroke-width="1.5" opacity="0.7"/>
        <line x1="150" y1="112" x2="150" y2="128" stroke="${accent}" stroke-width="1.5" opacity="0.7"/>
        <rect x="130" y="128" width="40" height="22" fill="${shade(main,20)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="90" y="161" width="115" height="8" fill="${accent}" opacity="0.85"/>
        <path d="M130 188 L128 220 L175 220 L173 188 Z" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.2"/>
        <path d="M195 186 L192 235 L220 240 L225 190 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="215" y="164" width="160" height="12" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="215" y="164" width="160" height="3" fill="${lighten(main,15)}"/>
        <line x1="290" y1="176" x2="278" y2="220" stroke="${dark}" stroke-width="2.5"/>
        <line x1="300" y1="176" x2="312" y2="220" stroke="${dark}" stroke-width="2.5"/>
        <rect x="372" y="160" width="12" height="20" fill="${dark}"/>
      </g>`;
  },
  pistol: function(main, accent, dark, mainFill) {
    const bodyFill = mainFill || main;
    return `
      <g>
        <path d="M100 130 L280 130 L295 148 L295 170 L100 170 Z" fill="${bodyFill}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="100" y="130" width="195" height="8" fill="${lighten(main,20)}" opacity="0.4"/>
        <rect x="115" y="148" width="160" height="10" fill="${accent}" opacity="0.65"/>
        <line x1="105" y1="140" x2="105" y2="165" stroke="${dark}" stroke-width="1.2"/>
        <line x1="112" y1="140" x2="112" y2="165" stroke="${dark}" stroke-width="1.2"/>
        <line x1="119" y1="140" x2="119" y2="165" stroke="${dark}" stroke-width="1.2"/>
        <line x1="278" y1="140" x2="278" y2="165" stroke="${dark}" stroke-width="1.2"/>
        <line x1="285" y1="140" x2="285" y2="165" stroke="${dark}" stroke-width="1.2"/>
        <rect x="150" y="122" width="6" height="10" fill="${dark}"/>
        <rect x="240" y="122" width="6" height="10" fill="${dark}"/>
        <rect x="288" y="152" width="12" height="12" fill="${dark}"/>
        <path d="M155 170 L165 200 L220 200 L230 170 Z" fill="${shade(main,20)}" stroke="${dark}" stroke-width="1.5"/>
        <circle cx="195" cy="185" r="6" fill="${dark}"/>
        <path d="M100 165 L110 240 L200 245 L210 168 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <line x1="120" y1="180" x2="200" y2="184" stroke="${dark}" stroke-width="1" opacity="0.5"/>
        <line x1="122" y1="195" x2="200" y2="198" stroke="${dark}" stroke-width="1" opacity="0.5"/>
        <line x1="124" y1="210" x2="200" y2="212" stroke="${dark}" stroke-width="1" opacity="0.5"/>
        <line x1="125" y1="225" x2="197" y2="228" stroke="${dark}" stroke-width="1" opacity="0.5"/>
        <rect x="112" y="238" width="90" height="10" fill="${accent}" opacity="0.7"/>
      </g>`;
  },
  smg: function(main, accent, dark, mainFill) {
    const bodyFill = mainFill || main;
    return `
      <g>
        <path d="M20 155 L60 145 L75 155 L75 195 L60 205 L20 195 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="72" y="155" width="180" height="42" fill="${bodyFill}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="72" y="155" width="180" height="9" fill="${lighten(main,20)}" opacity="0.35"/>
        <rect x="72" y="188" width="180" height="8" fill="${shade(main,20)}" opacity="0.55"/>
        <rect x="90" y="166" width="140" height="14" fill="${accent}" opacity="0.65"/>
        <g fill="${dark}" opacity="0.6">
          <circle cx="100" cy="160" r="1.5"/><circle cx="115" cy="160" r="1.5"/>
          <circle cx="130" cy="160" r="1.5"/><circle cx="145" cy="160" r="1.5"/>
          <circle cx="160" cy="160" r="1.5"/><circle cx="175" cy="160" r="1.5"/>
          <circle cx="190" cy="160" r="1.5"/><circle cx="205" cy="160" r="1.5"/>
        </g>
        <rect x="140" y="142" width="14" height="14" fill="${dark}"/>
        <rect x="252" y="167" width="70" height="14" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="320" y="163" width="8" height="22" fill="${dark}"/>
        <path d="M158 195 L165 218 L195 218 L188 195 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.2"/>
        <circle cx="178" cy="208" r="4" fill="${dark}"/>
        <path d="M118 195 L114 245 L166 245 L162 195 Z" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="122" y="205" width="38" height="4" fill="${accent}" opacity="0.7"/>
        <rect x="122" y="216" width="38" height="4" fill="${accent}" opacity="0.7"/>
        <rect x="122" y="227" width="38" height="4" fill="${accent}" opacity="0.7"/>
        <path d="M200 195 L196 238 L228 240 L232 197 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
      </g>`;
  },
  shotgun: function(main, accent, dark, mainFill) {
    const bodyFill = mainFill || main;
    return `
      <g>
        <path d="M15 160 L60 145 L75 155 L75 200 L60 210 L15 195 Z" fill="${shade(main,20)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="75" y="155" width="115" height="40" fill="${bodyFill}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="75" y="155" width="115" height="8" fill="${lighten(main,20)}" opacity="0.35"/>
        <rect x="85" y="165" width="90" height="10" fill="${accent}" opacity="0.65"/>
        <rect x="200" y="170" width="70" height="18" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5" rx="2"/>
        <line x1="210" y1="170" x2="210" y2="188" stroke="${dark}" stroke-width="1"/>
        <line x1="230" y1="170" x2="230" y2="188" stroke="${dark}" stroke-width="1"/>
        <line x1="250" y1="170" x2="250" y2="188" stroke="${dark}" stroke-width="1"/>
        <rect x="190" y="163" width="200" height="10" fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <ellipse cx="385" cy="168" rx="7" ry="10" fill="${dark}"/>
        <path d="M130 195 L135 218 L165 218 L160 195 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.2"/>
        <circle cx="147" cy="208" r="4" fill="${dark}"/>
        <path d="M155 195 L152 240 L182 240 L188 197 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="190" y="188" width="80" height="10" fill="${shade(main,15)}" stroke="${dark}" stroke-width="1"/>
      </g>`;
  },
  heavy: function(main, accent, dark, mainFill) {
    const bodyFill = mainFill || main;
    return `
      <g>
        <path d="M15 165 L55 150 L70 160 L70 200 L55 210 L15 195 Z" fill="${shade(main,20)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="70" y="152" width="180" height="50" fill="${bodyFill}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="70" y="152" width="180" height="10" fill="${lighten(main,20)}" opacity="0.35"/>
        <rect x="90" y="168" width="140" height="16" fill="${accent}" opacity="0.65"/>
        <rect x="90" y="200" width="120" height="45" fill="${shade(main,20)}" stroke="${dark}" stroke-width="1.5" rx="3"/>
        <g stroke="${dark}" stroke-width="1" opacity="0.7">
          <line x1="100" y1="212" x2="200" y2="212"/>
          <line x1="100" y1="222" x2="200" y2="222"/>
          <line x1="100" y1="232" x2="200" y2="232"/>
        </g>
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
        <path d="M210 200 L206 245 L240 248 L246 205 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="140" y="140" width="10" height="14" fill="${dark}"/>
      </g>`;
  },
  knife: function(main, accent, dark, mainFill) {
    const bodyFill = mainFill || main;
    return `
      <g>
        <path d="M60 155 L280 130 L340 155 L280 180 L60 175 Z" fill="${bodyFill}" stroke="${dark}" stroke-width="1.5"/>
        <path d="M60 155 L280 130 L340 155 L280 145 Z" fill="${lighten(main,30)}" opacity="0.35"/>
        <line x1="90" y1="163" x2="290" y2="148" stroke="${accent}" stroke-width="1.5" opacity="0.65"/>
        <line x1="90" y1="170" x2="290" y2="160" stroke="${dark}" stroke-width="1" opacity="0.45"/>
        <line x1="65" y1="175" x2="335" y2="155" stroke="${dark}" stroke-width="1.3"/>
        <path d="M50 140 L60 140 L60 190 L50 190 L45 175 L45 155 Z" fill="${shade(main,30)}" stroke="${dark}" stroke-width="1.5"/>
        <path d="M50 148 L45 200 L15 210 L15 145 Z" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <g stroke="${accent}" stroke-width="2" opacity="0.7">
          <line x1="20" y1="160" x2="45" y2="165"/>
          <line x1="19" y1="175" x2="45" y2="180"/>
          <line x1="18" y1="190" x2="45" y2="195"/>
        </g>
        <circle cx="20" cy="177" r="3" fill="${accent}"/>
      </g>`;
  },
  gloves: function(main, accent, dark, mainFill) {
    const bodyFill = mainFill || main;
    return `
      <g>
        <path d="M80 100 Q100 90 130 92 L200 95 L260 98 Q280 100 288 120 L295 200 Q295 220 275 225 L100 225 Q80 220 78 200 L80 100 Z"
          fill="${bodyFill}" stroke="${dark}" stroke-width="1.5"/>
        <path d="M78 200 Q60 195 55 175 L48 130 Q52 110 72 108 L82 125 L80 200 Z"
          fill="${shade(main,10)}" stroke="${dark}" stroke-width="1.5"/>
        <path d="M110 105 L280 108 L280 130 L110 128 Z" fill="${accent}" opacity="0.75"/>
        <line x1="130" y1="90" x2="130" y2="220" stroke="${dark}" stroke-width="1.5" opacity="0.7"/>
        <line x1="175" y1="90" x2="175" y2="220" stroke="${dark}" stroke-width="1.5" opacity="0.7"/>
        <line x1="220" y1="93" x2="220" y2="220" stroke="${dark}" stroke-width="1.5" opacity="0.7"/>
        <line x1="265" y1="98" x2="265" y2="220" stroke="${dark}" stroke-width="1.5" opacity="0.7"/>
        <rect x="80" y="205" width="215" height="18" fill="${shade(main,25)}" stroke="${dark}" stroke-width="1.5"/>
        <rect x="90" y="212" width="195" height="4" fill="${accent}" opacity="0.85"/>
        <path d="M90 130 Q180 125 285 132" stroke="${accent}" stroke-width="1.2" fill="none" opacity="0.6" stroke-dasharray="3 2"/>
        <path d="M90 155 Q180 152 285 158" stroke="${accent}" stroke-width="1.2" fill="none" opacity="0.6" stroke-dasharray="3 2"/>
      </g>`;
  },
};

// Class-icon glyphs for the emblem
const CLASS_GLYPH = {
  rifle: 'R', sniper: 'S', pistol: 'P', smg: 'M',
  shotgun: 'G', heavy: 'H', knife: 'K', gloves: 'X'
};

// ---------- Skin pattern fills ---------- //
// Each generator returns { defs, url } — defs go into <defs>, url becomes fill.
CRATER.SKIN_PATTERNS = {
  solid: function(uid, main, accent, extra) {
    return { defs: '', url: main };
  },
  fade: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-fade';
    return {
      defs: `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="${main}"/>
        <stop offset="55%" stop-color="${lighten(main,15)}"/>
        <stop offset="100%" stop-color="${accent}"/>
      </linearGradient>`,
      url: `url(#${id})`
    };
  },
  chevron: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-chev';
    return {
      defs: `<pattern id="${id}" width="18" height="14" patternUnits="userSpaceOnUse">
        <rect width="18" height="14" fill="${main}"/>
        <path d="M0 7 L9 0 L18 7 L9 14 Z" fill="${accent}" opacity="0.8"/>
        <path d="M9 3 L15 7 L9 11 L3 7 Z" fill="${lighten(main,30)}" opacity="0.55"/>
      </pattern>`,
      url: `url(#${id})`
    };
  },
  hex: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-hex';
    return {
      defs: `<pattern id="${id}" width="16" height="28" patternUnits="userSpaceOnUse">
        <rect width="16" height="28" fill="${main}"/>
        <polygon points="8,2 14,7 14,17 8,22 2,17 2,7" fill="none" stroke="${accent}" stroke-width="1.3" opacity="0.9"/>
        <polygon points="8,2 14,7 14,17 8,22 2,17 2,7" fill="${lighten(main,25)}" opacity="0.4"/>
      </pattern>`,
      url: `url(#${id})`
    };
  },
  grid: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-grid';
    return {
      defs: `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect width="10" height="10" fill="${main}"/>
        <path d="M10 0 L0 0 0 10" fill="none" stroke="${accent}" stroke-width="1.1" opacity="0.85"/>
      </pattern>`,
      url: `url(#${id})`
    };
  },
  circuit: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-circ';
    return {
      defs: `<pattern id="${id}" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="${main}"/>
        <path d="M0 8 L14 8 L14 20 L28 20 L28 32 L40 32" fill="none" stroke="${accent}" stroke-width="1" opacity="0.7"/>
        <path d="M4 32 L18 32 L18 24 M22 4 L36 4 L36 16" fill="none" stroke="${accent}" stroke-width="0.8" opacity="0.55"/>
        <circle cx="14" cy="8" r="1.5" fill="${accent}" opacity="0.9"/>
        <circle cx="28" cy="32" r="1.5" fill="${accent}" opacity="0.9"/>
        <circle cx="36" cy="4" r="1.5" fill="${accent}" opacity="0.9"/>
      </pattern>`,
      url: `url(#${id})`
    };
  },
  splatter: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-splat';
    return {
      defs: `<pattern id="${id}" width="60" height="60" patternUnits="userSpaceOnUse">
        <rect width="60" height="60" fill="${main}"/>
        <circle cx="12" cy="18" r="5" fill="${accent}" opacity="0.9"/>
        <circle cx="10" cy="26" r="2" fill="${accent}" opacity="0.75"/>
        <circle cx="18" cy="12" r="2.5" fill="${accent}" opacity="0.7"/>
        <circle cx="42" cy="10" r="7" fill="${accent}" opacity="0.85"/>
        <circle cx="48" cy="16" r="2" fill="${accent}" opacity="0.7"/>
        <circle cx="34" cy="36" r="4" fill="${lighten(accent,20)}" opacity="0.8"/>
        <circle cx="52" cy="44" r="6" fill="${accent}" opacity="0.8"/>
        <circle cx="18" cy="48" r="3" fill="${accent}" opacity="0.85"/>
        <circle cx="7" cy="42" r="1.5" fill="${accent}" opacity="0.7"/>
        <circle cx="26" cy="52" r="2" fill="${accent}" opacity="0.75"/>
        <circle cx="38" cy="50" r="1.2" fill="${accent}" opacity="0.6"/>
      </pattern>`,
      url: `url(#${id})`
    };
  },
  camo: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-camo';
    const c3 = extra || shade(main, 30);
    return {
      defs: `<pattern id="${id}" width="80" height="80" patternUnits="userSpaceOnUse">
        <rect width="80" height="80" fill="${main}"/>
        <path d="M10 15 Q22 8 34 14 Q38 28 30 38 Q18 44 8 34 Q4 22 10 15 Z" fill="${shade(main,15)}" opacity="0.85"/>
        <path d="M45 8 Q58 4 68 14 Q72 26 60 32 Q50 30 44 22 Z" fill="${c3}" opacity="0.75"/>
        <path d="M55 46 Q68 44 74 56 Q70 68 58 68 Q48 62 52 52 Z" fill="${shade(main,25)}" opacity="0.8"/>
        <path d="M12 55 Q22 50 30 60 Q28 72 18 74 Q6 68 8 58 Z" fill="${accent}" opacity="0.35"/>
      </pattern>`,
      url: `url(#${id})`
    };
  },
  waves: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-wave';
    return {
      defs: `<pattern id="${id}" width="40" height="16" patternUnits="userSpaceOnUse">
        <rect width="40" height="16" fill="${main}"/>
        <path d="M0 8 Q10 2 20 8 T40 8" fill="none" stroke="${accent}" stroke-width="1.8" opacity="0.9"/>
        <path d="M0 12 Q10 6 20 12 T40 12" fill="none" stroke="${lighten(main,30)}" stroke-width="1.3" opacity="0.7"/>
      </pattern>`,
      url: `url(#${id})`
    };
  },
  tribal: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-tri';
    return {
      defs: `<pattern id="${id}" width="30" height="30" patternUnits="userSpaceOnUse">
        <rect width="30" height="30" fill="${main}"/>
        <path d="M0 15 L7 8 L15 15 L23 8 L30 15 L23 22 L15 15 L7 22 Z" fill="none" stroke="${accent}" stroke-width="1.6" opacity="0.9"/>
        <path d="M15 0 L15 8 M15 22 L15 30" stroke="${accent}" stroke-width="1.4" opacity="0.75"/>
      </pattern>`,
      url: `url(#${id})`
    };
  },
  prismatic: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-pris';
    return {
      defs: `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0.3">
        <stop offset="0%"  stop-color="${main}"/>
        <stop offset="25%" stop-color="${accent}"/>
        <stop offset="50%" stop-color="${lighten(accent,25)}"/>
        <stop offset="75%" stop-color="${lighten(main,25)}"/>
        <stop offset="100%" stop-color="${main}"/>
      </linearGradient>`,
      url: `url(#${id})`
    };
  },
  dots: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-dot';
    return {
      defs: `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="12" height="12" fill="${main}"/>
        <circle cx="6" cy="6" r="2.2" fill="${accent}" opacity="0.9"/>
        <circle cx="0" cy="0" r="1" fill="${accent}" opacity="0.5"/>
        <circle cx="12" cy="12" r="1" fill="${accent}" opacity="0.5"/>
      </pattern>`,
      url: `url(#${id})`
    };
  },
  scales: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-scl';
    return {
      defs: `<pattern id="${id}" width="16" height="14" patternUnits="userSpaceOnUse">
        <rect width="16" height="14" fill="${main}"/>
        <path d="M0 14 Q0 4 8 4 Q16 4 16 14" fill="${lighten(main,25)}" opacity="0.85"/>
        <path d="M0 14 Q0 4 8 4 Q16 4 16 14" fill="none" stroke="${accent}" stroke-width="1.1" opacity="0.9"/>
        <path d="M-8 21 Q-8 11 0 11 Q8 11 8 21" fill="${shade(main,20)}" opacity="0.75"/>
        <path d="M8 21 Q8 11 16 11 Q24 11 24 21" fill="${shade(main,20)}" opacity="0.75"/>
      </pattern>`,
      url: `url(#${id})`
    };
  },
  stripes: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-str';
    return {
      defs: `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="14" height="14" fill="${main}"/>
        <rect x="0" y="0" width="5" height="14" fill="${accent}" opacity="0.9"/>
        <rect x="7" y="0" width="1.5" height="14" fill="${lighten(main,30)}" opacity="0.55"/>
      </pattern>`,
      url: `url(#${id})`
    };
  },
  runes: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-run';
    return {
      defs: `<pattern id="${id}" width="36" height="36" patternUnits="userSpaceOnUse">
        <rect width="36" height="36" fill="${main}"/>
        <path d="M8 8 L8 22 M8 14 L14 8 M14 14 L20 8" stroke="${accent}" stroke-width="1.6" fill="none" opacity="0.9"/>
        <path d="M24 22 L24 34 M24 28 L30 22 M18 34 L30 34" stroke="${accent}" stroke-width="1.6" fill="none" opacity="0.85"/>
        <circle cx="30" cy="10" r="2.5" fill="none" stroke="${accent}" stroke-width="1.2" opacity="0.85"/>
      </pattern>`,
      url: `url(#${id})`
    };
  },
  pixel: function(uid, main, accent, extra) {
    const id = 'sp-' + uid + '-pix';
    return {
      defs: `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="${main}"/>
        <rect x="0" y="0" width="4" height="4" fill="${accent}" opacity="0.55"/>
        <rect x="4" y="4" width="4" height="4" fill="${accent}" opacity="0.55"/>
      </pattern>`,
      url: `url(#${id})`
    };
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
  const uid = (item.instanceId || item.id || 'x' + Math.floor(Math.random() * 1e9).toString(36));

  // Skin pattern fill (fade / chevron / hex / grid / camo / splatter / ...)
  const patternKey = item.pattern || 'solid';
  const patGen = CRATER.SKIN_PATTERNS[patternKey] || CRATER.SKIN_PATTERNS.solid;
  const patRes = patGen(uid, main, accent, dark);

  return svgOpen('0 0 400 300') + `
    <defs>
      <linearGradient id="wbg-${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${lighten(rarityCol, -60)}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0.65"/>
      </linearGradient>
      <radialGradient id="wglow-${uid}" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="${rarityCol}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${rarityCol}" stop-opacity="0"/>
      </radialGradient>
      ${patRes.defs}
    </defs>
    ${bg ? `<rect width="400" height="300" fill="url(#wbg-${uid})"/>` : ''}
    ${bg ? `<ellipse cx="200" cy="150" rx="180" ry="80" fill="url(#wglow-${uid})"/>` : ''}
    ${art(main, accent, dark, patRes.url)}
  </svg>`;
};

// ---------- Case artwork (industrial ammo-crate look) ---------- //
CRATER.artCase = function(cfg) {
  const { primary, secondary, accent, weapon, tier, name, id } = cfg;
  const iconArt = (CRATER.WEAPON_ART[weapon] || CRATER.WEAPON_ART.rifle)(secondary, accent, shade(primary, 30));
  const tierRoman = ['','I','II','III','IV','V'][tier] || '';
  const uid = 'c-' + id;
  const glyph = CLASS_GLYPH[weapon] || 'W';

  // Deterministic serial from id
  let serial = 0;
  for (let i = 0; i < id.length; i++) serial = (serial * 31 + id.charCodeAt(i)) & 0x7fff;
  const serialStr = String(1000 + (serial % 9000));

  const pLight = lighten(primary, 22);
  const pDark  = shade(primary, 35);
  const pDarker= shade(primary, 55);
  const strapCol = shade(primary, 45);
  const strapLight = shade(primary, 25);

  return svgOpen('0 0 400 400') + `
    <defs>
      <!-- Backdrop -->
      <radialGradient id="${uid}-bg" cx="30%" cy="15%" r="90%">
        <stop offset="0%"  stop-color="${lighten(primary,5)}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${shade(primary,55)}" stop-opacity="0.85"/>
      </radialGradient>
      <!-- Case body -->
      <linearGradient id="${uid}-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="${pLight}"/>
        <stop offset="45%"  stop-color="${primary}"/>
        <stop offset="100%" stop-color="${pDark}"/>
      </linearGradient>
      <!-- Metal (latches, hardware, plates) -->
      <linearGradient id="${uid}-metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#6a7776"/>
        <stop offset="35%"  stop-color="#3a4544"/>
        <stop offset="65%"  stop-color="#1a2321"/>
        <stop offset="100%" stop-color="#0a100f"/>
      </linearGradient>
      <linearGradient id="${uid}-metal-r" x1="1" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#5c6968"/>
        <stop offset="60%"  stop-color="#232c2b"/>
        <stop offset="100%" stop-color="#0a100f"/>
      </linearGradient>
      <!-- Brass plate for CRATER brand -->
      <linearGradient id="${uid}-brass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="${lighten(accent,15)}"/>
        <stop offset="45%"  stop-color="${accent}"/>
        <stop offset="100%" stop-color="${shade(accent,35)}"/>
      </linearGradient>
      <!-- Emblem disc -->
      <radialGradient id="${uid}-emblem" cx="30%" cy="30%" r="80%">
        <stop offset="0%"   stop-color="${lighten(accent,20)}"/>
        <stop offset="60%"  stop-color="${accent}"/>
        <stop offset="100%" stop-color="${shade(accent,40)}"/>
      </radialGradient>
      <!-- Strap texture -->
      <pattern id="${uid}-strap" width="6" height="10" patternUnits="userSpaceOnUse">
        <rect width="6" height="10" fill="${strapCol}"/>
        <line x1="0" y1="0" x2="6" y2="0" stroke="${strapLight}" stroke-width="1" opacity="0.5"/>
        <line x1="0" y1="5" x2="6" y2="5" stroke="#000" stroke-width="0.5" opacity="0.3"/>
      </pattern>
      <!-- Body grid texture -->
      <pattern id="${uid}-grid" width="14" height="14" patternUnits="userSpaceOnUse">
        <path d="M14 0 L0 0 0 14" fill="none" stroke="${pDarker}" stroke-width="0.5" opacity="0.35"/>
      </pattern>
      <!-- Subtle scratch overlay -->
      <pattern id="${uid}-scratch" width="180" height="180" patternUnits="userSpaceOnUse">
        <path d="M20 25 L58 27" stroke="#fff" stroke-width="0.5" opacity="0.06"/>
        <path d="M120 62 L155 58" stroke="#000" stroke-width="0.4" opacity="0.14"/>
        <path d="M40 110 L88 105" stroke="#fff" stroke-width="0.5" opacity="0.05"/>
        <path d="M60 148 L100 152" stroke="#000" stroke-width="0.5" opacity="0.14"/>
        <path d="M110 130 L128 128" stroke="#fff" stroke-width="0.4" opacity="0.05"/>
      </pattern>
      <!-- Radial highlight top-left -->
      <radialGradient id="${uid}-hi" cx="25%" cy="15%" r="55%">
        <stop offset="0%"   stop-color="rgba(255,255,255,0.15)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
      </radialGradient>
      <!-- Radial ambient glow behind case -->
      <radialGradient id="${uid}-glow" cx="50%" cy="55%" r="55%">
        <stop offset="0%"  stop-color="${accent}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
      <!-- Drop shadow filter -->
      <filter id="${uid}-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity="0.55"/>
      </filter>
      <filter id="${uid}-emboss">
        <feDropShadow dx="0" dy="1" stdDeviation="0.8" flood-color="#000" flood-opacity="0.6"/>
      </filter>
    </defs>

    <!-- Backdrop -->
    <rect width="400" height="400" fill="url(#${uid}-bg)"/>
    <ellipse cx="200" cy="200" rx="180" ry="120" fill="url(#${uid}-glow)"/>

    <!-- Big CRATER watermark behind case -->
    <text x="200" y="235" text-anchor="middle"
      font-family="Rajdhani, Chakra Petch, sans-serif" font-size="120" font-weight="700"
      fill="${lighten(primary,10)}" opacity="0.10" letter-spacing="14">CRATER</text>

    <!-- Case group with drop shadow -->
    <g filter="url(#${uid}-shadow)">

      <!-- Handle (top center) -->
      <g>
        <path d="M170 52 Q170 32 200 32 Q230 32 230 52" fill="none"
          stroke="url(#${uid}-metal)" stroke-width="7" stroke-linecap="round"/>
        <rect x="163" y="48" width="16" height="20" fill="url(#${uid}-metal)" stroke="#0a0a0a" stroke-width="1" rx="2"/>
        <rect x="221" y="48" width="16" height="20" fill="url(#${uid}-metal)" stroke="#0a0a0a" stroke-width="1" rx="2"/>
        <circle cx="171" cy="58" r="1.5" fill="${accent}" opacity="0.6"/>
        <circle cx="229" cy="58" r="1.5" fill="${accent}" opacity="0.6"/>
      </g>

      <!-- Case body -->
      <rect x="30" y="62" width="340" height="290" rx="14" fill="url(#${uid}-body)"/>
      <!-- grid texture -->
      <rect x="30" y="62" width="340" height="290" rx="14" fill="url(#${uid}-grid)"/>
      <!-- scratch overlay -->
      <rect x="30" y="62" width="340" height="290" rx="14" fill="url(#${uid}-scratch)"/>
      <!-- top highlight -->
      <rect x="30" y="62" width="340" height="290" rx="14" fill="url(#${uid}-hi)"/>
      <!-- outer edge dark -->
      <rect x="30" y="62" width="340" height="290" rx="14" fill="none"
        stroke="#0a0f0d" stroke-width="1.5"/>
      <rect x="31" y="63" width="338" height="288" rx="13" fill="none"
        stroke="${lighten(primary,30)}" stroke-width="1" opacity="0.4"/>

      <!-- Top metal band -->
      <rect x="30" y="62" width="340" height="34" rx="14" fill="url(#${uid}-metal)"/>
      <rect x="30" y="88" width="340" height="8" fill="url(#${uid}-metal-r)"/>
      <rect x="30" y="94" width="340" height="2" fill="${accent}" opacity="0.65"/>
      <!-- rivets on top band -->
      <g fill="${lighten(accent,10)}" stroke="#0a0a0a" stroke-width="0.6">
        <circle cx="50"  cy="79" r="2.4"/>
        <circle cx="350" cy="79" r="2.4"/>
      </g>

      <!-- 2 latches on top band -->
      <g>
        <rect x="82"  y="70" width="42" height="22" rx="2" fill="url(#${uid}-metal)" stroke="#0a0a0a" stroke-width="1"/>
        <rect x="86"  y="74" width="34" height="14" rx="1" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="0.8"/>
        <rect x="86"  y="77" width="34" height="1"  fill="rgba(255,255,255,0.35)"/>
        <circle cx="90"  cy="81" r="1.8" fill="${accent}"/>
        <circle cx="116" cy="81" r="1.8" fill="${accent}"/>

        <rect x="276" y="70" width="42" height="22" rx="2" fill="url(#${uid}-metal)" stroke="#0a0a0a" stroke-width="1"/>
        <rect x="280" y="74" width="34" height="14" rx="1" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="0.8"/>
        <rect x="280" y="77" width="34" height="1"  fill="rgba(255,255,255,0.35)"/>
        <circle cx="284" cy="81" r="1.8" fill="${accent}"/>
        <circle cx="310" cy="81" r="1.8" fill="${accent}"/>
      </g>

      <!-- Bottom metal band -->
      <rect x="30" y="316" width="340" height="36" rx="14" fill="url(#${uid}-metal)"/>
      <rect x="30" y="316" width="340" height="6" fill="url(#${uid}-metal-r)"/>
      <rect x="30" y="322" width="340" height="2" fill="${accent}" opacity="0.75"/>
      <g fill="${lighten(accent,10)}" stroke="#0a0a0a" stroke-width="0.6">
        <circle cx="50"  cy="336" r="2.4"/>
        <circle cx="350" cy="336" r="2.4"/>
      </g>

      <!-- Corner reinforcement plates (only inner corners visible above band) -->
      <g>
        <!-- top-left plate -->
        <path d="M30 96 L86 96 L86 128 Q86 140 74 140 L30 140 Z"
          fill="url(#${uid}-metal-r)" stroke="#0a0a0a" stroke-width="1"/>
        <g fill="${lighten(accent,10)}" opacity="0.9">
          <circle cx="42" cy="108" r="2"/>
          <circle cx="70" cy="108" r="2"/>
          <circle cx="56" cy="128" r="2"/>
        </g>
        <!-- top-right plate -->
        <path d="M370 96 L314 96 L314 128 Q314 140 326 140 L370 140 Z"
          fill="url(#${uid}-metal)" stroke="#0a0a0a" stroke-width="1"/>
        <g fill="${lighten(accent,10)}" opacity="0.9">
          <circle cx="358" cy="108" r="2"/>
          <circle cx="330" cy="108" r="2"/>
          <circle cx="344" cy="128" r="2"/>
        </g>
        <!-- bottom-left plate -->
        <path d="M30 316 L86 316 L86 284 Q86 272 74 272 L30 272 Z"
          fill="url(#${uid}-metal-r)" stroke="#0a0a0a" stroke-width="1"/>
        <g fill="${lighten(accent,10)}" opacity="0.9">
          <circle cx="42" cy="304" r="2"/>
          <circle cx="70" cy="304" r="2"/>
          <circle cx="56" cy="284" r="2"/>
        </g>
        <!-- bottom-right plate -->
        <path d="M370 316 L314 316 L314 284 Q314 272 326 272 L370 272 Z"
          fill="url(#${uid}-metal)" stroke="#0a0a0a" stroke-width="1"/>
        <g fill="${lighten(accent,10)}" opacity="0.9">
          <circle cx="358" cy="304" r="2"/>
          <circle cx="330" cy="304" r="2"/>
          <circle cx="344" cy="284" r="2"/>
        </g>
      </g>

      <!-- 2 vertical straps flanking the front -->
      <g>
        <!-- left strap -->
        <rect x="108" y="96" width="26" height="220" fill="url(#${uid}-strap)"/>
        <rect x="108" y="96" width="1" height="220" fill="rgba(255,255,255,0.2)"/>
        <rect x="133" y="96" width="1" height="220" fill="rgba(0,0,0,0.5)"/>
        <!-- upper buckle -->
        <rect x="104" y="102" width="34" height="30" rx="2"
          fill="url(#${uid}-metal)" stroke="#0a0a0a" stroke-width="1"/>
        <rect x="108" y="106" width="26" height="22" rx="1" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="0.8"/>
        <rect x="108" y="110" width="26" height="2" fill="rgba(255,255,255,0.35)"/>
        <!-- D-ring bottom -->
        <path d="M108 316 Q108 300 121 300 Q134 300 134 316"
          fill="none" stroke="url(#${uid}-metal)" stroke-width="4"/>
        <rect x="114" y="308" width="14" height="12" rx="1" fill="url(#${uid}-metal-r)" stroke="#0a0a0a" stroke-width="0.6"/>

        <!-- right strap -->
        <rect x="266" y="96" width="26" height="220" fill="url(#${uid}-strap)"/>
        <rect x="266" y="96" width="1" height="220" fill="rgba(255,255,255,0.2)"/>
        <rect x="291" y="96" width="1" height="220" fill="rgba(0,0,0,0.5)"/>
        <rect x="262" y="102" width="34" height="30" rx="2"
          fill="url(#${uid}-metal)" stroke="#0a0a0a" stroke-width="1"/>
        <rect x="266" y="106" width="26" height="22" rx="1" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="0.8"/>
        <rect x="266" y="110" width="26" height="2" fill="rgba(255,255,255,0.35)"/>
        <path d="M266 316 Q266 300 279 300 Q292 300 292 316"
          fill="none" stroke="url(#${uid}-metal)" stroke-width="4"/>
        <rect x="272" y="308" width="14" height="12" rx="1" fill="url(#${uid}-metal-r)" stroke="#0a0a0a" stroke-width="0.6"/>
      </g>

      <!-- Diagonal accent slash on body -->
      <polygon points="140,110 260,110 260,120 140,120" fill="${accent}" opacity="0.15"/>
      <polygon points="140,300 260,300 260,308 140,308" fill="${accent}" opacity="0.15"/>

      <!-- Weapon silhouette large in center panel -->
      <g transform="translate(70 145) scale(0.65)">
        ${iconArt}
      </g>

      <!-- Central emblem (embossed disc top-center of panel) -->
      <g transform="translate(200 155)" filter="url(#${uid}-emboss)">
        <circle r="30" fill="url(#${uid}-emblem)" stroke="${shade(accent,30)}" stroke-width="1.5"/>
        <circle r="26" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1"/>
        <circle r="22" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="0.5"/>
        <!-- Small rivets around perimeter -->
        <g fill="${shade(accent,50)}">
          <circle cx="0"  cy="-27" r="1.2"/>
          <circle cx="27" cy="0"   r="1.2"/>
          <circle cx="0"  cy="27"  r="1.2"/>
          <circle cx="-27" cy="0"  r="1.2"/>
          <circle cx="19" cy="-19" r="1.2"/>
          <circle cx="19" cy="19"  r="1.2"/>
          <circle cx="-19" cy="19" r="1.2"/>
          <circle cx="-19" cy="-19" r="1.2"/>
        </g>
        <!-- Center glyph -->
        <text text-anchor="middle" y="7" font-family="Rajdhani, Chakra Petch, sans-serif"
          font-size="24" font-weight="700" fill="${shade(accent,55)}" letter-spacing="1">${glyph}</text>
      </g>

      <!-- CRATER brass brand plate (below weapon) -->
      <g transform="translate(200 262)" filter="url(#${uid}-emboss)">
        <path d="M-72 -13 L72 -13 L78 0 L72 13 L-72 13 L-78 0 Z"
          fill="url(#${uid}-brass)" stroke="${shade(accent,40)}" stroke-width="1"/>
        <path d="M-72 -13 L72 -13 L78 0 L72 13 L-72 13 L-78 0 Z"
          fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="0.5"/>
        <text text-anchor="middle" y="6" font-family="Rajdhani, Chakra Petch, sans-serif"
          font-size="17" font-weight="700" fill="${shade(accent,60)}" letter-spacing="7">CRATER</text>
      </g>

      <!-- Warning label sticker (top right of body face) -->
      <g transform="translate(316 148) rotate(-3)">
        <rect x="0" y="0" width="46" height="34" fill="#f5e2b0" stroke="#8a6a1c" stroke-width="0.6"/>
        <rect x="0" y="0" width="46" height="7" fill="#e5a923"/>
        <text x="23" y="5.5" text-anchor="middle" font-family="Rajdhani, monospace" font-size="5" fill="#3a2a05" font-weight="700" letter-spacing="0.5">CAUTION</text>
        <text x="23" y="18" text-anchor="middle" font-family="Rajdhani, monospace" font-size="4.5" fill="#3a2a05" font-weight="700">CONTENTS</text>
        <text x="23" y="25" text-anchor="middle" font-family="Rajdhani, monospace" font-size="4.5" fill="#3a2a05" font-weight="700">CLASSIFIED</text>
        <text x="23" y="31" text-anchor="middle" font-family="Rajdhani, monospace" font-size="3.5" fill="#3a2a05">LOT ${tierRoman}-${serialStr.slice(1)}</text>
      </g>

      <!-- Tier badge (top-left of body face, big chevron) -->
      <g transform="translate(45 148)">
        <polygon points="0,0 40,0 45,16 40,32 0,32 5,16"
          fill="${accent}" opacity="0.95" stroke="${shade(accent,25)}" stroke-width="1"/>
        <polygon points="0,0 40,0 45,16 40,32 0,32 5,16"
          fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="0.5"/>
        <text x="22" y="21" text-anchor="middle" font-family="Rajdhani, Chakra Petch, sans-serif"
          font-size="18" font-weight="700" fill="${shade(accent,60)}" letter-spacing="1">${tierRoman}</text>
      </g>

      <!-- Serial stencil (bottom-left of body face) -->
      <g transform="translate(48 292)">
        <text font-family="Chakra Petch, monospace" font-size="9" font-weight="700"
          fill="${lighten(primary,20)}" opacity="0.75" letter-spacing="2">NO. ${serialStr}</text>
        <text y="10" font-family="Chakra Petch, monospace" font-size="6" font-weight="600"
          fill="${lighten(primary,10)}" opacity="0.6" letter-spacing="1.5">${(id||'').toUpperCase()}</text>
      </g>

      <!-- Bottom side spec strip -->
      <g transform="translate(212 292)">
        <text font-family="Chakra Petch, monospace" font-size="7" font-weight="600"
          fill="${lighten(primary,15)}" opacity="0.75" letter-spacing="1.5">TIER ${tierRoman} · CRATER STD.</text>
      </g>

      <!-- Wear scratches on edges -->
      <g stroke="rgba(0,0,0,0.55)" stroke-width="1" fill="none">
        <path d="M40 130 L52 134"/>
        <path d="M360 200 L348 205"/>
        <path d="M320 320 L305 316"/>
        <path d="M45 260 L58 264"/>
      </g>
      <g stroke="rgba(255,255,255,0.15)" stroke-width="0.6" fill="none">
        <path d="M60 100 L80 102"/>
        <path d="M330 180 L340 178"/>
      </g>

    </g>

    <!-- Case name band at bottom -->
    <g transform="translate(200 380)">
      <rect x="-110" y="-11" width="220" height="22" fill="rgba(0,0,0,0.55)" stroke="${accent}" stroke-width="0.5" opacity="0.85"/>
      <text text-anchor="middle" y="5" font-family="Rajdhani, Chakra Petch, sans-serif"
        font-size="13" font-weight="700" fill="${accent}" letter-spacing="4">${(name||'').toUpperCase()} · CASE</text>
    </g>
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
