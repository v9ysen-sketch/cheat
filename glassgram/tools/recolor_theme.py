"""GlassGram: turns Telegram's "Dark Blue" theme into the blue liquid-glass palette.
Usage: python3 -I recolor_theme.py <darkblue.attheme>"""
import colorsys, sys

path = sys.argv[1]
lines = open(path, encoding='utf-8').read().split('\n')

OVERRIDES = {
    # glass outlines / hairlines: cold blue light on the glass edges
    'chat_compact_backgroundGradient': 0x144FC3F7,
    'chat_compact_glassOutline':       0x33A0C8FF,
    'chat_compact_glassShadow':        0x40000814,
    'chat_compact_glassHairline':      0x1FFFFFFF,
    'chat_compact_inputGlassOutline':  0x33A0C8FF,
    'chat_compact_buttonGlassOutline': 0x33A0C8FF,
    # more see-through blurred panels
    'chat_BlurAlpha':                  0x8C000000,
    'chat_BlurAlphaSlow':              0xA6000000,
    'glass_tabSelected':               0xFF4FC3F7,
    'glass_tabSelectedText':           0xFF7FD4FF,
    'chat_wallpaper':                  0xFF050E1F,
    'chats_actionBackground':          0xFF2D7BFF,
    'chats_actionPressedBackground':   0xFF1F63D9,
    'chats_unreadCounter':             0xFF3FA9FF,
    'chat_outBubble':                  0xFF2D6BFF,
    'chat_outBubbleGradient':          0xFF3FB4FF,
    'chat_inBubble':                   0xFF13284D,
}

def s32(v):
    v &= 0xFFFFFFFF
    return v - (1 << 32) if v & 0x80000000 else v

def recolor(v):
    v &= 0xFFFFFFFF
    a = v >> 24
    r, g, b = ((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    hd = h * 360
    if a < 0x60:
        return v
    if l < 0.32 and (s < 0.18 or 180 <= hd <= 250):
        # grey-blue surfaces -> deep saturated navy
        h, s, l = 220 / 360, min(0.72, max(s, 0.55)), l * 0.80
    elif 0.42 <= l <= 0.85 and 185 <= hd <= 235 and s > 0.25:
        # accents -> glassy cyan-blue
        h, s = 207 / 360, min(1.0, s + 0.12)
    else:
        return v
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return (a << 24) | (round(r * 255) << 16) | (round(g * 255) << 8) | round(b * 255)

seen = set()
out = []
for line in lines:
    if '=' in line and not line.startswith('WPS'):
        k, val = line.split('=', 1)
        try:
            iv = int(val)
        except ValueError:
            out.append(line)
            continue
        if k in OVERRIDES:
            iv = OVERRIDES[k]
        else:
            iv = recolor(iv)
        seen.add(k)
        out.append('%s=%d' % (k, s32(iv)))
    else:
        out.append(line)

# keys absent from the file are appended before the trailing empty line / wallpaper section
missing = ['%s=%d' % (k, s32(v)) for k, v in OVERRIDES.items() if k not in seen]
idx = next((i for i, l in enumerate(out) if l.startswith('WPS')), len(out))
while idx > 0 and out[idx - 1] == '':
    idx -= 1
out[idx:idx] = missing
open(path, 'w', encoding='utf-8').write('\n'.join(out))
print('recolored', len(seen), 'keys, added', len(missing))
