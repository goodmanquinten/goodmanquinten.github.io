"""Build the Life page's small world map (visited countries highlighted) as inline SVG.

Run: python scripts/make_world_svg.py  -> rewrites the block between the world markers in index.html
Data: data/world-110m.json (world-atlas 2.0.2, Natural Earth 1:110m, public domain).
"""

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VISITED = [
    "Austria", "Belgium", "Canada", "China", "France", "Hungary", "Iceland", "Ireland", "Italy", "Japan",
    "Mexico", "Morocco", "Netherlands", "Poland", "Portugal", "Puerto Rico", "Slovakia", "South Korea",
    "Switzerland", "Taiwan", "United Arab Emirates", "United Kingdom", "United States of America", "Vietnam",
]
W, H = 1000, 500


def natural_earth(lon: float, lat: float) -> tuple[float, float]:
    """Natural Earth I projection (Šavrič et al.), radians in, unit plane out."""
    l, p = math.radians(lon), math.radians(lat)
    p2 = p * p
    p4 = p2 * p2
    x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)))
    y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)))
    return x, y


def decode_arcs(topo: dict) -> list[list[tuple[float, float]]]:
    (sx, sy), (tx, ty) = topo["transform"]["scale"], topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)
    return arcs


def ring(arcs, idxs):
    pts = []
    for i in idxs:
        a = arcs[i] if i >= 0 else arcs[~i][::-1]
        pts.extend(a if not pts else a[1:])
    # rings that cross the 180° line (Russia, Fiji) would streak across the whole map;
    # keep longitudes continuous instead, so the overhang falls outside the frame and is clipped
    out, prev = [], None
    for lon, lat in pts:
        if prev is not None:
            while lon - prev > 180:
                lon -= 360
            while lon - prev < -180:
                lon += 360
        out.append((lon, lat))
        prev = lon
    return out


def main() -> None:
    topo = json.loads((ROOT / "data" / "world-110m.json").read_text(encoding="utf-8"))
    arcs = decode_arcs(topo)
    # fit the projected world (minus Antarctica) to the canvas
    xmax = natural_earth(180, 0)[0]
    ymax = natural_earth(0, 84)[1]
    ymin = natural_earth(0, -58)[1]
    k = min(W / (2 * xmax), H / (ymax - ymin))
    ox, oy = W / 2, (H - (ymax - ymin) * k) / 2 + ymax * k

    def proj(pt):
        x, y = natural_earth(*pt)
        return ox + x * k, oy - y * k

    visited, other = [], []
    for g in topo["objects"]["countries"]["geometries"]:
        name = g["properties"]["name"]
        if name == "Antarctica" or g.get("type") is None:
            continue
        polys = g["arcs"] if g["type"] == "MultiPolygon" else [g["arcs"]]
        d = ""
        for poly in polys:
            for r in poly:
                pts = [proj(p) for p in ring(arcs, r)]
                d += "M" + "L".join(f"{x:.0f},{y:.0f}" for x, y in pts) + "Z"
        (visited if name in VISITED else other).append(f'<path d="{d}"><title>{name}</title></path>' if name in VISITED else f'<path d="{d}"/>')
    svg = (f'<svg class="world" viewBox="0 0 {W} {H}" role="img" aria-label="World map with the {len(VISITED)} countries I have visited highlighted">'
           f'<g class="land">{"".join(other)}</g><g class="been">{"".join(visited)}</g></svg>')
    shown = sorted("United States" if n == "United States of America" else n for n in VISITED)
    block = (f'<div class="travel"><h3>{len(VISITED)} countries so far</h3>{svg}'
             f'<p class="clist">{" · ".join(shown)}</p></div>')
    index = ROOT / "index.html"
    html = index.read_text(encoding="utf-8")
    a, b = "<!-- world:start -->", "<!-- world:end -->"
    i, j = html.index(a) + len(a), html.index(b)
    index.write_text(html[:i] + "\n    " + block + "\n    " + html[j:], encoding="utf-8")
    print(f"index.html map updated ({len(block) // 1024} KB, {len(visited)} visited)")


if __name__ == "__main__":
    main()
