import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = ROOT / "previews" / "v19"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080
IMG_W, IMG_H = 5120, 2880
IMG_SCALE = 0.42
LON_MIN, LON_MAX = 14.0, 35.2
LAT_MIN, LAT_MAX = 38.2, 51.4
CENTER = (W / 2, H / 2)
ACTION_CENTER = (W / 2, 500)
MAP_ORIGIN = (
    CENTER[0] - (IMG_W * IMG_SCALE) / 2,
    CENTER[1] - (IMG_H * IMG_SCALE) / 2,
)
PLAN = {"FAR": 1.12, "MED": 1.75, "CLOSE": 2.45, "MACRO": 3.60}

COL = {
    "blue": (30, 91, 255, 255),
    "red": (213, 37, 26, 255),
    "gold": (226, 164, 55, 255),
    "cream": (243, 232, 201, 255),
    "black": (8, 8, 7, 230),
}

ROUTES = {
    "kishinev": [(28.835, 47.010), (28.32, 47.10), (27.795, 47.209)],
    "crossing": [(25.367, 43.656), (25.358, 43.638), (25.350, 43.620)],
    "nikopol": [(25.350, 43.620), (25.16, 43.67), (24.900, 43.700)],
    "shipka": [(25.350, 43.620), (25.55, 43.28), (25.636, 43.075), (25.47, 42.91), (25.320, 42.750)],
    "plevna": [(22.872, 43.996), (23.48, 43.78), (24.617, 43.417)],
}


def font(size):
    for p in [
        Path("C:/Windows/Fonts/arialbd.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
    ]:
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default()


F_TITLE = font(38)
F_BODY = font(22)
F_LABEL = font(18)


def merc_y(lat):
    r = math.radians(lat)
    return math.log(math.tan(math.pi / 4 + r / 2))


MERC_MIN = merc_y(LAT_MIN)
MERC_MAX = merc_y(LAT_MAX)


def xy(lon, lat):
    px = (lon - LON_MIN) / (LON_MAX - LON_MIN) * IMG_W
    py = (MERC_MAX - merc_y(lat)) / (MERC_MAX - MERC_MIN) * IMG_H
    return (MAP_ORIGIN[0] + px * IMG_SCALE, MAP_ORIGIN[1] + py * IMG_SCALE)


def route_focus(coords):
    lons = [p[0] for p in coords]
    lats = [p[1] for p in coords]
    return ((min(lons) + max(lons)) / 2, (min(lats) + max(lats)) / 2)


def camera_for(lon, lat, scale):
    p = xy(lon, lat)
    return (
        ACTION_CENTER[0] - (p[0] - CENTER[0]) * scale,
        ACTION_CENTER[1] - (p[1] - CENTER[1]) * scale,
    )


def local_to_screen(local, rig_pos, scale):
    return (
        rig_pos[0] + (local[0] - CENTER[0]) * scale,
        rig_pos[1] + (local[1] - CENTER[1]) * scale,
    )


def geo_to_screen(lon, lat, rig_pos, scale):
    return local_to_screen(xy(lon, lat), rig_pos, scale)


def draw_text(draw, xypos, text, fill, fnt, anchor="mm"):
    x, y = xypos
    draw.text((x + 2, y + 2), text, font=fnt, fill=(0, 0, 0, 180), anchor=anchor)
    draw.text((x, y), text, font=fnt, fill=fill, anchor=anchor)


def paste_asset(canvas, path, xypos, size):
    img = Image.open(path).convert("RGBA")
    img.thumbnail((size, size), Image.LANCZOS)
    x = int(xypos[0] - img.width / 2)
    y = int(xypos[1] - img.height / 2)
    canvas.alpha_composite(img, (x, y))

def route_point(coords, fraction):
    pts = [xy(lon, lat) for lon, lat in coords]
    segs = []
    total = 0.0
    for a, b in zip(pts, pts[1:]):
        d = math.hypot(b[0] - a[0], b[1] - a[1])
        segs.append(d)
        total += d
    target = max(0.0, min(1.0, fraction)) * max(total, 0.001)
    passed = 0.0
    for i, seg in enumerate(segs, start=1):
        if passed + seg >= target:
            k = 0 if seg <= 0 else (target - passed) / seg
            return (
                coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * k,
                coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * k,
            )
        passed += seg
    return coords[-1]


def draw_scene(name, title, body, focus_route, scale_name, route_color, portraits, icons, active_route=None, labels=None, callouts=None, zones=None):
    base = Image.open(ASSETS / "balkans_1880_real_boundaries_v9_overscan.png").convert("RGB")
    focus = route_focus(focus_route)
    scale = PLAN[scale_name]
    rig = camera_for(focus[0], focus[1], scale)

    src_cx = (CENTER[0] + (W / 2 - rig[0]) / scale - MAP_ORIGIN[0]) / IMG_SCALE
    src_cy = (CENTER[1] + (H / 2 - rig[1]) / scale - MAP_ORIGIN[1]) / IMG_SCALE
    src_w = W / (scale * IMG_SCALE)
    src_h = H / (scale * IMG_SCALE)
    box = (
        int(src_cx - src_w / 2),
        int(src_cy - src_h / 2),
        int(src_cx + src_w / 2),
        int(src_cy + src_h / 2),
    )
    frame = base.crop(box).resize((W, H), Image.Resampling.BICUBIC).convert("RGBA")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    d.rectangle((0, 0, W, 150), fill=(8, 8, 7, 215))
    d.rectangle((0, 930, W, H), fill=(8, 8, 7, 190))
    draw_text(d, (W / 2, 58), title, COL["gold"], F_TITLE)
    draw_text(d, (W / 2, 106), body, COL["cream"], F_BODY)

    for coords, fill, outline, dashed in zones or []:
        pts = [geo_to_screen(lon, lat, rig, scale) for lon, lat in coords]
        d.polygon(pts, fill=fill)
        if dashed:
            for a, b in zip(pts, pts[1:] + pts[:1]):
                # small dashed approximation for preview QA
                dx, dy = b[0] - a[0], b[1] - a[1]
                dist = max(math.hypot(dx, dy), 0.001)
                steps = int(dist // 18)
                for i in range(0, steps, 2):
                    t0, t1 = i / steps, min((i + 1) / steps, 1)
                    d.line((a[0] + dx * t0, a[1] + dy * t0, a[0] + dx * t1, a[1] + dy * t1), fill=outline, width=4)
        else:
            d.line(pts + [pts[0]], fill=outline, width=4, joint="curve")

    if active_route:
        pts = [geo_to_screen(lon, lat, rig, scale) for lon, lat in active_route]
        d.line(pts, fill=(243, 232, 201, 120), width=12, joint="curve")
        d.line(pts, fill=route_color, width=7, joint="curve")
        for p in pts:
            d.ellipse((p[0] - 6, p[1] - 6, p[0] + 6, p[1] + 6), fill=route_color, outline=COL["cream"], width=2)

    for lon, lat, text_value, color, dx, dy in labels or []:
        pos = geo_to_screen(lon, lat, rig, scale)
        draw_text(d, (pos[0] + dx, pos[1] + dy), text_value, color, F_LABEL)

    for lon, lat, title_value, body_value, dx, dy in callouts or []:
        pos = geo_to_screen(lon, lat, rig, scale)
        x, y = pos[0] + dx, pos[1] + dy
        d.rectangle((x - 120, y - 36, x + 120, y + 36), fill=(8, 8, 7, 215), outline=COL["blue"], width=2)
        draw_text(d, (x, y - 10), title_value, COL["gold"], F_LABEL)
        draw_text(d, (x, y + 15), body_value, COL["cream"], font(14))

    for slug, lon, lat, dx, dy in portraits:
        pos = geo_to_screen(lon, lat, rig, scale)
        paste_asset(overlay, ASSETS / "portraits" / "medallions" / f"{slug}_medallion.png", (pos[0] + dx, pos[1] + dy), 128)

    for file_name, lon, lat, dx, dy in icons:
        pos = geo_to_screen(lon, lat, rig, scale)
        paste_asset(overlay, ASSETS / "tactical_icons" / file_name, (pos[0] + dx, pos[1] + dy), 92)

    # Compact legend outside the action center.
    d.rectangle((1395, 688, 1855, 930), fill=(9, 24, 29, 220), outline=COL["gold"], width=2)
    draw_text(d, (1422, 722), "ЛЕГЕНДА", COL["gold"], F_LABEL, anchor="lm")
    d.line((1420, 790, 1510, 790), fill=COL["blue"], width=5)
    draw_text(d, (1530, 790), "русское движение", COL["cream"], F_LABEL, anchor="lm")
    d.line((1420, 830, 1510, 830), fill=COL["red"], width=5)
    draw_text(d, (1530, 830), "османское движение", COL["cream"], F_LABEL, anchor="lm")
    paste_asset(overlay, ASSETS / "tactical_icons" / "cavalry_gold.png", (1448, 880), 42)
    draw_text(d, (1490, 880), "род войск / роль", COL["cream"], F_LABEL, anchor="lm")

    frame.alpha_composite(overlay)
    out = OUT / f"{name}.jpg"
    frame.convert("RGB").save(out, quality=92)
    print(out)


def main():
    draw_scene(
        "01_kishinev_ungheny",
        "КИШИНЁВ -> УНГЕНЫ",
        "24 апреля 1877: движение к переправам через Прут.",
        ROUTES["kishinev"],
        "CLOSE",
        COL["blue"],
        [("nikolai_nikolaevich", 27.795, 47.209, 0, 0)],
        [("cavalry_blue.png", *route_point(ROUTES["kishinev"], 0.52), -28, 44)],
        ROUTES["kishinev"],
    )
    draw_scene(
        "02_zimnitsa_svishtov",
        "ЗИМНИЦА -> СВИШТОВ",
        "27-28 июня 1877: короткая переправа через Дунай показана крупным планом.",
        ROUTES["crossing"],
        "MACRO",
        COL["blue"],
        [("carol_i", 25.350, 43.620, 0, 0)],
        [("objective_flag_blue.png", *route_point(ROUTES["crossing"], 0.50), 48, -20)],
        ROUTES["crossing"],
        labels=[(25.355, 43.648, "Дунай", (190, 235, 255, 255), -4, -52)],
        callouts=[(25.358, 43.638, "ПЕРЕПРАВА", "через Дунай", 0, 96)],
        zones=[(
            [(25.28, 43.67), (25.44, 43.67), (25.49, 43.59), (25.32, 43.56)],
            (30, 91, 255, 42),
            (30, 91, 255, 180),
            False,
        )],
    )
    draw_scene(
        "03_svishtov_nikopol",
        "СВИШТОВ -> НИКОПОЛЬ",
        "Июль 1877: движение идёт вдоль Дуная к Никополю.",
        ROUTES["nikopol"],
        "CLOSE",
        COL["blue"],
        [("nikolai_nikolaevich", 24.900, 43.700, 0, 0)],
        [("fort_gold.png", 24.900, 43.700, 50, -44), ("cannon_blue.png", *route_point(ROUTES["nikopol"], 0.46), 0, 48)],
        ROUTES["nikopol"],
        labels=[(25.12, 43.73, "Дунай", (190, 235, 255, 255), 0, -42)],
        zones=[(
            [(25.38, 43.61), (25.10, 43.68), (24.82, 43.73), (24.82, 43.63), (25.34, 43.56)],
            (30, 91, 255, 34),
            (30, 91, 255, 170),
            True,
        )],
    )
    draw_scene(
        "04_shipka_gurko",
        "СВИШТОВ -> ТЫРНОВО -> ШИПКА",
        "Июль 1877: передовой отряд выходит к Балканским проходам.",
        ROUTES["shipka"],
        "CLOSE",
        COL["blue"],
        [("iosif_gurko", 25.320, 42.750, 0, 0)],
        [("cavalry_blue.png", *route_point(ROUTES["shipka"], 0.58), -50, -44), ("hill_fort_gold.png", 25.32, 42.75, 46, 18)],
        ROUTES["shipka"],
        zones=[(
            [(25.20, 43.00), (25.78, 43.02), (25.72, 42.70), (25.18, 42.68)],
            (226, 164, 55, 42),
            (226, 164, 55, 185),
            True,
        )],
    )
    draw_scene(
        "05_vidin_plevna",
        "ВИДИН -> ПЛЕВНА",
        "Июль 1877: Осман-паша занимает Плевну.",
        ROUTES["plevna"],
        "MED",
        COL["red"],
        [("osman_pasha", 24.617, 43.417, 0, 0)],
        [("cannon_red.png", *route_point(ROUTES["plevna"], 0.50), -10, 50)],
        ROUTES["plevna"],
        zones=[(
            [(24.30, 43.62), (24.78, 43.55), (24.90, 43.28), (24.36, 43.25)],
            (213, 37, 26, 36),
            (213, 37, 26, 185),
            True,
        )],
    )
    draw_scene(
        "06_plevna_siege",
        "ПЛЕВНА: ОСАДА",
        "Июль-декабрь 1877: стрелки убраны; остаётся ключевой узел кампании.",
        [(24.617, 43.417)],
        "CLOSE",
        COL["gold"],
        [("osman_pasha", 24.617, 43.417, -72, -56), ("mikhail_skobelev", 24.617, 43.417, 72, -56)],
        [("fort_gold.png", 24.617, 43.417, 0, 56), ("crossed_swords_gold.png", 24.617, 43.417, 0, -48)],
        None,
    )


if __name__ == "__main__":
    main()
