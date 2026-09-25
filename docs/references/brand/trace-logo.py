"""Trace flat-colour raster brand art into SVG paths, holes included."""
import math, sys
import numpy as np
from PIL import Image
from scipy import ndimage

NEIGH = [(0,1),(1,1),(1,0),(1,-1),(0,-1),(-1,-1),(-1,0),(-1,1)]

def trace_ring(mask):
    """Moore-neighbour trace of the single outer ring of `mask`."""
    ys, xs = np.nonzero(mask)
    top = int(ys.min()); start = (top, int(xs[ys == top].min()))
    h, w = mask.shape
    solid = lambda p: 0 <= p[0] < h and 0 <= p[1] < w and mask[p]
    ring = [start]; cur = start; back = 4; second = None
    limit = 8 * int(mask.sum()) + 32
    for _ in range(limit):
        for k in range(1, 9):
            idx = (back + k) % 8
            cand = (cur[0] + NEIGH[idx][0], cur[1] + NEIGH[idx][1])
            if solid(cand):
                back = (idx + 4) % 8; cur = cand; break
        else:
            break
        if second is None:
            second = cur
        elif cur == start and ring[-1] == second:
            break
        ring.append(cur)
        if len(ring) > 4 and cur == start and ring[1] == second:
            ring.pop(); break
    return ring

def perp(p, a, b):
    if a == b: return math.hypot(p[0]-a[0], p[1]-a[1])
    return abs((b[0]-a[0])*(a[1]-p[1]) - (a[0]-p[0])*(b[1]-a[1])) / math.hypot(b[0]-a[0], b[1]-a[1])

def dp(pts, tol):
    if len(pts) < 3: return list(pts)
    a, b = pts[0], pts[-1]
    wi, wd = 0, -1.0
    for i in range(1, len(pts)-1):
        d = perp(pts[i], a, b)
        if d > wd: wi, wd = i, d
    if wd <= tol: return [a, b]
    return dp(pts[:wi+1], tol)[:-1] + dp(pts[wi:], tol)

def simplify(ring, tol):
    sys.setrecursionlimit(100000)
    r = list(ring) + [ring[0]]
    s = dp(r, tol)
    if s[0] == s[-1]: s = s[:-1]
    out = [p for i, p in enumerate(s)
           if perp(p, s[i-1], s[(i+1) % len(s)]) > tol * 0.5]
    return out or s

def fmt(v, places=2):
    s = ('%.*f' % (places, v)).rstrip('0').rstrip('.')
    return '0' if s in ('-0', '', '0') else s

def rings_of(comp, tol):
    """Outer ring plus every hole ring of one connected component."""
    out = [simplify(trace_ring(comp), tol)]
    holes = ndimage.binary_fill_holes(comp) & ~comp
    if holes.any():
        hl, hn = ndimage.label(holes, structure=np.ones((3,3), int))
        for i in range(1, hn+1):
            h = hl == i
            if h.sum() >= 64:
                out.append(simplify(trace_ring(h), tol))
    return out

def to_path(rings, x0, y0, scale, places=2):
    parts = []
    for ring in rings:
        for j, (r, c) in enumerate(ring):
            x = (c - x0) * scale; y = (r - y0) * scale
            parts.append(('M' if j == 0 else 'L') + fmt(x, places) + ' ' + fmt(y, places))
        parts.append('Z')
    return ''.join(p if p == 'Z' else p + ' ' for p in parts).replace(' Z', 'Z').strip()

def trace(png, height=128.0, tol_frac=0.0015, crop=None, min_area=400, places=2):
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
    scale = height / src_h
    tol = tol_frac * src_h
    lab, n = ndimage.label(m, structure=np.ones((3,3), int))
    comps = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        sub = lab[sl] == i
        if sub.sum() < min_area: continue
        full = np.zeros_like(m); full[sl] = sub
        comps.append((sl[1].start, full))
    comps.sort(key=lambda c: c[0])
    paths = [to_path(rings_of(c, tol), x0, y0, scale, places) for _, c in comps]
    return {'viewBox': '0 0 %s %s' % (fmt(src_w*scale), fmt(height)),
            'src': (src_w, src_h), 'paths': paths}
