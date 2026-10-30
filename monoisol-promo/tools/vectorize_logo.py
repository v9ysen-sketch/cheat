#!/usr/bin/env python3
"""Trace the alpha silhouette of the raster site logo and write (a) an SVG path file and (b) a colour plate
with colours bled into transparent areas, so the renderer can draw a crisp large logo.
usage: vectorize_logo.py <logo.png> <out_dir>"""
import sys, json, numpy as np, potrace
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
UP = 8
im = Image.open(src).convert('RGBA'); w, h = im.size
a = np.asarray(im.resize((w * UP, h * UP), Image.BICUBIC))[:, :, 3] / 255.0
bm = potrace.Bitmap(a > 0.5)
plist = bm.trace(turdsize=4, alphamax=1.0, opticurve=True, opttolerance=0.2)
parts = []
for curve in plist:
    sp = curve.start_point; d = [f'M{sp.x / UP:.3f},{sp.y / UP:.3f}']
    for seg in curve.segments:
        if seg.is_corner: d.append(f'L{seg.c.x / UP:.3f},{seg.c.y / UP:.3f}L{seg.end_point.x / UP:.3f},{seg.end_point.y / UP:.3f}')
        else: d.append(f'C{seg.c1.x / UP:.3f},{seg.c1.y / UP:.3f} {seg.c2.x / UP:.3f},{seg.c2.y / UP:.3f} {seg.end_point.x / UP:.3f},{seg.end_point.y / UP:.3f}')
    parts.append(''.join(d) + 'Z')
json.dump({'width': w, 'height': h, 'path': ' '.join(parts)}, open(f'{out}/logo_path.json', 'w'))
# colour plate: bleed opaque colours outward (repeated dilation), then upscale 8x
rgba = np.asarray(im).astype(np.float32); rgb = rgba[:, :, :3].copy(); al = rgba[:, :, 3] > 200
for _ in range(12):
    acc = np.zeros_like(rgb); cnt = np.zeros(al.shape, np.float32)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            m = np.roll(np.roll(al, dy, 0), dx, 1); acc += np.roll(np.roll(rgb, dy, 0), dx, 1) * m[..., None]; cnt += m
    grow = (~al) & (cnt > 0); rgb[grow] = acc[grow] / cnt[grow][:, None]; al = al | grow
plate = Image.fromarray(rgb.clip(0, 255).astype(np.uint8)).resize((w * UP, h * UP), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=3, percent=60, threshold=2))
plate.save(f'{out}/logo_plate.png')
print('curves', len(plist), 'plate', plate.size)
