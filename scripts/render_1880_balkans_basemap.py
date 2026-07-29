import json
import math
import argparse
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "data" / "geo"
DEFAULT_OUT = ROOT / "assets" / "balkans_1880_real_boundaries_v9_overscan.png"

URLS = {
    "world_1880.geojson": "https://raw.githubusercontent.com/aourednik/historical-basemaps/master/geojson/world_1880.geojson",
    "ne_10m_rivers_lake_centerlines.geojson": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson",
    "ne_10m_lakes.geojson": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_lakes.geojson",
}

W, H = 5120, 2880
LON_MIN, LON_MAX = 14.0, 35.2
LAT_MIN, LAT_MAX = 38.2, 51.4

SEA = (62, 125, 158)
RIVER = SEA
LAND = (198, 187, 152)
BORDER = (44, 40, 33)

COLORS = {
    "Romania": (202, 184, 105),
    "Ottoman": (172, 92, 75),
    "Serbia": (122, 151, 103),
    "Austria Hungary": (144, 133, 105),
    "Russian Empire": (151, 137, 174),
    "Montenegro": (111, 137, 92),
    "Bulgaria": (178, 98, 80),
}


def merc_y(lat):
    r = math.radians(lat)
    return math.log(math.tan(math.pi / 4 + r / 2))


MERC_MIN = merc_y(LAT_MIN)
MERC_MAX = merc_y(LAT_MAX)


def project(lon, lat):
    x = (lon - LON_MIN) / (LON_MAX - LON_MIN) * W
    y = (MERC_MAX - merc_y(lat)) / (MERC_MAX - MERC_MIN) * H
    return int(round(x)), int(round(y))


def in_extent(lon, lat, pad=1.0):
    return LON_MIN - pad <= lon <= LON_MAX + pad and LAT_MIN - pad <= lat <= LAT_MAX + pad


def ring_in_extent(ring):
    return any(in_extent(lon, lat) for lon, lat in ring)


def polygon_rings(geom):
    if not geom:
        return []
    t = geom.get("type")
    coords = geom.get("coordinates", [])
    if t == "Polygon":
        return coords
    if t == "MultiPolygon":
        rings = []
        for poly in coords:
            rings.extend(poly)
        return rings
    return []


def line_parts(geom):
    if not geom:
        return []
    t = geom.get("type")
    coords = geom.get("coordinates", [])
    if t == "LineString":
        return [coords]
    if t == "MultiLineString":
        return coords
    return []


def fill_color(props):
    name = props.get("NAME", "")
    subj = props.get("SUBJECTO", "")
    if name == "Romania" or subj == "Romania":
        return COLORS["Romania"]
    if name == "Serbia" or subj == "Serbia":
        return COLORS["Serbia"]
    if name == "Montenegro" or subj == "Montenegro":
        return COLORS["Montenegro"]
    if name == "Russian Empire" or subj == "Russian Empire":
        return COLORS["Russian Empire"]
    if name == "Austria Hungary" or subj == "Austria Hungary":
        return COLORS["Austria Hungary"]
    if name == "Bulgaria":
        return COLORS["Bulgaria"]
    if name == "Ottoman Empire" or subj == "Ottoman Empire":
        return COLORS["Ottoman"]
    return LAND


def draw_lines(draw, coords, color, width, alpha=255):
    pts = [project(lon, lat) for lon, lat in coords if in_extent(lon, lat, pad=1.5)]
    if len(pts) > 1:
        draw.line(pts, fill=color + (alpha,), width=width, joint="curve")


def draw_lake_polygons(draw, data):
    for feature in data.get("features", []):
        for ring in polygon_rings(feature.get("geometry")):
            if not ring_in_extent(ring):
                continue
            pts = [project(lon, lat) for lon, lat in ring]
            if len(pts) >= 3:
                draw.polygon(pts, fill=SEA + (255,))


def ensure_file(path, url):
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    print(f"downloading {url}")
    urllib.request.urlretrieve(url, path)


def parse_args():
    parser = argparse.ArgumentParser(description="Render a clean 1880 Balkan basemap for AE map animation.")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--no-download", action="store_true")
    return parser.parse_args()


def main():
    args = parse_args()
    boundaries = args.data_dir / "world_1880.geojson"
    rivers_path = args.data_dir / "ne_10m_rivers_lake_centerlines.geojson"
    lakes_path = args.data_dir / "ne_10m_lakes.geojson"
    if not args.no_download:
        ensure_file(boundaries, URLS["world_1880.geojson"])
        ensure_file(rivers_path, URLS["ne_10m_rivers_lake_centerlines.geojson"])
        ensure_file(lakes_path, URLS["ne_10m_lakes.geojson"])

    data = json.loads(boundaries.read_text(encoding="utf-8"))
    rivers = json.loads(rivers_path.read_text(encoding="utf-8"))
    lakes = json.loads(lakes_path.read_text(encoding="utf-8"))

    img = Image.new("RGB", (W, H), SEA)
    draw = ImageDraw.Draw(img, "RGBA")

    # Land fill from real 1880 boundaries.
    for feature in data["features"]:
        color = fill_color(feature.get("properties", {}))
        for ring in polygon_rings(feature.get("geometry")):
            if not ring_in_extent(ring):
                continue
            pts = [project(lon, lat) for lon, lat in ring]
            if len(pts) >= 3:
                draw.polygon(pts, fill=color + (238,))

    # Lakes/inner water after land fill.
    draw_lake_polygons(draw, lakes)

    # Real boundary outlines.
    for feature in data["features"]:
        for ring in polygon_rings(feature.get("geometry")):
            if not ring_in_extent(ring):
                continue
            pts = [project(lon, lat) for lon, lat in ring]
            if len(pts) >= 3:
                draw.line(pts + [pts[0]], fill=BORDER + (225,), width=4, joint="curve")

    # Natural Earth river centerlines.
    for feature in rivers.get("features", []):
        geom = feature.get("geometry")
        props = feature.get("properties", {})
        name = str(props.get("name", "") or props.get("NAME", ""))
        scalerank = int(props.get("scalerank", props.get("Scalerank", 99)) or 99)
        width = 4
        alpha = 205
        if "Danube" in name:
            width = 10
            alpha = 255
        elif "Prut" in name or "Siret" in name or "Seret" in name:
            width = 6
            alpha = 240
        elif scalerank <= 4:
            width = 4
            alpha = 190
        else:
            width = 2
            alpha = 135
        for part in line_parts(geom):
            if not any(in_extent(lon, lat, pad=0.3) for lon, lat in part):
                continue
            draw_lines(draw, part, RIVER, width, alpha)

    # Subtle relief zones: no fake hachures, just quiet brown washes.
    relief = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(relief, "RGBA")
    carpathians = [(20.4, 46.2), (21.8, 46.9), (23.8, 46.8), (25.6, 46.1), (26.2, 45.4), (24.6, 45.65), (22.2, 45.95)]
    balkans = [(21.6, 42.55), (23.6, 42.95), (25.4, 42.85), (27.7, 43.02), (28.0, 42.65), (25.4, 42.42), (22.2, 42.28)]
    rd.polygon([project(*p) for p in carpathians], fill=(76, 59, 38, 54))
    rd.polygon([project(*p) for p in balkans], fill=(76, 59, 38, 66))
    relief = relief.filter(ImageFilter.GaussianBlur(18))
    img = Image.alpha_composite(img.convert("RGBA"), relief)

    # Light paper grain and vignette.
    grain = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grain, "RGBA")
    for x in range(0, W, 48):
        gd.line([(x, 0), (x - 220, H)], fill=(255, 255, 255, 7), width=1)
    img = Image.alpha_composite(img, grain)

    vignette = Image.new("L", (W, H), 0)
    vd = ImageDraw.Draw(vignette)
    vd.rectangle([180, 130, W - 180, H - 130], fill=0)
    vignette = vignette.filter(ImageFilter.GaussianBlur(210))
    dark = Image.new("RGBA", (W, H), (0, 0, 0, 58))
    img = Image.composite(dark, img, vignette)

    out = args.out
    meta = out.with_suffix(".meta.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(out, quality=95)
    meta.write_text(json.dumps({
        "width": W,
        "height": H,
        "lon_min": LON_MIN,
        "lon_max": LON_MAX,
        "lat_min": LAT_MIN,
        "lat_max": LAT_MAX,
        "projection": "web_mercator_crop",
        "boundary_source": "aourednik/historical-basemaps world_1880.geojson",
        "river_source": "Natural Earth ne_10m_rivers_lake_centerlines.geojson",
        "lake_source": "Natural Earth ne_10m_lakes.geojson",
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
