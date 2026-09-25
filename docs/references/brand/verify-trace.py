"""Rasterise traced paths back at source resolution and diff against the PNG."""
import re
import numpy as np
from PIL import Image, ImageDraw

def rings_from_path(d):
    rings, cur = [], []
    for tok in re.findall(r'[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)|Z', d):
        if tok == ('', ''):
            continue
        cur.append((float(tok[0]), float(tok[1])))
    # split on Z
    rings, cur = [], []
    for m in re.finditer(r'([ML])\s*(-?[\d.]+)\s+(-?[\d.]+)|(Z)', d):
        if m.group(4):
            if cur: rings.append(cur); cur = []
        else:
            cur.append((float(m.group(2)), float(m.group(3))))
    if cur: rings.append(cur)
    return rings

def check(png, result, crop=None, label=''):
    im = Image.open(png).convert('RGBA')
    m = np.asarray(im)[..., 3] > 128
    if crop:
        x0c, y0c, x1c, y1c = crop
        keep = np.zeros_like(m); keep[y0c:y1c, x0c:x1c] = True
        m = m & keep
    ys, xs = np.nonzero(m)
    y0, x0 = int(ys.min()), int(xs.min())
    src_h = int(ys.max()) - y0 + 1
    src_w = int(xs.max()) - x0 + 1
    src = m[y0:y0+src_h, x0:x0+src_w]

    scale = src_h / 128.0
    canvas = Image.new('1', (src_w, src_h), 0)
    dr = ImageDraw.Draw(canvas)
    for d in result['paths']:
        rings = rings_from_path(d)
        for i, ring in enumerate(rings):
            pts = [(x * scale, y * scale) for x, y in ring]
            dr.polygon(pts, fill=(1 if i == 0 else 0))
    rep = np.asarray(canvas).astype(bool)

    inter = (src & rep).sum(); union = (src | rep).sum()
    bad = int((src ^ rep).sum())
    print('%-10s IoU=%.5f  mismatch=%d px of %d (%.4f%%)  max edge drift < %.2f px'
          % (label, inter / union, bad, int(union), 100.0 * bad / union, scale * 0.5))
    return rep, src
